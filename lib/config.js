import Configstore from 'configstore';
import { name } from '../package.json';

function setupConfig() {
  const config = new Configstore(name);

  const set = (key, val) => config.set(key, val);
  const get = key => config.get(key);
  const all = () => ({ ...config.all });
  const clear = () => config.clear();

  return { set, get, all, clear };
}

export { setupConfig };
