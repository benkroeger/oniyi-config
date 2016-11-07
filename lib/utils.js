'use strict';

// node core modules
const fs = require('fs');
const path = require('path');

// 3rd party modules
const _ = require('lodash');
const logger = require('oniyi-logger')('oniyi:config:utils');

// internal modules
const { fileExtensions } = require('./constants');

/**
 * make new RegExp object to match file names that fit the pattern <name>[.env].ext
 * @param  {String}           name        base name of the file
 * @return {RegExp}                       RegExp generated from base name and extensions
 */
function makeFilenameRegex(name) {
  if (!_.isString(name)) {
    throw new TypeError('name parameter must be of type "String"');
  }

  const regexString = `^${name}(?:[\.](.+))?\.(${fileExtensions.join('|')})$`;
  return new RegExp(regexString);
}

function isDirectory(checkPath) {
  try {
    const stats = fs.statSync(checkPath);
    return stats && stats.isDirectory();
  } catch (exception) {
    logger.debug(`"${checkPath}" does not exist or is not a directory`);
    return false;
  }
}

function isFile(checkPath) {
  try {
    const stats = fs.statSync(checkPath);
    return stats && stats.isFile();
  } catch (exception) {
    logger.debug(`"${checkPath}" does not exist or is not a file`);
    return false;
  }
}

function safeRequire(what, loader = require) {
  try {
    return loader(what);
  } catch (safeRequireError) {
    logger.debug('can not load module "%s":', what, safeRequireError);
    return undefined;
  }
}

function toLowerCase(item) {
  if (_.isString(item)) {
    return item.toLowerCase();
  }
  return item;
}

function mergeObjects(obj, src) {
  // return src when obj is null or undefined
  if (obj === null || obj === undefined || src === false) {
    return src;
  }

  // if both are arrays, merge with lodash's `union` (concat + uniq)
  if (Array.isArray(obj) && Array.isArray(src)) {
    return _.union(obj, src);
  }

  // if both are plain objects, return undefined --> will be handled by _.merge
  if (_.isPlainObject(obj) && _.isPlainObject(src)) {
    return undefined;
  }

  if (src && src.prototype !== Object) {
    return src;
  }

  return undefined;
}

function loadConfig(params) {
  const { name, env, dir } = params;
  logger.debug('loading config with params %j', { name, env, dir });

  if (!isDirectory(dir)) {
    logger.debug('"%s" is not a directory', dir);
    return {};
  }

  const configFileRegExp = makeFilenameRegex(name);

  const config = fs
    .readdirSync(dir)
    // filter for files only
    .filter(file => isFile(path.join(dir, file)))
    // filter for files that match regex and current `env` + `env='local'`
    .filter((file) => {
      const match = configFileRegExp.exec(file);

      // filter if pattern not matched
      if (!match) {
        return false;
      }

      // filter if infix does not match current environment or 'local'
      const [, fileEnv = null] = _.map(match, toLowerCase);
      if (fileEnv && !['local', env].includes(fileEnv)) {
        return false;
      }

      // keep file if all previous rules were positive
      return true;
    })
    // sort config files in `dir` by : 1. json before js; 2. `plain` before `env` before `local`
    .sort((a, b) => {
      const [, aEnv, aExt] = _.map(configFileRegExp.exec(a), toLowerCase);
      const [, bEnv, bExt] = _.map(configFileRegExp.exec(b), toLowerCase);

      // both files have the same infix / environment
      // only need to compare extensions
      if (aEnv === bEnv) {
        return fileExtensions.indexOf(aExt) - fileExtensions.indexOf(bExt);
      }

      // All environments besides process.env.NODE_ENV and "local" have been filtered before
      // one of "a" and "b" doesn't have an environment infix
      // if it's "a", sort it up; sort it down otherwise
      if (!(aEnv && bEnv)) {
        return aEnv ? 1 : -1;
      }

      // in case "a" has an environment that is not "local", sort it up; sort down otherwise

      return (aEnv !== 'local') ? -1 : 1;
    })
    // subsequently load all identified config files in sorted order,
    // extend iteratively
    .reduce((result, filename) => {
      const fileData = safeRequire(path.join(dir, filename));

      return _.mergeWith(result, fileData || {}, mergeObjects);
    }, {});

  return config;
}

module.exports = {
  makeFilenameRegex,
  toLowerCase,
  isDirectory,
  isFile,
  safeRequire,
  mergeObjects,
  loadConfig,
};
