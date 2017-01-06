# Startup Options

```bash
 $ norch --help
 
   Usage: norch [options]
 
   Options:
 
    -h, --help                   output usage information
    -V, --version                output the version number
    -p, --port <port>            specify the port, defaults to 3030
    -i, --norchHome <indexPath>  specify the name of the index directory, defaults to norch-index
    -l, --logLevel <logLevel>    specify the loglevel- silly | debug | verbose | info | warn | error
    -m, --machineReadable        machine readable, logo not printed, all stdout/stderr is JSON
 ```

# Endpoints

| Endpoint | Method | Response | Typical Use Case |
| :--- | :--- | :--- | :--- |
| [`/add`](#add) | `POST` | status code | Add documents to the index |
| [`/availableFields`](#availablefields) | `GET` | stream | Discover the name of fields which can be searched in |
| [`/buckets`](#buckets) | `GET` | stream | Aggregate documents on ranges of metadata |
| [`/categorize`](#categorize) | `GET` | stream | Aggregate documents on single metadata values |
| [`/createSnapshot`](#createsnapshot) | `POST` | status code | Create a snapshot of the index |
| [`/delete`](#delete) | `DELETE` | status code | Remove documents from index |
| [`/docCount`](#doccount) | `GET` | object | Counts total document in index |
| [`/flush`](#flush) | `DELETE` | status code | Remove all documents from index |
| [`/get`](#get) | `GET` | stream | Get documents by ID |
| [`/latestSnapshot`](#latestsnapshot) | `GET` | file | Download the latest index snapshot |
| [`/match`](#match) | `GET` | stream | Match by linguistic similarity- autosuggest, autocomplete |
| [`/search`](#search) | `GET` | stream | Search in the index |
| [`/totalHits`](#totalhits) | `GET` | object | Show number of hits that a given query returns |

# API

## GET

### /availableFields

TODO

### /buckets

Wrapper for search-index's
[`buckets`](https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#buckets)
method. Get user defined aggregations of documents.

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

### /categorize

Wrapper for search-index's
[`categorize`](https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#categorize)
method. Aggregate documents on metadata: Example: show counts by topic value

Query parameter: **q**

Example:

```bash
curl -X GET http://localhost:3030/categorize -G --data-urlencode q@- <<REQUEST_BODY
{
  "query": [{
    "AND": {
      "*": ["reuter"]
    }
  }],
  "category": {
    "field": "topics"
  }
}
REQUEST_BODY
```

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

### /match

Wrapper for search-index's
[`match`](https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#match)
method. Returns word suggestions based on frequency in the index, used for
making autosuggest and autocomplete functions.

Query parameter: **q**

Example:

```bash
curl -X GET http://localhost:3030/match -G --data-urlencode q@- <<REQUEST_BODY
{
  "beginsWith": "lon"
}
REQUEST_BODY
```

### /search

Wrapper for search-index's
[`search`](https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#search)
method. Search in the index.

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

### /totalHits

Show total number of hits for a qiven query. Queries take the same
format as for `/search`

## POST

### /add

Add documents to the index.

Example: (where justTen.json is a [newline separated object stream](https://github.com/fergiemcdowall/reuters-21578-json/blob/master/data/fullFileStream/justTen.str))

```bash
curl -X POST -d @justTen.str http://localhost:3030/add
```

API: https://github.com/fergiemcdowall/search-index/blob/master/doc/API.md#defaultpipeline

### /createSnapshot

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
