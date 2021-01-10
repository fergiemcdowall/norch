const fs = require('fs')
const http = require('http')
const querystring = require('querystring')
const si = require('search-index')
const url = require('url')


const sendJSONResponse = (_JSON, res) => {
  res.setHeader("Content-Type", "application/json")
  res.writeHead(200)
  res.end(JSON.stringify(_JSON, null, 2))
}

const sendHTMLResponse = (HTML, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.writeHead(200)
  res.end(HTML)
}

const sendTextResponse = (text, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.writeHead(200)
  res.end(text + '')
}

const root = (req, res) => sendHTMLResponse(
  fs.readFileSync(__dirname + '/index.html'), res
)

// curl -H "Content-Type: application/json" --data @testdata.json http://localhost:8081/put
// if ?form=[fieldName] then read from that form field
const put = (req, res, index) => {
  const formField = url.parse(req.url, {
    parseQueryString: true
  }).query.form
  var body = ""
  req.on('data', d => body += d.toString())
  req.on('end', () => index.PUT(JSON.parse(
    formField
      ? querystring.decode(body)[formField]
      : body
  )).then(idxRes => {
    sendJSONResponse(idxRes, res)
  }))
}

const get = (req, res) => res.end('This is GET yo!')

const documentCount = (req, res, index) =>
      index.DOCUMENT_COUNT().then(td => sendTextResponse(td, res))

// default ("page not found?")
const def = (req, res) => {
  res.write('This is DEFAULT yo!')
  res.end()
}

//create a server object:
si({ name: 'norch-data' }).then(index =>
  http.createServer((req, res) => {
    const _url = url.parse(req.url)
    if (_url.pathname == '/') return root(req, res)
    if (_url.pathname == '/put') return put(req, res, index)
    if (_url.pathname == '/document-count') return documentCount(req, res, index)
    if (_url.pathname == '/get') return get(req, res)
    return def(req, res)
  }).listen(8081) //the server object listens on port 8080 
)
