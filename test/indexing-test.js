var forage = require('../forage.js');
var buster = require('buster');
var fs = require('fs');
var request = require('request');

buster.testCase('Indexing tests:', {
  setUp: function() {
    this.timeout = 15000; // 1000 ms ~ 1 s
  },
  "read in 1000 documents": function (done) {
    var r = request.post('http://localhost:3000/indexer',
                         function (error, response, body) {
                           if (!response) {
                             done(assert(false));
                           }
                           else if (error) {
                             done(assert(false));
                           }
                           else if (response.statusCode == 200) {
                             done(assert(true));
                           }
                         })
    var form = r.form()
    form.append('filterOn', 'places,topics,organisations')
    form.append('document',
                fs.createReadStream('testdata/reuters-000.json'));
                
  }
});

