'use strict';

// core modules
const fs = require('fs');
const path = require('path');

// 3rd party modules
const _ = require('lodash');

// other modules
const logger = require('./logger');

// the global catalog to remember already loaded configurations
const catalog = {};

// used to sort found files by type; order of file extension defines which extension will be loaded first
const fileExtensions = ['json', 'js'];

/**
 * make new RegExp object to match file names that fit the pattern <name>[.env].ext
 * @param  {String}           name        base name of the file
 * @return {RegExp}                       RegExp generated from base name and extensions
 */
function makeFilenameRegex(name) {
  if (!_.isString(name)) {
    throw new TypeError('name parameter must be of type "String"');
  }
  // @TODO: this regexp will allow a filename like providers-.json
  /* beautify preserve:start */
  return new RegExp(`^${name}(?:[\.-](.*))?\.(${fileExtensions.join('|')})$`);
  /* beautify preserve:end */
}

function verifyDirectoryExists(directoryPath) {
  let basePathStats;
  // load file stats for provided basePath
  try {
    basePathStats = fs.statSync(directoryPath);
  } catch (err) {
    logger.debug(`failed to load stats for path "${directoryPath}"`);
    throw err;
  }

  // check if provided directoryPath is actually a directiry
  if (!basePathStats.isDirectory()) {
    logger.error(`directoryPath "${directoryPath}" is not a directory`);
    throw new Error(`${directoryPath} must be a directory`);
  }
  return true;
}

module.exports = function oniyiConfig(options) {
  // base path defaults to <current-work-directory>/config
  const basePath = options.basePath || path.join(process.cwd(), 'config');
  const baseName = options.baseName || options.module;
  if (!_.isString(baseName)) {
    throw new TypeError('baseName must be of type "String"');
  }

  verifyDirectoryExists(basePath);
  const env = (options.environment || options.env || process.env.NODE_ENV || 'development').toLowerCase();
  const catalogKey = `${basePath}-${baseName}-${env}`;
  const configFileRegExp = makeFilenameRegex(baseName);

  if (!!options.forceRelead && catalog[catalogKey]) {
    return catalog[catalogKey];
  }

  catalog[catalogKey] = fs
    .readdirSync(basePath)
    // filter for files only
    .filter((file) => {
      return fs
        .statSync(path.join(basePath, file))
        .isFile();
    })
    // providers([.-]environment)?.(js|json)
    .filter((file) => {
      const match = configFileRegExp.exec(file);
      // filter if pattern not matched
      if (!match) {
        return false;
      }
      // filter if infix does not match current environment or 'local'
      if (match[1] && ['local', env].indexOf(match[1].toLowerCase()) < 0) {
        return false;
      }
      // keep file if all previous rules were positive
      return true;
    })
    // sort rules:
    // json before js
    // plain before environment before local
    .sort((a, b) => {
      const aMatch = configFileRegExp.exec(a);
      const bMatch = configFileRegExp.exec(b);

      const aEnv = aMatch[1] ? aMatch[1].toLowerCase() : null;
      const bEnv = bMatch[1] ? bMatch[1].toLowerCase() : null;

      // both files have the same infix / environment
      // only need to compare extensions
      if (aEnv === bEnv) {
        return fileExtensions.indexOf(aMatch[2]) - fileExtensions.indexOf(bMatch[2]);
      }

      // All environments besides process.env.NODE_ENV and "local" have been filtered before
      // one of "a" and "b" doesn't have an environment infix
      // it it's "a", sort it up; sort it down otherwise
      if (!(aEnv && bEnv)) {
        return aEnv ? 1 : -1;
      }

      // in case "a" has an environment that is not "local", sort it up
      if (aEnv !== 'local') {
        return -1;
      }

      // default is to sort down
      return 1;
    })
    // subsequently load all identified config files in sorted order,
    // extend iteratively
    .reduce((result, filename) => {
      return _.mergeWith(result, require(path.join(basePath, filename)), (obj, src) => {
        // return src when obj is null or undefined
        if (obj === null || obj === undefined) {
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
      });
    }, {});

  return catalog[catalogKey];
};
