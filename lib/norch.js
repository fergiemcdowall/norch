
module.exports = function (options, callback) {
  const _ = require('lodash')
  const searchindex = require('search-index')
  options = _.defaults(
    options, {
      cors: [],
      indexPath: 'si',
      logLevel: 'error',
      logSilent: 'false',
      port: 3030,
      si: null
    }
  )
  if (process.argv.indexOf('-h') === -1) {
    if (options.si) {
      return startServer(options, callback)
    } else {
      searchindex({
        indexPath: options.indexPath
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
  var restify = require('restify')
  var logo = require('./printLogo.js')
  var routes = require('./routeFunctions.js')(siOptions)
  var norch
  norch = restify.createServer({
    name: 'norch',
    version: require('../package.json').version
  })
  norch.listen(siOptions.port)
  norch.use(restify.queryParser())
  logo(siOptions)
  if (siOptions.cors && siOptions.cors.length >= 1) {
    norch.use(restify.CORS({
      origins: siOptions.cors,
      credentials: true, // defaults to false
      headers: ['x-foo'] // sets expose-headers
    }))
  }
  norch.post('/add', restify.bodyParser(), routes.add)
  norch.post('/delete', routes.del)
  norch.post('/replicate', routes.replicate)
  norch.get('/flush', routes.flush)
  norch.get('/get', routes.get)
  norch.get('/matcher', routes.matcher)
  norch.get('/search', routes.search)
  norch.get('/snapshot', routes.snapshot)
  norch.get('/tellmeaboutmynorch', routes.tellMeAboutMyNorch)
  norch.get(/\//, restify.serveStatic({
    directory: 'lib',
    default: 'index.html'
  }))
  return callback(null, norch)
}
