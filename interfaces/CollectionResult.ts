/**
 * 发送给breeze-{Brand}-DB-job的入库数据
 */
interface CollectionResult {
  brand: string;
  city: string;
  collected_at: string; // updated_at
  vehicle_type: string;
  vehicle_id: string;
  vol: string;
  latitude: number;
  longitude: number;
  total_mileage: number;
  status: number; // 1
  __v: number; // hour * (60 / stemp) + Math.floor(minute / step) + 1;
  price_model: {
    pricingAmountCents: string;
    pricingUnitSeconds: string;
    unlockingCents: string;
    currency: string;
  };
  ext_data: {
    [key: string]: any;
  };
};
