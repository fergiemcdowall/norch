const API = require('./API.js')
const fs = require('fs')
const http = require('http')
const mime = require('mime')
const path = require('path')
const si = require('search-index')
const url = require('url')


// ("404: page not found")
const _404 = (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.writeHead(404)
  res.end('<html>nothing here bro!</html>')
}

const files = dirs => {
  const getFilesInDir = name => fs.readdirSync(
    '/Users/fergie/projects/norch/www_root' + name, {
      withFileTypes: true
    }
  ).filter(dirent => dirent.isFile()).map(f => name + f.name)
  return dirs.map(d => getFilesInDir(d)).flat()
}

const sendFileResponse = (name, res) => sendResponse(
  fs.readFileSync(path.resolve(__dirname + '/../www_root' + name)) + '',
  res,
  mime.getType(name)
)

const sendResponse = (body, res, type) => {
  res.setHeader("Content-Type", type + '; charset=utf-8')
  res.writeHead(200)
  res.end(body)
}


const createServer = index => http.createServer((req, res) => {

  // TODO: req/res should probably go here
  const api = API(index, sendResponse)
  const pathname = url.parse(req.url).pathname
  console.log(req.method)
  console.log(pathname)
  
  const routes = routes => new Proxy(routes, {
    get (target, property) {
      return target[property]
        ? target[property](req, res)
        : _404(req, res)
    }
  })
  
  if (req.method == 'GET') {      
    const fileDirs = [ '/', '/openapi/' ]

    // Files
    if (files(fileDirs).includes(pathname))
      return sendFileResponse(pathname, res)

    // Files (default to index.html when only directory is specified)
    if (fileDirs.includes(pathname))
      return sendFileResponse(pathname + 'index.html', res)

    return routes({
      '/aggregate/buckets': api.buckets,
      '/aggregate/facets': api.facets,
      '/documents': api.documents,
      '/documents/all': api.allDocuments,
      '/documents/count': api.documentCount,
      '/documents/query': api.query,
      '/meta/created': api.created,
      '/meta/fields': api.fields,
      '/meta/last-updated': api.lastUpdated,
      '/replicate': api.replicate,
      '/values/dictionary': api.dictionary,
      '/values/distinct': api.distinct,
      '/values/max': api.max,
      '/values/min': api.min,

      '/get': api.get,  // not sure if this should be here...
    })[pathname]

  }
  
  if (req.method == 'POST') {
    console.log('in POST ' + pathname)
    return routes({
      '/documents': api.put,
      '/documents/raw': api.putRaw,
      '/replicate': api.imprt,
    })[pathname]
  }

  if (req.method == 'DELETE') {
    return routes({
      '/documents': api.del,
      '/documents/flush': api.flush,
    })[pathname]
  }

})

//create a server object:
module.exports = ops => si({
  ...JSON.parse(ops.searchIndexOptions),
  name: ops.norchHome,
  storeVectors: true
}).then(createServer)
  .then(server => server.listen(ops.port))
