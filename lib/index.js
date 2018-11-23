import program from 'commander';
import chalk from 'chalk';
import pkg from '../package.json';
import { setupConfig } from './config';
import getConfig from './utils/get-config';
import retriever from './commands/retriever';
import { subscribe, unsubscribe, resubscribe } from './commands/mailchimp';
import clear from './commands/clear';

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

export { program as default };
