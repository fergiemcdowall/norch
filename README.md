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

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

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

**Command line startup options**

```bash
 $ norch --help
 
   Usage: norch [options]
 
   Options:
 
    -h, --help                   output usage information
    -V, --version                output the version number
    -p, --port <port>            specify the port, defaults to 3030
    -i, --indexPath <indexPath>  specify the name of the index directory, defaults to norch-index
    -l, --logLevel <logLevel>    specify the loglevel- silly | debug | verbose | info | warn | error
    -s, --logSilent <logSilent>  silent mode
    -c, --cors <items>           comma-delimited list of Access-Control-Allow-Origin addresses in the form of "http(s)://hostname:port" (or "*")
 ```

# Endpoints

## GET

### /buckets

Get user defined aggregations of documents: for example: count all
docs with prices in these ranges 0-200, 200-300, 300-400, >400

Query parameter: **q**

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#buckets 

### /categorize

Aggregate documents on metadata: Example: show counts by topic value

Query parameter: **q**

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#categorize

### /docCount

Count the documents in the index

### /get

Get documents by ID

Query parameter: **ids** An array of document ids

### /latestSnapshot

Return the latest snapshot of the index. Generated the last time
`/snapshot` was run

### /matcher

Returns word suggestions based on frequency in the index, used for
making autosuggest and autocomplete functions.

Query parameter: **q**

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#match

### /search

Search in the index

Query parameter: **q**

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#search


## POST

### /add

Add documents to the index.

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#defaultpipeline

### /snapshot

Creates a snapshot of the index which is then available for export
under `/latestSnapshot`


## DELETE

### /delete

Deletes documents from the index

Query parameter: **ids** An array of document ids

### /flush

Deletes all documents from index


# About Norch

Norch.js is an experimental search engine built with
[Node.js](http://nodejs.org/) and
[search-index](https://github.com/fergiemcdowall/search-index)
featuring, Full text search, Stopword removal, aggregation Matching
(Autosuggest), Phrase search, Fielded search, Field weighting,
Relevance weighting (tf-idf), Paging (offset and resultset length)


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
