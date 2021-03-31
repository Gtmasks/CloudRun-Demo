const { Storage } = require('@google-cloud/storage');
const moment = require('moment')
const uuid = require('uuid')
const storage = new Storage();
const bucket = storage.bucket('global-config');

/**
 * Storage Base Class
 * 
 * 实现结果存储
 */
module.exports = class Storage {
  constructor() {
    this.maxChunkLength = 450;
  }

  init(options) { }

  /**
   * dataProcessor
   * @param {*} data 
   * 
   * 将Method返回数据进行格式统一
   */
  dataProcessor(data) { return data; }

  /**
   * save
   * @param {*} data 
   * 
   * 保存数据
   * 在redis中记录保存的数据条目数
   * 将需要保存的数据发送的Kinesis stream中
   * 以便后继过程进行处理
   */
  async save(data) {
    if (!data) {
      console.log(`Save Data No data!`);
      return
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    const { brand } = this.dataProcessor(data[0]);
    const nowStr = moment().format('YYYY-MM-DD-HH-mm-ss-SSS')
    const [y, m, d, h, mi, s, ms] = nowStr.split('-');
    const folder = `prod/${brand}/${y}/${m}/${d}`;
    const fileName = `${folder}/${nowStr}-${uuid.v4()}.txt`;
    const file = bucket.file(fileName);
    const bf = Buffer.from('', 'utf-8');
    for (let i = 0; i < data.length; i++) {
      const _data = this.dataProcessor(data[i]);
      bf.write(`${JSON.stringify(_data)}\n`)
    }
    await new Promise((resolve, reject) => {
      file.save(bf, function (err) {
        if (err) {
          console.log(`Save Data [${fileName}] error: `, err);
          console.log(err);
          return reject(err)
        }
        console.log(`Save Data [${fileName}] Success!`);
        resolve();
      });
    })
  }
}
