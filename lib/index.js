'use strict';

// node core modules
const path = require('path');

// 3rd party modules
const _ = require('lodash');

// internal modules
const logger = require('oniyi-logger')('oniyi:config');
const { toLowerCase, mergeObjects, loadConfig } = require('./utils');

module.exports = function oniyiConfig(options) {
  // compile env from options or default to `development`
  const env = toLowerCase(
    options.environment || options.env || process.env.NODE_ENV || 'development',
  );

  // eslint-disable-next-line prefer-destructuring
  const baseName = options.baseName;
  if (!_.isString(baseName)) {
    throw new TypeError('baseName must be of type "String"');
  }

  // base path defaults to <current-work-directory>/config
  const directories = options.sourceDirs || [];

  if (!Array.isArray(directories)) {
    throw new TypeError('"options.sourceDirs" must be of type "array"');
  }

  if (!directories.length) {
    const basePath =
      options.sourceDir ||
      options.baseDir ||
      options.basePath ||
      path.join(process.cwd(), 'config');
    logger.debug(
      'directories array is empty, adding computed basePath "%s"',
      basePath,
    );
    directories.push(basePath);
  }

  function loadThisConfigFromDir(dir) {
    return loadConfig({ dir, env, name: baseName });
  }

  const configs = directories.reverse().map(loadThisConfigFromDir);

  return _.mergeWith(...configs, mergeObjects);
};
