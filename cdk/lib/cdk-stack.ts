import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3_deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as athena from 'aws-cdk-lib/aws-athena';
import * as glue from 'aws-cdk-lib/aws-glue';


export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const mainResourcesName = 'athena_tests'
    const bucketName = `${mainResourcesName.replace('_', '-')}-s3`;
    const athenaWorkgroupName = `${mainResourcesName}_workgroup`;
    const glueDatabaseName = `${mainResourcesName}_database`;
    const glueTableName = `${mainResourcesName}_sample_data_table`;
    const roleName = `${mainResourcesName}_role`;

    // Create S3 raw bucket
    const rawBucket = new s3.Bucket(this, `${id}-RawBucket`, {
      bucketName: `${bucketName}-raw-${Stack.of(this).account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create S3 results bucket
    const resultsBucket = new s3.Bucket(this, `${id}-ResultsBucket`, {
      bucketName: `${bucketName}-results-${Stack.of(this).account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Add files inside 'sample_data' folder to the S3 'raw data' bucket
    const s3DeployFiles = new s3_deploy.BucketDeployment(this, `${id}-RawBucketDeployFile`, {
      sources: [s3_deploy.Source.asset('sample_data')],
      destinationBucket: rawBucket,
    });

    // Create an Athena workgroup for the project
    const workgroup = new athena.CfnWorkGroup(this, `${id}-AthenaWorkgroup`, {
      name: athenaWorkgroupName,
      description: 'Athena workgroup for S3 workflows',
      workGroupConfiguration: {
        enforceWorkGroupConfiguration: true,
        resultConfiguration: {
          outputLocation: `s3://${resultsBucket.bucketName}/`,
        },
      },
      recursiveDeleteOption: true,
    });

    // Create a Glue database
    const glueDatabase = new glue.CfnDatabase(this, `${id}-GlueDatabase`, {
      catalogId: this.account,
      databaseInput: {
        name: glueDatabaseName,
        locationUri: `s3://${resultsBucket.bucketName}/`,
        description: 'Glue database to be used in simple s3-athena workflows',
      }
    });

    // Create a Glue table based on the structure of the "sample_data"
    const glueTable = new glue.CfnTable(this, `${id}-GlueTable`, {
      catalogId: this.account,
      databaseName: glueDatabaseName,
      tableInput: {
        name: glueTableName,
        tableType: 'EXTERNAL_TABLE',
        storageDescriptor: {
          columns: [
            { name: 'price', type: 'float', },
            { name: 'owner', type: 'string', },
            { name: 'title', type: 'string', },
            { name: 'reviews', type: 'float', },
            { name: 'color', type: 'string', },
            { name: 'availability', type: 'string', },
            { name: 'datetime', type: 'string', },
            { name: 'views', type: 'string', },
            { name: 'url', type: 'string', },
          ],
          location: `s3://${rawBucket.bucketName}/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
            parameters: {
              'serialization.format': ',',
              'line.delim': '',
              'field.delim': ',',
              'skip.header.line.count': '1',
            },
          },
        }
      }
    });
    glueTable.node.addDependency(glueDatabase)

    // Create sample athena queries for the uploaded S3 "sample_data"
    const athenaQueryAll = new athena.CfnNamedQuery(this, `${id}-AthenaNamedQuery-All`, {
      database: glueDatabaseName,
      description: `Query to show all products from table ${glueTableName} for ${mainResourcesName} solution`,
      name: `${mainResourcesName}_select_all`,
      workGroup: athenaWorkgroupName,
      queryString: `SELECT * FROM "${glueDatabaseName}"."${glueTableName}";`
    });
    athenaQueryAll.node.addDependency(workgroup);

    const athenaQueryOnlyInStock = new athena.CfnNamedQuery(this, `${id}-AthenaNamedQuery-InStock`, {
      database: glueDatabaseName,
      description: `Query to show all products on stock from table ${glueTableName} for ${mainResourcesName} solution`,
      name: `${mainResourcesName}_select_in_stock`,
      workGroup: athenaWorkgroupName,
      queryString: `SELECT * FROM "${glueDatabaseName}"."${glueTableName}" WHERE availability='In Stock';`
    });
    athenaQueryOnlyInStock.node.addDependency(workgroup);

    const athenaQueryOrdeyCheapPrices = new athena.CfnNamedQuery(this, `${id}-AthenaNamedQuery-Cheap`, {
      database: glueDatabaseName,
      description: `Query to show products in cheap order from table ${glueTableName} for ${mainResourcesName} solution`,
      name: `${mainResourcesName}_select_cheap_order`,
      workGroup: athenaWorkgroupName,
      queryString: `SELECT * FROM "${glueDatabaseName}"."${glueTableName}" ORDER BY "price";`
    });
    athenaQueryOrdeyCheapPrices.node.addDependency(workgroup);

    // Create a policy that grants full access to Athena and Glue
    const athenaPolicy = new iam.Policy(this, `${id}-AthenaGluePolicy`, {
      statements: [
        new iam.PolicyStatement({
          actions: ['athena:*', 'glue:*'],
          resources: ['*']
        })
      ]
    });

    // Create IAM role that will grant access to Glue, Athena and the S3
    const glueAthenaS3Role = new iam.Role(this, `${id}-GlueS3Role`, {
      roleName: roleName,
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      description: 'Role for Glue-Athena based S3 workflows',
      // managedPolicies: [
      //   iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      // ],
    });

    // Grant read/write access to the S3 buckets for the glueAthenaS3Role
    rawBucket.grantReadWrite(glueAthenaS3Role);
    resultsBucket.grantReadWrite(glueAthenaS3Role);

    // Attach the athena policy to the glueAthenaS3Role
    glueAthenaS3Role.attachInlinePolicy(athenaPolicy);

  }
}
