/* global it, describe */

// http://stackoverflow.com/questions/10120866/how-to-unit-test-with-a-file-upload-in-mocha
// http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/

var async = require('async')
var da = require('distribute-array')
var fs = require('fs')
var should = require('should')
var supertest = require('supertest')
var request = require('request')
var sandbox = './test/sandbox/'
var superrequest = supertest('localhost:3030')
var _ = require('lodash')

describe('Am I A Happy Norch?', function () {
  it('should initialize a norch server', function (done) {
    require('../lib/norch.js')({
      indexPath: sandbox + 'norch-test'
    }, function (err, norch) {
      if (err) false.should.eql(true)
      done()
    })
  })
  it('should show the home page', function (done) {
    superrequest.get('/').expect(200).end(function (err, res) {
      should.not.exist(err)
      done()
    })
  })
})

describe('Can I Index Data?', function () {
  var timeLimit = 5000
  this.timeout(timeLimit)
  it('should post and index a file of data', function (done) {
    superrequest.post('/add')
      .attach('document', './node_modules/reuters-21578-json/data/justTen/justTen.json')
      .expect(200)
      .end(function (err, res) {
        should.not.exist(err)
        done()
      })
  })
  it('should post and index data "inline"', function (done) {
    superrequest.post('/add')
      .field('document', '[{"title":"A really interesting document","body":"This is a really interesting document"}, {"title":"Yet another really interesting document","body":"Yet again this is another really, really interesting document"}]')
      .expect(200)
      .end(function (err, res) {
        should.not.exist(err)
        done()
      })
  })
  it('should be able to search', function (done) {
    var q = {}
    q.query = {'*': ['*']}
    superrequest.get('/search?q=' + JSON.stringify(q))
      .expect(200)
      .end(function (err, res) {
        should.not.exist(err)
        should.exist(res.text)
        should.equal(JSON.parse(res.text).totalHits, 12)
        done()
      })
  })
})

describe('Can I do indexing and restore?', function () {
  describe('Making a backup', function () {
    var timeLimit = 10000
    this.timeout(timeLimit)
    it('should generate a backup file', function (done) {
      superrequest.get('/snapshot')
        .pipe(fs.createWriteStream(sandbox + 'backup.gz'))
        .on('close', function () {
          done()
        })
    })
  })
  describe('Restoring from a backup', function () {
    var replicantSuperrequest
    var timeLimit = 5000
    this.timeout(timeLimit)
    it('should initialize a NEW norch server', function (done) {
      require('../lib/norch.js')({
        indexPath: sandbox + 'norch-replicant',
        port: 4040
      }, function (err, norch) {
        if (err) false.should.eql(true)
        replicantSuperrequest = supertest('localhost:4040')
        done()
      })
    })
    it('should post and index a file of data', function (done) {
      fs.createReadStream(sandbox + 'backup.gz')
        .pipe(request.post('http://localhost:4040/replicate'))
        .on('response', function () {
          done()
        })
    })
    it('should be able to search again', function (done) {
      var q = {}
      q.query = {'*': ['reuter']}
      replicantSuperrequest.get('/search?q=' + JSON.stringify(q))
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err)
          should.exist(res.text)
          should.equal(JSON.parse(res.text).totalHits, 10)
          done()
        })
    })
  })
})

describe('Concurrent indexing', function (done) {
  this.timeout(60000)
  var concurrentSuperrequest
  var batchData = da(require('../node_modules/reuters-21578-json/data/full/reuters-000.json'), 10)
  var resultForStarUSA = [ '287', '510', '998', '997', '996', '995', '994', '993', '992', '991' ]

  function indexBatch (index, callback) {
    console.log('started indexing batch ' + index)
    concurrentSuperrequest.post('/add')
      .field('document', JSON.stringify(batchData[index]))
      .expect(200)
      .end(function (err, res) {
        should.not.exist(err)
        console.log('batch ' + index + ' indexed')
        return callback(null, 'indexed')
      })
  }

  var batchJobs = []
  batchData.forEach(function (item, i) {
    batchJobs[i] = function (callback) {
      indexBatch(i, callback)
    }
  })

  it('should initialize a NEW norch server', function (done) {
    require('../lib/norch.js')({
      indexPath: sandbox + 'norch-concurrent',
      port: 5050
    }, function (err, norch) {
      if (err) false.should.eql(true)
      concurrentSuperrequest = supertest('localhost:5050')
      done()
    })
  })

  it('should do concurrency', function (done) {
    async.parallel(_.shuffle(batchJobs), function (err, results) {
      if (err) {
        console.log('failure dear leader ' + err)
      }
      done()
    })
  })

  it('should be able to search', function (done) {
    var q = {}
    q.query = {'*': ['usa']}
    concurrentSuperrequest.get('/search?q=' + JSON.stringify(q))
      .expect(200)
      .end(function (err, res) {
        should.not.exist(err)
        should.exist(res.text)
        _.map(JSON.parse(res.text).hits, 'id').slice(0, 10).should.eql(resultForStarUSA)
        done()
      })
  })
})

describe('Can I empty an index?', function () {
  it('should say that there are documents in the index', function (done) {
    superrequest.get('/tellmeaboutmynorch').expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      should.equal(JSON.parse(res.text).totalDocs, 12)
      done()
    })
  })
  it('should empty the index', function (done) {
    superrequest.get('/flush').expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      should.equal(JSON.parse(res.text).success, true)
      should.equal(JSON.parse(res.text).message, 'index emptied')
      done()
    })
  })
  it('should say that there are now no documents in the index', function (done) {
    superrequest.get('/tellmeaboutmynorch').expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      should.equal(JSON.parse(res.text).totalDocs, 0)
      done()
    })
  })
})

describe('Can I Index and search in bigger data files?', function () {
  var timeLimit = 120000
  this.timeout(timeLimit)

  it('should post and index a file of data with filter fields', function (done) {
    var options = {}
    options.batchName = 'reuters'
    options.fieldOptions = [
      {fieldName: 'places', filter: true},
      {fieldName: 'topics', filter: true},
      {fieldName: 'organisations', filter: true}
    ]
    superrequest.post('/add')
      .field('options', JSON.stringify(options))
      .attach('document', './node_modules/reuters-21578-json/data/full/reuters-000.json')
      .expect(200)
      .end(function (err, res) {
        should.not.exist(err)
        done()
      })
  })

  it('should say that there are now 1000 documents in the index', function (done) {
    superrequest.get('/tellmeaboutmynorch').expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      should.equal(JSON.parse(res.text).totalDocs, 1000)
      done()
    })
  })

  it('should be able to search and show facets', function (done) {
    var q = {}
    q.query = {'*': ['reuter']}
    q.facets = {topics: {}, places: {}, organisations: {}}
    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      //      console.log(_.map(resultSet.hits, 'id').slice(0,10))
      resultSet.should.have.property('facets')
      _.map(resultSet.hits, 'id').slice(0, 10).should.eql([ '476', '813', '73', '426', '373', '343', '332', '134', '795', '328' ])
      resultSet.totalHits.should.be.exactly(922)
      resultSet.hits.length.should.be.exactly(100)
      resultSet.facets[0].key.should.be.exactly('topics')
      resultSet.facets[0].value[0].key.should.be.exactly('earn')
      resultSet.facets[0].value[0].value.should.be.exactly(182)
      resultSet.facets[1].key.should.be.exactly('places')
      resultSet.facets[1].value[2].key.should.be.exactly('japan')
      resultSet.facets[1].value[2].value.should.be.exactly(47)
      resultSet.facets[2].key.should.be.exactly('organisations')
      resultSet.facets[2].value[4].key.should.be.exactly('worldbank')
      resultSet.facets[2].value[4].value.should.be.exactly(5)
      done()
    })
  })
  it('should be able to search, show facets, and filter', function (done) {
    var q = {}
    q['query'] = {'*': ['reuter']}
    q['facets'] = {'topics': {}, 'places': {}, 'organisations': {}}
    q['filter'] = {'topics': [['earn', 'earn']]}
    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      resultSet.hits.length.should.be.exactly(100)
      resultSet.should.have.property('facets')
      resultSet.totalHits.should.be.exactly(182)
      resultSet.facets[0].key.should.be.exactly('topics')
      resultSet.facets[0].value[0].key.should.be.exactly('earn')
      resultSet.facets[0].value[0].value.should.be.exactly(182)
      resultSet.facets[1].key.should.be.exactly('places')
      resultSet.facets[1].value[5].key.should.be.exactly('hong-kong')
      resultSet.facets[1].value[5].value.should.be.exactly(3)
      resultSet.facets[2].key.should.be.exactly('organisations')
      resultSet.facets[2].value.length.should.be.exactly(0)
      done()
    })
  })
  it('can drill down on an individual result', function (done) {
    var q = {}
    q['query'] = {'*': ['reuter']}
    q['facets'] = {'topics': {}, 'places': {}, 'organisations': {}}
    q['filter'] = {'topics': [['earn', 'earn'], ['alum', 'alum']]}
    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      resultSet.hits.length.should.be.exactly(2)
      resultSet.should.have.property('facets')
      resultSet.totalHits.should.be.exactly(2)
      resultSet.facets[0].key.should.be.exactly('topics')
      resultSet.facets[0].value.length.should.be.exactly(2)
      resultSet.facets[0].value[0].key.should.be.exactly('earn')
      resultSet.facets[0].value[0].value.should.be.exactly(2)
      resultSet.facets[0].value[1].key.should.be.exactly('alum')
      resultSet.facets[0].value[1].value.should.be.exactly(2)
      resultSet.facets[1].key.should.be.exactly('places')
      resultSet.facets[1].value.length.should.be.exactly(1)
      resultSet.facets[1].value[0].key.should.be.exactly('australia')
      resultSet.facets[1].value[0].value.should.be.exactly(2)
      done()
    })
  })
  it('should be able to do a wildcard search and return all docs in the index', function (done) {
    var q = {}
    q['query'] = {'*': ['*']}
    q['facets'] = {'topics': {}, 'places': {}, 'organisations': {}}
    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      resultSet.totalHits.should.be.exactly(1000)
      resultSet.facets[0].key.should.be.exactly('topics')
      resultSet.facets[0].value[0].key.should.be.exactly('earn')
      resultSet.facets[0].value[0].value.should.be.exactly(193)
      resultSet.facets[1].key.should.be.exactly('places')
      resultSet.facets[1].value[0].key.should.be.exactly('usa')
      resultSet.facets[1].value[0].value.should.be.exactly(546)
      done()
    })
  })
  it('should be able to match', function (done) {
    var mtch = {beginsWith: 'lon'}
    superrequest.get('/matcher?match=' + JSON.stringify(mtch)).expect(200).end(function (err, res) {
      should.exist(res.text)
      should.not.exist(err)
      var matches = JSON.parse(res.text)
      matches.should.eql([ 'long',
        'london',
        'longer',
        'longrange',
        'longstanding',
        'longtime' ]
      )
      done()
    })
  })
})

describe('Running norch and search-index in the same process.', function () {
  var searchindex = require('search-index')
  var si
  var superTest
  var docId = '111'
  var docTitle = 'Test'

  it('should initialize a NEW norch server', function (done) {
    searchindex({
      indexPath: sandbox + 'norch-si-combined'
    }, function (err, thisSi) {
      should.not.exist(err)
      require('../lib/norch.js')({
        si: thisSi,
        port: 6060
      }, function (err, norch) {
        if (err) false.should.eql(true)
        si = thisSi
        superTest = supertest('localhost:6060')
        done()
      })
    })
  })

  describe('Index status', function () {
    it('should be empty', function (done) {
      si.tellMeAboutMySearchIndex(function (err, msg) {
        should.not.exist(err)
        msg.totalDocs.should.be.exactly(0)
        done()
      })
    })
  })

  describe('indexing data through norch and si', function () {
    it('should post and index a file of data', function (done) {
      superTest.post('/add')
        .attach('document', './node_modules/reuters-21578-json/data/justTen/justTen.json')
        .expect(200)
        .end(function (err) {
          should.not.exist(err)
          done()
        })
    })
    it("should be possible to add a doc through search-index's api", function (done) {
      si.add([{id: docId, title: docTitle}], {batchName: 'test'}, function (err) {
        should.not.exist(err)
        done()
      })
    })
    it('should have 11 docs now', function (done) {
      si.tellMeAboutMySearchIndex(function (err, msg) {
        should.not.exist(err)
        msg.totalDocs.should.be.exactly(11)
        done()
      })
    })
  })

  describe('getting docs should work through both norch and si', function () {
    it('should be able to find doc ' + docId + ' via norch get', function (done) {
      superTest.get('/get?docID=' + docId)
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err)
          var resp = JSON.parse(res.text)
          resp.id.should.be.exactly(docId)
          resp.title.should.be.exactly(docTitle)
          done()
        })
    })
    it('should be able to find doc ' + docId + ' through si get', function (done) {
      si.get(docId, function (err, res) {
        should.not.exist(err)
        var doc = res
        doc.id.should.be.exactly(docId)
        doc.title.should.be.exactly(docTitle)
        done()
      })
    })
  })
})

// needs some tests to show filtering
