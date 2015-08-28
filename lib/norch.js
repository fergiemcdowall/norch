module.exports = function (ops) {

  var _ = require('lodash');
  var bodyParser = require('body-parser');
  var express = require('express');
  var fs = require('fs');
  var http = require('http');
  var morgan = require('morgan');
  var path = require('path');

  //hmm- why?
  var listToArray = function (val) {
    return [].concat(val.split(','));
  };  
  var options = _.defaults(ops || {}, {});

  var program = require('commander')
    .version(require('../package.json').version)
    .option('-p, --port <port>', 'specify the port, defaults to $PORT or 3030', Number, process.env.PORT || options.port || 3030)
    .option('-n, --hostname <hostname>', 'specify the hostname, defaults to 0.0.0.0 (INADDR_ANY)', String, options.hostname || '0.0.0.0')
    .option('-i, --indexPath <indexPath>', 'specify the name of the index directory, defaults to norch-index', String, options.indexPath || 'norch-index')
    .option('-l, --logLevel <logLevel>', 'specify the loglevel- silly | debug | verbose | info | warn | error', String, options.logLevel || 'error')
    .option('-s, --logSilent <logSilent>', 'silent mode', String, options.logSilent || 'false')
    .option('-c, --cors <items>', 'comma-delimited list of Access-Control-Allow-Origin addresses in the form of "http(s)://hostname:port" (or "*")', listToArray, options.cors || '')
    .parse(process.argv);

  var SearchIndex = require('search-index');
  var si = options.si || new SearchIndex(program);
  var app = new express();
  var logo = require('./printLogo.js');


  if (process.argv.indexOf('-h') == -1) {
    http.createServer(app).listen(app.get('port'), app.get('hostname'), function () {
      logo(program);
    });
  }


  app.listen(program.port);
  app.use(morgan('tiny'));
  //to save uploaded files do "app.use(multer({ dest: './tmp/'}));"
  app.use(require('multer')());
  app.use(bodyParser.json());

  if (program.cors && program.cors.length >= 1){
    var allowCrossDomain = function (req, res, next) {
      // NOTE: correct way would be to only emit if we match on req.host
      // SEE: http://www.w3.org/TR/cors/#access-control-allow-origin-response-header
      // This would greatly simplify the code because we could use the object overload of
      // res.header({ Access-Control-Allow-Origin: origin, Access-Control-Allow-Methods: 'GET..', ...});
      // Drawback would be a slightly more complicated implementation when passing "*"
      program.cors.forEach(function (origin) {
        res.header('Access-Control-Allow-Origin', origin);
      });
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      return next();
    };
    app.use(allowCrossDomain);
  }


  //curl --form document=@testdata.json http://localhost:3030/indexer
  //--form options={}
  app.post('/indexer', function (req, res) {
    var options = {}
    if (req.body.options) options = JSON.parse(req.body.options);
    var jsonBatch;
    if (req.files.document) {
      fs.readFile(
        req.files.document.path,
        {encoding: 'utf8'},
        function (err, batch) {
          if (err) {
            res.status(500).send('Error reading file');
            return;
          }
          options.batchName = req.files.document.name;
          try {
            jsonBatch = JSON.parse(batch);
          } catch (e) {
            res.status(500).send('Failed parsing document to JSON.\n' + e);
            return;
          }
          si.add(options, jsonBatch, function (err) {
            if (err) {
              res.send(err);
            } else {
              res.send('Batch indexed');
            }
          });
        });
    }
    else {
      if (typeof req.body.document !== 'object') {
        try {
          jsonBatch = JSON.parse(req.body.document);
        } catch (e) {
          res.status(500).send('Failed parsing document to JSON.\n' + e);
          return;
        }
      } else {
        jsonBatch = req.body.document;
      }
      si.add(options, jsonBatch, function (err) {
        if (err) {
          res.send(err);
        } else {
          res.send('Batch indexed');
        }
      });
    }
  });

  //curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: application/gzip"
  app.post('/replicate', function (req, res) {
    si.replicate(req, function (msg) {
      res.send('completed ' + msg);
    });
  });

  app.post('/delete', function (req, res) {
    si.del(req.body.docID, function (msg) {
      res.send(msg);
    });
  });


  app.get('/matcher', function (req, res) {
    si.match(req.query.beginsWith, function (err, matches) {
      res.send(matches);
    });
  });

  app.get('/getDoc', function (req, res) {
    si.get(req.query.docID, function (err, msg) {
      res.send(msg);
    });
  });

  app.get('/empty', function (req, res) {
    si.empty(function (err) {
      if (!err) res.send({success: true, message: 'index emptied'});
      else res.send(
        {success: false,
         message: 'there was a problem- try manually deleting ' + program.indexPath}
      );
    });
  });

  //curl http://localhost:3030/snapshot -o snapshot.gz
  app.get('/snapShot', function (req, res) {
    si.snapShot(function (readStream) {
      readStream.pipe(res);
    });
  });

  app.get('/indexPeek', function (req, res) {
    si.indexPeek(req.query.start, req.query.stop, function (msg) {
      res.send(msg);
    });
  });

  app.get('/tellMeAboutMyNorch', function (req, res) {
    si.tellMeAboutMySearchIndex(function (msg) {
      res.send(msg);
    });
  });

  app.get('/', function (req, res) {
    console.log(__dirname);
    res.sendFile(path.join(__dirname, '../lib/index.html'));
  });

  //curl localhost:3030/search?q=aberdeen\&weight=%22category%22:10
  app.get('/search', function (req, res) {
    //http://localhost:3030/search?q={%22query%22:{%22*%22:[%22usa%22]}}
    if (req.query.q) {
      var q = JSON.parse(req.query.q);
      si.search(q, function (err, result) {
        res.send(result);
      });
    }
    else {
      res.send('This is a Norch endpoint for search');
    }
  });
};
