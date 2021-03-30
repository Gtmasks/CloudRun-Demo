
const moment = require('moment');
const Collector = require('../Collector');
const { VEHICLE_DATA_RADIUS_KM } = require('./Constants');
const MSStorage = require('./MSStorage');
const Fetcher = require('./Fetcher');
const Token = require('./Token');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports = class MSCollector extends Collector {
  constructor() {
    super();
  }

  async init(options) {
    let res = super.init(options);
    if (!res) {
      return res;
    }
    const { brand, city } = this.options;

    try {
      this.options.OA = JSON.parse(this.options.OA);
    } catch (err) {
      logger.error(err);
      throw err
    }

    // init storage
    this.storage = new MSStorage();
    this.storage.init(this.options);

    // init token pool
    this.token = new Token(this.options);

    const [[ne_lat, ne_lng], [sw_lat, sw_lng]] = this.getNESW(this.options.OA)
    let zoneNum = 0;
    const LAT_MOVE = this.getVMove(VEHICLE_DATA_RADIUS_KM * 1000);;
    const LNG_MOVE = LAT_MOVE;
    try {
      for (let i = 0; ; i++) {
        const _lat_s = sw_lat + i * LAT_MOVE;
        const _lat_n = _lat_s + LAT_MOVE;
        for (let j = 0; ; j++) {
          const _lng_w = sw_lng + j * LNG_MOVE;
          const _lng_e = _lng_w + LNG_MOVE;
          zoneNum++;
          const f = new Fetcher([_lat_n, _lng_e], [_lat_s, _lng_w], 0, String(zoneNum))
            .setOptions(this.options)
            .setTokenPool(this.token)
          // .setStorage(this.storage);
          this.methods.set(f, 0);
          if (_lng_e >= ne_lng) {
            break;
          }
        }
        if (_lat_n > ne_lat) {
          break;
        }
      }
    } catch (err) {
      logger.error(err, `${brand},${city} start from OA error`);
    }
    logger.log(`${brand},${city} create ${zoneNum} zone for OA: [${sw_lat}, ${sw_lng}], [${ne_lat}, ${ne_lng}]`);
    return true;
  }

  async run() {
    try {
      logger.log('Run ...');
      const now = moment();
      const step = 5; // min
      const minute = now.minute();
      const hour = now.hour();
      const __v = hour * (60 / step) + Math.floor(minute / step) + 1; // begin from 1
      const invokes = [];
      for (const [fn] of this.methods) {
        invokes.push(fn.invoke(now, __v));
      }
      const rsts = await Promise.all(invokes);
      let results = [];
      for (const rst of rsts) {
        results = results.concat(rst);
      }


      if (this.storage) {
        await this.storage.save(results).catch((err) => {
          logger.error(`Brand: ${this.options.brand}, City: ${this.options.city} save data failed, ${err}`);
        });
      } else {
        logger.error(`Brand: ${this.options.brand}, City: ${this.options.city} storage not init.`);
      }
      return results;
    } catch (err) {
      logger.error(err);
    }
  }
}
