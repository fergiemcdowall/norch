const snapshotDir = './snapshots/'
const JSONStream = require('JSONStream')

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
      .on('finish', function() {
        res.send('batch indexed')
        return next()
      })
  }

  routeFunctions.docCount = function (req, res, next) {
    options.si.countDocs(function (err, docCount) {
      res.send(String(docCount))
      return next()
    })
  }

  routeFunctions.del = function (req, res, next) {
    options.si.del(req.body.docID, function (msg) {
      res.send(msg)
      return next()
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
    options.si.get(req.query.docID, function (err, msg) {
      if (err) {
        req.log.error(err)
      }
      res.send(msg)
      return next()
    })
  }

  routeFunctions.matcher = function (req, res, next) {
    options.si.match(req.query.match, function (err, matches) {
      if (err) {
        req.log.error(err)
      }
      res.send(matches)
      return next()
    })
  }

  routeFunctions.replicate = function (req, res, next) {
    req
      .pipe(JSONStream.parse())
      .pipe(options.si.dbWriteStream())
      .on('finish', function() {
        res.send('replication complete')
        return next()
      })
  }

  routeFunctions.snapshot = function (req, res, next) {
    options.si.dbReadStream()
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(fs.createWriteStream(snapshotDir + Date.now() + '.json'))
      .on('close', function() {
        res.send('replication complete')
        return next()
      })
  }

  routeFunctions.latestSnapshot = function (req, res, next) {
    fs.readdir(snapshotDir, function (err, files) {
      fs.createReadStream(snapshotDir + files.pop()).pipe(res)
      return next()
    })
  }

  routeFunctions.search = function (req, res, next) {
    if (req.query.q) req.query.q = JSON.parse(req.query.q)
    options.si.search(req.query.q).pipe(res)
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
