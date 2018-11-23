import Listr from 'listr';
import md5 from 'md5';

const validateApiKey = key => {
  try {
    /**
     * The RegExp tests for existance of "-<datacenter>" at the end of the
     * api key string. All api keys from Mailchimp ends with e.g. "-us5"
     */
    const [, region] = /-(\w+\d)$/.exec(key);
    return region;
  } catch (err) {
    return false;
  }
};

const action = ({
  fetchPath,
  fetchConfig,
  taskTitle,
}) => config => async emails => {
  const region = validateApiKey(config.apiKey);
  if (!region) throw new Error('The API Key is incorrect');

  const baseUrl = `https://${region}.api.mailchimp.com/3.0`;
  const headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(
      `sjofartstidningen:${config.apiKey}`,
    ).toString('base64')}`,
  });

  const mailchimpAction = email => async (ctx, task) => {
    try {
      const response = await fetch(`${baseUrl}${fetchPath(config, email)}`, {
        headers,
        ...fetchConfig(config, email),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const reason = errorData.title;
        ctx.errorData = errorData;
        task.skip(reason);
      }
    } catch (error) {
      task.skip(error.message);
    }
  };

  const tasks = emails.map(email => ({
    title: taskTitle(email),
    task: mailchimpAction(email),
  }));

  const taskRunner = new Listr(tasks, { concurrent: false });
  return taskRunner.run();
};

const mailchimpSubscribe = action({
  fetchPath: ({ list }, email) =>
    `/lists/${list}/members/${md5(email.toLowerCase())}`,
  fetchConfig: (_, email_address) => ({
    method: 'PUT',
    body: JSON.stringify({ email_address, status_if_new: 'subscribed' }),
  }),
  taskTitle: email => `Subscribe ${email}`,
});

const mailchimpUnsubscribe = action({
  fetchPath: ({ list }, email) =>
    `/lists/${list}/members/${md5(email.toLowerCase())}`,
  fetchConfig: (_, email) => ({
    method: 'PATCH',
    body: JSON.stringify({ status: 'unsubscribed' }),
  }),
  taskTitle: email => `Unsubscribe ${email}`,
});

const mailchimpResubscribe = action({
  fetchPath: ({ list }, email) =>
    `/lists/${list}/members/${md5(email.toLowerCase())}`,
  fetchConfig: (_, email) => ({
    method: 'PATCH',
    body: JSON.stringify({ status: 'subscribed' }),
  }),
  taskTitle: email => `Resubscribe ${email}`,
});

const options = [
  ['--apiKey <apiKey>', 'Provide an API Key'],
  ['--list <listId>', 'Provide a list id'],
];

const configKey = 'mailchimp';
const questions = [
  {
    name: 'apiKey',
    message: 'API key',
    validate: apiKey => {
      if (apiKey.length < 1) return 'API Key must be defined';
      if (!validateApiKey(apiKey)) return 'The API Key is incorrect';
      return true;
    },
  },
  {
    name: 'list',
    message: 'List ID',
    validate: id => id.length > 0 || 'List ID must be defined',
  },
];

const subscribe = {
  handle: 'mailchimp-subscribe',
  args: '<emails...>',
  description: 'Subscribe an email to our newsletter',
  options,
  action: mailchimpSubscribe,
  configKey,
  questions,
};

const unsubscribe = {
  handle: 'mailchimp-unsubscribe',
  args: '<emails...>',
  description: 'Unsubscribe a member of our newsletter',
  options,
  action: mailchimpUnsubscribe,
  configKey,
  questions,
};

const resubscribe = {
  handle: 'mailchimp-resubscribe',
  args: '<emails...>',
  description: 'Resubscribe a member of our newsletter',
  options,
  action: mailchimpResubscribe,
  configKey,
  questions,
};

export { subscribe, unsubscribe, resubscribe };
