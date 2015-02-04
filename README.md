[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![MIT License][license-image]][license-url] [![Build Status][travis-image]][travis-url]

**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Installation](#installation)
- [Operation](#operation)
  - [Start your Norch.js server](#start-your-norchjs-server)
    - [Startup options](#startup-options)
- [Crawling](#crawling)
  - [norch-fetch](#norch-fetch)
  - [norch-document-processor](#norch-document-processor)
  - [norch-indexer](#norch-indexer)
- [Indexing API](#indexing-api)
  - [Document Format](#document-format)
  - [HTTP Interface](#http-interface)
  - [Norch-indexer](#norch-indexer)
  - [Indexing parameters](#indexing-parameters)
    - [filterOn](#filteron)
- [Replication API](#replication-api)
  - [Snapshot](#snapshot)
  - [Empty](#empty)
  - [Replicate](#replicate)
- [Search API](#search-api)
  - [Get document by ID](#get-document-by-id)
  - [Search parameters](#search-parameters)
    - [q](#q)
    - [searchFields](#searchfields)
    - [facets](#facets)
    - [filter](#filter)
    - [offset](#offset)
    - [pagesize](#pagesize)
    - [teaser](#teaser)
    - [weight](#weight)
- [Matcher API](#matcher-api)
  - [Connecting to a matcher](#connecting-to-a-matcher)
- [About Norch](#about-norch)
- [License](#license)

#Installation

Confirm that node.js is set up correctly, then install Norch like so:

    $ npm install -g norch

**Notes:**
  1. You need admin priviledges to install globally- on mac and linux use sudo: `$ sudo npm install -g norch`.
  2. Norch can also be installed into the current working directory by dropping the `-g` flag: `$ npm install norch`. Norch now exists in the `node_modules` directory. From the directory you ran the install command, type: `$ node_modules/norch/bin/norch` to start norch.

If everything went to plan- Norch should now be installed on your machine


#Operation

*Note: for the purposes of accessability, this doc assumes that Norch is being installed locally on your own computer
(localhost). Once Norch is rolled out on to remote servers, the
hostname on all URLs should be updated accordingly. Command line
commands are denoted by the prefix `$ ` which should not be typed in*

##Start your Norch.js server

Type

    $ norch

Hurrah! Norch is now running locally on your machine. Head over to [http://localhost:3030/](http://localhost:3030/)
and marvel. The default port of 3030 can be modified if required.

### Startup options

```
$ norch --help

  Usage: norch [options]

  Options:

      -h, --help         output usage information
      -V, --version      output the version number
      -p, --port <port>  specify the port, defaults to 3030
      -n, --hostname <hostname> specify the hostname, defaults to 0.0.0.0 (IADDR_ANY)
```


#Crawling
Norch has command line tools for spidering, fetching, processing and indexing webpages that can be installed seperately

##norch-fetch
Get your webpages with [norch-fetch](https://github.com/fergiemcdowall/norch-fetch)

**Install:**

```$ npm install -g norch-fetch```

**Help:**

```$ norch-fetch -h``` or [read the docs](https://github.com/fergiemcdowall/norch-fetch)

##norch-document-processor
Turn your fetched webpages into JSON with [norch-document-processor](https://github.com/fergiemcdowall/norch-document-processor)

**Install:**

```$ npm install -g norch-document-processor```

**Help:**

```$ norch-document-processor -h``` or [read the docs](https://github.com/fergiemcdowall/norch-document-processor)

##norch-indexer
Index your JSONified webpages with [norch-indexer](https://github.com/fergiemcdowall/norch-indexer)

**Install:**

```$ npm install -g norch-indexer```

**Help:**

```$ norch-indexer -h``` or [read the docs](https://github.com/fergiemcdowall/norch-indexer)


#Indexing API

##Document Format

Norch indexes data that is in the format below. Field
values can be either strings or simple arrays. Arrays can be used to
create filters and facets. An ID can optionally be specified, if no ID
is specified, an unique ID will be assigned by Norch

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

##HTTP Interface

If the above was in a file called `data.json`, it could be indexed using a command like

    curl --form document=@data.json http://localhost:3030/indexer --form filterOn=metedata

There is some test data in the test/testdata folder of the norch.js package. It can be indexed like so:

    curl --form document=@reuters-000.json http://localhost:3030/indexer --form filterOn=places,topics,organisations

You can also put the data to be indexed in the URL like this (note that single quotes go on the outside and double on the inside of the JSON object):

    curl --form document='[{"title":"A really interesting document","body":"This is a really interesting document"}]' http://localhost:3030/indexer



##Norch-indexer

Norch can optionally be indexed using the [norch-indexer node app](#norch-indexer).

##Indexing parameters

###filterOn

Example

```
 --form filterOn=places,topics,organisations
```

filterOn is an array of fields that can be used to filter search results. Each defined field must be an array field in
the document. filterOn will not work with string fields.


#Replication API

##Snapshot

Create a snapshot of the search index by doing this:

`curl http://localhost:3030/snapshot -o snapshot.gz`

##Empty

Empty an index by using the 'empty' endpoint (or alternatively you can just delete the data directory):

`curl http://localhost:3030/empty`

##Replicate

Replicate into an empty index from a snapshot file by doing this:

`curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: tion/gzip"`


#Search API

##Get document by ID

It is possible to get a document and associated index entries by ID by
calling `http://localhost.com:3030/getDoc?docID=` followed by the
document's ID

##Search parameters

Search is available on [http://localhost.com:3030/search](http://localhost.com:3030/search)

###q
**(Required)** For "query". The search term. Asterisk (```*```) returns everything.

Usage:

    q=<query term>

[http://localhost:3030/search?q=moscow](http://localhost:3030/search?q=moscow)

To search on one or more fields, do something like:

    q[title]=reagan&q[body]=intelligence contra

[http://localhost:3030/search?q[title]=reagan&q[body]=intelligence%20contra](http://localhost:3030/search?q[title]=reagan&q[body]=intelligence%20contra)

###facets
**(Optional)** For "facet". The fields that will be used to create faceted navigation

Usage:

    facets=<field to facet on>

[http://localhost:3030/search?q=moscow&facets=topics](http://localhost:3030/search?q=moscow&facets=topics)

###filter
**(Optional)** For "filter". Use this option to limit your search to the given field

Usage:

    filter[<filter field>][]=<value>

[http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&filter[topics][]=acq](http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain)

Multiple filters:

[http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&filter[topics][]=acq&filter[places][]=ussr](http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&filter[topics][]=acq&filter[places][]=ussr)


###offset

**(Optional)** The index in the resultSet that the server
  returns. Userful for paging.

Usage:

    offset=<start index>

[http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5](http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5)

###pagesize

**(Optional)** defines the size of the resultset (defaults to 20)

Usage:

    pagesize=<size of resultset>

[http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5&pagesize=5](http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5&pagesize=5)


###teaser
**(Optional)** for "teaser". Use this option to generate a short paragraph that indicates where the search terms occur in the document.

Usage:

    teaser=<field to generate teaser on>

[http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5&pagesize=5&teaser=body](http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5&pagesize=5&teaser=body)

###weight
**(Optional)** For "weight". Use this option to tune relevancy by assigning weight to given fields. Weights can be arbitralily large.

Usage:

    weight[<field name>][]:<weight (factor)>

[http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10](http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10)

Multiple field weights:

[http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10&weight[body][]=2](http://localhost:3030/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10&weight[body][]=2)

#Matcher API

Norch comes with a matcher that can be used to create autosuggest
functionality. The matcher is derived from the content of the reverse
index. At the moment Norch ships with one matcher, there is a desire
to abstract this out into a framework that can accomodate mulitiple
pluggable matchers.

##Connecting to a matcher

Using something like
[Typeahead](http://twitter.github.io/typeahead.js/) or [JQuery
autocomplete](http://jqueryui.com/autocomplete/) the matcher can be
called by using this URL:

    http://localhost:3030/matcher?beginsWith=<matcher term>

#About Norch

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

**Build Status Master Branch:** [![Build Status](https://secure.travis-ci.org/fergiemcdowall/norch.png)](http://travis-ci.org/fergiemcdowall/norch)

[![NPM](https://nodei.co/npm/norch.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/norch/)

[![NPM](https://nodei.co/npm-dl/norch.png)](https://nodei.co/npm/norch/)

http://npm-stat.com/charts.html?package=norch


#License

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
