'use strict';

class Listr {
  constructor(tasks) {
    this.tasks = tasks;
  }

  async run(context) {
    await Promise.all(
      this.tasks.map(async ({ task, skip }) => {
        const shouldSkip = skip && (await skip(context));
        if (shouldSkip === true || typeof shouldSkip === 'string') {
          return Promise.resolve(null);
        }

        const title = { skip: jest.fn() };
        return task(context, title);
      }),
    );
    return context;
  }
}

module.exports = Listr;
