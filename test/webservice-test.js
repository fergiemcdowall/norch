var forage = require('../forage.js');
var buster = require('buster');
var http = require('http');

buster.testCase('HTTP endpoints', {
  "test random search": function (done) {
    var options = {
      host: 'localhost',
      port: 3000,
      path: '/search?q=moscow'
    };
    http.get(options, done(function(res) {
      console.log("Got response: " + res.statusCode);
      assert.equals(res.statusCode, 200);
    })).on('error', done(function(e) {
      console.log("Got error: " + e.message);
      assert(false);
    }));
  }
});


