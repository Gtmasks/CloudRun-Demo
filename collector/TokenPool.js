
const { sleep } = require('../components/Utils');
const Din = require('../components/DingTalk');

class Token {
  constructor(options) {
    this.options = options;
    const { brand, city } = this.options;
    this.brand = brand;
    this.city = city;
    this.refreshToken = null;
    this.accessToken = null;
    this.refreshing = false;
    this.waits = []; // 当刷新token的过程中， 新来的获取token请求入队列

    this.maxRetry = 3;
    this.getTokenTimeout = 30 * 1000; // 30 s
    this.retryTime = 2 * 1000; // 2s
  }

  bearerToken(token) {
    return `Bearer ${token}`;
  }

  // get token
  get() {
    if (!this.refreshing && this.accessToken) {
      return this.accessToken;
    }

    /**
     * if refreshing, wait for new token
     */
    return new Promise((resolve, reject) => {
      let t;
      const stub = {
        then: () => {
          if (t) {
            clearTimeout(t);
          }
          resolve(this.accessToken);
        }
      };
      this.waits.push(stub);
      // handle long time wait
      t = setTimeout(() => {
        const idx = this.waits.indexOf(stub);
        if (idx > -1) {
          this.waits.splice(idx, 1); // remove stub
        }
        reject(new Error('Get token Timeout'));
      }, this.getTokenTimeout) // 30s timeout
    });
  }

  async doLoad() {
    return { accessToken: null, refreshToken: null };
  }

  async load() {
    const { accessToken, refreshToken } = (await this.doLoad()) || {};
    if (accessToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      return true
    }
    return this.refresh();
  };

  async doRefresh() { }

  async refresh(retry = 0) {
    if (retry > 0) {
      logger.log(`refresh token[${this.refreshToken}]. retry: ${retry}`);
    }
    if (retry > this.maxRetry) { // 超过重试次数
      logger.log(`refresh token[${this.refreshToken}]. retry max time ${this.maxRetry}`);
      DingTalk.robotSay('ALARM', `
    - Brand: ${this.options.brand} 
    - City: ${this.options.city} 
    - Message: Refresh Tooken Failed With ${this.maxRetry} Times \n
    `);
      return false;
    }
    if (this.refreshing) {
      return false;
    }
    this.refreshing = true;

    try {
      const { accessToken, refreshToken } = await this.doRefresh();
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.refreshing = false;
      Promise.all(this.waits);
      process.nextTick(() => {
        // make sure all waits are resolved
        this.waits = [];
      });
      return true;
    } catch (err) {
      this.refreshing = false;
      console.error(err);
      await sleep(this.retryTime); // 1s
      return this.refresh(retry + 1);
    }
  }
}

module.exports = Token;