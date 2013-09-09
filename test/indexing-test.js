var forage = require('../forage.js');
var buster = require('buster');
var fs = require('fs');
var request = require('request');

buster.testCase('Indexing tests:', {
  'index batch of 1000 docs': function (done) {
    this.timeout = 60000;
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
                fs.createReadStream('test/testdata/reuters-000.json'));
  }
});

