
const axios = require('axios');
const AxiosRequestAdapter = require('./AxiosRequestAdapter');
const FetchInfo = require('../models/FetchInfoMem');
const { alert, sleep } = require('./Utils');


class ResponseError extends Error {
  constructor(response) {
    super('ResponseError');
    this.response = response;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class WebApi {
  constructor() {
    this._maxRetry = 3;
    this._fetchInfo = null;
    this._retry = 0;
    this._conf = null;
    this._lib = axios;
    this._url = null;
    this._method = null;
    this._inited = false;

    this._onError = async (err, statusCode, _webapi) => {
      logger.error(err);
      return false;
    }
    this._onFailure = async (message, _webapi) => {
      logger.log(`${this.ref()}. Failed!!!`)
      return null;
    };
    this._onSuccess = async (data, res, _webapi) => {
      return data;
    }
  }

  maxRetry(maxRetry) {
    this._maxRetry = maxRetry;
    return this;
  }

  fi(fi) {
    this._fetchInfo = fi;
    return this;
  }

  useLib(lib) {
    if (!lib) {
      lib = AxiosRequestAdapter;
    }
    this._lib = lib;
    return this;
  }

  onError(fn) {
    this._onError = async (err, statusCode, _webapi) => {
      logger.log(`${this.ref()} Error: ${err.message}`);
      if (err.toString().includes('tunneling socket could not be established')) {
        alert(err, this);
      }
      return await fn(err, statusCode, _webapi);
    }
    return this;
  }

  onFailure(fn) {
    this._onFailure = async (message, _webapi) => {
      logger.log(`${this.ref()} Failure: ${message}`);
      return await fn(message, _webapi);
    }
    return this;
  }

  onSuccess(fn) {
    this._onSuccess = async (data, res, _webapi) => {
      return await fn(data, res, _webapi);
    }
    return this;
  }

  init(options) {
    this.options = options;
    return this;
  }

  conf(conf) {
    this._conf = conf;
    const { baseURL = '', url = '', method = '' } = this._conf;
    this._url = `${baseURL}${url}`;
    this._method = method.toUpperCase();
    this._inited = true;
    return this;
  }

  getConf() {
    if (!this._inited) {
      throw new Error('WebApi Not Init!');
    }
    return this._conf;
  }

  ok(status) {
    return status > 199 && status < 300
  }

  ref() {
    return `${this._method} ${this._url}`;
  }

  async wget(retry = 0) {
    if (!this._inited) {
      throw new Error('WebApi not inited!');
    }
    if (!this._fetchInfo) {
      this._fetchInfo = new FetchInfo();
    }
    if (retry > 0) {
      logger.log(`${this.ref()}. retry: ${retry}`);
    }
    if (retry > this._maxRetry) {
      this._fetchInfo.incTotalMaxRetry();
      this._fetchInfo.pushErrInfo(`retry max time ${this._maxRetry}`);
      return await this._onFailure('MAX_RETRY', this);
    }
    if (this._fetchInfo.testAf()) {
      this._fetchInfo.pushErrInfo('request outof time');
      return await this._onFailure('OUT_OF_TIME', this);
    }
    let _httpStatus = 0;
    let _res = null;
    try {
      this._fetchInfo.incTotalReq();
      const res = await this._lib(this._conf);
      const { status, data, headers } = res;
      _httpStatus = status;
      _res = { status, data, headers };
      if (this.ok(status)) {
        return await this._onSuccess(data, res, this);
      }
      throw new ResponseError(res);
    } catch (err) {
      this._fetchInfo.incTotalErr();
      logger.error(err);
      console.log(err);
      console.log('WebApi_Error');
      if (err.response) {
        alert(err.response, this);
        _res = { status: err.response.status, headers: err.response.headers, data: err.response.data };
        _httpStatus = _res.status;
        if (typeof this._fetchInfo[`incTotal${_httpStatus}`] === 'function') {
          this._fetchInfo[`incTotal${_httpStatus}`](); // statistics by status
        }
      } else {
        _res = err.toString();
      }
      const flag = await this._onError(err, _httpStatus, this);
      if (flag) {
        await sleep(flag);
        return await this.wget(retry + 1);
      }
      return await this._onFailure(`flag=${flag}`, this);
    } finally {
      setTimeout(() => {
        let rsp = null;
        try {
          rsp = JSON.stringify(_res);
        } catch (err) {
          logger.error(err);
          console.log(_res);
        }
        logger.log({
          request: this._conf,
          httpStatus: _httpStatus,
          response: rsp
        });
      }, 0)
    }
  }

}
module.exports = WebApi;