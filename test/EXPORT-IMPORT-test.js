import sw from 'stopword'
import test from 'tape'
import { Norch } from '../src/Norch.js'
import { writeFile, readFile } from 'fs/promises'

const urlRoot1 = 'http://localhost:3030/API/'
const urlRoot2 = 'http://localhost:3031/API/'

const filename = process.env.SANDBOX + '/IMPORT-EXPORT-test'

test(filename, t => {
  t.end()
})

test('start a norch PUT and EXPORT contents', async t => {
  const nrch = new Norch({
    name: filename,
    stopwords: sw.eng,
    storeVectors: false
  })

  await new Promise(resolve =>
    nrch.events.on('ready', () => {
      t.ok('server is ready')
      resolve()
    })
  )

  await fetch(urlRoot1 + 'PUT', {
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

  await fetch(urlRoot1 + 'SEARCH?STRING=interesting document')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(json, {
        PAGING: { NUMBER: 0, SIZE: 20, TOTAL: 1, DOC_OFFSET: 0 },
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
      })
    )
    .catch(t.error)

  await fetch(urlRoot1 + 'EXPORT')
    .then(res => res.json())
    .then(async json => {
      t.isEquivalent(json.slice(0, -2), [
        { key: ['CREATED_WITH'], value: 'search-index@5.1.3' },
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

      return json
    })
    .then(json => writeFile(filename + '-export.json', JSON.stringify(json)))
    .catch(t.error)

  nrch.server.destroy()
})

test('start another norch and IMPORT', async t => {
  const nrch = new Norch({
    name: filename + '-2',
    port: 3031,
    stopwords: sw.eng
  })

  await new Promise(resolve =>
    nrch.events.on('ready', () => {
      t.ok('server is ready')
      resolve()
    })
  )

  await fetch(urlRoot1 + 'SEARCH?STRING=interesting document').catch(() =>
    t.pass('correct- this index is no longer available')
  )

  await fetch(urlRoot2 + 'SEARCH?STRING=interesting document')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(json, {
        RESULT: [],
        RESULT_LENGTH: 0,
        PAGING: { NUMBER: 0, SIZE: 20, TOTAL: 0, DOC_OFFSET: 0 }
      })
    )
    .catch(t.error)

  await fetch(urlRoot2 + 'IMPORT', {
    method: 'POST',
    body: await readFile(filename + '-export.json')
  })
    .then(res => {
      if (!res.ok) t.error('fetch failed')
    })
    .catch(t.error)

  await fetch('http://localhost:3031/API/SEARCH?STRING=interesting document')
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
