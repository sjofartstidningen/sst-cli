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

import { join } from 'path';
import fs from 'fs';
import { promisify } from 'util';
import inquirer from 'inquirer';
import execa from 'execa';
import Listr from 'listr';

const access = promisify(fs.access);
const stat = promisify(fs.stat);

function action(config) {
  return async (files, command) => {
    /**
     * Setup config objects
     * These needs to be created as empty objects and keys added if they exist
     * This is because later in the program these objects will be merged
     * together. But if keys exist it will override an existing key, even though
     * it's undefined.
     */
    const currentConfig = config.get('retriever') || {};
    const commandConfig = {};
    const shouldAskFor = {};

    ['username', 'password', 'url'].forEach(key => {
      if (command[key]) commandConfig[key] = command[key];
      shouldAskFor[key] = () =>
        command.overrideConfig || (!commandConfig[key] && !currentConfig[key]);
    });

    /**
     * Construct questions
     * Defaults is fetched from the global configstore.
     */
    const questions = [
      {
        type: 'input',
        name: 'username',
        message: 'Username',
        default: currentConfig.username,
        when: shouldAskFor.username,
        validate: i => i.length > 0 || 'Username must be defined',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password',
        default: currentConfig.username,
        when: shouldAskFor.password,
        validate: i => i.length > 0 || 'Password must be defined',
      },
      {
        type: 'input',
        name: 'url',
        message: 'Url',
        default: currentConfig.url,
        when: shouldAskFor.url,
        validate: i =>
          i.startsWith('ftp://') || 'A ftp-url must start with ftp://',
      },
    ];

    /**
     * Merge configs together to form a final `answers`-object.
     * This object contains username, password and url which will be used later.
     */
    const answers = {
      ...currentConfig,
      ...commandConfig,
      ...(await inquirer.prompt(questions)),
    };

    /**
     * Store the new config object in the configstore. This file is locatet in
     * ~/.config/configstore/sst-cli.json
     */
    config.set('retriever', answers);

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
          `${answers.username}:${answers.password}`,
          answers.url,
        ]),
    }));

    const taskRunner = new Listr(tasks, { concurrent: true });

    try {
      await taskRunner.run();
    } catch (err) {
      console.error(err);
    }
  };
}

const command = {
  handle: 'retriever',
  args: '<files...>',
  description: 'Upload a file to the Retriever FTP-server',
  options: [
    [
      '-u, --username <username>',
      'Provide a username (will be asked for if not provided)',
    ],
    [
      '-p, --password <password>',
      'Provide a password (will be asked for if not provided)',
    ],
    ['--url <url>', 'Provide a url (will be asked for if not provided)'],
    [
      '-o, --override-config',
      'Override stored config and prompt for new input',
    ],
  ],
  action,
};

export { command as default };
