import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CdkStack } from '../lib/cdk-stack';


test('Expected results correctly created', () => {
    const app = new cdk.App();
    const myCdkStack = new CdkStack(app, 'CdkAthena');
    const template = Template.fromStack(myCdkStack);

    // Raw data bucket exists with public access blocked
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
            "Fn::Join": [
                "",
                [
                    "athena-tests-s3-raw-",
                    {
                        "Ref": "AWS::AccountId"
                    }
                ]
            ]
        },
        PublicAccessBlockConfiguration: {
            "BlockPublicAcls": true,
            "BlockPublicPolicy": true,
            "IgnorePublicAcls": true,
            "RestrictPublicBuckets": true
        },
    });

    // Results bucket exists with public access blocked
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
            "Fn::Join": [
                "",
                [
                    "athena-tests-s3-results-",
                    {
                        "Ref": "AWS::AccountId"
                    }
                ]
            ]
        },
        PublicAccessBlockConfiguration: {
            "BlockPublicAcls": true,
            "BlockPublicPolicy": true,
            "IgnorePublicAcls": true,
            "RestrictPublicBuckets": true
        },
    });

    // Glue role exists
    template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "glue.amazonaws.com"
                    }
                }
            ],
        }
    });
    template.hasResourceProperties('AWS::IAM::Policy', {});

    // Athena workgroup exists
    template.hasResourceProperties('AWS::Athena::WorkGroup', {
        Name: "athena_tests_workgroup",
    });

    // Glue database exists
    template.hasResourceProperties('AWS::Glue::Database', {
        CatalogId: {
            "Ref": "AWS::AccountId"
        },
        DatabaseInput: {
            "Name": "athena_tests_database"
        },
    });

});
