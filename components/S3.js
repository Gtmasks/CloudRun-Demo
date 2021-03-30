const AWS = require('aws-sdk');
const constants = require('../constants'); //Keep it consistent

const S3 = new AWS.S3((constants.RUNTIME === 'lambda') ? {
  apiVersion: constants.S3_API_VERSION,
  region: constants.REGION,
} : {
  apiVersion: constants.S3_API_VERSION,
  region: constants.REGION,
  accessKeyId: process.env.AWS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_KEY || '',
});

exports.getObject = async (bucketName, objectName) => {
  return S3.getObject({
    Bucket: bucketName || constants.S3_BUCKET,
    Key: objectName || constants.CONFIG_PATH,
  }).promise();
};
