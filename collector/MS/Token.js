
const TokenPool = require('../TokenPool');

class Token extends TokenPool {
  constructor(options) {
    super(options);
  }

  async get() {
    return null;
  }
}

module.exports = Token;