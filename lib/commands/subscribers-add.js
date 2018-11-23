/**
 * Command: add-subscriber
 * This command will take a list of emails and add them to our newsletter
 * subscribers list
 *
 * On the first run you will be prompted for an api key to access Mailchimp.
 * These values will be stored in a global configstore (located at
 * ~/.config/configstore/sst-cli.json).
 */

import inquirer from 'inquirer';
import Listr from 'listr';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(
  operation,
  {
    testFn = res => res.status === 'finish',
    pollInterval = 2000,
    retries = 5,
  } = {},
) {
  const result = await operation();
  const success = await testFn(result);

  if (success) return result;

  if (retries > 0) {
    await delay(pollInterval);
    return waitFor(operation, { testFn, pollInterval, retries: retries - 1 });
  }

  const error = new Error('Operation never succeeded within the limit');
  error.lastResult = result;
  throw error;
}

function action(config) {
  return async (emails, command) => {
    /**
     * Setup config objects
     * These needs to be created as empty objects and keys added if they exist
     * This is because later in the program these objects will be merged
     * together. But if keys exist it will override an existing key, even though
     * it's undefined.
     */
    const currentConfig = config.get('subscribers') || {};
    const commandConfig = {};
    const shouldAskFor = {};

    ['key', 'list'].forEach(key => {
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
        name: 'key',
        message: 'API Key',
        default: currentConfig.key,
        when: shouldAskFor.key,
        validate: key => {
          if (key.length < 1) return 'API Key must be defined';

          /**
           * The RegExp tests for existance of "-<datacenter>" at the end of the
           * api key string. All api keys from Mailchimp ends with e.g. "-us5"
           */
          const match = /-(\w+\d)$/.test(key);
          if (!match) return `Something's wrong with the API Key`;

          return true;
        },
      },
      {
        type: 'input',
        name: 'list',
        message: 'List ID',
        default: currentConfig.list,
        when: shouldAskFor.list,
        validate: i => i.length > 0 || 'List ID must be defined',
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
    config.set('subscribers', answers);

    const [, region] = /-(\w+\d)$/.exec(answers.key);
    const baseUrl = `https://${region}.api.mailchimp.com/3.0`;
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(
        `sjofartstidningen:${answers.key}`,
      ).toString('base64')}`,
    });

    const addMember = email => async (ctx, task) => {
      const config = {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
        }),
      };

      const response = await fetch(
        `${baseUrl}/lists/${answers.list}/members`,
        config,
      );

      if (!response.ok) {
        const errorData = await response.json();
        const reason = errorData.title;
        task.skip(
          `Could not subscribe ${email} (reason: ${reason.toLowerCase()})`,
        );
      }
    };

    const tasks = emails.map(email => ({
      title: `Subscribe ${email}`,
      task: addMember(email),
    }));

    const taskRunner = new Listr(tasks, { concurrent: false });

    try {
      await taskRunner.run();
    } catch (err) {
      // void
    }
  };
}

const command = {
  handle: 'subscribers-add',
  args: '<emails...>',
  description: 'Add a subscriber to our newsletter',
  options: [
    [
      '--key <api_key>',
      'Provide an api key (will be asked for if not provided)',
    ],
    [
      '--list <list_id>',
      'Provide a list id (will be asked for if not provided)',
    ],
    [
      '-o, --override-config',
      'Override stored config and prompt for new input',
    ],
  ],
  action,
};

export { command as default };
