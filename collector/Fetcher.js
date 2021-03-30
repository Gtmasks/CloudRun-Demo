const WebApi = require('../components/WebApi');
const FetchInfo = require('../models/FetchInfoMem');
const GEOHelper = require('../components/GEOHelper');


// 根据矩形区域拉取数据
class DataFetchMethod {
  constructor(ne, sw, z = 0, area_id = 0) {
    this.ne = ne; // 东北
    this.sw = sw; // 西南
    this.ne_lat = ne[0];
    this.ne_lng = ne[1];
    this.sw_lat = sw[0];
    this.sw_lng = sw[1];
    this.nw_lat = this.ne_lat;
    this.nw_lng = this.sw_lng;
    this.se_lat = this.sw_lat;
    this.se_lng = this.ne_lng;
    this.nw = [this.nw_lat, this.nw_lng]; // 西北
    this.se = [this.se_lat, this.se_lng]; // 东南
    this.region = [this.sw, this.nw, this.ne, this.se];
    this.z = z; // zoom level
    this.area_id = area_id;
    this.raduis = GEOHelper.distance(ne, sw) / 2;
    this.center = [(this.ne_lat + this.sw_lat) / 2, (this.sw_lng + this.ne_lng) / 2];

    // common datas
    this.options = null;
    this.datas = null;

    // api settings
    this.maxRecursive = 10;
    this.maxRetry = 3;
  }

  setApi(apiSetting) {
    if (apiSetting) {
      const { maxRecursive = 10, maxRetry = 3 } = apiSetting;
      this.maxRecursive = maxRecursive;
      this.maxRetry = maxRetry;
    }
    return this;
  }

  setDatas(datas) {
    this.datas = datas;
    return this;
  }

  init(options) {
    this.options = options;
    return this;
  }

  getApi() {
    return {
      maxRecursive: this.maxRecursive,
      maxRetry: this.maxRetry
    }
  }


  async fetchData(fetcher, fi) {
    fi.testMaxZ(this.z);
    if (this.z > this.maxRecursive) { // 防止栈溢出
      logger.error(`Maximum recursive size exceeded ${this.maxRecursive}`);
      fi.incTotalMaxRecursive();
      fi.pushErrInfo(`Maximum recursive size exceeded ${this.maxRecursive}`);
      return { s: 1, datas: [] }
    }
    const wapi = new WebApi().init(this.options)
      .fi(fi)
      .maxRetry(this.maxRetry);
    const conf = await fetcher.confApi(this);
    wapi.conf(conf)
    wapi.onSuccess(fetcher.onSuccess.bind(fetcher));
    wapi.onError(fetcher.onError.bind(fetcher));
    wapi.onFailure(fetcher.onFailure.bind(fetcher));
    let { s, datas } = await wapi.wget();
    const { next, datas: _datas } = await fetcher.next(this, datas);
    const total = _datas ? _datas.length : 0;
    if (s) { // not ok
      fi.setStatus(s);
      fi.addTotalData(total);
      return { s, datas: _datas };
    }
    if (!next) {
      return { s, datas: _datas };
    }
    const tasks = [Promise.resolve({ s: 0, datas: _datas })];
    const nextZ = this.z + 1;
    const regionNW = new DataFetchMethod([this.ne_lat, (this.ne_lng + this.sw_lng) / 2], [(this.ne_lat + this.sw_lat) / 2, this.sw_lng], nextZ, this.area_id)
      .init(this.options)
      .setApi(this.getApi())
      .setDatas(this.datas);
    const regionNE = new DataFetchMethod(this.ne, [(this.ne_lat + this.sw_lat) / 2, (this.ne_lng + this.sw_lng) / 2], nextZ, this.area_id)
      .init(this.options)
      .setApi(this.getApi())
      .setDatas(this.datas);
    const regionSE = new DataFetchMethod([(this.ne_lat + this.sw_lat) / 2, this.ne_lng], [this.sw_lat, ([this.ne_lng + this.sw_lng]) / 2], nextZ, this.area_id)
      .init(this.options)
      .setApi(this.getApi())
      .setDatas(this.datas);
    const regionSW = new DataFetchMethod([(this.ne_lat + this.sw_lat) / 2, (this.ne_lng + this.sw_lng) / 2], this.sw, nextZ, this.area_id)
      .init(this.options)
      .setApi(this.getApi())
      .setDatas(this.datas);
    tasks[tasks.length] = regionNW.fetchData(fetcher, fi);
    tasks[tasks.length] = regionNE.fetchData(fetcher, fi);
    tasks[tasks.length] = regionSE.fetchData(fetcher, fi);
    tasks[tasks.length] = regionSW.fetchData(fetcher, fi);
    const results = await Promise.all(tasks);
    const rsts = [];
    let _s = 0;
    const rstMap = new Map();
    for (const parts of results) {
      const { s, datas } = parts;
      _s += s;
      for (const data of datas) {
        const flag = await fetcher.distinct(data);
        if (rstMap.has(flag)) {
          continue;
        }
        rsts.push(data);
        rstMap.set(flag, 0);
      }
    }
    if (_s) { // not ok
      fi.setStatus(_s);
    }
    fi.addTotalData(rsts.length);
    return { s: _s, datas: rsts };
  }
}

class Fetcher {
  constructor(ne = [0, 0], sw = [0, 0], area_id = 1, z = 0) {
    this.ne = ne; // 东北
    this.sw = sw; // 西南
    this.z = z; // zoom level
    this.area_id = area_id;
    this.storage = null;
    this.tokenPool = null;
    this.options = null;
    this.datas = null;
    this.apiSetting = null;
    this.fetchInfoClass = FetchInfo;
  }

  setOptions(options) {
    this.options = options;
    return this;
  }

  setTokenPool(tokenPool) {
    this.tokenPool = tokenPool;
    return this;
  }

  setStorage(storage) {
    this.storage = storage;
    return this;
  }

  setDatas(datas) {
    this.datas = datas;
    return this;
  }

  setApi(apiSetting) {
    this.apiSetting = apiSetting;
    return this;
  }

  setFetchInfo(fetchInfo) {
    this.fetchInfoClass = fetchInfo;
    return this;
  }

  // see Class WebApi
  async onError(err, statusCode, webApi) { }
  async onSuccess(data, response, webApi) { }
  async onFailure(message, webApi) { }

  // config WebApi 
  async confApi(dataFetchMethod) { };

  /**
   * next: 是否需要递归进行抓取
   * datas: 本次抓取的有效数据
   * @param {*} datas
   */
  async next(dataFetchMethod, datas) {
    return { next: false, datas };
  }

  // 数据去重
  async distinct(data) {
    return data;
  }

  // process final data item
  async processData(data) {
    return data;
  }

  async invoke(now, __v) {
    const { brand, city } = this.options;
    const fi = new (this.fetchInfoClass)(brand, city, __v, this.area_id);
    const dfm = new DataFetchMethod(this.ne, this.sw, this.z, this.area_id)
      .init(this.options)
      .setApi(this.apiSetting)
      .setDatas(this.datas);
    const { datas: _results } = await dfm.fetchData(this, fi);
    const len = _results.length;
    const ok = fi.ok();
    logger.log({
      area_id: this.area_id,
      ok,
      total: len
    }, 'invoke fetchData');

    fi.setTotalData(len);
    logger.log('begin save fetchInfo...');
    await fi.save().catch(err => logger.error(err));
    logger.log('end save fetchInfo...');
    if (ok && len) { // write data
      const results = [];
      for (const _data of _results) {
        const data = await this.processData(_data);
        data.collected_at = now;
        data.__v = __v;
        data.area_id = this.area_id;
        results.push(data);
      }
      // if storage is set, save datas
      if (this.storage) {
        await this.storage.save(results).catch((err) => {
          logger.error(`Brand: ${this.options.brand}, City: ${this.options.city} save data failed, ${err}`);
        });
      }
      return results;
    } else {
      return [];
    }
  }
}

module.exports = Fetcher;