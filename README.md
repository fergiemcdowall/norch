**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Installation](#installation)
- [Operation](#operation)
	- [Start your Forage.js server](#start-your-foragejs-server)
		- [Startup options](#startup-options)
- [Crawling](#crawling)
	- [forage-fetch](#forage-fetch)
	- [forage-document-processor](#forage-document-processor)
	- [forage-indexer](#forage-indexer)
- [Indexing API](#indexing-api)
	- [Document Format](#document-format)
	- [HTTP Interface](#http-interface)
	- [Forage-indexer](#forage-indexer-1)
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
		- [teaser](#teaser)
		- [weight](#weight)
- [Matcher API](#matcher-api)
	- [Generating a matcher](#generating-a-matcher)
	- [Connecting to a matcher](#connecting-to-a-matcher)
- [About Forage](#about-forage)
- [Known Issues](#known-issues)
- [License](#license)


#Installation

Confirm that node.js is set up correctly, then install Forage like so:

    $ npm install -g forage

**Notes:**
  1. You need admin priviledges to install globally- on mac and linux use sudo: `$ sudo npm install -g forage`.
  2. Forage can also be installed into the current working directory by dropping the `-g` flag: `$ npm install forage`. Forage now exists in the `node_modules` directory. From the directory you ran the install command, type: `$ node_modules/forage/bin/forage` to start forage.

If everything went to plan- Forage should now be installed on your machine


#Operation

*Note: for the purposes of accessability, this doc assumes that Forage is being installed locally on your own computer
(localhost). Once Forage is rolled out on to remote servers, the
hostname on all URLs should be updated accordingly. Command line
commands are denoted by the prefix `$ ` which should not be typed in*

##Start your Forage.js server

Type

    $ forage

Hurrah! Forage is now running locally on your machine. Head over to [http://localhost:3030/](http://localhost:3030/)
and marvel. The default port of 3030 can be modified if required.

### Startup options

```
$ forage --help

  Usage: forage [options]

  Options:

      -h, --help         output usage information
      -V, --version      output the version number
      -p, --port <port>  specify the port, defaults to 3030
```


#Crawling
Forage has command line tools for spidering, fetching, processing and indexing webpages that can be installed seperately

##forage-fetch
Get your webpages with [forage-fetch](https://github.com/fergiemcdowall/forage-fetch)

**Install:**

```$ npm install -g forage-fetch```

**Help:**

```$ forage-fetch -h``` or [read the docs](https://github.com/fergiemcdowall/forage-fetch)

##forage-document-processor
Turn your fetched webpages into JSON with [forage-document-processor](https://github.com/fergiemcdowall/forage-document-processor)

**Install:**

```$ npm install -g forage-document-processor```

**Help:**

```$ forage-document-processor -h``` or [read the docs](https://github.com/fergiemcdowall/forage-document-processor)

##forage-indexer
Index your JSONified webpages with [forage-indexer](https://github.com/fergiemcdowall/forage-indexer)

**Install:**

```$ npm install -g forage-indexer```

**Help:**

```$ forage-indexer -h``` or [read the docs](https://github.com/fergiemcdowall/forage-indexer)


#Indexing API

##Document Format

Generally Forage indexes data that is in the format below, that is to say an object containing a list of key:values where the key is the document ID and the values are a futher
list of key:values that define the fields. Fields can be called anything other than 'ID'. Field values can be either
strings or simple arrays. Arrays can be used to create filters and facets.

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

##HTTP Interface

If the above was in a file called `data.json`, it could be indexed using a command like

    curl --form document=@data.json http://localhost:3030/indexer --form filterOn=metedata

There is some test data in the test/testdata folder of the forage.js package. It can be indexed like so:

    curl --form document=@reuters-000.json http://localhost:3030/indexer --form filterOn=places,topics,organisations

##Forage-indexer

Forage can optionally be indexed using the [forage-indexer node app](#forage-indexer).

##Indexing parameters

###filterOn

Example

```
 --form filterOn=places,topics,organisations
```

filterOn is an array of fields that can be used to filter search results. Each defined field must be an array field in
the document. filterOn will not work with string fields.


#Search API

Search is available on [http://localhost.com:3030/search](http://localhost.com:3030/search)

##Search parameters

###q
**(Required)** For "query". The search term. Asterisk (```*```) returns everything.

Usage:

    q=<query term>

[http://localhost:3030/search?q=moscow](http://localhost:3030/search?q=moscow)

###searchFields

Search on specified fields. Ignore text that exists in other fields.

    searchFields[]=<field to search in>
    
[http://localhost:3030/search?q=plans&searchFields[]=body](http://localhost:3030/search?q=plans&searchFields[]=body)

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

Forage comes with a matcher that can be used to create autosuggest
functionality. The matcher is derived from the content of the reverse
index. At the moment Forage ships with one matcher, there is a desire
to abstract this out into a framework that can accomodate mulitiple
pluggable matchers.

##Connecting to a matcher

Using something like
[Typeahead](http://twitter.github.io/typeahead.js/) or [JQuery
autocomplete](http://jqueryui.com/autocomplete/) the matcher can be
called by using this URL:

    http://localhost:3030/matcher?beginsWith=<matcher term>

#About Forage

![Forage](https://farm6.staticflickr.com/5192/14141658313_ebf053d53d_m.jpg)

Forage.js is an experimental search engine built with
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
* Virtualisation (see [virtual-forage](https://github.com/fergiemcdowall/virtual-forage))

**Homepage:** http://www.foragejs.net

**Github:** https://github.com/fergiemcdowall/forage

**Mailing list:** foragejs@googlegroups.com - subscribe by sending an email to foragejs+subscribe@googlegroups.com

**Build Status Master Branch:** [![Build Status](https://secure.travis-ci.org/fergiemcdowall/forage.png)](http://travis-ci.org/fergiemcdowall/forage) (TODO: fix travis tests- Forage probably works, even if the tests are failing)

[![NPM](https://nodei.co/npm/forage.png?stars&downloads)](https://nodei.co/npm/forage/)

[![NPM](https://nodei.co/npm-dl/forage.png)](https://nodei.co/npm/forage/)

http://npm-stat.vorba.ch/charts.html?package=forage

<a name="issues"></a>
#Known Issues

Forage is new software and as such should be regarded as a work in progress. Administrators should be aware of the
following:

 * **Installation on Windows** Forages underlying libraries float in and out of workingness on Windows. Although you
_can_ get Forage to work natively on Windows, its not really recommended. Thankfully, Forage can easily be virtualised
with Vagrant- check out [virtual-forage](https://github.com/fergiemcdowall/virtual-forage).


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


