//http://stackoverflow.com/questions/10120866/how-to-unit-test-with-a-file-upload-in-mocha
//http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/

var norch = require('../lib/norch.js');
var should = require('should'); 
var supertest = require('supertest');

var request = supertest('localhost:3030');

describe('Am I A Happy Norch?', function() {
  describe('General Norchiness', function() {
    it('should show the home page', function(done) {
      request.get('/').expect(200).end(function(err, res) {
        if (err) throw err;
        done();
      });
    });
	});
});

describe('Can I Index Data?', function() {
  describe('Indexing', function() {
    var timeLimit = 5000;
    this.timeout(timeLimit);
    it('should post and index a file of data', function(done) {
      request.post('/indexer')
        .attach('document', './node_modules/reuters-21578-json/data/justOne/justOne.json')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
    it('should post and index data "inline"', function(done) {
      request.post('/indexer')
        .field('document', '[{"title":"A really interesting document","body":"This is a really interesting document"}, {"title":"Yet another really interesting document","body":"Yet again this is another really, really interesting document"}]')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
	});
});

