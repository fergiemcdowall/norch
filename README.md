**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Forage](#forage)
- [Installation](#installation)
- [Operation](#operation)
	- [Start your Forage.js server](#start-your-foragejs-server)
		- [Startup options](#startup-options)
- [Crawling](#crawling)
	- [forage-fetch](#forage-fetch)
	- [forage-document-processor](#forage-document-processor)
	- [forage-indexer](#forage-indexer)
- [Indexing API](#indexing-api)
	- [Indexing parameters](#indexing-parameters)
		- [filterOn](#filteron)
- [Search API](#search-api)
	- [Search parameters](#search-parameters)
		- [q](#q)
		- [searchFields](#searchfields)
		- [facets](#facets)
		- [filter](#filter)
		- [offset](#offset)
		- [pagesize](#pagesize)
		- [weight](#weight)
- [About Forage](#about-forage)
- [Known Issues](#known-issues)
- [License](#license)


#Installation

Forage.js has 2 dependencies- Node.js and npm (Node Package Manager). Given that these are both installed Forage can be installed by running the following command which will download and install all dependencies:

    $ npm install -g forage

(Forage can also be installed into the current working directory by dropping the `-g` flag)

If everything went to plan- Forage should now be installed on your machine


#Operation

*Note: for the purposes of accessability, this doc assumes that Forage is being installed locally on your own computer
(localhost). Once Forage is rolled out on to remote servers, the
hostname on all URLs should be updated accordingly. Command line
commands are denoted by the prefix `$ ` which should not be typed in*

##Start your Forage.js server

Type

    $ forage

Hurrah! Forage is now running locally on your machine. Head over to [http://localhost:3000/](http://localhost:3000/)
and marvel. The default port of 3000 can be modified if required.

### Startup options

```
$ forage --help

  Usage: forage [options]

  Options:

      -h, --help         output usage information
      -V, --version      output the version number
      -p, --port <port>  specify the port, defaults to 3000
```


#Crawling
Forage comes bundled with command line tools for spidering, fetching, processing and indexing webpages.

##forage-fetch
```
$ forage-fetch --help

  Usage: forage-fetch [options]

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -d, --directory <directory>  specify the fetch directory,
    -n, --hostname <hostname>    specify the hostname
    -p, --protocol <protocol>    specify the protocol, defaults to http://
    -s, --starturl <starturl>    specify the URL to start fetching from
```
##forage-document-processor
```
$ forage-document-processor --help

  Usage: forage-document-processor [options]

  Options:

    -h, --help                                   output usage information
    -V, --version                                output the version number
    -f, --fetchdirectory <fetchdirectory>        specify the fetch directory, defaults to fetch/
    -d, --documentdirectory <documentdirectory>  specify the document directory, defaults to doc/
```
##forage-indexer
```
$ forage-indexer --help

  Usage: forage-indexer [options]

  Options:

    -h, --help                                   output usage information
    -V, --version                                output the version number
    -d, --documentdirectory <documentdirectory>  specify the document directory, defaults to doc/
    -e, --endpoint <endpoint>                    specify the forage endpoint,
```


#Indexing API
Once you have set up Forage.js, you can get some content into it. Forage comes with a JSONified version of the venerable
Reuters-21578 test dataset in the directory `test/testdata`. To index this data cd into the directory `test/testdata` and run
the following command (note that one data file can contain an arbitralily large number of documents)

    curl --form document=@reuters-000.json http://localhost:3000/indexer --form filterOn=places,topics,organisations

If you are on a unix machine (including mac OSX), you can also run /index.sh in order to read in the entire dataset
of 21 batch files.

Generally Forage indexes data that is in the format

```javascript
{
  'doc1':{
    'title':'A really interesting document',
    'body':'This is a really interesting document',
    'metadata':['red', 'potato']
  },
  'doc2':{
    'title':'Another interesting document',
    'body':'This is another really interesting document that is a bit different',
    'metadata':['yellow', 'potato']
  }
}
```

That is to say an object containing a list of key:values where the key is the document ID and the values are a futher
list of key:values that define the fields. Fields can be called anything other than 'ID'. Field values can be either
strings or simple arrays.

##Indexing parameters

###filterOn

Example

```
 --form filterOn=places,topics,organisations
```

filterOn is an array of fields that can be used to filter search results. Each defined field must be an array field in
the document. filterOn will not work with string fields.


#Search API

Search is available on [http://localhost.com:3000/search](http://localhost.com:3000/search)

##Search parameters

###q
**(Required)** For "query". The search term. Asterisk (```*```) returns everything.

Usage:

    q=<query term>

[http://localhost:3000/search?q=moscow](http://localhost:3000/search?q=moscow)

###searchFields

Search on specified fields. Ignore text that exists in other fields.

    searchFields[]=<field to search in>
    
[http://localhost:3000/search?q=plans&searchFields[]=body](http://localhost:3000/search?q=plans&searchFields[]=body)

###facets
**(Optional)** For "facet". The fields that will be used to create faceted navigation

Usage:

    facets=<field to facet on>

[http://localhost:3000/search?q=moscow&facets=topics](http://localhost:3000/search?q=moscow&facets=topics)

###filter
**(Optional)** For "filter". Use this option to limit your search to the given field

Usage:

    filter[<filter field>][]=<value>

[http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&filter[topics][]=acq](http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain)

Multiple filters:

[http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&filter[topics][]=acq&filter[places][]=ussr](http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&filter[topics][]=acq&filter[places][]=ussr)


###offset

**(Optional)** The index in the resultSet that the server
  returns. Userful for paging.

Usage:

    offset=<start index>

[http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5](http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5)

###pagesize

**(Optional)** defines the size of the resultset (defaults to 20)

Usage:

    pagesize=<size of resultset>

[http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5&pagesize=5](http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&offset=5&pagesize=5)

###weight
**(Optional)** For "weight". Use this option to tune relevancy by assigning weight to given fields. Weights can be arbitralily large.

Usage:

    weight[<field name>][]:<weight (factor)>

[http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10](http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10)

Multiple field weights:

[http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10&weight[body][]=2](http://localhost:3000/search?q=moscow&facets=topics&filter[topics][]=grain&weight[title][]=10&weight[body][]=2)


#About Forage

Forage.js is an experimental search engine built with [Node.js](http://nodejs.org/) and [search-index](https://github.com/fergiemcdowall/search-index) featuring

* Full text search
* Stopword removal
* Faceting
* Filtering
* Fielded search
* Field weighting
* Relevance weighting (tf-idf)
* Paging (offset and resultset length)
* Virtualisation (see [virtual-forage](https://github.com/fergiemcdowall/virtual-forage))

**Homepage:** http://www.foragejs.net

**Github:** https://github.com/fergiemcdowall/forage

**Build Status Master Branch:** [![Build Status](https://secure.travis-ci.org/fergiemcdowall/forage.png)](http://travis-ci.org/fergiemcdowall/forage)

[![NPM](https://nodei.co/npm/forage.png?stars&downloads)](https://nodei.co/npm/forage/)

[![NPM](https://nodei.co/npm-dl/forage.png)](https://nodei.co/npm/forage/)

<a name="issues"></a>
#Known Issues

Forage is new software and as such should be regarded as a work in progress. Administrators should be aware of the
following:

 * **The GUI (scrolling)** the default GUI is very much a temporary measure. The instant search function is flaky and currently
 there is no support for scrolling

 * **Out of memory error under heavy indexing** Currently heavy indexing may produce and out of memory error, even with the test data that is included with Forage.
One solution is to run Forage with the `--max-old-space-size=<the size of your RAM>` option. See this issue for further
details https://github.com/rvagg/node-levelup/issues/171

 * **Installation on Windows** Native installation on Windows should be regarded as non-trivial. If you have the "right" python and C libs installed
then it will work without any problems. See the section "Tested and Supported Platforms" in the
[levelDOWN docs](https://github.com/rvagg/node-leveldown). Windows users who cannot/will not change their C/Python setup
can optionally check out the [virtual-forage](https://github.com/fergiemcdowall/virtual-forage) package, which will
fire up forage in a virtual machine.

Indexing and GUI is the current focus of development


#License

Forage.js is released under the MIT license:

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


