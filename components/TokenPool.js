
const Authorization = require('../models/Authorization');
const DingTalk = require('./DingTalk');

const CONSTS = {
  CODE_TOO_MANY_USE: 429,
  TOKEN_REST_TIME: 30 * 1000, // 30s
  FETCH_TOKEN_WAIT_TIME_WHEN_REFRESH: 30 * 1000, // 30s
  MAX_USE: process.env.TOKEN_MAX_USE || 45,
  COUNT_FOR_SECONDS: process.env.TOKEN_COUNT_FOR_SECONDS || 10 // s
}
class TokenPool {
  constructor(brand, city) {
    if (!brand) {
      throw new Error('miss brand');
    }
    this.brand = brand;
    this.city = city;
    this.key = `__Token_Pool__${brand}__For_Count__`;
    this._b = Date.now() * 1e3;
    this._s = process.hrtime();
    this._tokens = [];
    this._total = this._tokens.length;
  }

  alert(message) {
    DingTalk.robotSay('Token Pool Error', `
    - Brand: ${this.brand} \n
    - City: ${this.city} \n
    - Message: ${message}\n
    `);
  }

  now() {
    const [s, n] = process.hrtime(this._s);
    return this._b + s * 1e6 + Math.round(n * 1e-3);
  }

  get CONSTS() {
    return CONSTS;
  }

  del(token) {
    // remove token from pool
    const idx = this._tokens.indexOf(token);
    if (idx > -1) {
      this._tokens.splice(idx, 1);
      this._total = this._tokens.length;
    }
    logger.info(`del token, pool size: ${this._total}`);
  }

  async addTo429(token) {
    // when 429, delete token
    this.del(token);
    await Authorization.freezeToken(token);
  }

  async countToken(token) {
    try {
      const k = `__Token_Pool__Count_token:${token}`;
      const n = await Redis.incr(k);
      await Redis.expire(k, CONSTS.COUNT_FOR_SECONDS);
      return n;
    } catch (err) {
      logger.error(err);
      return 0;
    }
  }


  async fetch() {
    if (!this._total) {
      return null;
    }
    const c = await Redis.incr(this.key);
    const idx = Number(c) % this._total;
    if (c > 1e9 && idx === 0) { // avoid big number
      const _rest_key = `${this.key}__rest`;
      try {
        const n = await Redis.setnx(_rest_key, 0);
        if (n === 1) {
          await Redis.del(this.key);
          await Redis.del(_rest_key);
        } else {
          // do nothing
        }
      } catch (err) {
        logger.error(err);
      }
    }
    const tk = this._tokens[idx];
    const num = await this.countToken(tk);
    if (num > CONSTS.MAX_USE) {
      this.del(tk);
      logger.error(`token max use than ${CONSTS.MAX_USE}`);
      return this.fetch();
    }
    return tk;
  }

  async remove(tk) {
    await Authorization.expireToken(tk);
    this.del(tk);
  }

  async refresh() {
    const all = await Authorization.findValiTokensByBrand(this.brand);
    const length = all.length;
    if (!length) {
      const message = 'No Token To Use In Token Pool';
      this.alert(message);
      throw new Error(message);
    }
    this._tokens = all;
    this._total = this._tokens.length;
    logger.log(`${this.key} refresh tokens ${length}`);
    return length;
  }
}

module.exports = TokenPool;