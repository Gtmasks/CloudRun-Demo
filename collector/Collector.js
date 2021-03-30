const Utils = require('../components/Utils');
const GEOHelper = require('../components/GEOHelper');

/**
 * @ Collector Base Class
 *
 * Collector 控制采集逻辑
 * Method 实现单个请求和结果处理
 * Storage 实现结果存储
 */
module.exports = class Collector {
  constructor() {
    this.methods = new Map();
    this.storage = null;
    this.options = null;
    this.retryCount = 0;
  }

  /**
   * 
   * @param {*} map_radius 
   * 1. 根据半径算出内接正方形的边长
   * 2. 根据内接正方形边长长度计算空间将纬度的偏移量
   */
  getVMove(map_radius) {
    const base = [0, 0]
    const v = GEOHelper.getVPoint(base, 2 * map_radius / Math.sqrt(2), GEOHelper.radians(0));
    return v[0];
  }

  getNESW(OA) {
    let ne_lat;
    let ne_lng;
    let sw_lat;
    let sw_lng;
    for (const point of OA) {
      const [lat, lng] = point;
      if (ne_lat === undefined) {
        ne_lat = lat;
      }
      if (sw_lat === undefined) {
        sw_lat = lat;
      }
      if (ne_lng === undefined) {
        ne_lng = lng;
      }
      if (sw_lng === undefined) {
        sw_lng = lng;
      }
      if (lat > ne_lat) {
        ne_lat = lat;
      } else if (lat < sw_lat) {
        sw_lat = lat;
      }
      if (lng > ne_lng) {
        ne_lng = lng;
      } else if (lng < sw_lng) {
        sw_lng = lng;
      }
    }
    return [[ne_lat, ne_lng], [sw_lat, sw_lng]];
  }

  /**
   * init
   * @param 
   * @ {
   * @ brand: string;
   * @ city: string;
   * @ retryTimes?: number; // integer，不存在则不启用失败重试
   * @ retryInterval?: number; // ms
   * @ } options 
   * 
   * @return
   * true 初始化成功, false 初始化失败.
   */
  async init(options) {
    this.options = options;
    return true;
  }

  /**
   * runTask
   * @param
   * @ {
   * @ fn: Method;  // 请求接口类
   * @ } task 
   * 
   * 默认执行过程，请求->结果处理(成功，401，其他错误)
   * 请求成功会调用storeData方法进行数据保存
   * 401会调用genSession重新生成Session
   * 其他错误会首先调用onError，然后调用retry尝试重试
   */
  async runTask(task) {
    let res = await task.fn.invoke();
    console.log(`++++++${res.status}`);
    if (res.status === 'OK') {
      await this.storeData(res.data);
    } else if (res.status === '401') {
      // refresh token
      const refreshRes = await this.refresSession();
      if (refreshRes) {
        // res = await task.fn.invoke();
        res = await this.runTask(task);
      } else {
        // retry
        await this.retry(task);
      }
    } else {
      // error
      await this.onError(res.error);
      // retry
      await this.retry(task);
    }
  }

  /**
   * run
   * 运行采集任务
   */
  async run() {
    logger.log('Run ...');
    let res = await this.genSession();
    if (!res) {
      let count = 0;
      do {
        logger.log(`Brand: ${this.options.brand}, City: ${this.options.city} genSession ...`);
        let res = await this.refresSession();
        if (res) {
          break;
        }
        count++;
        if (count >= 3) {
          logger.log(`Brand: ${this.options.brand}, City: ${this.options.city} has retried max: ${count - 1}.`);
          break;
        }
        logger.log(`Brand: ${this.options.brand}, City: ${this.options.city} genSession failed, retry count: ${count}, wait ${count * 0.5}s`);
        await Utils.sleep(count * 500);
      } while (true);
    }
    for (const [fn, conf] of this.methods) {
      // collection data
      await this.runTask({ fn });
    }
  }

  /**
   * genSession
   * 刷新Session，建议子类重写
   */
  async genSession() { return true; }

  async refresSession() { return true; }

  /**
   * storeData
   * @param { any } data 
   * 
   * 配合各采集器的storage进行使用
   */
  async storeData(data) {
    if (this.storage) {
      await this.storage.save(data).catch((err) => {
        console.log(err)
        logger.error(`Brand: ${this.options.brand}, City: ${this.options.city} save data failed, ${err}`);
      });
    } else {
      logger.error(`Brand: ${this.options.brand}, City: ${this.options.city} storage not init.`);
    }
  }

  /**
   * onError
   * @param {*} err 
   * 
   * 默认错误处理逻辑
   */
  async onError(err) {
    logger.error(err, `Brand: ${this.options.brand}, City: ${this.options.city} FetchData Error.`);
  }

  /**
   * retry
   * 
   * 默认的重试逻辑
   * 如果初始化配置了retryTimes，则启用重试功能
   * retryInterval默认为2
   */
  async retry(task) {
    if (this.options.retryTimes === undefined) {
      return;
    }
    if (this.retryCount >= this.options.retryTimes) {
      logger.log(`Brand: ${this.options.brand}, City: ${this.options.city} has retried max: ${this.options.retryTimes}, interval: ${tihs.options.retryInterval}.`);
    } else {
      // retry
      this.retryCount++;
      await Utils.sleep(this.retryCount * (this.options.retryInterval || 2));
      await this.runTask(task);
    }
  }
};
