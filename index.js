const Collector = require('./collector');
const redis = require('ioredis');
const constants = require('./constants');
const Logger = require('./components/Logger');
exports.handler = async (event, context, callback) => {
  try {
    const task = event;
    console.log(`Brand: ${task.brand}, City: ${task.city}`);
    console.log(JSON.stringify(task, null, 2));

    // init logger for brand, city
    global.logger = new Logger(task);
    {
      process.on('unhandledRejection', (reason, p) => {
        logger.error(reason, 'unhandledRejection', p);
      });
      process.on('uncaughtException', (err) => {
        logger.error(err, 'uncaughtException');
      });
    }

    /**
    * 初始化Redis连接
    * 每次都需要重新初始化
    * 函数实例可能复用，每次执行完不关闭连接会导致函数调用超时
    */
    const Client = {}
    // const Client = new redis({
    //   port: constants.REDIS_PORT,
    //   host: constants.REDIS_HOST,
    //   db: constants.REDIS_DB,
    //   connectTimeout: 20000,
    // });

    // global.Redis = Client;

    // Client.on('error', (error) => {
    //   console.log(error);
    // });

    // // connect redis
    // await new Promise((resolve) => {
    //   Client.on('connect', () => {
    //     console.log('Redis connected.');
    //     resolve();
    //   });
    // });

    // 根据品牌来初始化Collector
    let _Collector = Collector[task.brand];
    if (_Collector === undefined) {
      console.log(`Unknown brand: ${task.brand}. City: ${task.city}`);
      return;
    }
    _Collector = _Collector.Collector || _Collector[`${task.brand}Collector`];
    if (!_Collector || typeof _Collector !== 'function') {
      console.log(`collector file name shoule be Collectior or ${task.brand}Collectior, and exports a class or function`);
      return;
    }
    const collector = new _Collector();
    if (collector) {
      const res = await collector.init(task);
      if (!res) {
        console.log(`Init ${task.brand}Collector failed.`);
        return;
      }
      await collector.run();
    } else {
      console.log('Create collector failed.');
    }
  } catch (error) {
    console.log(error);
  }

  // 关闭Redis连接，防止函数调用超时
  if (global.Redis) {
    global.Redis.disconnect();
    global.Redis = undefined;
  }

  console.log(`Done`);

  callback(null, "message");
};


const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(bodyParser.json({
  limit: '10mb'
}));
app.use(bodyParser.text({
  limit: '10mb'
}));

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`${name}: Hello Breeze!`);
});

// Message consumer
app.post('/api/event/storage/message', async (req, res) => {
  console.log(`Message consumer`);
  try {
    let content = req.body.content;
    if (typeof content === 'string') {
      content = JSON.parse(content)
    }
    const event = content;
    await exports.handler(event, null, (err, msg) => { });
    res.send(`consumer success!`);
  } catch (err) {
    console.log(err);
    return res.send(`consumer error: ${err.message}`)
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`breeze worker: listening on port ${port}`);
});
