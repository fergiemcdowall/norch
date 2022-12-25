const enableDestroy = require('server-destroy')
const filename = process.env.SANDBOX + '/' + __filename.split('/').pop()
const fs = require('fs/promises')
const norch = require('../')
const sw = require('stopword')
const test = require('tape')

test(__filename, t => {
  t.end()
})

test('start a norch PUT and EXPORT contents', async t => {
  const nrch = await norch({
    index: filename,
    stopwords: sw.eng
  })

  enableDestroy(nrch)

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

  await fetch('http://localhost:3030/EXPORT')
    .then(res => res.json())
    .then(async json => {
      t.isEquivalent(json.slice(0, -2), [
        { key: ['CREATED_WITH'], value: 'search-index@3.3.0' },
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
    .then(json => fs.writeFile(filename + '-export.json', JSON.stringify(json)))
    .catch(t.error)

  nrch.destroy()
})

test('start another norch and IMPORT', async t => {
  const nrch = await norch({
    index: filename + '-2',
    port: 3031,
    stopwords: sw.eng
  })

  enableDestroy(nrch)

  await fetch('http://localhost:3030/SEARCH?STRING=interesting document').catch(
    () => t.pass('correct- this index is no longer available')
  )

  await fetch('http://localhost:3031/SEARCH?STRING=interesting document')
    .then(res => res.json())
    .then(json =>
      t.isEquivalent(
        {
          RESULT: [],
          RESULT_LENGTH: 0
        },
        json
      )
    )
    .catch(t.error)

  await fetch('http://localhost:3031/IMPORT', {
    method: 'POST',
    body: await fs.readFile(filename + '-export.json')
  })

  await fetch('http://localhost:3031/SEARCH?STRING=interesting document')
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

  nrch.destroy()
})
