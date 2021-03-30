module.exports = {
  STATE: {
    ACTIVE: 'ACTIVE',
    UPDATING: 'UPDATING',
    CREATING: 'CREATING',
    DELETING: 'DELETING'
  },
  PROFILE: process.env.PROFILE || 'staging',
  STREAM_NAME: process.env.KINESIS_NAME || 'breeze-event-staging',
  PARTITION_KEY: '<string-value-if-one-shard-anything-will-do',
  PAYLOAD_TYPE: 'string',
  REGION: process.env.AWS_REGION || 'eu-west-1',
  KINESIS_API_VERSION: '2013-12-02',
  REDIS_HOST: process.env.REDIS_HOST || '',
  REDIS_DB: process.env.REDIS_DB || 2,
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  S3_API_VERSION: '2006-03-01',
  S3_BUCKET: process.env.BUCKET_NAME || '',
  CONFIG_PATH: process.env.CONFIG_PATH || '',
  RUNTIME: (process.env.AWS_EXECUTION_ENV
    && process.env.AWS_EXECUTION_ENV.indexOf('AWS_Lambda_') === 0) ?
    'lambda' : 'node',
  mongo: {
    url: process.env.MONGODB_SERVER,
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PWD,
    poolSize: process.env.MONGODB_POOL_SIZE || 1
  }
};
