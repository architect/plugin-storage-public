let { toLogicalID } = require('@architect/utils')
let validate = require('./validate')

function start ({ arc, cloudformation }) {
  let cfn = cloudformation

  let storagePublic = arc['storage-public']

  // Only run if @storage-public is defined
  if (storagePublic) {

    // Validate the specified format
    validate(storagePublic)

    // First thing we do is declare a role for our macro resources
    cfn.Resources.PublicStorageMacroPolicy = {
      Type: 'AWS::IAM::Policy',
      DependsOn: 'Role',
      Properties: {
        PolicyName: 'PublicStorageMacroPolicy',
        PolicyDocument: {
          Statement: [ {
            Effect: 'Allow',
            Action: [ 's3:*' ],
            Resource: []
          } ]
        },
        Roles: [ { 'Ref': 'Role' } ],
      }
    }

    let resKeys = Object.keys(cfn.Resources)

    // storagePublic is an array of names for our public buckets
    storagePublic.forEach(bucket => {

      // Resource names
      let ID = toLogicalID(bucket)
      let Bucket = `${ID}Bucket`
      let BucketParam = `${ID}Param`
      let BucketPolicy = `${ID}Policy`

      // TODO: implement deploy.services integration
      // Add bucket name as a "ARC_STORAGE_PUBLIC_<bucketname>" env var to all Lambda functions
      resKeys.forEach((k) => {
        let BUCKET = `ARC_STORAGE_PUBLIC_${bucket.replace(/-/g, '_').toUpperCase()}`
        if (cfn.Resources[k].Type === 'AWS::Serverless::Function') {
          cfn.Resources[k].Properties.Environment.Variables[BUCKET] = { Ref: Bucket }
        }
      })

      // Add standard CloudFormation resources
      cfn.Resources[Bucket] = {
        Type: 'AWS::S3::Bucket',
        DeletionPolicy: 'Delete',
        Properties: {
          PublicAccessBlockConfiguration: {
            // Displayed as: 'Block public access to buckets and objects granted through new access control lists (ACLs)'
            BlockPublicAcls: false,
            // Displayed as: 'Block public access to buckets and objects granted through new public bucket or access point policies'
            BlockPublicPolicy: false,
            // Displayed as: 'Block public access to buckets and objects granted through any access control lists (ACLs)'
            IgnorePublicAcls: false,
            // Displayed as: 'Block public and cross-account access to buckets and objects through any public bucket or access point policies'
            RestrictPublicBuckets: false,
          },
          OwnershipControls: {
            Rules: [ {
              ObjectOwnership: 'BucketOwnerEnforced',
            } ]
          },
        }
      }

      // Add name to SSM params for runtime discovery
      cfn.Resources[BucketParam] = {
        Type: 'AWS::SSM::Parameter',
        Properties: {
          Type: 'String',
          Name: {
            'Fn::Sub': [
              '/${AWS::StackName}/storage-public/${bucket}',
              { bucket }
            ]
          },
          Value: { Ref: Bucket }
        }
      }

      // Allow public read access to all objects in the static bucket
      cfn.Resources[BucketPolicy] = {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: { Ref: Bucket },
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Action: [ 's3:GetObject' ],
                Effect: 'Allow',
                Principal: '*',
                Resource: [ {
                  'Fn::Sub': [
                    'arn:aws:s3:::${bucket}/*',
                    { bucket: { Ref: Bucket } }
                  ]
                } ],
                Sid: 'PublicReadGetObject'
              }
            ]
          }
        }
      }

      // Add IAM policy for least-priv runtime access
      let doc = cfn.Resources.PublicStorageMacroPolicy.Properties.PolicyDocument.Statement[0]
      doc.Resource.push({
        'Fn::Sub': [
          'arn:aws:s3:::${bucket}',
          { bucket: { Ref: Bucket } }
        ]
      })
      doc.Resource.push({
        'Fn::Sub': [
          'arn:aws:s3:::${bucket}/*',
          { bucket: { Ref: Bucket } }
        ]
      })

    })
  }

  return cfn
}

module.exports = { deploy: { start } }
