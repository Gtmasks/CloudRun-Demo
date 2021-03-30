const axios = require('axios');

const { alert } = require('./Utils');
/**
 * @ Method Base Class
 * 
 * 实现单个请求和结果处理
 */
module.exports = class Method {
  constructor() {
    this.method = '';
    this.baseURL = '';
    this.uri = '';
  }

  /**
   * init
   * @param {*} options 
   * 
   * 初始化Method
   */
  init(options) {
    this.options = options;
    return true;
  }

  /**
   * buildHeader
   * 
   * 构建请求的http headers
   */
  async buildHeaders() { return {}; }

  /**
   * buildParams
   * 
   * 构建请求的参数
   */
  async buildParams() { return {}; }

  /**
   * buildRequestData
   * 
   * 构建请求的Body
   */
  async buildRequestData() { return {}; }

  /**
   * processData
   * @param {*} data 
   * 
   * 处理返回的Body
   */
  async processData(data) { return data; }      // return a array or string

  /**
   * on401
   * @param {*} headers 
   * 
   * 处理http code为401的情况
   */
  async on401(headers) {
  }

  /**
   * on500
   * @param {*} err 
   * 
   * 处理http code不在(199, 300)之间且不为401和
   * http请求其他错误
   */
  async on500(err) { logger.error(err); }

  /**
   * success
   * @param {*} body 
   * 
   * @return
   * @ {
   * @ status: 'Empty' | 'OK';
   * @ data: null | any;
   * @ error: 'Response body is empty' | 'OK';
   * @ }
   * 
   * 对正常的请求结果进行处理
   */
  async success(body) {
    const data = await this.processData(body);
    const total = data.length;
    if (total === 0) {
      return {
        status: 'Empty',
        data: null,
        error: 'Response body is empty',
      };
    } else {
      return {
        status: 'OK',
        data,
        error: 'OK',
      };
    }
  }

  /**
   * ok
   * @param status: nubmer;
   * 
   * 判断http code是否在(199, 300)之间
   */
  ok(status) { return status > 199 && status < 300; }

  /**
   * 
   * invoke
   * 
   * @return
   * @{
   * @ status: 'OK' | 'Empty' | '401' | 'Error' | '${httpCode}';
   * @ data: Array<{[key: string]: any}> | null;
   * @ error: string | any;
   * @} | any
   * 
   * 进行请求
   */
  async invoke() {
    // const self = this;
    let method;
    let params;
    let datas;
    let headers;
    let responseData;
    let httpStatus;
    try {
      method = this.method.toLowerCase();
      headers = await this.buildHeaders();
      params = await this.buildParams();
      datas = await this.buildRequestData();
      const response = await axios({
        method,
        baseURL: this.baseURL,
        url: this.uri,
        headers,
        params,
        data: datas,
        timeout: 30000
      });
      const { status, data } = response
      httpStatus = status;
      responseData = data;
      if (this.ok(status)) {
        return await this.success(data);
      }
      throw new Error(`${this.baseURL}/${this.uri}  ${status}`);
    } catch (err) {
      if (err.response) {
        alert(err.response, this);
        httpStatus = err.response.status;
        responseData = err.response.data;
        if (err.response.status === 401) {
          const _res = await this.on401(err.response.headers);
          return _res || {
            status: '401',
            data: null,
            error: 'Unauthorized'
          };
        }
      } else {
        responseData = err.toString();
      }
      logger.error(err);
      const _res = await this.on500(err);
      return _res || {
        status: err.response ? `${err.response.status}` : 'Error',
        data: null,
        error: err,
      };
    } finally {
      logger.log(JSON.stringify({
        request: {
          method,
          baseURL: this.baseUrl,
          url: this.uri,
          headers,
          params,
          datas
        },
        httpStatus,
        response: responseData
      }, null, 2));
    }
  }
};
