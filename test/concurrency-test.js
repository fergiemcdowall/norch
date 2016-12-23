const Norch = require('../')
const num = require('written-number')
const request = require('request')
const sandbox = 'test/sandbox/'
const test = require('tape')
const totalDocs = 10

var norch

test('should initialize a norch server', function (t) {
  t.plan(1)
  Norch({
    norchHome: sandbox + 'norch-concurrency-test'
  }, function (err, thisNorch) {
    norch = thisNorch
    t.error(err)
  })
})

test('should post and index data concurrently', function (t) {
  t.plan(totalDocs)
  for (var i = 1; i <= totalDocs; i++) {
    var writtenNum = num(i)
    var doc = {
      id: writtenNum,
      body: 'this is the wonderfully fabulous doc number ' + writtenNum
    }
    request({
      headers: 'Content-Type: application/json',
      url: 'http://localhost:3030/concurrentAdd',
      method: 'POST',
      json: doc
    }, function (err, res, body) {
      t.error(err)
    })
  }
})

test('examine TF￮*￮*', function (t) {
  t.plan(2)
  norch.options.si.options.indexes.get('TF￮*￮*', function (err, data) {
    t.error(err)
    t.equal(data.length, totalDocs)
  })
})

test('examine DF￮*￮*', function (t) {
  t.plan(2)
  norch.options.si.options.indexes.get('DF￮*￮*', function (err, data) {
    t.error(err)
    t.equal(data.length, totalDocs)
  })
})

test('teardown', function (t) {
  norch.close()
  t.end()
})
