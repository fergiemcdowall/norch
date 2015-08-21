[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url] [![Build Status][travis-image]][travis-url]

**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Installation](#installation)
- [Operation](#operation)
  - [Start your Norch.js server](#start-your-norchjs-server)
    - [Startup options](#startup-options)
    - [Using Norch in a node-program](#using-norch-in-a-node-program)
- [Indexing](#indexing)
  - [Document Format](#document-format)
  - [HTTP Interface](#http-interface)
  - [Indexing options object](#indexing-options-object)
- [Replication](#replication)
  - [Snapshot](#snapshot)
  - [Empty](#empty)
  - [Replicate](#replicate)
- [Searching](#searching)
  - [Get document by ID](#get-document-by-id)
  - [Search parameters](#search-parameters)
- [Matching (Autosuggest)](#matching-autosuggest)
  - [Connecting to a matcher](#connecting-to-a-matcher)
- [About Norch](#about-norch)
- [License](#license)


# Installation

Confirm that node.js is set up correctly, then install Norch like so:

    $ npm install -g norch

**Notes:**
  1. You need admin priviledges to install globally- on mac and linux use sudo: `$ sudo npm install -g norch`.
  2. Norch can also be installed into the current working directory by dropping the `-g` flag: `$ npm install norch`. Norch now exists in the `node_modules` directory. From the directory you ran the install command, type: `$ node_modules/norch/bin/norch` to start norch.

If everything went to plan- Norch should now be installed on your machine


# Operation

*Note: for the purposes of accessability, this doc assumes that Norch is being installed locally on your own computer
(localhost). Once Norch is rolled out on to remote servers, the
hostname on all URLs should be updated accordingly. Command line
commands are denoted by the prefix `$ ` which should not be typed in*

## Start your Norch.js server

Type

```bash
$ norch
```

Hurrah! Norch is now running locally on your machine. Head over to [http://localhost:3030/](http://localhost:3030/)
and marvel. The default port of 3030 can be modified if required.

### Startup options

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

### Using Norch in a node-program

Norch can be instantiated like

```javascript
var norch = require('norch')(); 
```

or by giving it an instance of search-index

```javascript
var si = require('search-index')();
var norch - require('norch')({si: si});
```

# Indexing

## Document Format

Norch indexes data that is in the format below. Field values can be
either strings or simple arrays. Arrays can be used to create filters
and facets. An ID can optionally be specified, if no ID is specified,
an unique ID will be assigned by Norch

```javascript
[
  {
    "id":"1",
    "title":"A really interesting document",
    "body":"This is a really interesting document",
    "metadata":["red", "potato"]
  },
  {
    "id":"2",
    "title":"Another interesting document",
    "body":"This is another really interesting document that is a bit different",
    "metadata":["yellow", "potato"]
  }
]
```

## HTTP Interface

If the above was in a file called `data.json`, it could be indexed
using a command like

```bash
curl --form document=@data.json http://localhost:3030/indexer
```

There is some test data in the test/testdata folder of the norch.js
package. It can be indexed like so:

```bash
curl --form document=@reuters-000.json http://localhost:3030/indexer`
```

You could specify fields to facet and filter on like this:

```bash
curl --form document=@reuters-000.json http://localhost:3030/indexer --form options=[{fieldName: 'places', filter: true},{fieldName: 'topics', filter: true},{fieldName: 'organisations', filter: true}]
```

You can also put the data to be indexed in the URL like this (note that single quotes go on the outside and double on the inside of the JSON object):

```bash
curl --form document='[{"title":"A really interesting document","body":"This is a really interesting document"}]' http://localhost:3030/indexer
```

## Indexing options object

The indexing options object is that which is used by the underlying `search-index`. It is [described in more detail here](https://github.com/fergiemcdowall/search-index/blob/master/doc/add.md)

# Replication

## Snapshot

Create a snapshot of the search index by doing this:

`curl http://localhost:3030/snapshot -o snapshot.gz`

## Empty

Empty an index by using the 'empty' endpoint (or alternatively you can just delete the data directory):

`curl http://localhost:3030/empty`

## Replicate

Replicate into an empty index from a snapshot file by doing this:

`curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: tion/gzip"`


# Searching

## Get document by ID

It is possible to get a document and associated index entries by ID by
calling `http://localhost.com:3030/getDoc?docID=` followed by the
document's ID

## Search parameters

Search is available on [http://localhost.com:3030/search](http://localhost.com:3030/search)

Search using the [search-index.js API](https://github.com/fergiemcdowall/search-index/blob/master/doc/search.md) and attach the query object to a `q` parameter like so:

`http://localhost:3030/search?q={"query":{"*":["usa"]}}`


# Matching (Autosuggest)

Norch comes with a matcher that can be used to create autosuggest
functionality. The matcher is derived from the content of the reverse
index. At the moment Norch ships with one matcher, there is a desire
to abstract this out into a framework that can accomodate mulitiple
pluggable matchers.

## Connecting to a matcher

Using something like
[Typeahead](http://twitter.github.io/typeahead.js/) or [JQuery
autocomplete](http://jqueryui.com/autocomplete/) the matcher can be
called by using this URL:

    http://localhost:3030/matcher?beginsWith=<matcher term>

# About Norch

Norch.js is an experimental search engine built with
[Node.js](http://nodejs.org/) and
[search-index](https://github.com/fergiemcdowall/search-index)
featuring

* Full text search
* Stopword removal
* Faceting
* Filtering
* Matching (Autosuggest)
* Fielded search
* Field weighting
* Relevance weighting (tf-idf)
* Paging (offset and resultset length)
* Virtualisation (see [virtual-norch](https://github.com/fergiemcdowall/virtual-norch))

**Github:** https://github.com/fergiemcdowall/norch

**Mailing list:** norchjs@googlegroups.com - subscribe by sending an email to norchjs+subscribe@googlegroups.com

[![NPM](https://nodei.co/npm/norch.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/norch/)

[![NPM](https://nodei.co/npm-dl/norch.png)](http://npm-stat.com/charts.html?package=norch)



# License

Norch.js is released under the MIT license:

Copyright (c) 2013 Fergus McDowall

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: https://github.com/fergiemcdowall/norch/blob/master/README.md#license

[npm-url]: https://npmjs.org/package/norch
[npm-version-image]: http://img.shields.io/npm/v/norch.svg?style=flat
[npm-downloads-image]: http://img.shields.io/npm/dm/norch.svg?style=flat

[travis-url]: http://travis-ci.org/fergiemcdowall/norch
[travis-image]: http://img.shields.io/travis/fergiemcdowall/norch.svg?style=flat
