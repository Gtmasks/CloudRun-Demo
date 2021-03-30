const DingTalk = require('./DingTalk');

exports.sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};


// random sleep
exports.rsleep = (ms, r = 8 * 1000, min = 200) => new Promise(resolve => {
  // 生成+-r的随机数
  let _ms = Math.floor((Math.random() - 0.5) * 2 * r) + ms;
  if (_ms < min) {
    _ms = min; // 最低休眠min ms
  }
  setTimeout(resolve, _ms)
});

exports.ok = (status) => { return status > 199 && status < 300; }

const N_ALERT_URL_PREFIXS = [
];
const N_ALERT_URLS = new Map();
const ALERT_URLS = new Map();
const judgeAlert = ({ url = '' }) => {
  if (ALERT_URLS.has(url)) {
    return true;
  }
  if (N_ALERT_URLS.has(url)) {
    return false;
  }
  for (const up of N_ALERT_URL_PREFIXS) {
    if (url.startsWith(up)) {
      N_ALERT_URLS.set(url, true);
      return false;
    }
  }
  ALERT_URLS.set(url, true);
  return true;
};
exports.alert = async (response, _this) => {
  try {
    if (!response) {
      return;
    }
    const statusCode = response.status;
    if (this.ok(statusCode)) {
      return;
    }
    const { brand, city } = _this.options;
    const req = response.request;
    const res = req.res;
    const url = res.responseUrl;
    if (!judgeAlert({ url })) {
      return;
    }
    const method = req.method;
    const message = response.data;
    DingTalk.robotSay('ALARM', `
    - Brand: ${brand} 
    - City: ${city} 
    - Url: ${method} ${url} 
    - Status: ${statusCode}
    - Message: ${JSON.stringify(message)} \n
    `);
  } catch (err) {
    console.error(err);
  }
}


exports.base64Decode = (str) => {
  if (!str) {
    return str;
  }
  return new Buffer(str, 'base64').toString('utf-8');
}
