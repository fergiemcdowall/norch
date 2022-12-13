const test = require('tape')
const { spawn } = require('child_process')

let proc

const delay = (t, v) => new Promise(resolve => setTimeout(resolve, t, v))

test('start a norch', async t => {
  const tests = [
    data =>
      t.equal(
        data
          .toString()
          .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g, 'A_DATE'),
        `\n      ___           ___           ___           ___           ___      \n     /\\__\\         /\\  \\         /\\  \\         /\\  \\         /\\__\\     \n    /::|  |       /::\\  \\       /::\\  \\       /::\\  \\       /:/  /     \n   /:|:|  |      /:/\\:\\  \\     /:/\\:\\  \\     /:/\\:\\  \\     /:/__/      \n  /:/|:|  |__   /:/  \\:\\  \\   /::\\~\\:\\  \\   /:/  \\:\\  \\   /::\\  \\ ___  \n /:/ |:| /\\__\\ /:/__/ \\:\\__\\ /:/\\:\\ \\:\\__\\ /:/__/ \\:\\__\\ /:/\\:\\  /\\__\\ \n \\/__|:|/:/  / \\:\\  \\ /:/  / \\/_|::\\/:/  / \\:\\  \\  \\/__/ \\/__\\:\\/:/  / \n     |:/:/  /   \\:\\  /:/  /     |:|::/  /   \\:\\  \\            \\::/  /  \n     |::/  /     \\:\\/:/  /      |:|\\/__/     \\:\\  \\           /:/  /   \n     /:/  /       \\::/  /       |:|  |        \\:\\__\\         /:/  /    \n     \\/__/         \\/__/         \\|__|         \\/__/         \\/__/   \n\n      (c) 2013-2021 \x1B[1mFergus McDowall\x1B[0m\n\n      index contains \x1B[1m0\x1B[0m documents\n      created A_DATE\n      last updated A_DATE\n\n  \n`
      ),
    data => {
      t.equal(data.toString(), '/STATUS\n')
    },
    data => {
      t.equal(data.toString(), '/PUT\n')
    },
    data => {
      t.equal(data.toString(), '/SEARCH\n')
    }
  ]

  t.plan(7)

  proc = spawn('./bin/norch', [
    '-d',
    process.env.SANDBOX + '/' + __filename.split('/').pop()
  ])

  proc.stderr.on('data', e => {
    t.error(e)
  })

  proc.on('error', e => {
    t.error(e)
  })

  proc.stdout.on('data', data => {
    tests.shift()(data)
  })

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
          RESULT_LENGTH: 1
        },
        json
      )
    )
    .catch(t.error)
})

test('teardown', t => {
  t.plan(1)
  proc.kill()
  t.ok(true)
})
