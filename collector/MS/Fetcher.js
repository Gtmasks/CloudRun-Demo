
const Fetcher = require('../Fetcher');
const { DATA_URL, VEHICLE_DATA_RADIUS_KM, RETRY_TIME } = require('./Constants');

class DataFetcher extends Fetcher {
  constructor(...args) {
    super(...args)
  }
  // see Class WebApi
  async onError(err, statusCode, webApi) {
    return RETRY_TIME;
  }
  async onSuccess(body, response, webApi) {
    const { data = {} } = body;
    const { ridableVehicles } = data;
    if (!Array.isArray(ridableVehicles)) {
      return { s: 1, datas: [] };
    }
    return { s: 0, datas: ridableVehicles }
  }
  async onFailure(message, webApi) {
    return { s: 1, datas: [] };
  }

  // config WebApi 
  async confApi(dataFetchMethod) {
    const center = dataFetchMethod.center;
    const [lat, lng] = center;
    return {
      method: 'post',
      url: DATA_URL,
      headers: {
        Host: 'alpaca.maasasia.com',
        'content-type': 'application/json',
        'user-agent': '%EC%95%8C%ED%8C%8C%EC%B9%B4/2013 CFNetwork/1128.0.1 Darwin/19.6.0',
        'accept-language': 'zh-cn',
        'accept': '*/*',
        'if-none-match': 'W/"40-CUt3E0YVPH5hDfxmt82OfWyW3Cw"',
        'authorization': ''
      },
      data: { "operationName": "GetRidableVehicle", "variables": { "center": { "type": "Point", "coordinates": [lng, lat] } }, "query": "query GetRidableVehicle($center: GeoJSONPoint!) {\n  ridableVehicles(center: $center) {\n    id\n    serialNumber\n    vehicleCurrentStatus {\n      id\n      batteryPercentage\n      coordinate\n      __typename\n    }\n    __typename\n  }\n}\n" },
      rejectUnauthorized: false,
    }
  };

  /**
   * next: 是否需要递归进行抓取
   * datas: 本次抓取的有效数据
   * @param {*} datas
   */
  async next(dataFetchMethod, datas) {
    return {
      next: false, datas
    };
  }

  async processData(data) {
    data.area_id = this.area_id;
    return data;
  }

  async distinct(data) {
    return data.serialNumber;
  }
}

module.exports = DataFetcher;