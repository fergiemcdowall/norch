module.exports = function (options, callback) {
  options = options || {}
  const Logger = require('bunyan')
  const _ = require('lodash')
  const fs = require('fs')
  const searchindex = require('search-index')
  // If a search-index is being passed to Norch- use
  var norchHome = options.norchHome || 'norch-index'
  fs.mkdir(norchHome, function (err) {
    options = _.defaults(
      options, {
        cors: null,
        norchHome: norchHome,
        log: new Logger.createLogger({ // eslint-disable-line
          name: 'norch',
          level: options.logLevel || 'info',
          serializers: {
            req: function (req) {
              return {
                method: req.method,
                url: req.url,
                headers: req.headers
              }
            }
          },
          streams: [
            {
              path: norchHome + '/info.log',
              level: 'info'
            },
            {
              path: norchHome + '/error.log',
              level: 'error'
            }
          ]
        }),
        port: 3030,
        machineReadable: true,
        si: null
      })
    if (err) options.log.info(err)
    if (process.argv.indexOf('-h') === -1) {
      if (options.si) {
        return startServer(options, callback)
      } else {
        searchindex({
          indexPath: norchHome + '/data',
          log: options.log
        }, function (err, si) {
          if (err) {
            console.log(err)
          } else {
            options.si = si
            // maybe delete norchHome?
            return startServer(options, callback)
          }
        })
      }
    }
  })
}

var startServer = function (options, callback) {
  options.log.info('server starting')
  if (!options.machineReadable) {
    require('./printLogo.js')(options)
  }
  var fs = require('fs')
  var restify = require('restify')
  var routes = require('./routeFunctions.js')(options)

  var norch = restify.createServer({
    name: 'norch',
    version: require('../package.json').version,
    log: options.log
  })
  norch.listen(options.port)
  norch.pre(function (request, response, next) {
    request.log.info({
      req: request,
      req_id: request.getId()
    }, 'REQUEST')
    next()
  })
  norch.use(restify.queryParser())
  norch.use(restify.requestLogger({}))
  norch.use(restify.CORS(options.cors))

  // initialise snapshot dir
  try {
    fs.mkdirSync('./snapshots')
  } catch (e) {
    // what to do here?
  }

  norch.get('/docCount', routes.docCount)
  norch.get('/buckets', routes.buckets)
  norch.get('/categorize', routes.categorize)
  norch.get('/get', routes.get)
  norch.get('/latestSnapshot', routes.latestSnapshot)
  norch.get('/matcher', routes.matcher)
  norch.get('/search', routes.search)
  norch.get('/totalHits', routes.totalHits)
  norch.get('/listSnapshots', routes.listSnapshots)
  // norch.get('/tellmeaboutmynorch/:property', routes.tellMeAboutMyNorch)
  // norch.get('/tellmeaboutmynorch', routes.tellMeAboutMyNorch)
  norch.get(/\//, restify.serveStatic({
    directory: __dirname,
    file: './index.html'
  }))

  norch.post('/add', routes.add)
  norch.post('/concurrentAdd', restify.bodyParser(), routes.concurrentAdd)
  norch.post('/import', routes.replicate)
  norch.post('/snapshot', routes.snapshot)

  // TODO: throw error if user tries to GET or POST flush
  norch.del('/flush', routes.flush)
  norch.del('/delete', routes.del)

  norch.options = options
  return callback(null, norch)
}
