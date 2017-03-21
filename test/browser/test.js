/* global fetch */

const test = require('tape')

test('general testiness', function (t) {
  t.plan(1)
  t.equals('bollocks', 'bollocks')
})

test('can add a doc', function (t) {
  t.plan(1)
  fetch('http://lvh.me:9999/add', {
    method: 'POST',
    body: '{"id": "one", "body": "this is a body"}\n',
    mode: 'cors'
  }).then(function (r) {
    t.ok(true, 'document added')
  }).catch(function (e) {
    t.error(e)
  })
})

// this probably shouldn't be needed? Maybe wait for a stream instead?
test('breather', function (t) {
  t.plan(1)
  setTimeout(function () {
    t.ok(true)
  }, 1000)
})

test('can search for a doc', function (t) {
  t.plan(3)
  fetch('http://lvh.me:9999/search?q="one"', {
    method: 'GET',
    mode: 'cors'
  }).then(function (r) {
    t.equal(r.status, 200)
    t.ok(true, 'document present in search')
    return r.json()
  }).then(function (doc) {
    t.equal(doc.id, 'one')
  }).catch(function (e) {
    t.error(e)
  })
})

test('teardown', function (t) {
  window.close()
  t.end()
})
