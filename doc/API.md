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
 ```

# Endpoints

## GET

### /buckets

Get user defined aggregations of documents: for example: count all
docs with prices in these ranges 0-200, 200-300, 300-400, >400

Query parameter: **q**

Example:

```bash
curl -X GET http://localhost:3030/buckets -G --data-urlencode q@- <<REQUEST_BODY
{
  query: [{
    AND: {
      '*': ['reuter']
    }
  }],
  buckets: [{
    field: 'topics',
    gte: 'barley',
    lte: 'barley',
    set: true
  }, {
    field: 'topics',
    gte: 'lin',
    lte: 'oat',
    set: true
  }]
}
REQUEST_BODY
```

Example: 

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#buckets 

### /categorize

Aggregate documents on metadata: Example: show counts by topic value

Query parameter: **q**

Example:

```bash
curl -X GET http://localhost:3030/categorize -G --data-urlencode q@- <<REQUEST_BODY
{
  "query": {
    "AND": {
      "*": ["reuters"]
    }
  }
}
REQUEST_BODY
```

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#categorize

### /docCount

Count the documents in the index

### /get

Get documents by ID

Query parameter: **ids** An array of document ids

Example:

```bash
curl -X GET http://localhost:3030/get -G --data-urlencode ids@- <<REQUEST_BODY
["3", "7"]
REQUEST_BODY
```

### /latestSnapshot

Return the latest snapshot of the index. Generated the last time
`/snapshot` was run

### /matcher

Returns word suggestions based on frequency in the index, used for
making autosuggest and autocomplete functions.

Query parameter: **q**

Example:

```bash
curl -X GET http://localhost:3030/matcher -G --data-urlencode q@- <<REQUEST_BODY
{
  "beginsWith": "lon"
}
REQUEST_BODY
```

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#match

### /search

Search in the index

Query parameter: **q**

Example:

```bash
curl -X GET http://localhost:3030/search -G --data-urlencode q@- <<REQUEST_BODY
{
  "query": {
    "AND": {
      "*": ["marathon"]
    }
  }
}
REQUEST_BODY
```

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#search


## POST

### /add

Add documents to the index.

Example: (where justTen.json is a [newline separated object stream](https://github.com/fergiemcdowall/reuters-21578-json/blob/master/data/fullFileStream/justTen.str))

```bash
curl -X POST -d @justTen.str http://localhost:3030/add
```

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#defaultpipeline

### /snapshot

Creates a snapshot of the index which is then available for export
under `/latestSnapshot`


## DELETE

### /delete

Deletes documents from the index

Query parameter: **ids** An array of document ids

Example:

```bash
curl -X DELETE http://localhost:3030/delete -G --data-urlencode ids@- <<REQUEST_BODY
["7", "1"]      
REQUEST_BODY
```

### /flush

Deletes all documents from index
