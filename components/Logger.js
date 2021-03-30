const moment = require('moment');
class Logger {
  constructor(options) {
    this.options = options;
    const { brand, city, area_id = 1 } = this.options;
    let { __v } = this.options;
    this.brand = brand;
    this.city = city;
    this.area_id = area_id;

    if (__v === undefined) {
      const now = moment();
      const step = 5; // min
      const minute = now.minute();
      const hour = now.hour();
      __v = hour * (60 / step) + Math.floor(minute / step) + 1; // begin from 1
    }
    this.__v = __v;
    for (const attr in console) {
      const act = console[attr];
      if (typeof act === 'function') {
        this[attr] = act.bind(console, `[${this.brand},${this.city}:${this.area_id},${this.__v}]:`);
        this[`x${attr}`] = act.bind(console, `[${this.brand},${this.city}:${this.__v},${this.area_id}]:`);
        this[`v${attr}`] = act.bind(console, `[${this.brand},${this.city},${this.__v}]:`);
        this[`a${attr}`] = act.bind(console, `[${this.brand},${this.city},${this.area_id}]:`);
      }
    }
  }
}

module.exports = Logger;