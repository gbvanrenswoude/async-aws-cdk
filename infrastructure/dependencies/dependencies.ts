import { EC2 } from 'aws-sdk';

export const getEnv = (): string => {
    if ('ENV' in process.env) {
        return process.env['ENV']!
    } else {
        console.log('Dependency check warning: variable "ENV" not set in process.env, defaulting environment to "fb"');
        return 'fb'
    }
}

export function checkSOME_PW(): void {
    if ('SOME_PW' in process.env) {
        console.log('Dependency check passed: variable "SOME_PW" set');
    }
    else {
        throw new Error('Dependency check error: variable "SOME_PW" not set in process.env. Export SOME_PW!')
    }
}


// Uses awssdk for js/ts to get the subnet IDs as an example of an async lookup before processing the rest of the CF Stack
export async function getPrivateSubnetSelection(): Promise<string[]> {

    const ec2sdk = new EC2();

    const customvpc = await ec2sdk.describeVpcs({
        Filters: [
            {
                Name: "tag:Name",
                Values: [
                    'custom-vpc'
                ]
            },
        ],
    }).promise();

    const vpc = customvpc.Vpcs?.[0].VpcId
    if (!vpc) {
        throw new Error(`Dependency error: No custom vpc found in AWS Account`)
    }

    const params = {
        Filters: [
            {
                Name: "vpc-id",
                Values: [
                    vpc
                ]
            },
            {
                Name: "tag:Name",
                Values: [
                    "*private*"
                ]
            }
        ]
    };
    const data = await ec2sdk.describeSubnets(params).promise()
    const subnets = data.Subnets?.map((element) => element.SubnetId!)
    if (!subnets?.length) {
        throw new Error(`Dependency error: No private subnet_ids found`)
    }
    return subnets;
}
