const fs = require('fs')
const http = require('http')
const mime = require('mime')
const path = require('path')
const querystring = require('querystring')
const si = require('search-index')
const url = require('url')


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


const params = _url => url.parse(_url, {
  parseQueryString: true
}).query

const allDocuments = (req, res, index) => index.ALL_DOCUMENTS(
  +params(req.url).limit || undefined
).then(ad => sendJSONResponse(ad, res))

const buckets = (req, res, index) => index.BUCKETS(
  ...JSON.parse(params(req.url).q)
).then(b => sendJSONResponse(b, res))

const documentCount = (req, res, index) => index.DOCUMENT_COUNT().then(
  td => sendResponse(td + '', res, 'text/plain')
)

const created = (req, res, index) => index.CREATED().then(
  c => sendResponse(c + '', res, 'text/plain')
)

const lastUpdated = (req, res, index) => index.LAST_UPDATED().then(
  lu => sendResponse(lu + '', res, 'text/plain')
)

const query = (req, res, index) => index.QUERY(
  params(req.url).q,
  JSON.parse(params(req.url).ops)
).then(r => sendJSONResponse(r, res))

// default ("page not found?")
const def = (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.writeHead(404)
  res.end('<html>nothing here bro!</html>')
}


const sendResponse = (body, res, type) => {
  res.setHeader("Content-Type", type + '; charset=utf-8')
  res.writeHead(200)
  res.end(body)
}

const sendFileResponse = (name, res) => sendResponse(
  fs.readFileSync(path.resolve(__dirname + '/../www_root' + name)) + '',
  res,
  mime.getType(name)
)

const files = dirs => {
  const getFilesInDir = name => fs.readdirSync(
    '/Users/fergie/projects/norch/www_root' + name, {
      withFileTypes: true
    }
  ).filter(dirent => dirent.isFile()).map(f => name + f.name)
  return dirs.map(d => getFilesInDir(d)).flat()
}

//create a server object:
si({ name: 'norch-data' }).then(index =>
  http.createServer((req, res) => {

    const fileDirs = [ '/', '/openapi/' ]
    const pathname = url.parse(req.url).pathname
    
    // Files
    if (files(fileDirs).includes(pathname)) return sendFileResponse(pathname, res)

    // Files (default to index.html when only directory is specified)
    if (fileDirs.includes(pathname)) return sendFileResponse(pathname + 'index.html', res)
 
    // API endpoints
    if (pathname == '/all_documents') return allDocuments(req, res, index)
    if (pathname == '/buckets') return buckets(req, res, index)
    if (pathname == '/created') return created(req, res, index)
    if (pathname == '/document-count') return documentCount(req, res, index)
    if (pathname == '/get') return get(req, res)
    if (pathname == '/last-updated') return lastUpdated(req, res, index)
    if (pathname == '/query') return query(req, res, index)
    if (pathname == '/put') return put(req, res, index)



// ALL_DOCUMENTS
// BUCKETS
// DELETE
// CREATED
// DICTIONARY
// DOCUMENTS
// DISTINCT
// DOCUMENT_COUNT
// EXPORT
// FACETS
// FIELDS
// IMPORT
// INDEX
// MAX
// MIN
// PUT
// PUT_RAW
    
    return def(req, res)
  }).listen(3030) //the server object listens on port 8080 
)
