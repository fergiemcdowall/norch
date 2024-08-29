import test from 'tape'
import { spawn } from 'child_process'

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
        `\n         ___           ___           ___           ___           ___\n        /\\__\\         /\\  \\         /\\  \\         /\\  \\         /\\__\\\n       /::|  |       /::\\  \\       /::\\  \\       /::\\  \\       /:/  /\n      /:|:|  |      /:/\\:\\  \\     /:/\\:\\  \\     /:/\\:\\  \\     /:/__/\n     /:/|:|  |__   /:/  \\:\\  \\   /::\\~\\:\\  \\   /:/  \\:\\  \\   /::\\  \\ ___\n    /:/ |:| /\\__\\ /:/__/ \\:\\__\\ /:/\\:\\ \\:\\__\\ /:/__/ \\:\\__\\ /:/\\:\\  /\\__\\\n    \\/__|:|/:/  / \\:\\  \\ /:/  / \\/_|::\\/:/  / \\:\\  \\  \\/__/ \\/__\\:\\/:/  /\n        |:/:/  /   \\:\\  /:/  /     |:|::/  /   \\:\\  \\            \\::/  /\n        |::/  /     \\:\\/:/  /      |:|\\/__/     \\:\\  \\           /:/  /\n        /:/  /       \\::/  /       |:|  |        \\:\\__\\         /:/  /\n        \\/__/         \\/__/         \\|__|         \\/__/         \\/__/\n\n         (c) 2013-2024 \x1B[1mFergus McDowall\x1B[0m\n\n         index contains \x1B[1m0\x1B[0m documents\n         created \x1B[1mA_DATE\x1B[0m\n         last updated \x1B[1mA_DATE\x1B[0m\n         listening on port \x1B[1m3030\x1B[0m\n     \n`
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
