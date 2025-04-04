import test from 'tape'
import { spawn } from 'child_process'
import figlet from 'figlet'

const filename = process.env.SANDBOX + '/general-test'
const urlRoot = 'http://localhost:3030/API/'

let proc

const delay = (t, v) => new Promise(resolve => setTimeout(resolve, t, v))

test(filename, t => {
  t.end()
})

test('start a norch', async t => {
  const tests = [
    data =>
      t.equal(
        data
          .toString()
          .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g, 'A_DATE'),
        `
   ${figlet
     .textSync('NORCH', { font: 'Isometric1', horizontalLayout: 'full' })
     .replace(/(?:\n)/g, '\n   ')}\x1B[1m1.0.0-rc2\x1B[0m

         (c) 2013-${new Date().getFullYear()} \x1b[1mFergus McDowall\x1b[0m

         index contains \x1b[1m0\x1b[0m documents
         created \x1b[1mA_DATE\x1b[0m
         last updated \x1b[1mA_DATE\x1b[0m
         listening on port \x1b[1m3030\x1b[0m
     \n`
      ),
    data => t.ok(/\[200\] \d+ms \/API\/STATUS\n/.test(data)),
    data => t.ok(/\[200\] \d+ms \/API\/PUT\n/.test(data)),
    data =>
      t.ok(
        /\[200\] \d+ms \/API\/SEARCH\?STRING=interesting%20document/.test(data)
      )
  ]

  t.plan(8)

  proc = spawn('./bin/norch', ['-n', filename])

  proc.stderr.on('data', e => t.error(e))

  proc.stdout.on('data', data => tests.shift()(data))

  proc.on('error', e => t.error(e))

  proc.on('close', e => t.ok('child_process closed'))

  // magical delay to give norch time to spin up...
  await delay(500)

  await fetch(urlRoot + 'STATUS')
    .then(res => res.json())
    .then(json => {
      return t.isEquivalent(Object.keys(json), [
        'VERSION',
        'READY',
        'DOCUMENT_COUNT',
        'CREATED',
        'LAST_UPDATED'
      ])
    })
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
    .then(json => {
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
    })
    .catch(t.error)

  proc.kill()
  // magical timing needed to wait for proc.kill()
  await delay(500)
})
