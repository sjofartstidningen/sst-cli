import inquirer from 'inquirer';
import Listr from 'listr';

const delay = ms => new Promise(r => setTimeout(r, ms));

function action(config) {
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
          config.clear();
          task.title = 'User configurations removed';
        },
      },
    ];

    const taskRunner = new Listr(tasks, { concurrent: true });

    try {
      await taskRunner.run();
    } catch (err) {
      // void
    }
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

export { command as default };
