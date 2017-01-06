const Norch = require('../')
const lpad = require('left-pad')
const request = require('request')
const sandbox = 'test/sandbox/'
const test = require('tape')
const wnum = require('written-number')

var norch

test('should initialize a norch server', function (t) {
  t.plan(1)
  Norch({
    norchHome: sandbox + 'norch-offset-test'
  }, function (err, thisNorch) {
    norch = thisNorch
    t.error(err)
  })
})

test('concurrently index docs using concurrentAdd', t => {
  t.plan(200)
  for (var i = 1; i <= 100; i++) {
    request.post({
      url: 'http://localhost:3030/concurrentAdd',
      json: true,
      body: {
        id: lpad(i, 3, 0),
        body: 'this is the wonderfully fabulous doc number ' + wnum(i)
      }
    }, (e, r, body) => {
      t.error(e)
      t.equals(r.statusCode, 200)
    })
  }
})

test('search', t => {
  t.plan(2)
  var i = 0
  request('http://localhost:3030/search?q="number"')
    .on('data', hit => {
      hit = JSON.parse(hit.toString())
      if (i === 0) t.equal(hit.id, '100')
      i++
    })
    .on('end', () => {
      t.equal(i, 20)
    })
    .on('error', e => {
      t.fail(e)
    })
})

test('search with offset', t => {
  t.plan(2)
  var i = 0
  var q = {
    query: [{
      AND: {
        body: ['number']
      }
    }],
    offset: 15
  }
  request('http://localhost:3030/search?q=' + JSON.stringify(q))
    .on('data', hit => {
      hit = JSON.parse(hit.toString())
      if (i === 0) t.equal(hit.id, '085')
      i++
    })
    .on('end', () => {
      t.equal(i, 20)
    })
    .on('error', e => {
      t.fail(e)
    })
})

test('search with offset and pagesize', t => {
  t.plan(2)
  var i = 0
  var q = {
    query: [{
      AND: {
        body: ['number']
      }
    }],
    offset: 50,
    pageSize: 7
  }
  request('http://localhost:3030/search?q=' + JSON.stringify(q))
    .on('data', hit => {
      hit = JSON.parse(hit.toString())
      if (i === 0) t.equal(hit.id, '050')
      i++
    })
    .on('end', () => {
      t.equal(i, 7)
    })
    .on('error', e => {
      t.fail(e)
    })
})

test('search with offset and pagesize as per bug #126', t => {
  t.plan(2)
  var i = 0
  var q = {
    query: [{
      AND: {
        body: ['number']
      }
    }],
    offset: 3,
    pageSize: 1
  }
  request('http://localhost:3030/search?q=' + JSON.stringify(q))
    .on('data', hit => {
      hit = JSON.parse(hit.toString())
      console.log(hit.id)
      if (i === 0) t.equal(hit.id, '097')
      i++
    })
    .on('end', () => {
      t.equal(i, 1)
    })
    .on('error', e => {
      t.fail(e)
    })
})

test('teardown', function (t) {
  norch.close()
  t.end()
})
