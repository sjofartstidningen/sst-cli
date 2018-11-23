const inquirer = require('inquirer');
const Listr = require('listr');
const configstore = require('../config');

const delay = ms => new Promise(r => setTimeout(r, ms));

function action() {
  return async () => {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldClear',
        message: 'Are you sure you want to clear all stored configurations?',
        default: false,
      },
    ]);

    const tasks = [
      {
        title: 'Clear user configurations',
        skip: () => !answers.shouldClear,
        task: async (_, task) => {
          await delay(1000);
          configstore.clear();
          task.title = 'User configurations removed';
        },
      },
    ];

    const taskRunner = new Listr(tasks, { concurrent: true });
    await taskRunner.run();
  };
}

const command = {
  handle: 'clear',
  args: '',
  description:
    'Clear all stored data, useful if something is not working as expected',
  options: [],
  action,
};

module.exports = command;
