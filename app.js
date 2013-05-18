
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , levelup = require('levelup')
  , natural = require('natural')
  , norch = require('./norch.js');




  var reverseIndex = levelup('./reverseIndex');
  TfIdf = natural.TfIdf,
  tfidf = new natural.TfIdf();  //need this line?

  var app = express();


  // all environments
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }


//curl localhost:3000/search?q=aberdeen\&weight=%22category%22:10

  app.get('/search', function(req, res) {
    
    getVectorSet(req, 0, {});

    function getVectorSet (req, i, docValues) {
      queryTerms = req.query['q'].split(' ');
      reverseIndex.createReadStream({
        start:queryTerms[i] + "~",
          end:queryTerms[i] + "~~"}) 
      .on('data', function (data) {
        console.log(data.key);
        //remove documents that dont contain all queryTerms
        hasAllTerms = true;
        for (var j = 0; j < queryTerms.length; j++){
          if (data.value.indexOf(queryTerms[j]) == -1) {
            hasAllTerms = false;
          }          
        }
        if (hasAllTerms) {
          docValues[data.key] = JSON.parse(data.value);
        }
      })
      .on('end', function () {
        if (i < (queryTerms.length - 1)) {
          //evaluate the next least common term
          getVectorSet(req, ++i, docValues);
        }
        else {
          //all least common terms evaluated- go to results
          displayResults(req, docValues);
        }
      })

    }

    function displayResults(req, docValues) {
      queryTerms = req.query['q'].split(' ');
      var docVectors = {'documents':[]};
      var facets = {};

      for (var k in docValues) {
        for (var j = 0; j < docValues[k][0].documents.length; j++) {
          //filter out metadata that doesnt contain query terms
          if (queryTerms.indexOf(docValues[k][0].documents[j]['__keyword']) != -1) {
            docVectors.documents.push(docValues[k][0].documents[j]);
          }
          //build up facets
          for (l in docValues[k][1]['fields']) {
            if (l == 'body') {
              //dont treat body as metadata
            }
            else if (!facets[l]) {
              facets[l] = JSON.parse('{"' + docValues[k][1]['fields'][l] + '":1}');
            }
            else if (!facets[l][docValues[k][1]['fields'][l]]) {
              facets[l][docValues[k][1]['fields'][l]] = 1;
            }
            else {
              facets[l][docValues[k][1]['fields'][l]] = (facets[l][docValues[k][1]['fields'][l]] + 1);
            }
            debugger;
          }

        }
      }
      var tfidf = new TfIdf(docVectors);
      var resultSet = [];
      var collatedResultSet = [];

      //carry out tfidf analysis, remove vectors with a score of 0
      tfidf.tfidfs(queryTerms.join(' '), function(i, measure) {
        var keyParts = docVectors.documents[i].__key.split('~');
        resultSet.push([
          measure,
          docVectors.documents[i].__key,
          keyParts[0],
          docVectors.documents[i].__keyword,
          keyParts[1]]);
      });
      //no results


      //ADD FIELDED SEARCH


  //collate and collapse results
      if (resultSet.length > 0) {
        resultsSortedOnID = resultSet.sort(function(a, b) { return (a[2] < b[2] ? -1 : (a[2] > b[2] ? 1 : 0)); });
        var runningScore = 0;
        var scoringExplanation = '';
        //?weight:field1:2,field2:4
        var weighting = JSON.parse('{' + req.query['weight'] + '}');

        for (var i = 0; i < resultsSortedOnID.length; i++) {
          score = resultSet[i][0];
          if (weighting[resultSet[i][4]]) {
             score = score*weighting[resultSet[i][4]];
             scoringExplanation += resultSet[i][4] + ' is weighted by a factor of ' + weighting[resultSet[i][4]] + '; ';
          }
          runningScore += score;
          scoringExplanation += resultSet[i][1] + ' yields ' + score + ' for ' + resultSet[i][3] + '; ';
          if (i == (resultsSortedOnID.length - 1)) { 
            collatedResultSet.push([resultSet[i][2], runningScore, scoringExplanation]);
          }
          else if (resultsSortedOnID[i][2] == resultsSortedOnID[i + 1][2]) {
            //do nothing
          }
          else {
            collatedResultSet.push([resultSet[i][2], runningScore, scoringExplanation]);
            runningScore = 0;
            scoringExplanation = '';
          }
        }
      }

      var response = {
        query: queryTerms.join(' '),
        rawResultset: resultSet,
        resultset: collatedResultSet.sort(function(a,b){return b[1]-a[1]}),
        facets: facets
      };
      debugger; 

      res.send(response);
    }

  });






//curl --form document=@testdata.json http://localhost:3000/indexer

  app.post('/indexer', function(req, res) {
    var batch = JSON.parse(fs.readFileSync(req.files.document.path, 'utf8'));
    var indexer = norch.indexDoc;
    for (docID in batch) {
      console.log(docID);
      indexer(docID, batch[docID], reverseIndex);
    }
    res.send('indexed\n');
  });



  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
