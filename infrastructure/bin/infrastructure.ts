#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { InfrastructureStack } from '../lib/main_stack';
import { getEnv, getPrivateSubnetSelection, checkSOME_PW} from '../dependencies/dependencies';

const environment = getEnv()
const check = checkSOME_PW()
const app = new cdk.App();

async function main() {
    const subnets = await getPrivateSubnetSelection();
    new InfrastructureStack(app, `nicestack${environment}`, environment, subnets, {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        }
    });
}

main();
