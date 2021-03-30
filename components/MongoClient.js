const mongoose = require('mongoose');
const constants = require('../constants');
mongoose.Promise = global.Promise;

const STATE = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
};

const ConnArgs = [
  constants.mongo.url,
  {
    auth: {
      user: constants.mongo.user,
      password: constants.mongo.password
    },
    poolSize: constants.mongo.poolSize,
    socketTimeoutMS: 240000,
    connectTimeoutMS: 60000,
    server: {
      socketOptions: {
        socketTimeoutMS: 240000,
        connectTimeoutMS: 60000
      }
    }
  }
];

mongoose.connect(...ConnArgs);
const MongoClient = mongoose.connection;
/**
     * mongo connect event
     */
MongoClient.on('connecting', () => {
  logger.log('mongodb connecting...');
});

MongoClient.on('connected', () => {
  logger.log('mongodb connected!');
});

MongoClient.on('disconnecting', () => {
  logger.log('mongodb disconnecting...');
});

MongoClient.on('disconnected', () => {
  logger.log('mongodb disconnected!');
});

MongoClient.on('reconnected', () => {
  logger.log('mongodb reconnected!');
});

MongoClient.on('close', () => {
  logger.log('mongodb closed!');
});

MongoClient.on('fullsetup', () => {
  logger.log('mongodb fullsetup!');
});

MongoClient.on('all', () => {
  logger.log('mongodb all!');
});

MongoClient.on('reconnectFailed', () => {
  logger.log('mongodb reconnectFailed!');
});

MongoClient.on('reconnectTries', () => {
  logger.log('mongodb reconnectTries!');
});

MongoClient.on('error', (err) => {
  logger.log('mongodb error!!!');
  logger.error(err);
});

const CloseMongoClient = async () => {
  if (MongoClient && MongoClient.close) {
    await new Promise((resolve, reject) => {
      MongoClient.close((err) => {
        if (err) {
          logger.error(err, 'Close mongodb error!');
          return reject(err);
        }
        resolve();
      });
    })
  }
};

const reconnect = () => {
  return mongoose.connect(...ConnArgs);
};

module.exports = { MongoClient, MongoClientFactory: { reconnect }, STATE, CloseMongoClient };