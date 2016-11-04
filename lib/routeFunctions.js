const snapshotDir = './snapshots/'
const JSONStream = require('JSONStream')
const Readable = require('stream').Readable

module.exports = function (options) {
  var fs = require('fs')
  var routeFunctions = {}

  // curl --form document=@testdata.json http://localhost:3030/indexer
  // --form options={}
  routeFunctions.add = function (req, res, next) {
    req
      .pipe(JSONStream.parse())
      .pipe(options.si.defaultPipeline())
      .pipe(options.si.add())
      .on('finish', function () {
        res.send('batch indexed')
        return next()
      })
  }

  routeFunctions.buckets = function (req, res, next) {
    if (req.query.q) req.query.q = JSON.parse(req.query.q)
    options.si.buckets(req.query.q)
      .on('error', function (e) {
        res.status(500)
        res.send(e)
      })
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
      .on('finish', function () {
        return next()
      })
  }

  routeFunctions.docCount = function (req, res, next) {
    options.si.countDocs(function (e, docCount) {
      if (e) {
        res.status(500)
        res.send(e)
      }
      res.send(String(docCount))
      return next()
    })
  }

  routeFunctions.categorize = function (req, res, next) {
    if (req.query.q) req.query.q = JSON.parse(req.query.q)
    options.si.categorize(req.query.q)
      .on('error', function (e) {
        res.status(500)
        res.send(e)
      })
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
      .on('finish', function () {
        return next()
      })
  }

  routeFunctions.del = function (req, res, next) {
    var ids = JSON.parse(req.query.ids || [])
    options.si.del(ids, function (e) {
      if (e) {
        res.status(500)
        res.send(e)
      }
      res.send('batch deleted')
    })
  }

  routeFunctions.flush = function (req, res, next) {
    options.si.flush(function (err) {
      if (err) {
        res.send(err)
      } else {
        res.send('index flushed')
      }
      return next()
    })
  }

  routeFunctions.get = function (req, res, next) {
    var ids = JSON.parse(req.query.ids || [])
    options.si.get(ids, options)
      .on('error', function (e) {
        res.status(500)
        res.send(e)
      })
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
      .on('finish', function () {
        return next()
      })
  }

  routeFunctions.matcher = function (req, res, next) {
    var q
    try {
      q = JSON.parse(req.query.q)
    } catch (e) {
      q = { beginsWith: String(req.query.q) }
    }
    options.si.match(q, options)
      .on('error', function (e) {
        res.status(500)
        res.send(e)
      })
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
      .on('finish', function () {
        return next()
      })
  }

  routeFunctions.replicate = function (req, res, next) {
    req
      .pipe(JSONStream.parse())
      .pipe(options.si.dbWriteStream())
      .on('error', function (e) {
        res.status(500)
        res.send(e)
      })
      .on('finish', function () {
        res.send('replication complete')
        return next()
      })
  }

  routeFunctions.snapshot = function (req, res, next) {
    options.si.dbReadStream()
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(fs.createWriteStream(snapshotDir + Date.now() + '.json'))
      .on('close', function () {
        res.send('replication complete')
        return next()
      })
  }

  routeFunctions.latestSnapshot = function (req, res, next) {
    fs.readdir(snapshotDir, function (e, files) {
      if (e) {
        res.status(500)
        res.send(e)
      }
      fs.createReadStream(snapshotDir + files.pop()).pipe(res)
      return next()
    })
  }

  routeFunctions.listSnapshots = function (req, res, next) {
    fs.readdir(snapshotDir, function (e, files) {
      if (e) {
        res.status(500)
        res.send(e)
      }
      var s = new Readable()
      files.forEach(function (item) {
        s.push('<a href="/snapshots/' + item + '">' + item + '</a><br>')
      })
      s.push(null)
      s.pipe(res)
      return next()
    })
  }

  routeFunctions.search = function (req, res, next) {
    var q
    try {
      q = JSON.parse(req.query.q)
    } catch (e) {
      q = req.query.q
    }
    options.si.search(q)
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
    return next()
  }

  routeFunctions.tellMeAboutMyNorch = function (req, res, next) {
    options.si.tellMeAboutMySearchIndex(function (err, propertyMap) {
      if (err) {
        req.log.error(err)
      }
      if (req.params.property) {
        if (propertyMap.hasOwnProperty(req.params.property)) {
          res.send('' + propertyMap[req.params.property])
        } else {
          res.send(req.params.property +
            ' is not a valid property. Try one of the following: ' +
            Object.keys(propertyMap))
        }
      } else {
        res.send(propertyMap)
      }
      return next()
    })
  }

  return routeFunctions
}
