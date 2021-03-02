import path from 'path';

import test from 'ava';
import _ from 'lodash';
import utils from '../lib/utils';

const {
  makeFilenameRegex,
  isDirectory,
  isFile,
  toLowerCase,
  mergeObjects,
  loadConfig,
} = utils;

test('makeFilenameRegex() throws when called with non-string arg', (t) => {
  function throwing() {
    makeFilenameRegex(null);
  }

  t.throws(throwing, TypeError, 'only string args are allowed');
});

test('makeFilenameRegex() returns regular expression that tests truthy for all file name patterns', (t) => {
  const baseName = 'config';
  const fileNames = 'json js development.json development.js local.json local.js'
    .split(' ')
    .map((item) => `${baseName}.${item}`);

  const rex = makeFilenameRegex(baseName);
  t.true(
    fileNames.every((item) => rex.test(item)),
    `RegEx should test truthy for ${fileNames}`,
  );
});

test('isDirectory() returns true for existing directories', (t) => {
  t.true(isDirectory(__dirname), `"${__dirname}" seems to not be a directory`);
});

test('isDirectory() returns false for non-existing directories', (t) => {
  const dirPath = path.resolve(__dirname, 'foo');
  t.false(isDirectory(dirPath), `"${dirPath}" seems to be a directory`);
});

test('isFile() returns true for existing files', (t) => {
  t.true(isFile(__filename), `"${__filename}" seems to not be a file`);
});

test('isFile() returns false for non-existing files', (t) => {
  const filePath = path.resolve(__dirname, 'foo');
  t.false(isFile(filePath), `"${filePath}" seems to be a file`);
});

test('toLowerCase() returns non-string args unmodified', (t) => {
  const input = 1;
  const output = toLowerCase(input);
  t.true(input === output, 'input does not equal output');
});

test('toLowerCase() returns lower-case string', (t) => {
  const input = 'FOO';
  const output = toLowerCase(input);
  t.true(input.toLowerCase() === output, 'input does not equal output');
});

test('mergeObjects() two plain objects', (t) => {
  const src = {};
  const obj = {};
  t.is(mergeObjects(obj, src), undefined);
});

test('mergeObjects() obj arg === null', (t) => {
  const src = 'foo';
  const obj = null;
  t.is(mergeObjects(obj, src), src);
});

test('mergeObjects() obj arg === undefined', (t) => {
  const src = {};
  const obj = undefined;
  t.is(mergeObjects(obj, src), src);
});

test('mergeObjects() src arg === false', (t) => {
  const src = false;
  const obj = {};
  t.is(mergeObjects(obj, src), src);
});

test('mergeObjects() two arrays', (t) => {
  const src = [1, 2, 3];
  const obj = [3, 4, 5];

  const unioned = _.union(obj, src);
  const merged = mergeObjects(obj, src);

  const isUnionedArray =
    Array.isArray(merged) && merged.every((val, idx) => val === unioned[idx]);
  t.true(isUnionedArray);
});

test('mergeObjects() src.prototype is not `Object`', (t) => {
  const src = new Date();
  const obj = {};

  t.is(mergeObjects(obj, src), src);
});

test('mergeObjects() src is undefined', (t) => {
  const src = undefined;
  const obj = 'foo';

  t.is(mergeObjects(obj, src), undefined);
});

test('loadConfig() returns empty object when `dir` param is not a directory', (t) => {
  const baseName = 'providers';
  const environment = 'development';
  const cfgs = loadConfig({
    name: baseName,
    env: environment,
    dir: path.resolve(__dirname, 'foo'),
  });

  t.true(_.isPlainObject(cfgs) && !Object.keys(cfgs).length);
});

/* eslint-disable ava/no-skip-test */
test.skip('sample configuration files with base name "providers"', (t) => {
  t.plan(14);

  const baseName = 'providers';
  const environment = 'development';
  const cfgs = loadConfig({
    name: baseName,
    env: environment,
    dir: path.join(__dirname, 'fixtures', 'config-files'),
  });

  ['foo', 'bar'].forEach((topKey) => {
    const cfg = cfgs[topKey];
    t.true(_.isPlainObject(cfg), 'only plain objects are allowed for configs');

    ['', environment, 'local']
      .map((item) => item.toLowerCase())
      .map((env) =>
        ['json', 'js'].map((ext) => {
          if (env) {
            return `${baseName}.${env}.${ext}`;
          }
          return `${baseName}.${ext}`;
        }),
      )
      .reduce((result, current) => result.concat(current), [])
      .forEach((cfgKey) => {
        t.truthy(cfg[cfgKey], 'must be truthy value');
      });
  });
});
/* eslint-disable ava/no-skip-test */
