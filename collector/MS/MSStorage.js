const Storage = require('../../components/Storage');

module.exports = class GreenStorage extends Storage {
  constructor() {
    super();
    this.unicode = '';
  }

  init(options) {
    this.options = options;
    this.unicode = options.unicode;
    this.brand = options.brand;
    return this;
  }

  dataProcessor(data) {
    const rst = { brand: this.brand, city: this.unicode }
    const { serialNumber, vehicleCurrentStatus = {} } = data;
    const { batteryPercentage, coordinate } = vehicleCurrentStatus;
    const { coordinates } = coordinate; // lng, lat
    const [lng, lat] = coordinates;
    rst.vehicle_id = serialNumber;
    rst.vol = String(batteryPercentage) || '0';
    rst.latitude = +lat;
    rst.longitude = +lng;
    rst.total_mileage = 0;
    rst.status = 1;
    rst.collected_at = data.collected_at;
    rst.vehicle_type = 'scooter';
    rst.__v = data.__v;
    rst.area_id = data.area_id;
    const {
      currency,
      basePrice,
      baseMinute,
      extraUnitMinute,
      extraUnitPrice
    } = this.options;

    const unlockingCents = basePrice - (baseMinute / extraUnitMinute) * extraUnitPrice;
    const pricingUnitSeconds = 60; // 1min
    const pricingAmountCents = extraUnitPrice / extraUnitMinute;

    rst.price_model = { pricingUnitSeconds, unlockingCents, currency, pricingAmountCents };
    const ext_data = {};
    const km = new Map([
      ['collected_at', ''],
      ['__v', ''],
      ['area_id', '']
    ]);
    for (const k of Object.keys(data)) {
      if (km.has(k)) {
        continue;
      }
      ext_data[k] = data[k];
    }
    rst.ext_data = ext_data;
    data = null;
    return rst;
  }
};
