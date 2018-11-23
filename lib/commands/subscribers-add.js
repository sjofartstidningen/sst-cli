/**
 * Command: add-subscriber
 * This command will take a list of emails and add them to our newsletter
 * subscribers list
 *
 * On the first run you will be prompted for an api key to access Mailchimp.
 * These values will be stored in a global configstore (located at
 * ~/.config/configstore/sst-cli.json).
 */

import Listr from 'listr';
import getConfig from '../utils/get-config';

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
  return async emails => {
    let region;

    try {
      [, region] = /-(\w+\d)$/.exec(config.apiKey);
    } catch (err) {
      throw new Error('The API key is malformed');
    }

    const baseUrl = `https://${region}.api.mailchimp.com/3.0`;
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(
        `sjofartstidningen:${config.apiKey}`,
      ).toString('base64')}`,
    });

    const addMember = email => async (ctx, task) => {
      const response = await fetch(`${baseUrl}/lists/${config.list}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
        }),
      });

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
      '--apiKey <apiKey>',
      'Provide an api key (will be asked for if not provided)',
    ],
    [
      '--list <listId>',
      'Provide a list id (will be asked for if not provided)',
    ],
    [
      '-o, --override-config',
      'Override stored config and prompt for new input',
    ],
  ],
  action,
  configKey: 'mailchimp',
  questions: [
    {
      name: 'apiKey',
      message: 'API key',
      validate: apiKey => {
        if (apiKey.length < 1) return 'API Key must be defined';

        /**
         * The RegExp tests for existance of "-<datacenter>" at the end of the
         * api key string. All api keys from Mailchimp ends with e.g. "-us5"
         */
        const match = /-(\w+\d)$/.test(apiKey);
        if (!match) return `Something's wrong with the API Key`;

        return true;
      },
    },
    {
      name: 'list',
      message: 'List ID',
      validate: id => id.length > 0 || 'List ID must be defined',
    },
  ],
};

export { command as default };
