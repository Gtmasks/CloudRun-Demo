const request = require('request');
const { PROXY_URL } = process.env;

const ok = (status) => { return status > 199 && status < 300; };
module.exports = (opts) => {
  if (opts.params) {
    opts.qs = opts.params;
    delete opts.params;
  }
  if (opts.baseURL) {
    opts.url = `${opts.baseURL}${opts.url}`;
    delete opts.baseURL;
  }
  opts.json = true;
  if (PROXY_URL && !opts.proxy) {
    opts.proxy = PROXY_URL;
  }
  return new Promise((resolve, reject) => {
    request(opts, (err, response, body) => {
      if (err) {
        return reject(err);
      }
      const { statusCode, url, headers, method } = response;
      const request = {
        method,
        url,
        headers,
        res: {
          status: statusCode,
          responseUrl: url
        }
      }
      if (!ok(statusCode)) {
        response.status = statusCode;
        response.data = body;
        response.request;
        // error
        return reject({ response }); // err.response
      }
      resolve({
        status: statusCode,
        data: body,
        request
      });
    });
  })
}