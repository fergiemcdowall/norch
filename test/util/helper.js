const fs = require('fs')

module.exports = ops => {
  const norch = require('../../src/main.js')
  const tmpDir = 'tmp/'

  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

  let url, norchInstance, port

  return {
    init: ops =>
      norch(Object.assign(ops, { norchHome: tmpDir + ops.norchHome })).then(
        ni => {
          ;(norchInstance = ni),
            (port = ops.port),
            (url = `http://localhost:${port}/`)
        }
      ),
    get: path =>
      fetch(`${url}${path}`)
        .then(res => res.json())
        .catch(e => e),
    PUT: body =>
      fetch(`${url}PUT`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(res => res.json()),
    close: () =>
      Promise.all([norchInstance.closeAllConnections(), norchInstance.close()])
  }
}
