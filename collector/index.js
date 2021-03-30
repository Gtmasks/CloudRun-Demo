const lazy = require('lazily-require');
const path = require('path');
exports.MSE = lazy(path.join(__dirname, './MS'));
