#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaAPIStack } from '../lib/lambda-api-stack';
import { S3Stack } from '../lib/s3-stack';

const app = new cdk.App();
new LambdaAPIStack(app, 'LambdaAPIStack', {
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
        },
    }
);

new S3Stack(app, 'S3Stack', {
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
        },
    }
);
