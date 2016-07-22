'use strict';

import path from 'path';
import test from 'ava';
import _ from 'lodash';
import oniyiConfig from '../lib/index.js';

test('sample configuration files with base name "providers"', t => {
  t.plan(14);

  const baseName = 'providers';
  const environment = 'development';

  const cfgs = oniyiConfig({
    basePath: path.join(__dirname, 'helpers', 'config-files'),
    baseName,
    environment,
  });


  ['foo', 'bar']
  .forEach((topKey) => {
    const cfg = cfgs[topKey];
    t.true(_.isPlainObject(cfg), 'only plain objects are allowed for configs');

    ['', environment, 'local'].map((env) => ['json', 'js'].map((ext) => {
      if (env) {
        return `${baseName}.${env}.${ext}`;
      }
      return `${baseName}.${ext}`;
    })).reduce((result, current) => result.concat(current), []).forEach((cfgKey) => {
      t.truthy(cfg[cfgKey], 'must be truthy value');
    });
  });
});
