module.exports = function (options, callback) {
  // console.log(options)

  // logging:
  // https://nodejs.org/en/blog/module/service-logging-in-json-with-bunyan/
  // http://stackoverflow.com/questions/20626470/is-there-a-way-to-log-every-request-in-the-console-with-restify
  // http://trentm.com/talk-bunyan-in-prod/
  const Logger = require('bunyan')
  const _ = require('lodash')
  const searchindex = require('search-index')

  options = _.defaults(
    options, {
      cors: [],
      indexPath: 'si',
      log: new Logger.createLogger({ // eslint-disable-line
        name: 'norch',
        level: options.logLevel || 'info',
        serializers: {
          req: function (req) {
            return {
              method: req.method,
              // req_id: req.getId(),
              url: req.url,
              headers: req.headers
            }
          },
          res: Logger.stdSerializers.res
        },
        streams: [
          {
            path: 'log-info.log',
            level: 'info'
          },
          {
            path: 'log-error.log',
            level: 'error'
          }
        ]
      }),
      port: 3030,
      si: null
    }
  )

  if (process.argv.indexOf('-h') === -1) {
    if (options.si) {
      return startServer(options, callback)
    } else {
      searchindex({
        indexPath: options.indexPath,
        log: options.log
      }, function (err, si) {
        if (err) {
          console.log(err)
        } else {
          options.si = si
          // maybe delete indexPath?
          return startServer(options, callback)
        }
      })
    }
  }
}

var startServer = function (siOptions, callback) {
  require('./printLogo.js')(siOptions)

  var restify = require('restify')
  var routes = require('./routeFunctions.js')(siOptions)

  var norch = restify.createServer({
    name: 'norch',
    version: require('../package.json').version,
    log: siOptions.log
  })
  norch.listen(siOptions.port)
  norch.pre(function (request, response, next) {
    request.log.info({
      req: request,
      req_id: request.getId()
    }, 'REQUEST')
    next()
  })
  norch.use(restify.queryParser())
  norch.use(restify.requestLogger({}))

  if (siOptions.cors && siOptions.cors.length >= 1) {
    norch.use(restify.CORS({
      origins: siOptions.cors,
      credentials: true, // defaults to false
      headers: ['x-foo'] // sets expose-headers
    }))
  }

  norch.get('/flush', routes.flush)
  norch.get('/get', routes.get)
  norch.get('/matcher', routes.matcher)
  norch.get('/search', routes.search)
  norch.get('/snapshot', routes.snapshot)
  norch.get('/tellmeaboutmynorch/:property', routes.tellMeAboutMyNorch)
  norch.get('/tellmeaboutmynorch', routes.tellMeAboutMyNorch)
  norch.get(/\//, restify.serveStatic({
    directory: __dirname,
    file: './index.html'
  }))

  norch.post('/add', restify.bodyParser(), routes.add)
  norch.post('/delete', routes.del)
  norch.post('/replicate', routes.replicate)

  return callback(null, norch)
}
