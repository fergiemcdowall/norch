var buster = require("buster");
var forage = require('../lib/forage.js');
var http = require('http');
var request = require('request');
var fs = require('fs');

buster.spec.expose(); // Make functions global

var spec = describe("Test webservice", function () {


  var forageURLs = [{url:'/search?q=moscow',
                     searchTerm: 'moscow',
                     idf: 6.579714067838776,
                     firstHit: 286,
                     totalHits: 4},
                    {url:'/search?q=ussr',
                     searchTerm: 'ussr',
                     idf: 6.425563388011518,
                     firstHit: 856,
                     totalHits: 6}];
  var forageURLcounter = 0;

  beforeAll(function (done) {
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
                         });
    var form = r.form();
    form.append('filterOn', 'places,topics,organisations');
    form.append('document',
                fs.createReadStream('test/testdata/reuters-000.json'));
  });
  
  before(function (done) {
    var that = this;
    var options = {
      host: 'localhost',
      port: 3000,
      path: forageURLs[forageURLcounter].url
    };
    http.get(options, function(res) {
      var data = '';
      res.on('data', function (chunk){
        data += chunk;
      });
      res.on('end',function(){
        that.res = JSON.parse(data);
        done(buster.assert(true));
      });
    }).on('error', function(e) {
      //        console.log("Got error: " + e.message);
      buster.assert(false);
    });
  });
  

  for (var i = 0; i < forageURLs.length; i++) {
    it("query URL is " + forageURLs[i].url, function () {
      buster.assert(this.res);
      buster.assert(this.res.idf);
      buster.assert(this.res.idf[forageURLs[forageURLcounter].searchTerm],
                    forageURLs[forageURLcounter].idf);
      buster.assert(this.res.query);
      buster.assert(this.res.transformedQuery);
      buster.assert(this.res.facets);
      buster.assert(this.res.facets.places);
      buster.assert(this.res.facets.topics);
      buster.assert(this.res.facets.organisations);
      buster.assert.equals(this.res.hits[0].id + '',
                           forageURLs[forageURLcounter].firstHit + '');
      buster.assert(this.res.hits);
      buster.assert(this.res.totalHits);
      buster.assert.equals(this.res.totalHits,
                           forageURLs[forageURLcounter].totalHits);
      buster.assert.equals(this.res.totalHits, this.res.hits.length);
      buster.assert(this.res.hits[0].matchedTerms);
      buster.assert(this.res.hits[0].document);
      buster.assert(this.res.hits[0].score);
      forageURLcounter++
    });
  }
  
});
