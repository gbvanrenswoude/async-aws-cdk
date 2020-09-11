import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ssm from '@aws-cdk/aws-ssm';
import * as kms from '@aws-cdk/aws-kms';
import * as iam from '@aws-cdk/aws-iam';


export class InfrastructureStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, branch: string, subnets: string[], props?: cdk.StackProps) {
        super(scope, id, props);


        // dependencies
        const envMappings: { [key: string]: string } = {
            '111111111111': 'dev',
            '222222222222': 'sta',
            '333333333333': 'prd'
        }

        const CustomVpc = ec2.Vpc.fromLookup(this, 'DataSourceCustomVPC', {
            vpcName: 'custom-vpc',
            tags: { 'Name': 'custom-vpc', 'ApplicationName': 'Custom VPC from Corp Landing Zone' }
        });

        const vpcSubnets = subnets.map(id => ec2.Subnet.fromSubnetId(this, `DataSourcePrivateSubnet${id}`, id!))

        const source = lambda.Code.fromAsset('../src')

        // Or post subnet IDs in SSM and fetch from there
        const privateSubnetID1 = ec2.Subnet.fromSubnetId(this, 'DataSourcePrivateSubnetSSMParameter1', ssm.StringParameter.fromStringParameterAttributes(this, 'DataSourceSSMSubnet1', {
            parameterName: '/corp/landing-zone/vpc/subnets/private-1-id',
        }).stringValue)

        const privateSubnetID2 = ec2.Subnet.fromSubnetId(this, 'DataSourcePrivateSubnetSSMParameter2', ssm.StringParameter.fromStringParameterAttributes(this, 'DataSourceSSMSubnet2', {
            parameterName: '/corp/landing-zone/vpc/subnets/private-2-id',
        }).stringValue)

        const privateSubnetID3 = ec2.Subnet.fromSubnetId(this, 'DataSourcePrivateSubnetSSMParameter3', ssm.StringParameter.fromStringParameterAttributes(this, 'DataSourceSSMSubnet3', {
            parameterName: '/corp/landing-zone/vpc/subnets/private-3-id',
        }).stringValue)

        const privateSubnetIdArray: ec2.ISubnet[] = [privateSubnetID1, privateSubnetID2, privateSubnetID3]

        // resources
        const key = new kms.Key(this, 'SomeKey', { trustAccountIdentities: true });
        key.addAlias(`alias/${branch}-kms-key-for-some-app`);
        key.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['kms:GenerateDataKey*', 'kms:Decrypt'],
                principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
                resources: ["*"]
            })
        );
        
        // Create a secret from a pre-existing secret string. This will show in cdk synth so be careful.
        const CustomSecretFromOwnSecretString = new secretsmanager.CfnSecret(
            this,
            'meuk',
            {
                secretString: JSON.stringify({
                    username: 'SomeUser',
                    password: process.env['SOME_PW']
                })
            }
        )

        const lambdaFunction = new lambda.Function(this, 'CustomFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: source,  // code loaded from "src" directory, could use nodejsFunction Construct when using Node, Py for Python
            handler: 'handler.onMidOfficeNotification',
            vpc: CustomVpc,
            vpcSubnets: { subnets: privateSubnetIdArray },
            initialPolicy: [
                new iam.PolicyStatement({
                    actions: ['secretsmanager:*'],
                    resources: [CustomSecretFromOwnSecretString.ref]
                })],
            environment: {
                env: branch
            },
        });
    }
}
