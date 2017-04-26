const fs = require('fs')
const request = require('request')
const sandbox = './test/sandbox/'
const test = require('tape')
const Readable = require('stream').Readable
const Norch = require('../')
const sw = require('stopword')

const url = 'http://localhost:3033'

var norch

test('should initialize a norch server', function (t) {
  t.plan(1)
  Norch({
    norchHome: sandbox + 'classify-test',
    siOptions: {
      stopwords: sw.en,
      nGramLength: { gte: 1, lte: 3 }
    },
    port: 3033
  }, function (err, thisNorch) {
    norch = thisNorch
    t.error(err)
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

test('should be able to search', function (t) {
  t.plan(12)
  request(url + '/search?q="reuter"', function (err, res, body) {
    t.error(err)
    t.equal(res.statusCode, 200)
  })
    .on('data', function (d) {
      t.ok(true)
    })
    .on('error', function (error) {
      t.error(error)
    })
})

test('should classify some text', function (t) {
  t.plan(3)
  var results = [
    {
      'token': 'reuter', 'documents': ['1', '10', '2', '3', '4', '5', '6', '7', '8', '9']
    },
    {
      'token': 'marathon', 'documents': ['8']
    }
  ]
  var text = 'this is some interesting text that is about reuter and also some marathon'
    .split(' ')
  var textStream = new Readable()
  text.forEach(function (token) { textStream.push(token + '\n') })
  textStream.push(null)
  textStream
    .pipe(request.post(url + '/classify'))
    .on('data', function (data) {
      t.looseEqual(JSON.parse(data.toString()), results.shift())
    })
    .on('error', function (err) {
      t.error(err)
    })
    .on('end', function () {
      t.equal(results.length, 0)
    })
})

test('should classify some text with ngrams', function (t) {
  t.plan(4)
  var results = [
    {'token': 'reuter', 'documents': ['1', '10', '2', '3', '4', '5', '6', '7', '8', '9']},
    {'token': 'marathon', 'documents': ['8']},
    {'token': 'marathon oil', 'documents': ['8']},
    {'token': 'oil', 'documents': ['2', '6', '8']}
  ]
  var text = 'this is some interesting text that is about reuter and also some marathon oil and some other stuff'
    .split(' ')
  var textStream = new Readable()
  text.forEach(function (token) { textStream.push(token + '\n') })
  textStream.push(null)
  textStream
    .pipe(request.post(url + '/classify?maxNGramLength=2'))
    .on('data', function (data) {
      t.looseEqual(results.shift(), JSON.parse(data.toString()))
    })
})

test('teardown', function (t) {
  norch.close()
  t.end()
})

