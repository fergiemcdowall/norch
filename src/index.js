// TODO: handle POST requests

const http = require('http')
const url = require('url')
const si = require('search-index')

// init data store
const db = si({ name: 'norch-data' })

const search = (req, res) => {
  const q = new URLSearchParams(url.parse(req.url).search).get('q')
  db.SEARCH(q).then((result) => {
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.write(JSON.stringify(result, null, 2))
    res.end()
  }).catch(e => {
    res.writeHead(500, {'Content-Type': 'text/plain'})
    res.write(e.toString())
    res.end()
  })
}

// curl --header "Content-Type: application/json" --request POST --data '{"username":"xyz","password":"xyz"}' http://localhost:4444/add
const add = (req, res) => {
  var data = []
  req.on('data', chunk => data.push(chunk))
  req.on('end', () => {
    res.writeHead(200, {'Content-Type': 'text/plain'})
    db.PUT(JSON.parse(data.join(''))).then(() => res.end())
  })
}

// hanlde router using a PROXY
const router = new Proxy({
  '/add': add,
  '/search': search
}, {
  get: (target, name) => name in target ? target[name] : (req, res) => {
    // if object does not contain key then do this ->
    res.writeHead(404, {'Content-Type': 'text/plain'})
    res.write('NOT FOUND!')
    res.end()
  }
})

const run = options => {
  http.createServer((req, res) => {
    // TODO: possible lock function that waits for the data store to open
    console.log('[' + new Date().toUTCString() + '] ' + url.parse(req.url).path)
    router[url.parse(req.url).pathname](req, res)
  }).listen(3030)
}

module.exports = run
