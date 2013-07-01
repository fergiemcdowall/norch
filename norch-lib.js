var fs = require('fs')
, levelup = require('levelup')
, natural = require('natural');

var totalDocs = 1000;

var reverseIndex = levelup('./reverseIndex')
, TfIdf = require('natural').TfIdf;


exports.indexPeek = function(start, stop, callback) {
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

exports.deleteDoc = function(docID, callback) {
  var delBatch = [];
  reverseIndex.createReadStream({
    start: 'DOCUMENT~' + docID + '~',
    end: 'DOCUMENT~' + docID + '~~'})
    .on('data', function(data) {
      var deleteKeys = JSON.parse(data.value);
      for (var i = 0; i < deleteKeys.length; i++) {
        delBatch.push({
          type: 'del',
          key: deleteKeys[i]});
      }
    })
    .on('end', function() {
      reverseIndex.batch(delBatch, function (err) {
        if (err) return console.log('Ooops!', err);
        return;
      });
      callback('deleted ' + docID);
    });
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
    var deleteKeys = [];
    for (var k in docVector) {
      if (k != '__key') {
        var facetIndexKey = ['NO~FACETING'];
        for (var l = 0; l < facets.length; l++) {
          debugger;
          if (doc[facets[l]]) {
            var thisFacetValue = doc[facets[l]];
            for (var m = 0; m < thisFacetValue.length; m++) {
              facetIndexKey.push(facets[l] + '~' + thisFacetValue[m]);
            }
          } 
        }
        for (var l = 0; l < facetIndexKey.length; l++) {
          var tokenKey = k + '~'
            + facetIndexKey[l] + '~'
            + fieldKey + "~"
            + docVector[k] + '~'
            + highestFrequencyCount + '~'
            + (docVector[k] / highestFrequencyCount) + '~'
            + id;
          fieldBatch.push({
            type:'put',
            key:tokenKey,
            value:JSON.stringify(value)});
          deleteKeys.push(tokenKey);
        }
      }
    }
    //dump references so that docs can be deleted
    var docDeleteIndexKey = 'DOCUMENT~' + id + '~' + fieldKey;
    deleteKeys.push(docDeleteIndexKey);
    fieldBatch.push({
      type: 'put',
      key: docDeleteIndexKey,
      value: JSON.stringify(deleteKeys)});
  }

  


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
//  console.log(indexKeys);
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
      if (thisQueryTerm == queryTerms[0]) {
        docSet[docID] = {};
        docSet[docID]['matchedTerms'] = {};
        docSet[docID]['matchedTerms'][thisQueryTerm] = {};
        docSet[docID]['matchedTerms'][thisQueryTerm][fieldName] = tf;
        docSet[docID]['document'] = JSON.parse(data.value).fields;
      }
      //check to see if last term was a hit (docSet[docID] is set)
      else if (docSet[docID] != null) {
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
        getSearchResults(q, ++i, docSet, idf, indexKeys, callback);
      }
      else {
        //idf generation in here
        for (var k = 0; k < idf.length; k++) {
          idf[k] = Math.log(totalDocs / idf[k]);
        }
//        console.log(idf);
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

        docSetLoop:
        for (j in docSet) {

          //deal with filtering
          for (var k in q.filter) {
            var filterIsPresent = false;
            for (var l = 0; l < q.filter[k].length; l++) {
              debugger;
              //if the filter field is missing- drop hit
              if (docSet[j].document[k] === undefined)
                continue docSetLoop;
              //if the filter value is present- mark as true
              if (docSet[j].document[k].indexOf(q.filter[k][l]) != -1)
                filterIsPresent = true
            }
            //if this is still false, the hit did not contain the
            //right filter field value anywhere in the filter field
            //array
            if (!filterIsPresent) {
              continue docSetLoop;
            }
          }

          var totalMatchedTerms = Object.keys(docSet[j]['matchedTerms']).length;
          if (totalMatchedTerms < queryTerms.length) {
            continue docSetLoop;
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

