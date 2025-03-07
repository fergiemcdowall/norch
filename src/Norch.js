import EventEmitter from 'events'
import enableDestroy from 'server-destroy'
import mime from 'mime' // commonjs module: can't do named export for 'getType'
import { API } from './API.js'
import { SearchIndex } from 'search-index'
import { createServer } from 'node:http'
import { fileURLToPath } from 'url'
import { createReadStream, readdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'path'
import figlet from 'figlet'

export class Norch {
  constructor(ops = {}) {
    const defaultConfigFile = JSON.parse(
      readFileSync(new URL('../defaultConfig.json', import.meta.url))
    )
    const userConfigFile = this.readUserConfigFile(ops.configFile)
    this.options = Object.assign(defaultConfigFile, ops, userConfigFile)
    this.index = new SearchIndex(this.options)
    this.events = new EventEmitter()
    this.index.EVENTS.on('ready', () => {
      this.splash(this.index, this.options.port)
        .then(() =>
          this.createNorchServer(
            new API(
              this.index,
              this.sendResponse,
              this.events,
              this.logResponse
            )
          )
        )
        .then(server => {
          server.listen(this.options.port)
          enableDestroy(server)
          this.server = server
          this.events.emit('ready')
        })
    })
  }

  // logResponse = (statusCode, path) =>
  //   console.info('[' + statusCode + '] ' + path)

  logResponse = (statusCode, path, reqTimestamp) =>
    console.info(
      '[' + statusCode + '] ' + (Date.now() - reqTimestamp) + 'ms ' + path
    )

  readUserConfigFile = location => {
    // if no user config defined, simply return an empty object
    if (!location) return {}
    try {
      return JSON.parse(readFileSync(location, 'utf8'))
    } catch (e) {
      throw new Error(e)
    }
  }

  splash = (index, port) =>
    Promise.all([
      index.LAST_UPDATED(),
      index.CREATED(),
      index.DOCUMENT_COUNT()
    ]).then(res =>
      console.info(
        `
   ${figlet
     .textSync('NORCH', { font: 'Isometric1', horizontalLayout: 'full' })
     .replace(/(?:\n)/g, '\n   ')}\x1b[1m${
          process.env.npm_package_version
        }\x1b[0m

         (c) 2013-${new Date(
           res[0]
         ).getFullYear()} \x1b[1mFergus McDowall\x1b[0m

         index contains \x1b[1m${res[2]}\x1b[0m documents
         created \x1b[1m${res[1]}\x1b[0m
         last updated \x1b[1m${res[0]}\x1b[0m
         listening on port \x1b[1m${port}\x1b[0m
     `
      )
    )

  sendResponse = (body, res, type) => {
    res.setHeader('Content-Type', type)
    res.writeHead(200)
    res.end(body)
  }

  createNorchServer = api =>
    createServer((req, res) => {
      req.timestamp = Date.now()

      // strip hostname, protocol, url-params, etc
      let pathname = new URL(req.url, `http://${req.headers.host}/`).pathname
      // Serve up API requests
      if (pathname.split('/')[1] === 'API') {
        return api[pathname.split('/')[2]]
          ? api[pathname.split('/')[2]](req, res)
          : this._404(res, pathname)
      }

      // serve up file requests (default to index.html when only file-directory
      // is specified)
      if (/^\/.*\/$|^\/$/.test(pathname)) pathname += 'index.html'
      return this.sendFileResponse(pathname, res)
    })

  files = dirs => {
    const getFilesInDir = name =>
      readdirSync('www_root' + name, {
        withFileTypes: true
      })
        .filter(dirent => dirent.isFile())
        .map(f => name + f.name)
    return dirs.map(d => getFilesInDir(d)).flat()
  }

  sendFileResponse = (pathname, res) => {
    const s = createReadStream(
      resolve(dirname(fileURLToPath(import.meta.url)), '../www_root' + pathname)
    )
    s.on('open', () => {
      res.setHeader('Content-Type', mime.getType(pathname))
      s.pipe(res)
      console.info('[200] ' + pathname)
    })
    s.on('error', e => {
      // TODO: codes other than 404 here.
      this._404(res, pathname)
    })
  }

  // ("404: page not found")
  _404 = (res, pathname) => {
    console.info('[404] ' + pathname)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.writeHead(404)
    res.end('<html><h1>404</h1>nothing here bro!</html>')
  }
}
