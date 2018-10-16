import Configstore from 'configstore';
import { name } from '../package.json';

function setupConfig() {
  const conf = new Configstore(name);

  const set = (key, val) => conf.set(key, val);
  const get = key => conf.get(key);
  const all = () => ({ ...conf.all });

  return { set, get, all };
}

export { setupConfig };
