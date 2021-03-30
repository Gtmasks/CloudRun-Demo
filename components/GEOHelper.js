const inside = require('point-in-polygon');

const RATIO_DEGREES = 180 / Math.PI
const RATIO_RADIANS = Math.PI / 180
const R = 6378.137 * 1000; // km (change this constant to get miles)

class GEOGelper {
  distance([lat1, lon1], [lat2, lon2]) {
    if (lat1 == 0 || lon1 == 0) {
      // if no start location return -1
      return -1;
    }
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d);
  }

  isInside([x, y], polygon) {
    return inside([x, y], polygon);
  }

  radians(degrees) {
    return degrees * RATIO_RADIANS
  }

  degrees(radians) {
    return radians * RATIO_DEGREES
  }

  /**
   * 获取到给定点指定距离和方位角的空间点
   * @param {*} [loc] - source location 
   * @param {*} d - distance
   * @param {*} brng - radians
   */
  getVPoint([lat, lng], d, brng) {
    const lat1 = this.radians(lat);
    const lon1 = this.radians(lng);
    let lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) +
      Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));

    let lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
      Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

    lat2 = this.degrees(lat2);
    lon2 = this.degrees(lon2);
    return [lat2, lon2]
  }
}
module.exports = new GEOGelper();
