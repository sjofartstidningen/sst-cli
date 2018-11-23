const Configstore = require('configstore');
const { name } = require('../package.json');

const configstore = new Configstore(name);
module.exports = configstore;
