import program from 'commander';
import { version } from '../package.json';
import { setupConfig } from './config';
import retriever from './command-retriever';

const config = setupConfig();

program.version(version, '-v, --version');

[retriever].forEach(command => {
  const cmd = program
    .command(`${command.handle} ${command.args}`)
    .description(command.description);

  (command.options || []).forEach(opt => cmd.option(...opt));

  cmd.action(command.action(config));
});

program.on('command:*', function() {
  console.error(
    'Invalid command: %s\nSee --help for a list of available commands.',
    program.args.join(' '),
  );
  process.exit(1);
});

export { program as default };