//http://stackoverflow.com/questions/10120866/how-to-unit-test-with-a-file-upload-in-mocha
//http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/

var fs = require('fs');
var should = require('should'); 
var supertest = require('supertest');
var norch = require('../lib/norch.js')({'indexPath':'test-norch'});
var superrequest = supertest('localhost:3030');
var request = require('request');

describe('Am I A Happy Norch?', function() {
  describe('General Norchiness', function() {
    it('should show the home page', function(done) {
      superrequest.get('/').expect(200).end(function(err, res) {
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
      superrequest.post('/indexer')
        .attach('document', './node_modules/reuters-21578-json/data/justTen/justTen.json')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
    it('should post and index data "inline"', function(done) {
      superrequest.post('/indexer')
        .field('document', '[{"title":"A really interesting document","body":"This is a really interesting document"}, {"title":"Yet another really interesting document","body":"Yet again this is another really, really interesting document"}]')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
  });
});


describe('Can I do indexing and restore?', function() {
  describe('Making a backup', function() {
    var timeLimit = 10000;
    this.timeout(timeLimit);
    it('should generate a backup file', function(done) {
      superrequest.get('/snapshot')
        .pipe(fs.createWriteStream('backup.gz'))
        .on('close', function() {
          done();
        });
    });
  });
  describe('Restoring from a backup', function() {
    var replicantNorch = require('../lib/norch.js')({'indexPath':'replicant-norch','port':4040});
    var replicantSuperrequest = supertest('localhost:4040');
    var timeLimit = 5000;
    this.timeout(timeLimit);



  //curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: application/gzip"
    it('should post and index a file of data', function(done) {
      fs.createReadStream('backup.gz')
        .pipe(request.post('http://localhost:4040/replicate'))
        .on('response', function(){
          done();
      });
    });

    it('should be able to search again', function(done) {
      replicantSuperrequest.get('/search?q=reuter')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          should.exist(res.text);
          should.exist(JSON.parse(res.text).totalDocs, 9);
          done();
        });
    });

  });
});


