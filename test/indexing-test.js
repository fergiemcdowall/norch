var forage = require('../lib/forage.js');
var buster = require('buster');
var fs = require('fs');
var request = require('request');

buster.testCase('Indexing tests:', {
  'index batch of 1000 docs': function (done) {
    this.timeout = 10000;
    var r = request.post('http://localhost:3000/indexer',
                         function (error, response, body) {
                           if (!response) {
                             done(buster.assert(false));
                           }
                           else if (error) {
                             done(buster.assert(false));
                           }
                           else if (response.statusCode == 200) {
                             done(buster.assert(true));
                           }
                         })
    var form = r.form()
    form.append('filterOn', 'places,topics,organisations')
    form.append('document',
                fs.createReadStream('test/testdata/reuters-000.json'));
  }
});

