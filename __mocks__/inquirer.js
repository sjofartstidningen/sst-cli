'use strict';

let __answers = {};
const __setPreferedAnswers = answers => {
  __answers = answers;
};

afterEach(() => {
  __answers = {};
});

const prompt = questions => {
  const answers = questions.reduce((acc, question) => {
    const key = question.name;
    const answer = __answers[key] || question.default;

    if (answer) return Promise.resolve({ ...acc, [key]: answer });
    return Promise.resolve(acc);
  }, {});

  return answers;
};

module.exports = { prompt, __setPreferedAnswers };
