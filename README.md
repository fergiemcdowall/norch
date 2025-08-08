[![npm-version-image]][npm-url] [![MIT License][license-image]][license-url] 


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

Norch is a stand alone search server that can be installed with
npm. It uses the [`search-index`](https://github.com/fergiemcdowall/search-index) query language which integrates easily
with JavaScript.

Use Norch when you need a fast and lightweight backend to your search
applications.

# Quickstart

 - In a terminal type `npx norch`
 - Add documents by going to quickstart on your
   [locally installed norch](http://localhost:3030/utils/uploader/)
   and upload. (here is
   some [test data](https://github.com/fergiemcdowall/norch/blob/master/test/data/movies.json)) 
 - Search by going to quickstart on your
   [locally installed norch](http://localhost:3030/utils/search/)
 - For advanced use check out the [openapi endpoints](http://localhost:3030/openapi/) 

# Terminal

Type `npx norch` (append `-h` to display help) 

# Node

To use norch programatically within a node project, install with `npm i
norch` and invoke like so:

```javascript
import { Norch } from 'norch'
const myNorch = new Norch(ops)
```

# API

Checkout the OpenAPI documentation
[online](https://fergiemcdowall.github.io/norch/www_root/openapi/),
or [on your own norch server](http://localhost:3030/openapi/).


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://github.com/fergiemcdowall/norch/blob/master/README.md#license

[npm-url]: https://npmjs.org/package/norch
[npm-version-image]: http://img.shields.io/npm/v/norch
