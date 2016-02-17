module.exports = function (ops, callback) {
  var program = require('commander')
  var searchindex = require('search-index')
  // hmm- why?
  var listToArray = function (val) {
    return [].concat(val.split(','))
  }
  program.version(require('../package.json').version)
    .option('-p, --port <port>', 'specify the port, defaults to $PORT or 3030', Number, process.env.PORT || ops.port || 3030)
    .option('-i, --indexPath <indexPath>', 'specify the name of the index directory, defaults to norch-index', String, ops.indexPath || 'norch-index')
    .option('-l, --logLevel <logLevel>', 'specify the loglevel- silly | debug | verbose | info | warn | error', String, ops.logLevel || 'error')
    .option('-s, --logSilent <logSilent>', 'silent mode', String, 'false')
    .option('-c, --cors <items>', 'comma-delimited list of Access-Control-Allow-Origin addresses in the form of "http(s)://hostname:port" (or "*")', listToArray, '')
    .parse(process.argv)
  var options = {}
  options.si = ops.si || null
  options.cors = program.cors
  options.indexPath = program.indexPath
  options.logLevel = program.logLevel
  options.logSilent = program.logSilent
  options.port = program.port
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
