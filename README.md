**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Installation](#user-content-installation)
- [Operation](#user-content-operation)
	- [Start your Norch.js server](#user-content-start-your-norchjs-server)
		- [Startup options](#user-content-startup-options)
- [Crawling](#user-content-crawling)
	- [norch-fetch](#user-content-norch-fetch)
	- [norch-document-processor](#user-content-norch-document-processor)
	- [norch-indexer](#user-content-norch-indexer)
- [Indexing API](#user-content-indexing-api)
	- [Document Format](#user-content-document-format)
	- [HTTP Interface](#user-content-http-interface)
	- [Norch-indexer](#user-content-norch-indexer-1)
	- [Indexing parameters](#user-content-indexing-parameters)
		- [filterOn](#user-content-filteron)
- [Search API](#user-content-search-api)
 	- [Get document by ID](#user-content-get-document-by-id)
	- [Search parameters](#user-content-search-parameters)
		- [q](#user-content-q)
		- [searchFields](#user-content-searchfields)
		- [facets](#user-content-facets)
		- [filter](#user-content-filter)
		- [offset](#user-content-offset)
		- [pagesize](#user-content-pagesize)
		- [teaser](#user-content-teaser)
		- [weight](#user-content-weight)
- [Matcher API](#user-content-matcher-api)
	- [Connecting to a matcher](#user-content-connecting-to-a-matcher)
- [About Norch](#user-content-about-norch)
- [License](#user-content-license)


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

Generally Norch indexes data that is in the format below, that is to say an object containing a list of key:values where the key is the document ID and the values are a futher
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

There is some test data in the test/testdata folder of the norch.js package. It can be indexed like so:

    curl --form document=@reuters-000.json http://localhost:3030/indexer --form filterOn=places,topics,organisations

You can also put the data to be indexed in the URL like this (note that single quotes go on the outside and double on the inside of the JSON object):

    curl --form document='{"doc1":{"title":"A really interesting document","body":"This is a really interesting document"}}' http://localhost:3030/indexer



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

**Homepage:** http://www.norchjs.net

**Github:** https://github.com/fergiemcdowall/norch

**Mailing list:** norchjs@googlegroups.com - subscribe by sending an email to norchjs+subscribe@googlegroups.com

**Build Status Master Branch:** [![Build Status](https://secure.travis-ci.org/fergiemcdowall/norch.png)](http://travis-ci.org/fergiemcdowall/norch)

[![NPM](https://nodei.co/npm/norch.png?stars&downloads)](https://nodei.co/npm/norch/)

[![NPM](https://nodei.co/npm-dl/norch.png)](https://nodei.co/npm/norch/)

http://npm-stat.vorba.ch/charts.html?package=norch


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


