var forage = require('../lib/forage.js');
var buster = require('buster');
var http = require('http');


testForageURL('search for USSR', '/search?q=ussr', 856, 'ussr', 6.425563388011518, 6);
testForageURL('search for moscow', '/search?q=moscow', 286, 'moscow', 6.579714067838776, 4);

function testForageURL (testCaseName,
                        URL,
                        expectedFirstResultID,
                        idfToken,
                        idfValue,
                        totalHits) {
  buster.testCase(testCaseName, {
    setUp: function (done) {
      var thisholder = this;
      var options = {
        host: 'localhost',
        port: 3000,
        path: URL
      };
      http.get(options, function(res) {
        var data = '';
        res.on('data', function (chunk){
          data += chunk;
        });
        res.on('end',function(){
          thisholder.res = JSON.parse(data);
          done(buster.assert(true));
        });
      }).on('error', function(e) {
//        console.log("Got error: " + e.message);
        buster.assert(false);
      });
    },
    'endpoint returns result': function() {
//      console.log(JSON.stringify(this.res, null, 2));
      buster.assert(this.res);
    },
    'idf': {
      'result has idf': function() {
        buster.assert(this.res.idf);
      },
      'idf for ussr on testset is correct': function() {
        buster.assert.equals(this.res.idf[idfToken], idfValue);
      }
    },
    'query': {
      'result has query': function() {
        buster.assert(this.res.query);
      },
      'result has transformed query': function() {
        buster.assert(this.res.transformedQuery);
      }
    },
    'facets': {
      'result has facets': function() {
        buster.assert(this.res.facets);
      },
      'result has places facet': function() {
        buster.assert(this.res.facets.places);
      },
      'result has topics facet': function() {
        buster.assert(this.res.facets.topics);
      },
      'result has organisations facet': function() {
        buster.assert(this.res.facets.organisations);
      }
    },
    'hits': {
      'result has hits': function() {
        buster.assert.equals(this.res.hits[0].id + '', expectedFirstResultID + '');
      },
      'top hit is correct': function() {
        buster.assert(this.res.hits);
      },
      'result has totalHits': function() {
        buster.assert(this.res.totalHits);
      },
      'totalHits is correct': function() {
        buster.assert.equals(this.res.totalHits, totalHits);
      },
      'totalHits value is equal to the actual count of hits': function() {
        buster.assert.equals(this.res.totalHits, this.res.hits.length);
      },
      'first hit has matchedTerms': function() {
        buster.assert(this.res.hits[0].matchedTerms);
      },
      'first hit has document': function() {
        buster.assert(this.res.hits[0].document);
      },
      'first hit has score': function() {
        buster.assert(this.res.hits[0].score);
      }
    }
  });
}
