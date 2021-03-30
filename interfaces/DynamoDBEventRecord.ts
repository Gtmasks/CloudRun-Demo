interface item {
  S?: string;
  N?: string;
  B?: string;
  SS?: string;
  NS?: string;
  BS?: string;
  M?: string;
  L?: string;
  NULL?: string;
  BOOL?: string;
};

/**
 * 从DynamoDB得到的事件信息
 */
interface DynamoDBEventRecord {
  eventID: string;
  eventName: 'INSERT' | 'MODIFY' | 'REMOVE';
  eventVersion: string;
  eventSource: 'aws:dynamodb';
  awsRegion: string;
  eventSourceARN: string;
  dynamodb: {
    ApproximateCreationDateTime: number;
    Keys: {
      [keyName: string]: item;
    };
    NewImage?: {
      [itemName: string]: item;
    };
    OldImage?: {
      [itemName: string]: item;
    };
    SequenceNumber: string;
    SizeBytes: number;
    StreamViewType: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES';
  };
};

// sample

// {
//   "Records": [
//     {
//       "eventID": "1",
//       "eventVersion": "1.0",
//       "dynamodb": {
//         "Keys": {
//           "Id": {
//             "N": "101"
//           }
//         },
//         "NewImage": {
//           "Message": {
//             "S": "New item!"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "StreamViewType": "NEW_AND_OLD_IMAGES",
//         "SequenceNumber": "111",
//         "SizeBytes": 26
//       },
//       "awsRegion": "eu-west-1",
//       "eventName": "INSERT",
//       "eventSourceARN": "arn:aws:dynamodb:eu-west-1:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
//       "eventSource": "aws:dynamodb"
//     },
//     {
//       "eventID": "2",
//       "eventVersion": "1.0",
//       "dynamodb": {
//         "OldImage": {
//           "Message": {
//             "S": "New item!"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "SequenceNumber": "222",
//         "Keys": {
//           "Id": {
//             "N": "101"
//           }
//         },
//         "SizeBytes": 59,
//         "NewImage": {
//           "Message": {
//             "S": "This item has changed"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "StreamViewType": "NEW_AND_OLD_IMAGES"
//       },
//       "awsRegion": "eu-west-1",
//       "eventName": "MODIFY",
//       "eventSourceARN": "arn:aws:dynamodb:eu-west-1:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
//       "eventSource": "aws:dynamodb"
//     },
//     {
//       "eventID": "3",
//       "eventVersion": "1.0",
//       "dynamodb": {
//         "Keys": {
//           "Id": {
//             "N": "101"
//           }
//         },
//         "SizeBytes": 38,
//         "SequenceNumber": "333",
//         "OldImage": {
//           "Message": {
//             "S": "This item has changed"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "StreamViewType": "NEW_AND_OLD_IMAGES"
//       },
//       "awsRegion": "eu-west-1",
//       "eventName": "REMOVE",
//       "eventSourceARN": "arn:aws:dynamodb:eu-west-1:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
//       "eventSource": "aws:dynamodb"
//     }
//   ]
// }
