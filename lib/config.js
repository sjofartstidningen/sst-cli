const Configstore = require('configstore');
const { name } = require('../package.json');

function setupConfig() {
  const config = new Configstore(name);

  const set = (key, val) => config.set(key, val);
  const get = key => config.get(key);
  const all = () => ({ ...config.all });
  const clear = () => config.clear();

  return { set, get, all, clear };
}

module.exports = { setupConfig };
