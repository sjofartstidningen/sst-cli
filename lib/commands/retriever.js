/**
 * Command: retriever
 * This command will takes a list of files and will upload them to the root of
 * an ftp-url.
 *
 * This command is mainly used in our organization to upload a set of pdf-files
 * to an external service once a month.
 *
 * On the first run you will be prompted for a username, password and url. These
 * values will be stored in a global configstore (located at
 * ~/.config/configstore/sst-cli.json).
 *
 * To skip being prompted use the, -u, -p and --url flags to provide the
 * variables.
 */

const { join } = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execa = require('execa');
const Listr = require('listr');
const getConfig = require('../utils/get-config');

const access = promisify(fs.access);
const stat = promisify(fs.stat);

function action(config) {
  return async files => {
    /**
     * The files argument can be defined either as a list of files
     * (fileA.pdf fileB.pdf) or as a command line glob (*.pdf).
     *
     * Each task is verifying that the file exists, that it is a file and that
     * it ends with .pdf, since thats all we're dealing with in regard to
     * Retriever
     */
    const tasks = files.map(file => ({
      title: `Upload ${file}`,
      skip: async () => {
        try {
          const fullPath = join(process.cwd(), file);
          await access(fullPath, fs.constants.R_OK);

          if (!(await stat(fullPath)).isFile())
            return 'The specified path is not a file';

          return file.endsWith('.pdf') ? false : 'File must be a pdf-file';
        } catch (err) {
          switch (err.code) {
            case 'ENOENT':
              return 'No such file';
            default:
              return err.message;
          }
        }
      },
      task: () =>
        execa('curl', [
          '-T',
          file,
          '--user',
          `${config.username}:${config.password}`,
          config.url,
        ]),
    }));

    const taskRunner = new Listr(tasks, { concurrent: true });

    try {
      await taskRunner.run();
    } catch (err) {
      // void
    }
  };
}

const command = {
  handle: 'retriever',
  args: '<files...>',
  description: 'Upload a file to the Retriever FTP-server',
  options: [
    ['--username <username>', 'Provide a username'],
    ['--password <password>', 'Provide a password'],
    ['--url <url>', 'Provide a url'],
  ],
  action,
  configKey: 'retriever',
  questions: [
    {
      name: 'username',
      message: 'Username',
      validate: i => i.length > 0 || 'Username must be defined',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password',
      validate: i => i.length > 0 || 'Password must be defined',
    },
    {
      name: 'url',
      message: 'Url',
      validate: i =>
        i.startsWith('ftp://') || 'An ftp-url must start with ftp://',
    },
  ],
};

module.exports = command;
