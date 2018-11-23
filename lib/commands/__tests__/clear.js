const command = require('../clear.js');
const inquirer = require('inquirer');
const config = require('../../config');

jest.mock('configstore');
jest.mock('inquirer');
jest.mock('listr');

describe('command: clear', () => {
  it('should clear out the database', async () => {
    inquirer.__setPreferedAnswers({ shouldClear: true });
    const { action } = command;
    await action()();

    expect(config.clear).toHaveBeenCalled();
  });

  it('should skip clearing out if user regrets command', async () => {
    inquirer.__setPreferedAnswers({ shouldClear: false });
    const { action } = command;
    await action()();

    expect(config.clear).not.toHaveBeenCalled();
  });
});
