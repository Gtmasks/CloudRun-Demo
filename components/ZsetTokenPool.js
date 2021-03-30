
const Authorization = require('../models/Authorization');

const CONSTS = {
  CODE_TOO_MANY_USE: 429,
  TOKEN_REST_TIME: 30 * 1000, // 30s
  FETCH_TOKEN_WAIT_TIME_WHEN_REFRESH: 30 * 1000 // 30s
}
class TokenPool {
  constructor(brand, city) {
    if (!brand) {
      throw new Error('miss brand');
    }
    this.brand = brand;
    this.city = city;
    this.key = `__Token_Pool__${brand}_${city}__`;
    this._b = Date.now() * 1e3;
    this._s = process.hrtime();
    this._rest = CONSTS.TOKEN_REST_TIME * 1000; // 微秒
    this._pool429 = new Map();
    this.refreshing = false;
    this.total = 0;
    this.alive = 0;
    this.waits = [];
  }

  now() {
    const [s, n] = process.hrtime(this._s);
    return this._b + s * 1e6 + Math.round(n * 1e-3);
  }

  get CONSTS() {
    return CONSTS;
  }

  addTo429(token) {
    this._pool429.set(token, this.now());
  }

  async add(...tks) {
    return Redis.zadd(this.key, ...tks.filter((v) => !!v).reduce((datas, tk) => {
      return datas.concat([this.now(), tk]);
    }, []));
  }

  async fetch() {
    if (!this.refreshing) {
      return this.get();
    }
    // token pool is refreshing, wait complete
    return new Promise((resolve, reject) => {
      let sid = null;
      const stub = {
        async then() {
          if (sid) {
            clearTimeout(sid);
          }
          const tk = await this.get();
          resolve(tk);
        }
      };
      this.waits.push(stub);
      sid = setTimeout(async () => {
        const idx = this.waits.indexOf(stub);
        if (idx > -1) {
          this.waits.splice(idx, 1); // remove stub
        }
        logger.error(`${this.brand} Get token Timeout ${CONSTS.FETCH_TOKEN_WAIT_TIME_WHEN_REFRESH}`);
        const tk = await this.get();
        resolve(tk);
      }, CONSTS.FETCH_TOKEN_WAIT_TIME_WHEN_REFRESH)

    });
  }
  async get() {
    const now = this.now();
    const data = await Redis.zrangebyscore(this.key, 0, now, 'WITHSCORES', 'LIMIT', 0, 1);
    if (!data || data.length != 2) {
      return null;
    }
    const t = data[0];
    if (this._pool429.has(t)) {// use to many
      const _ts = this._pool429.get(t)
      if (now - _ts < this._rest) { // less then use to limit
        return CONSTS.CODE_TOO_MANY_USE;
      } else {
        this._pool429.delete(t)
      }
    }
    await this.add(t); // refresh score
    return t;
  }

  async remove(tk) {
    this.alive = this.alive - 1;
    await Redis.zrem(this.key, tk);
    await Authorization.expireToken(tk);
    if (this.alive / this.total < 0.5) {
      this.refresh();
    }
  }

  async clear() {
    return Redis.del(this.key);
  }

  async tokens() {
    return Redis.zrange(this.key, 0, -1);
  }

  async refresh() {
    if (this.refreshing) {
      return;
    }
    this.refreshing = true;
    const all = await Authorization.findValiTokensByBrand(this.brand);
    const length = all.length;
    if (!length) {
      throw new Error('No Token Found');
    }
    await this.clear();
    this._pool429.clear();
    await this.add(...all);
    this.total = length;
    this.alive = this.total;
    this.refreshing = false;
    Promise.all(this.waits);
    process.nextTick(() => {
      this.waits = [];
    });
    logger.log(`${this.key} refresh tokens ${length}`);
    return length;
  }
}

module.exports = TokenPool;