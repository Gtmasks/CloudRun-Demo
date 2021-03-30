/**
 * 采集器的任务数据
 */
interface CollectorOptions {
  brand: string;
  city: string;
  country: string;
  currency: string;
  timezone: string;
  code: string;
  unicode: string;
  token: string;
  interval: string;
  OA: string;
  unlockingCents: string;
  pricingAmountCents: string;
  pausedPricingCents: string | undefined;
  pricingUnitSeconds: string;
  extraCharge: string;
  OACircular: {
    point: {
      lat: number;
      lng: number;
    },
    radius: number;
  } | undefined;
  retryTimes?: number;  // 重试次数
  retryInterval?: number; // 重试间隔
  WareHousePoint?: string;
};
