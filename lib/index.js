const program = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const { setupConfig } = require('./config');
const getConfig = require('./utils/get-config');
const retriever = require('./commands/retriever');
const { subscribe, unsubscribe, resubscribe } = require('./commands/mailchimp');
const clear = require('./commands/clear');

const configstore = setupConfig();

program.version(pkg.version, '-v, --version').description(pkg.description);

[retriever, subscribe, unsubscribe, resubscribe, clear].forEach(
  ({ handle, args, description, options, action, configKey, questions }) => {
    const command = program.command(`${handle} ${args}`);
    command.description(description);

    if (Array.isArray(options)) {
      options.forEach(opt => command.option(...opt));
    }

    command.option(
      '-o, --override-config',
      'Override stored config and prompt for new input',
    );

    command.action(async (input, opts) => {
      let config = {};

      if (configKey) {
        config = await getConfig({
          configstore,
          options: opts,
          overrideConfig: opts.overrideConfig,
          configKey,
          questions,
        });
      }

      return action(config)(input, opts);
    });
  },
);

program.on('command:*', function() {
  console.error(
    `
Invalid command: ${chalk.red(program.args.join(' '))}
See ${chalk.green.bold('sst --help')} for a list of available commands.
    `,
  );

  process.exit(1);
});

module.exports = program;
