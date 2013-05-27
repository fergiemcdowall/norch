var fs = require('fs')
, levelup = require('levelup')
, natural = require('natural');

var reverseIndex = levelup('./reverseIndex')
, TfIdf = require('natural').TfIdf;


exports.dumpIndex = function(start, stop, callback) {
  var dump = '';
  reverseIndex.createReadStream({
    start:start + "~",
    end:stop + "~~"})
    .on('data', function(data) {
      dump += data.key + '<br>'
      + data.value + '<br><br>';
    })
    .on('end', function() {
      callback(dump);
    });
}


exports.index = function(batchString, callback) {
  var batch = JSON.parse(batchString);
  for (docID in batch) {
    console.log(docID);
    indexDoc(docID, batch[docID], reverseIndex);
  }
  callback('indexed\n');
}


function indexDoc(docID, doc) {
  //use key if found, if no key is found set filename to be key.
  var fieldBatch = [];
  var id = docID;
  var value = {};
  value['fields'] = doc;
  for (fieldKey in doc) {
    tfidf = new TfIdf();
    tfidf.addDocument(doc[fieldKey], fieldKey + '~' + id);
    for (var k in tfidf.documents[tfidf.documents.length - 1]) {
      if (k != '__key') {
        var tokenKey = k + '~' + fieldKey + '~' + id;
        tfidfx = new TfIdf();
        tfidfx.addDocument(doc[fieldKey], tokenKey);
        value['vector'] = tfidfx['documents'][0];
        fieldBatch.push
        ({type:'put',
          key:tokenKey,
          value:JSON.stringify(value)});
      }
    }
  }
  //put key-values into database
  reverseIndex.batch(fieldBatch, function (err) {
    if (err) return console.log('Ooops!', err);
    return;
  });
}



//rewrite so that exports.search returns a value instead of proviking a res.send()
exports.search = function (q, callback) {
  getVectorSet(q, 0, [], {}, reverseIndex, function(msg) {
    callback(msg);
  });
}




function getVectorSet (q, i, vectorSet, docSet, reverseIndex, callback) {
  queryTerms = q['query'];
  reverseIndex.createReadStream({
    start:queryTerms[i] + "~",
    end:queryTerms[i] + "~~"}) 
    .on('data', function (data) {
      console.log(data.key);
      var val = JSON.parse(data.value);
      //remove documents that dont contain all queryTerms
      hasAllTerms = true;
      //apply filters
      satisfiesFilter = true;
      for (var j = 0; j < queryTerms.length; j++){
        if (!val.vector.hasOwnProperty(queryTerms[j].toLowerCase())) {
          hasAllTerms = false;
        }
      }
      for (filterField in q.filter) {
        if (!val.fields[filterField]) {
          satisfiesFilter = false;            
        }
        else if (val.fields[filterField] != q.filter[filterField]) {
          satisfiesFilter = false;
        } 
      }
      if (hasAllTerms && satisfiesFilter) {
        vectorSet.push(val.vector);
        docSet[data.key] = val.fields;
      }
    })
    .on('end', function () {
      if (i < (queryTerms.length - 1)) {
        //evaluate the next least common term
        getVectorSet(q, ++i, vectorSet, docSet, reverseIndex, callback);
      }
      else {
        //all least common terms evaluated- go to results
        displayResults(q, vectorSet, docSet, function(msg) {
          callback(msg);
        });
      }
    })
}


function displayResults(q, vectorSet, docSet, callback) {
  queryTerms = q['query'];
  var docVectors = {'documents':vectorSet};
  var facets = {};
  for (var i = 0; i < q['facets'].length; i++) {
    facets[q['facets'][i]] = {};
  }
  var tfidf = new TfIdf(docVectors);
  var resultSet = [];
  var collatedResultSet = [];
  //carry out tfidf analysis, remove vectors with a score of 0
  tfidf.tfidfs(queryTerms, function(i, measure) {
    var key = docVectors.documents[i].__key;
    var keyParts = key.split('~');
    resultSet.push([
      keyParts[2],
      keyParts[1],
      keyParts[0],
      key,
      measure]);
  });
  //no results

  //collate and collapse results
  if (resultSet.length > 0) {
    resultsSortedOnID = resultSet.sort(function(a, b) {
      return (a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0));
    });

//    var runningScore = 0;
    var weighting = q['weight'];
    var scoringExplanation = new Array();
    for (var i = 0; i < resultsSortedOnID.length; i++) {
      var docID = resultSet[i][0];
      var score;
      var unweightedScore = resultSet[i][4];
      var fieldName = resultSet[i][1];
      var fieldKey = resultSet[i][3];
      var weight = 1;
      if (weighting[fieldName]) {
        weight = weighting[fieldName];
        score = unweightedScore*weight;
      }
      scoringExplanation.push([fieldName, unweightedScore, weight]);
      if (i == (resultsSortedOnID.length - 1)) {
        pushToResultset();
      }
      else if (docID != resultsSortedOnID[i + 1][0]){
        pushToResultset();
      }
      function pushToResultset() {
        var fieldDesc = {}
        var runningScore = 0;
        for (var j = 0; j < scoringExplanation.length; j++) {
          fieldDesc[scoringExplanation[j][0]] =
//            {'value': docSet[fieldKey][scoringExplanation[j][0]],
//             'tfidf': scoringExplanation[j][1],
//             'weight': scoringExplanation[j][2],
//             'score': (scoringExplanation[j][1]*scoringExplanation[j][2])};
          runningScore = runningScore 
            + (scoringExplanation[j][1]*scoringExplanation[j][2])
        }
        for (field in docSet[fieldKey]) {
          console.log(field);
          fieldDesc[field] =
            {'value': docSet[fieldKey][field],
             'tfidf': 0,
             'weight': 0,
             'score': 0};
          for (var j = 0; j < scoringExplanation.length; j++) {
            if (scoringExplanation[j].indexOf(field) != -1) {
              fieldDesc[field] =
                {'value': docSet[fieldKey][scoringExplanation[j][0]],
                 'tfidf': scoringExplanation[j][1],
                 'weight': scoringExplanation[j][2],
                 'score': (scoringExplanation[j][1]*scoringExplanation[j][2])};         
            }
          }
          debugger;
          if (q['facets'].indexOf(field) != -1) {
            if (facets[field][docSet[fieldKey][field]]) {
              facets[field][docSet[fieldKey][field]] =
                (facets[field][docSet[fieldKey][field]] + 1);
            }
            else {
              facets[field][docSet[fieldKey][field]] = 1;
            }
          }
        }
        collatedResultSet.push([docID,
                                runningScore,
//                                scoringExplanation,
//                                docSet[fieldKey],
                                fieldDesc]);
        scoringExplanation = new Array();
      }
    }
  }

  var response = {
    query: q,
//    rawResultset: resultSet,
    resultset: collatedResultSet.sort(function(a,b){return b[1]-a[1]}),
    facets: facets
  };

  callback(response);
}
