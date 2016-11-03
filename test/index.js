'use strict';

import path from 'path';

import test from 'ava';
import oniyiConfig from '../lib/index.js';

test('without baseName param', (t) => {
  function runner() {
    oniyiConfig({});
  }

  t.throws(runner, TypeError, 'without baseName param');
});

test('with invalid sourceDirs param', (t) => {
  function runner() {
    oniyiConfig({
      baseName: 'config',
      sourceDirs: 'some dir', // correct param type would be `Array`
    });
  }

  t.throws(runner, TypeError, 'with invalid sourceDirs param');
});

test('load config from single sourceDir', (t) => {
  const config = oniyiConfig({
    baseName: 'providers',
    sourceDir: path.resolve(__dirname, 'fixtures', 'config-files'),
  });
  t.true(!!config);
});

test.todo('load config from multiple sourceDirs'); // eslint-disable-line ava/no-todo-test
