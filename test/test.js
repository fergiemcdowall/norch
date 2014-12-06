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
    it('should post and index a file of data within ' + timeLimit + 'ms', function(done) {
      request.post('/indexer')
        .field('extra_info', '{"in":"case you want to send json along with your file"}')
        .attach('document', './node_modules/reuters-21578-json/data/justOne/justOne.json')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
	});
});

