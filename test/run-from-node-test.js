import test from 'tape'
import { Norch } from '../src/Norch.js'

const urlRoot = 'http://localhost:3030/API/'

const filename = process.env.SANDBOX + '/run-from-node-test'

test(filename, t => {
  t.end()
})

test('start a norch', async t => {
  const nrch = new Norch({
    name: filename
  })

  await new Promise(resolve =>
    nrch.events.on('ready', () => {
      t.ok('server is ready')
      resolve()
    })
  )

  await fetch(urlRoot + 'STATUS')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(
        ['READY', 'DOCUMENT_COUNT', 'CREATED', 'LAST_UPDATED'],
        Object.keys(json)
      )
    )
    .catch(t.error)

  await fetch(urlRoot + 'PUT', {
    method: 'POST',
    body: JSON.stringify([
      {
        _id: 'one',
        content: 'this is an interesting document'
      },
      {
        _id: 'two',
        content: 'this is a boring document'
      }
    ])
  })
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(json, [
        { _id: 'one', operation: 'PUT', status: 'CREATED' },
        { _id: 'two', operation: 'PUT', status: 'CREATED' }
      ])
    )
    .catch(t.error)

  await fetch(urlRoot + 'SEARCH?STRING=interesting document')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(json, {
        RESULT: [
          {
            _id: 'one',
            _match: [
              { FIELD: 'content', VALUE: 'document', SCORE: '1.00' },
              { FIELD: 'content', VALUE: 'interesting', SCORE: '1.00' }
            ],
            _score: 2.2
          }
        ],
        RESULT_LENGTH: 1,
        PAGING: { NUMBER: 0, SIZE: 20, TOTAL: 1, DOC_OFFSET: 0 }
      })
    )
    .catch(t.error)

  nrch.server.destroy()
})
