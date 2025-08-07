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


# Installation and usage

## Terminal

To install and invoke from the terminal type `npx norch`.

The following options are available

```
  -V, --version                  output the version number
  -c, --configFile <configFile>  specify a configuration file
  -n, --name <name>              specify the name/location of the index (default: "norch-data")
  -p, --port <port>              specify the port (default: 3030)
  -h, --help                     display help for command
```


## Node

To include norch in an existing node project, use `npm i norch`. Norch
can then be invoked from within a node application like so:

```javascript
import { Norch } from 'norch'

const myNorch = new Norch(ops) // same options as terminal
```

# API

Checkout the OpenAPI documentation
[online](http://fergiemcdowall.github.io/norch/www_root/api/api.html),
or [on your own norch server](http://localhost:3030).


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://github.com/fergiemcdowall/norch/blob/master/README.md#license

[npm-url]: https://npmjs.org/package/norch
[npm-version-image]: http://img.shields.io/npm/v/norch
