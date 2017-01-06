const snapshotDir = './snapshots/'
const JSONStream = require('JSONStream')
const Readable = require('stream').Readable

module.exports = function (options) {
  var fs = require('fs')
  var routeFunctions = {}

  var parseQuery = function (res, req, param) {
    try {
      return JSON.parse(req.query[param] || '{}')
    } catch (e) {
      res.status(500)
      res.write(e + '\n')
      res.end()
    }
  }

  var resWrite = function (res, level, message) {
    level = level || ''
    if (level.trim().toLowerCase() === 'verbose') {
      res.write(message)
      return
    } else if (level.trim().toLowerCase() === 'silent') {
      return
    } else {
      res.write('.')
      return
    }
  }

  var sendError = function (res, e) {
    res.status(500)
    res.send(e)
  }

  routeFunctions.availableFields = function (req, res, next) {
    options.si.availableFields().pipe(res)
  }

  routeFunctions.add = function (req, res, next) {
    req
      .pipe(JSONStream.parse())
      .on('data', function (d) {
        var ev = { event: 'received' }
        if (d.id) ev.id = d.id
        resWrite(res, req.query.responseLevel, JSON.stringify(ev) + '\n')
      })
      .pipe(options.si.defaultPipeline())
      .on('data', function (d) {
        var ev = {
          event: 'processed',
          id: d.id
        }
        resWrite(res, req.query.responseLevel, JSON.stringify(ev) + '\n')
      })
      .pipe(options.si.add({batchSize: 2000}))
      .on('data', function (d) {
        var ev = {}
        if (d.totalKeys) {
          ev.event = 'dbKeysCounted'
          ev.count = d.totalKeys
          resWrite(res, req.query.responseLevel, JSON.stringify(ev) + '\n')
        } else {
          ev = {
            event: 'dbInsert',
            key: d
          }
          resWrite(res, req.query.responseLevel, JSON.stringify(ev) + '\n')
        }
      })
      .on('finish', function () {
        res.write(JSON.stringify({ event: 'finished' }) + '\n')
        res.end()
        return next()
      })
  }

  routeFunctions.buckets = function (req, res, next) {
    options.si.buckets(parseQuery(res, req, 'q'))
      .on('error', function (e) { sendError(res, e) })
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
      .on('finish', function () {
        return next()
      })
  }

  routeFunctions.docCount = function (req, res, next) {
    options.si.countDocs(function (e, docCount) {
      if (e) { sendError(res, e) }
      res.send(String(docCount))
      return next()
    })
  }

  routeFunctions.categorize = function (req, res, next) {
    options.si.categorize(parseQuery(res, req, 'q'))
      .on('error', function (e) { sendError(res, e) })
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
      .on('finish', function () {
        return next()
      })
  }

  routeFunctions.concurrentAdd = function (req, res, next) {
    options.si.concurrentAdd({}, [req.body], function (e) {
      if (e) { sendError(res, e) } else {
        res.status(200)
        res.send()
      }
    })
  }

  routeFunctions.del = function (req, res, next) {
    options.si.del(parseQuery(res, req, 'ids'), function (e) {
      if (e) { sendError(res, e) }
      res.send('batch deleted')
    })
  }

  routeFunctions.flush = function (req, res, next) {
    options.si.flush(function (e) {
      if (e) {
        sendError(res, e)
      } else {
        res.send('index flushed') // should be an event object?
      }
      return next()
    })
  }

  routeFunctions.get = function (req, res, next) {
    options.si.get(parseQuery(res, req, 'ids'), options)
      .on('error', function (e) { sendError(res, e) })
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
      .on('finish', function () {
        return next()
      })
  }

  routeFunctions.latestSnapshot = function (req, res, next) {
    fs.readdir(snapshotDir, function (e, files) {
      if (e) { sendError(e) }
      fs.createReadStream(snapshotDir + files.pop()).pipe(res)
      return next()
    })
  }

  routeFunctions.listSnapshots = function (req, res, next) {
    fs.readdir(snapshotDir, function (e, files) {
      if (e) {
        sendError(e)
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

  routeFunctions.match = function (req, res, next) {
    options.si.match(parseQuery(res, req, 'q'), options)
      .on('error', function (e) { sendError(res, e) })
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
      .on('data', function (d) {})
      .on('error', function (e) { sendError(res, e) })
      .on('end', function () {
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

  routeFunctions.search = function (req, res, next) {
    options.si.search(parseQuery(res, req, 'q'))
      .pipe(JSONStream.stringify('', '\n', ''))
      .pipe(res)
    return next()
  }

  routeFunctions.totalHits = function (req, res, next) {
    options.si.totalHits(parseQuery(res, req, 'q'), function (e, totalHits) {
      if (e) { sendError(res, e) }
      res.send({
        totalHits: totalHits
      })
    })
  }

  return routeFunctions
}
