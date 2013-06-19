var fs = require('fs')
, levelup = require('levelup')
, natural = require('natural');

var totalDocs = 1000;

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


exports.index = function(batchString, facets, callback) {
  var batch = JSON.parse(batchString);
  for (docID in batch) {
    console.log(docID);
    indexDoc(docID, batch[docID], facets);
  }
  callback('indexed\n');
}


function indexDoc(docID, doc, facets) {
  //use key if found, if no key is found set filename to be key.
  var fieldBatch = [];
  var id = docID;
  var value = {};
  value['fields'] = {};

  var facetValues;
  if (doc[facets[0]]) {
    facetValues = doc[facets[0]];
  }
debugger;
  
  for (fieldKey in doc) {
    if( Object.prototype.toString.call(doc[fieldKey]) === '[object Array]' ) {
      value['fields'][fieldKey] = doc[fieldKey];
    } else {
      value['fields'][fieldKey] = doc[fieldKey].substring(0, 100);
    }
    tfidf = new TfIdf();
    tfidf.addDocument(doc[fieldKey], fieldKey + '~' + id);
    docVector = tfidf.documents[tfidf.documents.length - 1];
    var highestFrequencyCount = 0;
    for (var k in docVector) {
      if (docVector[k] > highestFrequencyCount)
        highestFrequencyCount = docVector[k];
    }
    for (var k in docVector) {
      if (k != '__key') {
        var tokenKey = k + '~'
          + 'NO~FACETING~'
          + fieldKey + "~"
          + docVector[k] + '~'
          + highestFrequencyCount + '~'
          + (docVector[k] / highestFrequencyCount) + '~'
          + id;
        
        //        console.log(tokenKey);
        fieldBatch.push({
          type:'put',
          key:tokenKey,
          value:JSON.stringify(value)});
        
        for (var j = 0; j < facetValues.length; j++) { 
          var tokenKey = k + '~'
            + facets[0] + '~'
            + facetValues[j] + '~'
            + fieldKey + "~"
            + docVector[k] + '~'
            + highestFrequencyCount + '~'
            + (docVector[k] / highestFrequencyCount) + '~'
            + id;
          
          //        console.log(tokenKey);
          fieldBatch.push({
            type:'put',
            key:tokenKey,
            value:JSON.stringify(value)});
        }
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
exports.search = function (q, callback) {
  getSearchResults(q, 0, [], {}, {}, reverseIndex, function(msg) {
    callback(msg);
  });
}




function getSearchResults (q, i, vectorSet, docSet, idf, reverseIndex, callback) {
  var queryTerms = q['query'];
  var offset = parseInt(q['offset']);
  var pageSize = parseInt(q['pagesize']);
  var weight = {};
  if (q['weight']) {
    weight = q['weight'];
  }
  var idfCount = 0;
  reverseIndex.createReadStream({
    start:queryTerms[i] + "~NO~FACETING~",
    end:queryTerms[i] + "~NO~FACETING~~"}) 
    .on('data', function (data) {
      idfCount++;
      var splitKey = data.key.split('~');
      //console.log(splitKey);
      var docID = splitKey[7];
      var fieldName = splitKey[3];
      var tf = splitKey[6];
      //first term in the query string?
      if (i == 0) {
        docSet[docID] = {};
        docSet[docID]['matchedTerms'] = {};
        docSet[docID]['matchedTerms'][queryTerms[i]] = {};
        docSet[docID]['matchedTerms'][queryTerms[i]][fieldName] = tf;
        docSet[docID]['document'] = JSON.parse(data.value).fields;
      }
      //check to see if last term was a hit (docSet[docID] is set)
      else if (docSet[docID]) {
        docSet[docID]['matchedTerms'][queryTerms[i]] = {};
        docSet[docID]['matchedTerms'][queryTerms[i]][fieldName] = tf;
        docSet[docID]['document'] = JSON.parse(data.value).fields;
      }
    })
    .on('end', function () {
      idf[queryTerms[i]] = Math.log(totalDocs / idfCount);
      if (i < (queryTerms.length - 1)) {
        //evaluate the next least common term
        getSearchResults(q, ++i, vectorSet, docSet, idf, reverseIndex, callback);
      }
      else {
        //generate resultset with tfidf
        var resultSet = {};
        resultSet['idf'] = idf;
        resultSet['query'] = q;
        resultSet['totalHits'] = 0;
        resultSet['hits'] = [];
        for (j in docSet) {
          var totalMatchedTerms = Object.keys(docSet[j]['matchedTerms']).length;
          if (totalMatchedTerms < queryTerms.length) {
//            delete docSet[j];
          }
          else {
            hit = docSet[j];
            hit['id'] = j;
            var score = 0;
            for (k in idf) {
              var searchTerm = k;
              var IDF = idf[k];
              var documentHitFields = hit['matchedTerms'][k];
              for (l in documentHitFields) {
                //weighting
                var W = 1;
                if (weight[l]) {
                  W = parseInt(weight[l]);
                }
                var TF = documentHitFields[l];
                score += (TF * IDF * W);
              }
              hit['score'] = score;
            }            
            resultSet['hits'].push(hit);
          }
        }
        //array sort function
        function compare(a,b) {
          if (a.score < b.score)
            return 1;
          if (a.score > b.score)
            return -1;
          return 0;
        }
        resultSet['totalHits'] = resultSet.hits.length;
        resultSet.hits = resultSet.hits.sort(compare)
          .slice(offset, (offset + pageSize));
        callback(resultSet);
      }
    })
}

