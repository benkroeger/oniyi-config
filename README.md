# oniyi-config [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Simple config file loader

## Installation

```sh
$ npm install --save oniyi-config
```

## Usage

```js
const oniyiConfig = require('oniyi-config');

const cfg = oniyiConfig({
  basePath: __dirname,
  module: 'providers',
  forceReload: true,
  environment: 'production',
  });
```

will merge `js`and `json` files starting with name  `providers` in `${appRootDir}/authentication`
iteratively. File name schema is **providers.[environment].(json|js)**.  
`environment` is optional and defaults to 'development'. Possible values are anything you can set in `process.env.NODE_ENV`.
For file name resolution, `process.env.NODE_ENV` will be transformed to lower-case.  
One special environment is `local`. It will always be loaded **last**.  
It is okay to provide the same file name with different extensions. `json` will always be loaded before
`js`, meaning `js` **will overwrite** `json`

Sample load order:
1. providers.json
2. providers.js
3. providers.development.json
4. providers.development.js
5. providers.local.json
6. providers.local.js
7. 
## License

MIT © [Benjamin Kroeger]()


[npm-image]: https://badge.fury.io/js/oniyi-config.svg
[npm-url]: https://npmjs.org/package/oniyi-config
[travis-image]: https://travis-ci.org/benkroeger/oniyi-config.svg?branch=master
[travis-url]: https://travis-ci.org/benkroeger/oniyi-config
[daviddm-image]: https://david-dm.org/benkroeger/oniyi-config.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/benkroeger/oniyi-config
[coveralls-image]: https://coveralls.io/repos/benkroeger/oniyi-config/badge.svg
[coveralls-url]: https://coveralls.io/r/benkroeger/oniyi-config
