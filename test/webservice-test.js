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
    if (this.res) {
      console.log(this.res);
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'result has idf': function() {
    debugger;
    if (this.res.idf) {
      console.log('idf: '
                  + JSON.stringify(this.res.idf));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'result has query': function() {
    debugger;
    if (this.res.query) {
      console.log('query: '
                  + JSON.stringify(this.res.query));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'result has transformed query': function() {
    debugger;
    if (this.res.query) {
      console.log('transformedQuery: '
                  + JSON.stringify(this.res.transformedQuery));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'result has totalHits': function() {
    debugger;
    if (this.res.query) {
      console.log('totalHits: '
                  + JSON.stringify(this.res.totalHits));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'result has facets': function() {
    debugger;
    if (this.res.query) {
      console.log('facets: '
                  + JSON.stringify(this.res.facets));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'result has hits': function() {
    debugger;
    if (this.res.query) {
      console.log('hits: '
                  + JSON.stringify(this.res.transformedQuery));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'first hit has matchedTerms': function() {
    debugger;
    if (this.res.query) {
      console.log('hits[0].matchedTerms: '
                  + JSON.stringify(this.res.hits[0].matchedTerms));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'first hit has document': function() {
    debugger;
    if (this.res.query) {
      console.log('hits[0].document: '
                  + JSON.stringify(this.res.hits[0].document));
      assert(true);
    }
    else {
      assert(false);
    }
  },
  'first hit has score': function() {
    debugger;
    if (this.res.query) {
      console.log('hits[0].score: '
                  + JSON.stringify(this.res.hits[0].score));
      assert(true);
    }
    else {
      assert(false);
    }
  }
});


