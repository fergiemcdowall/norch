const test = require('tape')
const { init, get, PUT, close } = require('../util/helper.js')()

let norchInstance

const doc = {
  _id: 1,
  title: 'pretium',
  body: 'in congue etiam justo etiam pretium iaculis justo in hac habitasse platea dictumst etiam faucibus cursus urna ut tellus nulla ut erat id mauris vulputate elementum',
  year: 2010,
  tags: 'internet solution'
}

test('init', t => {
  t.plan(1)
  init({
    searchIndexOptions: '{}',
    port: 3031,
    norchHome: 'PUT_test'
  }).then(ni => {
    norchInstance = ni
    t.ok(true)
  })
})

test('is alive', t => {
  t.plan(1)
  get('STATUS').then(res => t.deepEqual(res.IS_ALIVE, true))
})

test('FLUSH', t => {
  t.plan(1)
  get('FLUSH').then(res => t.deepEqual(res, true))
})

test('can PUT', t => {
  t.plan(1)
  PUT([doc]).then(res =>
    t.deepEqual(res, [{ _id: doc._id, operation: 'PUT', status: 'CREATED' }])
  )
})

test('can PUT (update)', t => {
  t.plan(1)
  PUT([doc]).then(res =>
    t.deepEqual(res, [{ _id: 1, operation: 'PUT', status: 'UPDATED' }])
  )
})

test('ALL_DOCUMENTS', t => {
  t.plan(1)
  get('ALL_DOCUMENTS').then(res => t.deepEqual(res, [{ _id: 1, _doc: doc }]))
})

test('teardown', t => {
  close()
  t.end()
})
