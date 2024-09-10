import EventEmitter from 'events'
import enableDestroy from 'server-destroy'
import mime from 'mime' // commonjs module: can't do named export for 'getType'
import { API } from './API.js'
import { SearchIndex } from 'search-index'
import { createServer } from 'node:http'
import { fileURLToPath } from 'url'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'path'
import figlet from 'figlet'

export class Norch {
  constructor (ops = {}) {
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
            new API(this.index, this.sendResponse, this.events)
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
      console.log(
        `
   ${figlet
     .textSync('NORCH', { font: 'Isometric1', horizontalLayout: 'full' })
     .replace(/(?:\n)/g, '\n   ')}

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
    res.setHeader('Content-Type', type + '; charset=utf-8')
    res.writeHead(200)
    res.end(body)
  }

  createNorchServer = api =>
    createServer((req, res) => {
      let pathname = new URL(req.url, `http://${req.headers.host}/`).pathname
      console.info(pathname)

      if (req.method === 'GET') {
        const fileDirs = ['/', '/api/']

        // default to index.html when only file-directory is specified
        if (fileDirs.includes(pathname)) pathname += 'index.html'

        // Serve up static files files
        if (this.files(fileDirs).includes(pathname)) {
          console.log(dirname(fileURLToPath(import.meta.url)))
          return this.sendFileResponse(pathname, res)
        }
      }

      return api[pathname.slice(1)]
        ? api[pathname.slice(1)](req, res)
        : this._404(req, res)
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

  sendFileResponse = (name, res) =>
    this.sendResponse(
      readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), '../www_root' + name)
      ) + '',
      res,
      mime.getType(name)
    )

  // ("404: page not found")
  _404 = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.writeHead(404)
    res.end('<html><h1>404</h1>nothing here bro!</html>')
  }
}
