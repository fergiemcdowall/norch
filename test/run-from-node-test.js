const test = require('tape')
const norch = require('../')

let proc

const delay = (t, v) => new Promise(resolve => setTimeout(resolve, t, v))

test('start a norch', async t => {
  t.plan(3)

  await norch({
    data: process.env.SANDBOX + '/' + __filename.split('/').pop()
  })

  await delay(1000)

  await fetch('http://localhost:3030/STATUS')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(
        ['IS_ALIVE', 'DOCUMENT_COUNT', 'CREATED', 'LAST_UPDATED'],
        Object.keys(json)
      )
    )
    .catch(t.error)

  await fetch('http://localhost:3030/PUT', {
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

  await fetch('http://localhost:3030/SEARCH?STRING=interesting document')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(
        {
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
          RESULT_LENGTH: 1
        },
        json
      )
    )
    .catch(t.error)
})
