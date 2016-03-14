'use strict';

const assert = require('assert');
const path = require('path');
const _ = require('lodash');
const oniyiConfig = require('../lib');

describe('sample configuration files with base name "providers"', () => {
  const baseName = 'providers';
  const environment = 'development';

  const cfgs = oniyiConfig({
    basePath: path.join(__dirname, 'config-files'),
    baseName,
    environment,
  });


  ['foo', 'bar']
  .forEach((topKey) => {
    const cfg = cfgs[topKey];
    describe(`top level config object "${topKey}"`, () => {
      it('should be plain object', () => {
        assert(_.isPlainObject(cfg), 'only plain objects are allowed for configs');
      });

      ['', environment, 'local'].map((env) => {
        return ['json', 'js'].map((ext) => {
          if (env) {
            return `${baseName}.${env}.${ext}`;
          }
          return `${baseName}.${ext}`;
        });
      }).reduce((result, current) => {
        return result.concat(current);
      }, []).forEach((cfgKey) => {
        it(`should set ${cfgKey} in config object ${topKey}`, () => {
          assert(cfg[cfgKey], 'must be truthy value');
        });
      });
    });
  });
});
