const API = require('./API.js')
const fs = require('fs')
const http = require('http')
const mime = require('mime')
const path = require('path')
const si = require('search-index')

// ("404: page not found")
const _404 = (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.writeHead(404)
  res.end('<html><h1>404</h1>nothing here bro!</html>')
}

const files = dirs => {
  const getFilesInDir = name =>
    fs
      .readdirSync('/Users/fergie/projects/norch/www_root' + name, {
        withFileTypes: true
      })
      .filter(dirent => dirent.isFile())
      .map(f => name + f.name)
  return dirs.map(d => getFilesInDir(d)).flat()
}

const sendFileResponse = (name, res) =>
  sendResponse(
    fs.readFileSync(path.resolve(__dirname, '../www_root' + name)) + '',
    res,
    mime.getType(name)
  )

const sendResponse = (body, res, type) => {
  res.setHeader('Content-Type', type + '; charset=utf-8')
  res.writeHead(200)
  res.end(body)
}

const createServer = index =>
  http.createServer((req, res) => {
    const api = API(index, sendResponse)
    let pathname = new URL(req.url, `http://${req.headers.host}/`).pathname
    console.info(pathname)

    if (req.method === 'GET') {
      const fileDirs = ['/']

      // default to index.html when only file-directory is specified
      if (fileDirs.includes(pathname)) pathname += 'index.html'

      // Serve up static files files
      if (files(fileDirs).includes(pathname)) {
        return sendFileResponse(pathname, res)
      }
    }

    return api[pathname.slice(1)]
      ? api[pathname.slice(1)](req, res)
      : _404(req, res)
  })

const splash = index =>
  Promise.all([
    index.LAST_UPDATED(),
    index.CREATED(),
    index.DOCUMENT_COUNT()
  ]).then(res => {
    console.log(
      `
      ___           ___           ___           ___           ___      
     /\\__\\         /\\  \\         /\\  \\         /\\  \\         /\\__\\     
    /::|  |       /::\\  \\       /::\\  \\       /::\\  \\       /:/  /     
   /:|:|  |      /:/\\:\\  \\     /:/\\:\\  \\     /:/\\:\\  \\     /:/__/      
  /:/|:|  |__   /:/  \\:\\  \\   /::\\~\\:\\  \\   /:/  \\:\\  \\   /::\\  \\ ___  
 /:/ |:| /\\__\\ /:/__/ \\:\\__\\ /:/\\:\\ \\:\\__\\ /:/__/ \\:\\__\\ /:/\\:\\  /\\__\\ 
 \\/__|:|/:/  / \\:\\  \\ /:/  / \\/_|::\\/:/  / \\:\\  \\  \\/__/ \\/__\\:\\/:/  / 
     |:/:/  /   \\:\\  /:/  /     |:|::/  /   \\:\\  \\            \\::/  /  
     |::/  /     \\:\\/:/  /      |:|\\/__/     \\:\\  \\           /:/  /   
     /:/  /       \\::/  /       |:|  |        \\:\\__\\         /:/  /    
     \\/__/         \\/__/         \\|__|         \\/__/         \\/__/   

      (c) 2013-2021 \x1b[1mFergus McDowall\x1b[0m

      index contains \x1b[1m${res[2]}\x1b[0m documents
      created ${new Date(res[1]).toISOString()}
      last updated ${new Date(res[0]).toISOString()}

  `
    )
    return index
  })

// create a server object:
module.exports = ops =>
  si({
    ...JSON.parse(ops.searchIndexOptions),
    name: ops.data,
    storeVectors: true
  })
    .then(splash)
    .then(createServer)
    .then(server => {
      server.listen(ops.port)
      return server
    })
