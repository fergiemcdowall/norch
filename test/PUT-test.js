import test from 'tape'
import { Norch } from '../src/Norch.js'
import { eng } from 'stopword'

const urlRoot = 'http://localhost:3030/API/'

const filename = process.env.SANDBOX + '/PUT-test'

test(filename, t => {
  t.end()
})

test('start a norch', async t => {
  const nrch = new Norch({
    name: filename,
    stopwords: eng,
    storeVectors: false
  })

  await new Promise(resolve =>
    nrch.events.on('ready', () => {
      t.ok('server is ready')
      resolve()
    })
  )

  await fetch(urlRoot + 'DOESNOTEXIST_EFEWIHOIEWHFOIW', {
    method: 'POST'
  })
    .then(res => t.equals(res.status, 404))
    .catch(t.error)

  await fetch(urlRoot + 'DOESNOTEXIST_SLDJSADOSA', {
    method: 'GET'
  })
    .then(res => t.equals(res.status, 404))
    .catch(t.error)

  await fetch(urlRoot + 'PUT', {
    method: 'POST',
    body: JSON.stringify('THIS IS DEFINITELY NOT JSON')
  })
    .then(res => {
      t.equals(res.status, 500)
      return res.json()
    })
    .then(json =>
      t.isEquivalent(json, {
        status: 500,
        error: 'TypeError: docs.map is not a function'
      })
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

  await fetch(urlRoot + 'EXPORT')
    .then(res => res.json())
    .then(async json => {
      t.isEquivalent(json.slice(0, -2), [
        { key: ['CREATED_WITH'], value: 'search-index@6.0.1' },
        { key: ['DOCUMENT_COUNT'], value: 2 },
        {
          key: ['DOC_RAW', 'one'],
          value: { _id: 'one', content: 'this is an interesting document' }
        },
        {
          key: ['DOC_RAW', 'two'],
          value: { _id: 'two', content: 'this is a boring document' }
        },
        { key: ['FIELD', 'content'], value: 'content' },
        { key: ['IDX', 'content', ['boring', '1.00']], value: ['two'] },
        {
          key: ['IDX', 'content', ['document', '1.00']],
          value: ['one', 'two']
        },
        { key: ['IDX', 'content', ['interesting', '1.00']], value: ['one'] }
      ])
    })
    .catch(t.error)

  await fetch(urlRoot + 'SEARCH?STRING=interesting document')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(json, {
        QUERY: { AND: ['interesting', 'document'] },
        OPTIONS: { SCORE: { TYPE: 'TFIDF' }, SORT: true, DOCUMENTS: true },
        RESULT_LENGTH: 1,
        RESULT: [
          {
            _id: 'one',
            _match: [
              { FIELD: 'content', VALUE: 'document', SCORE: '1.00' },
              { FIELD: 'content', VALUE: 'interesting', SCORE: '1.00' }
            ],
            _score: 2.2,
            _doc: { _id: 'one', content: 'this is an interesting document' }
          }
        ],
        PAGING: { NUMBER: 0, SIZE: 20, TOTAL: 1, DOC_OFFSET: 0 }
      })
    )
    .catch(t.error)

  nrch.server.destroy()
})
