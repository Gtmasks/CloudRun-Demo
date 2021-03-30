
const crypto = require('crypto');

class Encrypt {
  md5(input) {
    const _md5 = crypto.createHash('md5');
    return _md5.update(input).digest('hex');
  }
}

module.exports = new Encrypt();