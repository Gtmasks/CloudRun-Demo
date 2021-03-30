// const AWS = require('aws-sdk');
// const uuid = require('uuid');
// const constants = require('../constants'); //Keep it consistent
// const kinesis = new AWS.Kinesis((constants.RUNTIME === 'lambda') ? {
//   apiVersion: constants.KINESIS_API_VERSION,
//   region: constants.REGION,
// } : {
//     apiVersion: constants.KINESIS_API_VERSION,
//     region: constants.REGION,
//     accessKeyId: process.env.AWS_KEY_ID || '',
//     secretAccessKey: process.env.AWS_SECRET_KEY || '',
//   });

// const savePayload = async (pk, payload) => {
//   //We can only save strings into the streams
//   if (typeof payload !== constants.PAYLOAD_TYPE) {
//     try {
//       payload = JSON.stringify(payload);
//     } catch (e) {
//       console.log(e);
//     }
//   }

//   const params = {
//     Data: payload,
//     PartitionKey: pk || constants.PARTITION_KEY,
//     StreamName: constants.STREAM_NAME
//   };

//   const res = await kinesis.putRecord(params).promise().catch((err) => {
//     console.log(err, err.stack);
//     return null;
//   });

//   return res;
// };

// const savePayloadEx = async (streamName, payload) => {
//   if (!Array.isArray(payload)) {
//     payload = [payload];
//   }

//   const params = {
//     Records: [],
//     StreamName: streamName || constants.STREAM_NAME,
//   };
//   for (const record of payload) {
//     try {
//       const curData = JSON.stringify(record) + '\n';
//       params.Records.push({
//         Data: curData,
//         PartitionKey: uuid.v4() || constants.PARTITION_KEY,
//       });
//     } catch (error) {
//       console.loog(error);
//     }
//   }

//   console.log(`Records number: ${params.Records.length}`);
//   const res = await kinesis.putRecords(params).promise().catch((err) => {
//     console.log(err, err.stack);
//     return null;
//   });
//   return res;
// };

// exports.save = async (payload) => {
//   await savePayload(uuid.v4(), payload);
// };

// exports.saveEx = async (streamName, payload) => {
//   return await savePayloadEx(streamName, payload);
// };
