#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const DEPLOYMENT_ENVIRONMENT = "dev";
const NAME_PREFIX = "";
const MAIN_RESOURCES_NAME = "s3-athena-workflow";

const app = new cdk.App();
const myCdkStack = new CdkStack(app, 'CdkAthena', {
  stackName: MAIN_RESOURCES_NAME,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: `Stack that creates the infrastructure for ${MAIN_RESOURCES_NAME} in ${DEPLOYMENT_ENVIRONMENT} environment`
});

cdk.Tags.of(myCdkStack).add('Environment', DEPLOYMENT_ENVIRONMENT);
cdk.Tags.of(myCdkStack).add('RepositoryUrl', 'https://github.com/san99tiago/aws-cdk-simple-s3-athena-workflow')
cdk.Tags.of(myCdkStack).add('Source', 'aws-cdk-simple-s3-athena-workflow')
cdk.Tags.of(myCdkStack).add('Owner', 'Santiago Garcia Arango');
