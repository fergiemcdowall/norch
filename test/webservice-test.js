var forage = require('../forage.js');
var buster = require('buster');
var http = require('http');

buster.testCase('HTTP endpoints', {
  setUp: function (done) {
    var thisholder = this;
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/search?q=ussr'
    };
    http.get(options, function(res) {
      console.log("Got response: " + res.statusCode);
      var data = '';
      res.on('data', function (chunk){
        data += chunk;
        console.log('parsing res')
      });
      res.on('end',function(){
        var obj = JSON.parse(data);
        thisholder.res = JSON.parse(data);
        done(assert(true));
      });
    }).on('error', function(e) {
      console.log("Got error: " + e.message);
      assert(false);
    });
  },
  'endpoint returns result': function() {
    assert(this.res);
  },
  'idf': {
    'result has idf': function() {
      assert(this.res.idf);
    },
    'idf for ussr on testset is correct': function() {
      assert.equals(this.res.idf.ussr, 6.425563388011518);
    }
  },
  'query': {
    'result has query': function() {
      assert(this.res.query);
    },
    'result has transformed query': function() {
      assert(this.res.transformedQuery);
    }
  },
  'facets': {
    'result has facets': function() {
      assert(this.res.facets);
    }
  },
  'hits': {
    'result has hits': function() {
      assert(this.res.hits);
    },
    'result has totalHits': function() {
      assert(this.res.totalHits);
    },
    'first hit has matchedTerms': function() {
      assert(this.res.hits[0].matchedTerms);
    },
    'first hit has document': function() {
      assert(this.res.hits[0].document);
    },
    'first hit has score': function() {
      assert(this.res.hits[0].score);
    }
  }
});


