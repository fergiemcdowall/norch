[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url] [![Build Status][travis-image]][travis-url] [![Join the chat at https://gitter.im/fergiemcdowall/search-index](https://badges.gitter.im/fergiemcdowall/search-index.svg)](https://gitter.im/fergiemcdowall/search-index?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


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

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://dashboard.heroku.com/new?button-url=https%3A%2F%2Fgithub.com%2Ffergiemcdowall%2Fnorch&template=https%3A%2F%2Fgithub.com%2Ffergiemcdowall%2Fnorch)

`npm install norch` and then start with `norch`

or programatically:

```javascript
require('norch')(options, function(err, norch) {
  // Norch server started on http://localhost:3030 (or the specified host/port)
})
```

**Put stuff in**

`curl -X POST -d @myData.json http://localhost:3030/add`
(where myData.json is a newline separated file of JSON objects)

**Search for hits** ([uses `search-index's` API](https://github.com/fergiemcdowall/search-index/blob/master/doc/search.md))

`http://localhost:3030/search?q={"query":[{"AND":{"*":["usa"]}}]}`

(`http://localhost:3030/search` returns everything)

**Make autosuggest**

`http://localhost:3030/matcher?q=usa`

**Export, import, and replicate an index**

```bash
# create a snapshot on the server (available under /latestSnapshot)
curl -X POST http://localhost:3030/snapshot
# get latest snapshot
curl -X GET http://anotherIndex:3030/latestSnapshot > export.json
# replicate an export file into a new index on another server
curl -X POST -d @export.json http://someOtherServer:3030/import
```

# API

The Norch API docs [are here](doc/API.md). Norch is essentially an http wrapper around [search-index](https://www.npmjs.com/package/search-index).

# About Norch

Norch.js is an experimental search engine built with
[Node.js](http://nodejs.org/) and
[search-index](https://github.com/fergiemcdowall/search-index)
featuring, Full text search, Stopword removal, aggregation Matching
(Autosuggest), Phrase search, Fielded search, Field weighting,
Relevance weighting (tf-idf), Paging (offset and resultset length)

# Logging
On Linux and OSX. Install `bunyan`, tail the log-file and pipe to bunyan.

Install bunyan:
```console
install -g bunyan
````

Tail log-file:

```console
tail -f log-info.log |bunyan
````

**Mailing list:** norchjs@googlegroups.com - subscribe by sending an email to norchjs+subscribe@googlegroups.com


# License

MIT, Copyright (c) 2013-16 Fergus McDowall


[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://github.com/fergiemcdowall/norch/blob/master/README.md#license

[npm-url]: https://npmjs.org/package/norch
[npm-version-image]: http://img.shields.io/npm/v/norch.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/norch.svg?style=flat

[travis-url]: http://travis-ci.org/fergiemcdowall/norch
[travis-image]: http://img.shields.io/travis/fergiemcdowall/norch.svg?style=flat
