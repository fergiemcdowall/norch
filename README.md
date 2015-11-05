[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url] [![Build Status][travis-image]][travis-url]


[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


`npm install -g norch`

`var norch = require('norch')();`

**Put stuff in**

`curl --form document=@reuters-000.json http://localhost:3030/indexer`

**Search for hits**

`http://localhost:3030/search?q={"query":{"*":["usa"]}}`

**Make autosuggest**

`http://localhost:3030/matcher?match={"beginsWith":"usa"}`

**Replicate an index**

```bash
curl http://localhost:3030/snapshot -o snapshot.gz
curl -X POST http://anotherIndex:3030/replicate --data-binary @snapshot.gz -H "Content-Type: application/gzip"
```

**Command line startup options**

```bash
 $ norch --help
 
   Usage: norch [options]
 
   Options:
 
    -h, --help                   output usage information
    -V, --version                output the version number
    -p, --port <port>            specify the port, defaults to 3030
    -n, --hostname <hostname>    specify the hostname, defaults to 0.0.0.0 (INADDR_ANY)
    -i, --indexPath <indexPath>  specify the name of the index directory, defaults to norch-index
    -l, --logLevel <logLevel>    specify the loglevel- silly | debug | verbose | info | warn | error
    -s, --logSilent <logSilent>  silent mode
    -c, --cors <items>           comma-delimited list of Access-Control-Allow-Origin addresses in the form of "http(s)://hostname:port" (or "*")
 ```


### About Norch

Norch.js is an experimental search engine built with [Node.js](http://nodejs.org/) and
[search-index](https://github.com/fergiemcdowall/search-index)
featuring, Full text search, Stopword removal, Faceting, Filtering,
Matching (Autosuggest), Fielded search, Field weighting, Relevance
weighting (tf-idf), Paging (offset and resultset length),
Virtualisation (see
[virtual-norch](https://github.com/fergiemcdowall/virtual-norch))


**Mailing list:** norchjs@googlegroups.com - subscribe by sending an email to norchjs+subscribe@googlegroups.com


# License

MIT, Copyright (c) 2013 Fergus McDowall


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://github.com/fergiemcdowall/norch/blob/master/README.md#license

[npm-url]: https://npmjs.org/package/norch
[npm-version-image]: http://img.shields.io/npm/v/norch.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/norch.svg?style=flat

[travis-url]: http://travis-ci.org/fergiemcdowall/norch
[travis-image]: http://img.shields.io/travis/fergiemcdowall/norch.svg?style=flat
