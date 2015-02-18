//http://stackoverflow.com/questions/10120866/how-to-unit-test-with-a-file-upload-in-mocha
//http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/

var fs = require('fs');
var should = require('should'); 
var supertest = require('supertest');
var request = require('request');
//var norch = require('../lib/norch.js')({'indexPath':'norch-test'});
var Norch = require('../lib/norch.js');
var norch = new Norch({'indexPath':'norch-test'});
var superrequest = supertest('localhost:3030');


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
    var replicantNorch = new Norch({'indexPath':'norch-replicant','port':4040});
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

describe('Can I empty an index?', function() {
  it('should say that there are documents in the index', function(done) {

    request('http://localhost:3030/tellMeAboutMyNorch', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body) // Show the HTML for the Google homepage.
      }
    })

    request('http://localhost:4040/tellMeAboutMyNorch', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body) // Show the HTML for the Google homepage.
      }
    })

    superrequest.get('/tellMeAboutMyNorch').expect(200).end(function(err, res) {
      should.exist(res.text);
      should.exist(JSON.parse(res.text).totalDocs, 12);
      done();
    });
  });
  it('should empty the index', function(done) {
    superrequest.get('/empty').expect(200).end(function(err, res) {
      should.exist(res.text);
      should.exist(JSON.parse(res.text).success, true);
      should.exist(JSON.parse(res.text).message, 'index emptied');
      done();
    });
  });
  it('should say that there are now no documents in the index', function(done) {
    superrequest.get('/tellMeAboutMyNorch').expect(200).end(function(err, res) {
      should.exist(res.text);
      should.exist(JSON.parse(res.text).totalDocs, 0);
      done();
    });
  });
});


describe('Can I Index and search in bigger data files?', function() {
  var timeLimit = 120000;
  this.timeout(timeLimit);
  it('should post and index a file of data with filter fields', function(done) {
    superrequest.post('/indexer')
      .field('filterOn','places,topics,organisations')
      .attach('document', './node_modules/reuters-21578-json/data/full/reuters-000.json')
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });
  it('should say that there are now 1000 documents in the index', function(done) {
    superrequest.get('/tellMeAboutMyNorch').expect(200).end(function(err, res) {
      should.exist(res.text);
      should.exist(JSON.parse(res.text).totalDocs, 1000);
      done();
    });
  });
  it('should be able to search and show facets', function(done) {
    superrequest.get('/search?q=reuter&facets=topics,places,organisations').expect(200).end(function(err, res) {
      should.exist(res.text);
      var resultSet = JSON.parse(res.text);
      resultSet.should.have.property('facets');
      resultSet.totalDocs.should.be.exactly(922);
      resultSet.hits.length.should.be.exactly(10);
//ranking is volitile for searches where score is exactly the same
//      resultSet.hits[0].id.should.be.exactly(53);
      resultSet.facets.should.have.property('topics');
      resultSet.facets.topics[0].key.should.be.exactly('earn');
      resultSet.facets.topics[0].value.should.be.exactly(182);
      resultSet.facets.should.have.property('places');
      resultSet.facets.places[2].key.should.be.exactly('japan');
      resultSet.facets.places[2].value.should.be.exactly(47);
      resultSet.facets.should.have.property('organisations');
      resultSet.facets.organisations[4].key.should.be.exactly('worldbank');
      resultSet.facets.organisations[4].value.should.be.exactly(5);
      done();
    });
  });
  it('should be able to do a wildcard search and return all docs in the index', function(done) {
    superrequest.get('/search?q=*&facets=topics,places,organisations').expect(200).end(function(err, res) {
      should.exist(res.text);
      var resultSet = JSON.parse(res.text);
      resultSet.totalDocs.should.be.exactly(1000);
      resultSet.facets.should.have.property('topics');
      resultSet.facets.topics[0].key.should.be.exactly('earn');
      resultSet.facets.topics[0].value.should.be.exactly(193);
      resultSet.facets.should.have.property('places');
      resultSet.facets.places[0].key.should.be.exactly('usa');
      resultSet.facets.places[0].value.should.be.exactly(546);
      done();
    });
  });
});

