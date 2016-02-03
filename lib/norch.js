module.exports = function (ops, callback) {
  var callBackRequested = arguments[1] || false

  var _ = require('lodash')
  var fs = require('fs')
  var restify = require('restify')
  var program = require('commander')

  // hmm- why?
  var listToArray = function (val) {
    return [].concat(val.split(','))
  }
  var options = _.defaults(ops || {}, {})

  program.version(require('../package.json').version)
    .option('-p, --port <port>', 'specify the port, defaults to $PORT or 3030', Number, process.env.PORT || options.port || 3030)
    .option('-i, --indexPath <indexPath>', 'specify the name of the index directory, defaults to norch-index', String, options.indexPath || 'norch-index')
    .option('-l, --logLevel <logLevel>', 'specify the loglevel- silly | debug | verbose | info | warn | error', String, options.logLevel || 'error')
    .option('-s, --logSilent <logSilent>', 'silent mode', String, options.logSilent || 'false')
    .option('-c, --cors <items>', 'comma-delimited list of Access-Control-Allow-Origin addresses in the form of "http(s)://hostname:port" (or "*")', listToArray, options.cors || '')
    .parse(process.argv)

  var SearchIndex = require('search-index')
  var si = options.si || new SearchIndex(program)
  var logo = require('./printLogo.js')
  var server

  if (process.argv.indexOf('-h') === -1) {
    server = restify.createServer({
      name: 'norch',
      version: require('../package.json').version
    })
    // server.use(restify.bodyParser())
    server.listen(program.port)
    logo(program)
    if (callBackRequested) {
      return callback('started ' + program.port)
    }
  }

  server.use(restify.queryParser())

  if (program.cors && program.cors.length >= 1) {
    server.use(restify.CORS({
      origins: program.cors,
      credentials: true, // defaults to false
      headers: ['x-foo'] // sets expose-headers
    }))
  }

  // curl --form document=@testdata.json http://localhost:3030/indexer
  // --form options={}
  server.post('/indexer', restify.bodyParser(), function (req, res, next) {
    var options = {}
    if (req.body.options) options = JSON.parse(req.body.options)
    var jsonBatch
    if (req.files.document) {
      fs.readFile(
        req.files.document.path,
        {encoding: 'utf8'},
        function (err, batch) {
          if (err) {
            res.status(500).send('Error reading file')
            return
          }
          options.batchName = req.files.document.name
          try {
            jsonBatch = JSON.parse(batch)
          } catch (e) {
            res.status(500).send('Failed parsing document to JSON.\n' + e)
            return
          }
          si.add(jsonBatch, options, function (err) {
            if (err) {
              res.send(err)
            } else {
              res.send('Batch indexed')
            }
            return next()
          })
        })
    } else {
      if (typeof req.body.document !== 'object') {
        try {
          jsonBatch = JSON.parse(req.body.document)
        } catch (e) {
          res.status(500).send('Failed parsing document to JSON.\n' + e)
          return
        }
      } else {
        jsonBatch = req.body.document
      }
      si.add(jsonBatch, options, function (err) {
        if (err) {
          res.send(err)
        } else {
          res.send('Batch indexed')
        }
        return next()
      })
    }
  })

  // curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: application/gzip"
  server.post('/replicate', function (req, res, next) {
    si.replicate(req, function (msg) {
      res.send('completed ' + msg)
      return next()
    })
  })

  server.post('/delete', function (req, res, next) {
    si.del(req.body.docID, function (msg) {
      res.send(msg)
      return next()
    })
  })

  server.get('/matcher', function (req, res, next) {
    si.match(req.query.match, function (err, matches) {
      if (err) {
        console.log(err)
      }
      res.send(matches)
      return next()
    })
  })

  server.get('/get', function (req, res, next) {
    si.get(req.query.docID, function (err, msg) {
      if (err) {
        console.log(err)
      }
      res.send(msg)
      return next()
    })
  })

  server.get('/flush', function (req, res, next) {
    si.flush(function (err) {
      if (err) {
        res.send({
          success: false,
          message: 'there was a problem- try manually deleting ' + program.indexPath})
      } else {
        res.send({
          success: true,
          message: 'index emptied'})
      }
      return next()
    })
  })

  // curl http://localhost:3030/snapshot -o snapshot.gz
  server.get('/snapshot', function (req, res, next) {
    si.snapShot(function (readStream) {
      readStream.pipe(res)
      return next()
    })
  })

  server.get('/tellmeaboutmynorch', function (req, res, next) {
    si.tellMeAboutMySearchIndex(function (err, msg) {
      if (err) {
        console.log(err)
      }
      res.send(msg)
      return next()
    })
  })

  server.get('/search', function (req, res, next) {
    if (req.query.q) {
      var q = JSON.parse(req.query.q)
      si.search(q, function (err, result) {
        if (err) {
          console.log(err)
        }
//        console.log(JSON.stringify(result.hits, null, 2))
        res.send(result)
        return next()
      })
    } else {
      res.send('This is a Norch endpoint for search')
      return next()
    }
  })

  server.get(/\//, restify.serveStatic({
    directory: 'lib',
    default: 'index.html'
  }))
}
