import inquirer from 'inquirer';

/**
 * Get config will
 * -> Get the stored config from configstore
 * -> ask for input of those questions that are not answered (or if
 *    command.overrideConfig is defined)
 * -> Merge the answers with the configstore keys and return a config object
 * -> It will also update the configstore with the latest settings
 */
async function getConfig({
  configstore,
  configKey,
  options,
  questions = [],
  overrideConfig,
}) {
  const configstoreConfig = configstore.get(configKey) || {};

  const commandConfig = questions.reduce((acc, { name }) => {
    if (options[name]) {
      return { ...acc, [name]: options[name] };
    }

    return acc;
  }, {});

  const shouldAskFor = name => () =>
    overrideConfig || (!commandConfig[name] && !configstoreConfig[name]);

  const answers = await inquirer.prompt(
    questions.map(({ name, message, type = 'input', validate }) => ({
      type,
      name,
      message,
      default: configstoreConfig[name],
      when: shouldAskFor(name),
      validate,
    })),
  );

  const mergedConfig = {
    ...configstoreConfig,
    ...commandConfig,
    ...answers,
  };

  configstore.set(configKey, mergedConfig);

  return mergedConfig;
}

export default getConfig;
