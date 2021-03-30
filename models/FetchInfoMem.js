const REQUEST_NAF = 290 * 1000; // ms
const SAVE_COLLS = [
  'brand',
  'city',
  '__v',
  'area_id',
  'naf',
  'totalReq',
  'total429',
  'total401',
  'total403',
  'totalAf',
  'totalMaxRecursive',
  'totalMaxRetry',
  'totalErr',
  'totalData',
  'maxZ',
  'status',
  'errInfos'
];

class FetchInfo {
  constructor(brand, city, __v, area_id) {
    this.brand = brand;
    this.city = city;
    this.__v = __v;
    this.area_id = String(area_id);
    this.naf = Date.now() + REQUEST_NAF;
    this.totalReq = 0;
    this.total429 = 0;
    this.total401 = 0;
    this.total403 = 0;
    this.totalAf = 0;
    this.totalMaxRecursive = 0;
    this.totalMaxRetry = 0;
    this.totalErr = 0;
    this.totalData = 0;
    this.maxZ = 0;
    this.status = 0; // 0 is ok, others are not ok
    this.errInfos = [];
  }
  setBrand(brand) {
    this.brand = brand;
    return this;
  }
  setCity(city) {
    this.city = city;
    return this;
  }
  set__V(__v) {
    this.__v = __v;
    return this;
  }
  setAreaId(area_id) {
    this.area_id = Striing(area_id);
    return this;
  }
  setTotalData(totalData) {
    this.totalData = totalData;
    return this;
  }
  addTotalData(totalData) {
    this.totalData += totalData;
    return this;
  }

  setStatus(status) {
    this.status = status;
    return this;
  }

  pushErrInfo(errinfo) {
    this.errInfos.push(errinfo);
    return this;
  }

  ok() {
    return this.status === 0;
  }

  inc(col) {
    const v = this[col] || 0;
    this[col] = v + 1;
    return this;
  }
  incTotalReq() {
    return this.inc('totalReq')
  }
  incTotal429() {
    return this.inc('total429')
  }
  incTotal401() {
    return this.inc('total401')
  }
  incTotal403() {
    return this.inc('total403')
  }
  incTotalAf() {
    return this.inc('totalAf')
  }
  incTotalMaxRecursive() {
    return this.inc('totalMaxRecursive')
  }
  incTotalMaxRetry() {
    return this.inc('totalMaxRetry')
  }
  incTotalErr() {
    return this.inc('totalErr')
  }

  testAf() {
    const af = Date.now() > this.naf; // after 
    if (af) {
      this.incTotalAf();
    }
    return af;
  }

  testMaxZ(z) {
    if (Number(z) > Number(this.maxZ)) {
      this.maxZ = z;
      return true;
    }
    return false;
  }

  get429Rate() {
    return this.total429 / this.totalReq;
  }
  get403Rate() {
    return this.total403 / this.totalReq;
  }

  async save() {
    logger.log('FetchInfoMem:', JSON.stringify(this))
  }

}


module.exports = FetchInfo;
