import program from 'commander';
import { version, description } from '../package.json';
import { setupConfig } from './config';
import retriever from './commands/retriever';
import clear from './commands/clear';

const config = setupConfig();

program.version(version, '-v, --version').description(description);

[retriever, clear].forEach(({ handle, args, description, options, action }) => {
  const cmd = program.command(`${handle} ${args}`).description(description);

  if (Array.isArray(options)) options.forEach(opt => cmd.option(...opt));
  cmd.action(action(config));
});

program.on('command:*', function() {
  console.error(
    'Invalid command: %s\nSee --help for a list of available commands.',
    program.args.join(' '),
  );
  process.exit(1);
});

export { program as default };
