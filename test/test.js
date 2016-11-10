const fs = require('fs')
const request = require('request')
const sandbox = './test/sandbox/'
const test = require('tape')
const Readable = require('stream').Readable
const SearchIndex = require('search-index')
const Norch = require('../')

var norch, norchReplicant, combinedNorch
const url = 'http://localhost:3030'

test('should initialize a norch server', function (t) {
  t.plan(1)
  Norch({
    indexPath: sandbox + 'norch-test'
  }, function (err, thisNorch) {
    norch = thisNorch
    t.error(err)
  })
})

test('should show the home page', function (t) {
  t.plan(1)
  request.get(url).on('response', function (r) {
    t.equals(r.statusCode, 200)
  })
})

test('should post and index a file of data', function (t) {
  t.plan(1)
  var lastMsg
  fs.createReadStream('./node_modules/reuters-21578-json/data/fullFileStream/justTen.str')
    .pipe(request.post(url + '/add'))
    .on('data', function (d) {
      lastMsg = d
    })
    .on('end', function () {
      t.looseEqual(JSON.parse(lastMsg.toString()), { event: 'finished' })
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should post and index data "inline"', function (t) {
  t.plan(1)
  var lastMsg
  var s = new Readable({ objectMode: true })
  s.push('{"title":"A really interesting document","body":"This is a really interesting document"}\n')
  s.push('{"title":"Yet another really interesting document","body":"Yet again this is another really, really interesting document"}\n')
  s.push(null)
  s.pipe(request.post(url + '/add'))
    .on('data', function (d) {
      lastMsg = d
    })
    .on('end', function () {
      t.looseEqual(JSON.parse(lastMsg.toString()), { event: 'finished' })
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should be able to search', function (t) {
  t.plan(2)
  request(url + '/search', function (err, res, body) {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
})

test('search should return 12 docs', function (t) {
  t.plan(13)
  var i = 0
  request(url + '/search')
    .on('data', function (data) {
      t.ok(true, 'doc found')
      i++
    })
    .on('end', function (data) {
      t.equal(i, 12)
    })
})

test('should say that there are now 12 documents in the index', function (t) {
  t.plan(1)
  request(url + '/docCount')
    .on('data', function (data) {
      t.equal(data.toString(), '"12"')
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should generate a backup file', function (t) {
  t.plan(1)
  request.post(url + '/snapshot')
    .on('data', function (data) {
      t.equal(data.toString(), '"replication complete"')
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should initialize a NEW norch server', function (t) {
  t.plan(1)
  Norch({
    indexPath: sandbox + 'norch-replicant',
    port: 4040
  }, function (err, norch) {
    norchReplicant = norch
    t.error(err)
  })
})

test('should get latest snapshot and import in into a new norch', function (t) {
  t.plan(1)
  request(url + '/latestSnapshot')
    .pipe(request.post('http://localhost:4040/import'))
    .on('data', function (data) {
      t.equal(data.toString(), '"replication complete"')
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should be able to return 12 results from the replicant norch', function (t) {
  t.plan(13)
  var i = 0
  var q = {
    query: {
      AND: {'*': ['*']}
    }
  }
  request('http://localhost:4040/search?q=' + JSON.stringify(q))
    .on('data', function (data) {
      t.ok(true, 'document in search results')
      i++
    })
    .on('end', function (data) {
      t.equal(i, 12)
    })
})

test('should say that there are 12 documents in the index', function (t) {
  t.plan(13)
  var i = 0
  var q = {
    query: {
      AND: {'*': ['*']}
    }
  }
  request(url + '/search?q=' + JSON.stringify(q))
    .on('data', function (data) {
      t.ok(true, 'document in search results')
      i++
    })
    .on('end', function (data) {
      t.equal(i, 12)
    })
})

test('should empty the index', function (t) {
  t.plan(1)
  request.del(url + '/flush')
    .on('data', function (data) {
      t.ok(true, '"index flushed"')
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should say that there are now no documents in the index', function (t) {
  t.plan(1)
  var i = 0
  var q = {
    query: {
      AND: {'*': ['*']}
    }
  }
  console.log(url)
  request(url + '/search?q=' + JSON.stringify(q))
    .on('data', function (data) {
      t.ok(false, 'document in search results (shouldn\'t be there)')
      i++
    })
    .on('error', function (error) {
      t.error(error)
    })
    .on('end', function (data) {
      t.equal(i, 0)
    })
})

test('should post and index a file of data', function (t) {
  t.plan(1)
  var lastMsg
  fs.createReadStream('./node_modules/reuters-21578-json/data/fullFileStream/justTen.str')
    .pipe(request.post(url + '/add'))
    .on('data', function (d) {
      lastMsg = d
    })
    .on('end', function () {
      t.looseEqual(JSON.parse(lastMsg.toString()), { event: 'finished' })
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should be able fail nicely with malformed query when categorizing', function (t) {
  t.plan(3)
  var q = {
    query: [{
      AND: {'*': ['reuter']}
    }]
  }
  q = JSON.stringify(q)
  request.get(url + '/categorize?q=' + q)
    .on('data', function (data) {
      t.equal(JSON.parse(data.toString()).message, 'you need to specify a category')
    })
    .on('error', function (error) {
      t.error(error)
    })
    .on('response', function (r) {
      t.equal(r.statusCode, 500)
      t.equal(r.statusMessage, 'Internal Server Error')
    })
})

test('should be able to categorize', function (t) {
  t.plan(14)
  var results = [
    { key: '*', value: 5 },
    { key: 'acq', value: 1 },
    { key: 'barley', value: 1 },
    { key: 'cocoa', value: 1 },
    { key: 'corn', value: 2 },
    { key: 'earn', value: 1 },
    { key: 'grain', value: 2 },
    { key: 'lin', value: 1 },
    { key: 'linseed', value: 1 },
    { key: 'oat', value: 1 }
  ]
  var q = {
    query: [{
      AND: {'*': ['reuter']}
    }],
    category: {
      field: 'topics'
    }
  }
  q = JSON.stringify(q)
  var i = 0
  request.get(url + '/categorize?q=' + q)
    .on('data', function (d) {
      i++
      var expected = results.shift()
      if (expected) t.looseEqual(JSON.parse(d.toString()), expected)
    })
    .on('error', function (e) {
      t.error(e)
    })
    .on('response', function (r) {
      t.equal(r.statusCode, 200)
      t.equal(r.statusMessage, 'OK')
    })
    .on('end', function () {
      t.equal(i, 19)
      t.equal(results.length, 0)
    })
})

test('should be able to get buckets', function (t) {
  t.plan(6)
  var results = [
    {
      field: 'topics',
      gte: 'barley',
      lte: 'barley',
      set: true,
      value: ['5']
    },
    {
      field: 'topics',
      gte: 'lin',
      lte: 'oat',
      set: true,
      value: ['5', '6']
    }
  ]
  var q = {
    query: [{
      AND: {
        '*': ['reuter']
      }
    }],
    buckets: [{
      field: 'topics',
      gte: 'barley',
      lte: 'barley',
      set: true
    }, {
      field: 'topics',
      gte: 'lin',
      lte: 'oat',
      set: true
    }]
  }
  q = JSON.stringify(q)
  var i = 0
  request.get(url + '/buckets?q=' + q)
    .on('data', function (d) {
      i++
      var expected = results.shift()
      if (expected) t.looseEqual(JSON.parse(d.toString()), expected)
    })
    .on('error', function (e) {
      t.error(e)
    })
    .on('response', function (r) {
      t.equal(r.statusCode, 200)
      t.equal(r.statusMessage, 'OK')
    })
    .on('end', function () {
      t.equal(results.length, 0)
      t.equal(i, 2)
    })
})

test('should be able to search and filter', function (t) {
  t.plan(5)
  var results = [ '5' ]
  var q = {
    query: [{
      AND: {
        '*': ['reuter'],
        topics: ['barley']
      }
    }]
  }
  q = JSON.stringify(q)
  var i = 0
  request.get(url + '/search?q=' + q)
    .on('data', function (d) {
      i++
      var expected = results.shift()
      if (expected) t.equal(JSON.parse(d.toString()).id, expected)
    })
    .on('error', function (e) {
      t.error(e)
    })
    .on('response', function (r) {
      t.equal(r.statusCode, 200)
      t.equal(r.statusMessage, 'OK')
    })
    .on('end', function () {
      t.equal(results.length, 0)
      t.equal(i, 1)
    })
})

test('should be able to match', function (t) {
  t.plan(12)
  var expectedMatches = [ 'loan',
                          'lower',
                          'loans',
                          'long',
                          'longer',
                          'lose',
                          'losses',
                          'lowered' ]
  var i = 0
  var mtch = { beginsWith: 'lo', threshold: 2 }
  request.get(url + '/matcher?q=' + JSON.stringify(mtch))
    .on('data', function (d) {
      i++
      var expected = expectedMatches.shift()
      if (expected) t.equal(d.toString().trim(), '"' + expected + '"')
    })
    .on('error', function (e) {
      t.error(e)
    })
    .on('response', function (r) {
      t.equal(r.statusCode, 200)
      t.equal(r.statusMessage, 'OK')
    })
    .on('end', function () {
      t.equal(expectedMatches.length, 0)
      t.equal(i, 8)
    })
})

test('can make a new norch with an existing instance of search-index', function (t) {
  t.plan(6)
  SearchIndex({
    indexPath: sandbox + 'norch-si-combined'
  }, function (err, thisSi) {
    t.error(err)
    Norch({
      si: thisSi,
      port: 6060
    }, function (err, norch) {
      combinedNorch = norch
      t.error(err)
      var s = new Readable({ objectMode: true })
      s.push('{"id": "boom", "title":"A really interesting document"}\n')
      s.push('{"id": "baam", "title":"Yet another really interesting document"}\n')
      s.push(null)
      var lastMsg
      s.pipe(request.post('http://localhost:6060/add'))
        .on('data', function (d) {
          lastMsg = d
        })
        .on('error', function (error) {
          t.error(error)
        })
        .on('end', function () {
          t.looseEqual(JSON.parse(lastMsg.toString()), { event: 'finished' })
          var i = 0
          request('http://localhost:6060/search')
            .on('data', function (data) {
              t.ok(true)
              i++
            })
            .on('error', function (error) {
              t.error(error)
            })
            .on('end', function (data) {
              t.equal(i, 2)
            })
        })
    })
  })
})

test('Can get documents by id', function (t) {
  t.plan(4)
  var i = 0
  const docID = JSON.stringify(['9', '3'])
  var expected = [ '9', '3' ]
  request(url + '/get?ids=' + docID)
    .on('data', function (data) {
      i++
      t.equal(JSON.parse(data.toString()).id, expected.shift())
    })
    .on('error', function (error) {
      t.error(error)
    })
    .on('end', function () {
      t.equal(i, 2)
      t.equal(expected.length, 0)
    })
})

test('Can delete document', function (t) {
  t.plan(1)
  const docID = JSON.stringify(['9', '3'])
  request.del(url + '/delete?ids=' + docID)
    .on('data', function (data) {
      t.equal(data.toString(), '"batch deleted"')
    })
    .on('error', function (error) {
      t.error(error)
    })
    .on('end', function () {

    })
})

test('Cannot get deleted documents', function (t) {
  t.plan(1)
  var i = 0
  const docID = JSON.stringify(['9', '3'])
  request(url + '/get?ids=' + docID)
    .on('data', function (data) {
      i++
    })
    .on('error', function (error) {
      t.error(error)
    })
    .on('end', function () {
      t.equal(i, 0)
    })
})

// TODO:
//    test for /cors
//    test for last update
//    test for concurrent indexing

test('teardown', function (t) {
  norch.close()
  norchReplicant.close()
  combinedNorch.close()
  t.end()
})
