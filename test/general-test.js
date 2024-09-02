import test from 'tape'
import { spawn } from 'child_process'
import figlet from 'figlet'

const filename = process.env.SANDBOX + '/general-test'

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
     .replace(/(?:\n)/g, '\n   ')}

         (c) 2013-${new Date().getFullYear()} \x1b[1mFergus McDowall\x1b[0m

         index contains \x1b[1m0\x1b[0m documents
         created \x1b[1mA_DATE\x1b[0m
         last updated \x1b[1mA_DATE\x1b[0m
         listening on port \x1b[1m3030\x1b[0m
     \n`
      ),
    data => t.equal(data.toString(), '/STATUS\n'),
    data => t.equal(data.toString(), '/PUT\n'),
    data => t.equal(data.toString(), '/SEARCH\n')
  ]

  t.plan(8)

  proc = spawn('./bin/norch', ['-n', filename])

  proc.stderr.on('data', e => t.error(e))

  proc.stdout.on('data', data => tests.shift()(data))

  proc.on('error', e => t.error(e))

  proc.on('close', e => t.ok('child_process closed'))

  // magical delay to give norch time to spin up...
  await delay(500)

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
          RESULT_LENGTH: 1,
          PAGING: { NUMBER: 0, SIZE: 20, TOTAL: 1, DOC_OFFSET: 0 }
        },
        json
      )
    )
    .catch(t.error)

  proc.kill()
  // magical timing needed to wait for proc.kill()
  await delay(500)
})
