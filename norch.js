  var  levelup = require('levelup')
  , natural = require('natural')
  , fs = require('fs');

  var reverseIndex = levelup('./reverseIndex');
  
  TfIdf = natural.TfIdf,
  tfidf = new natural.TfIdf();  //need this line?


  exports.indexBatch = function(batchString, callback) {
    var batch = JSON.parse(batchString);
    for (docID in batch) {
      console.log(docID);
      indexDoc(docID, batch[docID], reverseIndex);
    }
    callback('indexed\n');
  }


  function indexDoc(docID, doc) {
   //use key if found, if no key is found set filename to be key.
    tfidf = new TfIdf();
    var fieldBatch = [];
    var id = docID;
//DOCS
//work out the vector for the uploaded file in the URL request
    tfidf.addDocument(doc.body, docID);

    //doc is the collection of vectors + fields for each document
    var docVectors = [];
    docVectors.push(tfidf);
    docVectors.push({'fields':doc});
    //generate reverse index for file
    //FORMAT:
    //<keyword>~CONTENT~SEEVALUE~<docID>
    for (var i = 0; i < tfidf.documents.length; i++) {
      for (var k in tfidf.documents[i]) {
        if (k != '__key') {
          var tokenKey = k + '~CONTENT~' + id;
          tfidf.documents[i]['__keyword'] = k;
          fieldBatch.push({type:'put', key:tokenKey, value:JSON.stringify(docVectors)});
        }
      }
    }
  //FIELDS
  //work out the vector for each field in the URL request.
//    for (var URLParamKey in req.body) {
    for (fieldKey in doc) {
      tfidf.addDocument(doc[fieldKey], id + '~' + fieldKey);  
      for (var k in tfidf.documents[tfidf.documents.length - 1]) {
        if (k != '__key') {
          var tokenKey = k + '~' + fieldKey + '~' + id;
          tfidf.documents[i]['__keyword'] = k;
          fieldBatch.push({type:'put', key:tokenKey, value:JSON.stringify(docVectors)});
        }
      } 
    }
debugger;

//put key-values into database
    reverseIndex.batch(fieldBatch, function (err) {
      if (err) return console.log('Ooops!', err);
      return;
    });
  }

//rewrite so that exports.search returns a value instead of proviking a res.send()
  exports.search = function (req, callback) {

    getVectorSet(req, 0, {}, reverseIndex, function(msg) {
      callback(msg);
    });
  }

  function getVectorSet (req, i, docValues, reverseIndex, callback) {
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
        getVectorSet(req, ++i, docValues, reverseIndex, callback);
      }
      else {
        //all least common terms evaluated- go to results
        displayResults(req, docValues, function(msg) {
          callback(msg);
        });
      }
    })
  }


  function displayResults(req, docValues, callback) {
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
        else if (resultsSortedOnID[i][2] == resultsSortedOnID[i + 1][2]) {     //do nothing
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
      //rawResultset: resultSet,
      resultset: collatedResultSet.sort(function(a,b){return b[1]-a[1]}),
      facets: facets
    };
    debugger; 

    callback(response);
  }
