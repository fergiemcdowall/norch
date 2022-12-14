[![NPM version][npm-version-image]][npm-url] [![MIT License][license-image]][license-url] [![Join the chat at https://gitter.im/fergiemcdowall/search-index](https://badges.gitter.im/fergiemcdowall/search-index.svg)](https://gitter.im/fergiemcdowall/search-index?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


```
      ___           ___           ___           ___           ___      
     /\__\         /\  \         /\  \         /\  \         /\__\     
    /::|  |       /::\  \       /::\  \       /::\  \       /:/  /     
   /:|:|  |      /:/\:\  \     /:/\:\  \     /:/\:\  \     /:/__/      
  /:/|:|  |__   /:/  \:\  \   /::\~\:\  \   /:/  \:\  \   /::\  \ ___  
 /:/ |:| /\__\ /:/__/ \:\__\ /:/\:\ \:\__\ /:/__/ \:\__\ /:/\:\  /\__\ 
 \/__|:|/:/  / \:\  \ /:/  / \/_|::\/:/  / \:\  \  \/__/ \/__\:\/:/  / 
     |:/:/  /   \:\  /:/  /     |:|::/  /   \:\  \            \::/  /  
     |::/  /     \:\/:/  /      |:|\/__/     \:\  \           /:/  /   
     /:/  /       \::/  /       |:|  |        \:\__\         /:/  /    
     \/__/         \/__/         \|__|         \/__/         \/__/     

```


# Installation

In the terminal type `npm i norch` (or install globally with `npm i -g norch`)


# Usage

## Invoking from the terminal

Simply type `norch` and a norch server will be available at
http://localhost:3030 (or the port/url of your choosing)


The following options are available

```
  -V, --version                   output the version number
  -p, --port <port>               specify the port, defaults to PORT or 3030 (default: 3030)
  -d, --data <name>               specify the name of the directory that stores the data (default: "norch-data")
  -h, --help                      display help
```

## Invoking from a node application

```javascript
const norch = require('norch')
const options = { /* options here */ }

await norch(options)
```

## API

See the online [API documentation](http://fergiemcdowall.github.io/norch/www_root/api.html), or open `/api.html` on your own norch server.


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://github.com/fergiemcdowall/norch/blob/master/README.md#license

[npm-url]: https://npmjs.org/package/norch
[npm-version-image]: http://img.shields.io/npm/v/norch.svg?style=flat
