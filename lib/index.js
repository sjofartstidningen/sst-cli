import program from 'commander';
import chalk from 'chalk';
import pkg from '../package.json';
import { setupConfig } from './config';
import retriever from './commands/retriever';
import addSubscriber from './commands/subscribers-add';
import clear from './commands/clear';

const config = setupConfig();

program.version(pkg.version, '-v, --version').description(pkg.description);

[retriever, addSubscriber, clear].forEach(
  ({ handle, args, description, options, action }) => {
    const cmd = program.command(`${handle} ${args}`).description(description);

    if (Array.isArray(options)) options.forEach(opt => cmd.option(...opt));
    cmd.action(action(config));
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
