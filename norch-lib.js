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

  var facetValues = {};
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
  }
  
  for (fieldKey in doc) {
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
  //terms to look up in the reverse index
  var indexKeys = [];
  if (q['filter']) {
    for (var i = 0; i < q['query'].length; i++) {
      for (var j in q['filter']) {
        var filterArray = q['filter'][j];
        for (var k = 0; k < filterArray.length; k++) {
          indexKeys.push(q['query'][i] + '~'
                         + j + '~' + filterArray[k]);
        }
      }
    }
  } else {
    for (var i = 0; i < q['query'].length; i++) {
      indexKeys.push(q['query'][i] + '~NO~FACETING');
    }
  }
  console.log(indexKeys);

  getSearchResults(q, 0, {}, {}, indexKeys, function(msg) {
    callback(msg);
  });
}


function getSearchResults (q, i, docSet, idf, indexKeys, callback) {
  var queryTerms = q['query'];
  var thisQueryTerm = indexKeys[i].split('~')[0];
  var offset = parseInt(q['offset']);
  var pageSize = parseInt(q['pagesize']);
  var weight = {};
  if (q['weight']) {
    weight = q['weight'];
  }
  var idfCount = 0;
  reverseIndex.createReadStream({
    start:indexKeys[i] + "~",
    end:indexKeys[i] + "~~"})
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
        docSet[docID]['matchedTerms'][thisQueryTerm] = {};
        docSet[docID]['matchedTerms'][thisQueryTerm][fieldName] = tf;
        docSet[docID]['document'] = JSON.parse(data.value).fields;
      }
      //check to see if last term was a hit (docSet[docID] is set)
      else if (docSet[docID]) {
        docSet[docID]['matchedTerms'][thisQueryTerm] = {};
        docSet[docID]['matchedTerms'][thisQueryTerm][fieldName] = tf;
        docSet[docID]['document'] = JSON.parse(data.value).fields;
      }
    })
    .on('end', function () {
      //move this line
      if (idf[thisQueryTerm]) { 
        idf[thisQueryTerm] = (idf[thisQueryTerm] + idfCount);
      } else {
        idf[thisQueryTerm] = idfCount;
      }

      if (i < (indexKeys.length - 1)) {
        //evaluate the next least common term
        getSearchResults(q, ++i, docSet, idf, indexKeys, callback);
      }
      else {
        //idf generation in here
        for (var k = 0; k < idf.length; k++) {
          idf[k] = Math.log(totalDocs / idf[k]);
        }
        console.log(idf);
        //generate resultset with tfidf
        var resultSet = {};
        resultSet['idf'] = idf;
        resultSet['query'] = q;
        resultSet['totalHits'] = 0;
        resultSet['facets'] = {};
        var facetFields = [];
        if (q['facets']) {
          facetFields = q['facets'];
          for (var m = 0; m < facetFields.length; m++) {
            resultSet['facets'][facetFields[m]] = {};
          }
        }
        resultSet['hits'] = [];

        for (j in docSet) {
          debugger;
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
            //faceting
            for (var m = 0; m < facetFields.length; m++) {
              if (hit.document[facetFields[m]]) {
                var documentFacetTags = hit.document[facetFields[m]];
                for (var n = 0; n < documentFacetTags.length; n++) {
                  if (!resultSet.facets[facetFields[m]][documentFacetTags[n]]) {
                    resultSet.facets[facetFields[m]][documentFacetTags[n]] = 0;
                  }
                  resultSet.facets[facetFields[m]][documentFacetTags[n]]++;
                }
              }
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

