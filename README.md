#Norch

Norch is an experimental search engine built with Node.js and LevelDB. The name Norch is a contraction of " **No** de Sea **rch** "

###Homepage
https://github.com/fergiemcdowall/Norch

###Download
Currently Norch is best obtained using Git. Run the following command to clone the git repository for Norch:

    git clone https://github.com/fergiemcdowall/Norch
    
###Installing Norch
Norch has 2 dependencies- Node.js and npm (Node Package Manager). Given that these are both installed Norch can be installed by running the following command which will download and install all dependencies:

    npm install

If everything went to plan- Norch chould now be installed on your machine.
    

##Operation

###Start your Norch server
Navigate to the directory where you installed Norch and type

    node norch-server

Et voilá. Norch is now running locally on your machine. The default port of 3000 can be modified if required.

##Indexing
Once you have set up Norch, you can get some content into it. Norch comes with some test data in the directory "testdata"

cd into the directory "testdata" and run the following command to index 1000 documents of the reuters test data set (note that one data file can contain an arbitralily large number of documents)

    curl --form document=@reuters-000.json http://localhost:3000/indexer

Norch indexes data that is in the format

```javascript
{
    'doc1':{'title':'A really interesting document',
            'body':'This is a really interesting document'},
    'doc2':{'title':'Another interesting document',
            'body':'This is another really interesting document that is a bit different'}
}
```

##Searching

Search is available on [http://localhost.com:3000/search](http://localhost.com:3000/search)

##Search parameters

###q
**(Required)** For "query". The search term.

[http://localhost:3000/search?q=moscow](http://localhost:3000/search?q=moscow)


###f
**(Optional)** For "facet". The fields that will be used to create faceted navigation

[http://localhost:3000/search?q=moscow&f=topics](http://localhost:3000/search?q=moscow&f=topics)

###filter
**(Optional)** For "filter". Use this option to limit your search to the given field

[http://localhost:3000/search?q=moscow&f=topics&filter=topics:grain](http://localhost:3000/search?q=moscow&f=topics&filter=topics:grain)

####w
**(Optional)** For "weight". Use this option to tune relevancy by assigning weight to given fields. Weights can be arbitralily large.

