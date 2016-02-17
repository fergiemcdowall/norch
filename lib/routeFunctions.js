module.exports = function (siOptions) {
  var fs = require('fs')
  var routeFunctions = {}

  // curl --form document=@testdata.json http://localhost:3030/indexer
  // --form options={}
  routeFunctions.add = function (req, res, next) {
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
            return next()
          }
          options.batchName = req.files.document.name
          try {
            jsonBatch = JSON.parse(batch)
          } catch (e) {
            res.status(500).send('Failed parsing document to JSON.\n' + e)
            return next()
          }
          siOptions.si.add(jsonBatch, options, function (err) {
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
      siOptions.si.add(jsonBatch, options, function (err) {
        if (err) {
          res.send(err)
        } else {
          res.send('Batch indexed')
        }
        return next()
      })
    }
  }

  routeFunctions.del = function (req, res, next) {
    siOptions.si.del(req.body.docID, function (msg) {
      res.send(msg)
      return next()
    })
  }

  routeFunctions.flush = function (req, res, next) {
    siOptions.si.flush(function (err) {
      if (err) {
        res.send({
          success: false,
          message: 'there was a problem- try manually deleting ' + siOptions.indexPath})
      } else {
        res.send({
          success: true,
          message: 'index emptied'})
      }
      return next()
    })
  }

  // curl http://localhost:3030/snapshot -o snapshot.gz
  routeFunctions.get = function (req, res, next) {
    siOptions.si.get(req.query.docID, function (err, msg) {
      if (err) {
        console.log(err)
      }
      res.send(msg)
      return next()
    })
  }

  routeFunctions.matcher = function (req, res, next) {
    siOptions.si.match(req.query.match, function (err, matches) {
      if (err) {
        console.log(err)
      }
      res.send(matches)
      return next()
    })
  }

  // curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: application/gzip"
  routeFunctions.replicate = function (req, res, next) {
    siOptions.si.replicate(req, function (msg) {
      res.send('completed ' + msg)
      return next()
    })
  }

  routeFunctions.search = function (req, res, next) {
    if (req.query.q) {
      var q = JSON.parse(req.query.q)
      siOptions.si.search(q, function (err, result) {
        if (err) {
          console.log(err)
        }
        res.send(result)
        return next()
      })
    } else {
      res.send('This is a Norch endpoint for search')
      return next()
    }
  }

  routeFunctions.snapshot = function (req, res, next) {
    siOptions.si.snapShot(function (readStream) {
      readStream.pipe(res)
      return next()
    })
  }

  routeFunctions.tellMeAboutMyNorch = function (req, res, next) {
    siOptions.si.tellMeAboutMySearchIndex(function (err, msg) {
      if (err) {
        console.log(err)
      }
      res.send(msg)
      return next()
    })
  }

  return routeFunctions
}
