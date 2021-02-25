const API = require('./API.js')
const fs = require('fs')
const http = require('http')
const mime = require('mime')
const path = require('path')
const querystring = require('querystring')
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

//create a server object:
si({ name: 'norch-data' }).then(index =>
  http.createServer((req, res) => {

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
        '/buckets': api.buckets,
        '/created': api.created,
        '/document-count': api.documentCount,
        '/documents/all': api.allDocuments,
        '/documents/query': api.query,
        '/get': api.get,  // not sure if this should be here...
        '/last-updated': api.lastUpdated,
        '/put': api.put
      })[pathname]

    }

    
    if (req.method == 'POST') {
      return routes({
        '/documents': api.put,
      })[pathname]
    }    
                    
                    // DELETE
                    // DICTIONARY
                    // DOCUMENTS
                    // DISTINCT
                    // EXPORT
                    // FACETS
                    // FIELDS
                    // IMPORT
                    // MAX
                    // MIN
                    // PUT
                    // PUT_RAW
                    
  }).listen(3030) //the server object listens on port 8080 
)
