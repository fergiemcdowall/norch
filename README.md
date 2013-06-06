#Norch

Norch is an experimental search engine built with Node.js and LevelDB

The name Norch is a contraction of " **No** de Sea **rch** "

##What Norch does

Norch makes structured data searchable

##What Norch does NOT do

Norch has no form of document processing, that is, it only accepts formattet JSON files as input. Web-crawling, file parsing, and databases connectivity are all outwith the scope of the project

##Operation
###Getting Norch
Norch lives at https://github.com/fergiemcdowall/Norch. There are a variety of download options available. Currently, cloning Norch with Git is recommended

###Clone Norch
Currently Norch is best obtained using Git. Run the following command to clone the git repository for Norch:
    git clone https://github.com/fergiemcdowall/Norch

###Installing Norch
Norch has 2 dependencies- Node.js and npm (Node Package Manager). Given that these are both installed Norch can be installed by running the following command which will download and install all dependencies:
    npm install

If everything went to plan- Norch chould now be installed on your machine.

###Starting a Norch server
1) Navigate to the directory where you installed Norch
2) Type
    node norch-server

Et voilá. Norch is now running locally on your machine. The default port of 3000 can be modified if required.

##Indexing
After setting up a fresh install of Norch, The first thing you probably want to do is to get some content into it. Norch comes with some test data in the directory "testdata"

cd into the directory "testdata" and run the following command to index 1000 documents of the reuters test data set (note that one data file can contain an arbitralily large number of documents)
    curl --form document=@reuters-000.json http://localhost:3000/indexer

Norch indexes data that is in the format {<document1>:{<field1name>:<field1content>,<field2name>:<field2content>},<document2>:{<field1name>:<field1content>,<field2name>:<field2content>}}"

##Searching

Search is available on http://localhost:3000/search

##Search parameters

###q
For "query"
The search term. This parameter must always be set

###f
For "facet"
The fields that will be used to create faceted navigation

###filter
For "filter"
Use this option to limit your search to the given field

####w
For "weight"
Use this option to assign weight to given fields. Weights can be arbitralily large.

