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
  this.timeout(5000)
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
    q.query = {
      AND: {'*': ['*']}
    }
    superrequest.get('/search?q=' + JSON.stringify(q))
      .expect(200)
      .end(function (err, res) {
        should.not.exist(err)
        should.exist(res.text)
        should.equal(JSON.parse(res.text).totalHits, 12)
        done()
      })
  })
  it('should be able to show totalDocs', function (done) {
    superrequest.get('/tellmeaboutmynorch').expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      should.equal(JSON.parse(res.text).totalDocs, 12)
      done()
    })
  })
  it('should be able to show totalDocs', function (done) {
    superrequest.get('/tellmeaboutmynorch/totalDocs').expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      should.equal(JSON.parse(res.text), '12')
      done()
    })
  })
  it('should be able to show lastupdate', function (done) {
    superrequest.get('/tellmeaboutmynorch/lastUpdate').expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      JSON.parse(res.text).should.be.above('1456753328000')
      JSON.parse(res.text).substring(0, 2).should.equal('14')
      done()
    })
  })
})

describe('Can I do indexing and restore?', function () {
  describe('Making a backup', function () {
    this.timeout(10000)
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
    this.timeout(5000)
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
      q.query = {
        AND: {'*': ['reuter']}
      }
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
  var resultForStarUSA = [ '510', '287', '998', '997', '996', '995', '994', '993', '992', '991' ]

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
    q.query = {
      AND: {'*': ['usa']}
    }
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
  this.timeout(120000)

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
    q.query = {
      AND: {'*': ['reuter']}
    }
    q.categories = [
      {field: 'topics'},
      {field: 'places'},
      {field: 'organisations'}
    ]
    // q.facets = {topics: {}, places: {}, organisations: {}}
    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      resultSet.should.have.property('categories')
      resultSet.hits.map(
        function (hit) {
          return hit.id
        }
      ).slice(0, 10).should.eql(
        [ '476', '311', '328', '998', '997', '995', '991', '990', '989', '988' ]
      )
      resultSet.totalHits.should.be.exactly(922)
      resultSet.hits.length.should.be.exactly(100)
      resultSet.categories[0].key.should.equal('topics')
      resultSet.categories[0].value.slice(0, 5).should.eql([
        {
          key: 'earn',
          value: 182
        },
        {
          key: 'acq',
          value: 100
        },
        {
          key: 'crude',
          value: 28
        },
        {
          key: 'grain',
          value: 25
        },
        {
          key: 'money-fx',
          value: 19
        }])
      resultSet.categories[1].key.should.equal('places')
      resultSet.categories[1].value.slice(0, 5).should.eql([
        {
          key: 'usa',
          value: 524
        },
        {
          key: 'uk',
          value: 84
        },
        {
          key: 'japan',
          value: 47
        },
        {
          key: 'canada',
          value: 42
        },
        {
          key: 'brazil',
          value: 21
        }
      ])
      resultSet.categories[2].key.should.equal('organisations')
      resultSet.categories[2].value.slice(0, 5).should.eql([
        {
          key: 'ico-coffee',
          value: 10
        },
        {
          key: 'imf',
          value: 10
        },
        {
          key: 'opec',
          value: 10
        },
        {
          key: 'ec',
          value: 9
        },
        {
          key: 'worldbank',
          value: 5
        }
      ])

      done()
    })
  })

  it('should be able to search, show facets, and filter', function (done) {
    var q = {}
    q.query = {
      AND: {'*': ['reuter']}
    }
    q.categories = [
      {field: 'topics'},
      {field: 'places'},
      {field: 'organisations'}
    ]
    q.filter = [
      {
        field: 'topics',
        gte: 'earn',
        lte: 'earn'
      }
    ]
    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      resultSet.hits.length.should.be.exactly(100)
      resultSet.should.have.property('categories')
      resultSet.totalHits.should.be.exactly(182)

      // console.log(JSON.stringify(resultSet.categories, null, 2))
      resultSet.categories[0].key.should.be.exactly('topics')
      resultSet.categories[0].value.should.eql([
        {
          key: 'earn',
          value: 182,
          active: true
        },
        {
          key: 'acq',
          value: 3
        },
        {
          key: 'alum',
          value: 2
        },
        {
          key: 'crude',
          value: 1
        }
      ])

      resultSet.categories[1].key.should.be.exactly('places')
      resultSet.categories[1].value.slice(0, 5).should.eql([
        {
          key: 'usa',
          value: 148
        },
        {
          key: 'canada',
          value: 14
        },
        {
          key: 'uk',
          value: 6
        },
        {
          key: 'australia',
          value: 4
        },
        {
          key: 'hong-kong',
          value: 3
        }
      ])

      resultSet.categories[2].key.should.be.exactly('organisations')
      resultSet.categories[2].value.should.eql([])
      done()
    })
  })

  it('can drill down on an individual result', function (done) {
    var q = {}
    q.query = {
      AND: {'*': ['reuter']}
    }
    q.categories = [
      {field: 'topics'},
      {field: 'places'},
      {field: 'organisations'}
    ]
    q.filter = [
      {
        field: 'topics',
        gte: 'earn',
        lte: 'earn'
      },
      {
        field: 'topics',
        gte: 'alum',
        lte: 'alum'
      }
    ]
    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      // console.log(JSON.stringify(resultSet, null, 2))
      resultSet.hits.length.should.be.exactly(2)
      resultSet.should.have.property('categories')
      resultSet.totalHits.should.be.exactly(2)
      resultSet.hits.map(
        function (hit) {
          return hit.id
        }
      ).should.eql(
        ['938', '921']
      )
      resultSet.categories[0].key.should.be.exactly('topics')
      resultSet.categories[0].value.should.eql([
        {
          key: 'alum',
          value: 2,
          active: true
        },
        {
          key: 'earn',
          value: 2,
          active: true
        }
      ])
      resultSet.categories[1].key.should.be.exactly('places')
      resultSet.categories[1].value.should.eql([
        {
          key: 'australia',
          value: 2
        }
      ])
      resultSet.categories[2].key.should.be.exactly('organisations')
      resultSet.categories[2].value.should.eql([])
      done()
    })
  })

  it('should be able to do a wildcard search and return all docs in the index', function (done) {
    var q = {}
    // q['query'] = {'*': ['*']}
    // q['facets'] = {'topics': {}, 'places': {}, 'organisations': {}}
    q.query = {
      AND: {'*': ['*']}
    }
    q.categories = [
      {field: 'topics'},
      {field: 'places'},
      {field: 'organisations'}
    ]

    superrequest.get('/search?q=' + JSON.stringify(q)).expect(200).end(function (err, res) {
      should.not.exist(err)
      should.exist(res.text)
      var resultSet = JSON.parse(res.text)
      resultSet.totalHits.should.be.exactly(1000)

      resultSet.categories[0].key.should.be.exactly('topics')
      resultSet.categories[0].value.slice(0, 5).should.eql(
        [
          {
            key: 'earn',
            value: 193
          },
          {
            key: 'acq',
            value: 108
          },
          {
            key: 'crude',
            value: 31
          },
          {
            key: 'grain',
            value: 28
          },
          {
            key: 'money-supply',
            value: 27
          }
        ]
      )

      resultSet.categories[1].key.should.be.exactly('places')
      resultSet.categories[1].value.slice(0, 5).should.eql(
        [
          {
            key: 'usa',
            value: 546
          },
          {
            key: 'uk',
            value: 85
          },
          {
            key: 'japan',
            value: 47
          },
          {
            key: 'canada',
            value: 42
          },
          {
            key: 'brazil',
            value: 21
          }
        ]
      )

      resultSet.categories[2].key.should.be.exactly('organisations')
      resultSet.categories[2].value.slice(0, 5).should.eql(
        [
          {
            key: 'ico-coffee',
            value: 10
          },
          {
            key: 'imf',
            value: 10
          },
          {
            key: 'opec',
            value: 10
          },
          {
            key: 'ec',
            value: 9
          },
          {
            key: 'worldbank',
            value: 5
          }
        ]
      )

      done()
    })
  })

  it('should be able to match', function (done) {
    var mtch = {beginsWith: 'lon'}
    superrequest.get('/matcher?match=' + JSON.stringify(mtch)).expect(200).end(
      function (err, res) {
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
      }
    )
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
    this.timeout(10000)
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
