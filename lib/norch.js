var Norch = module.exports = function(options) {
  var that = this;
  if (!(this instanceof Norch)) {
    return new Norch(options);
  }

  var listToArray = function(val) {
      return [].concat(val.split(','));
  };

  this.bodyParser = require('body-parser');
  this.colors = require('colors');
  this.fs = require('fs');
  this.http = require('http');
  this.path = require('path');
  this.express = require('express');
  this.program = require('commander')
    .version(require('../package.json').version)
    .option('-p, --port <port>', 'specify the port, defaults to 3030', Number, options.port || 3030)
    .option('-n, --hostname <hostname>', 'specify the hostname, defaults to 0.0.0.0 (INADDR_ANY)', String, options.hostname || '0.0.0.0')
    .option('-i, --indexPath <indexPath>', 'specify the name of the index directory, defaults to norch-index', String, options.indexPath || 'norch-index')
    .option('-l, --logLevel <logLevel>', 'specify the loglevel- silly | debug | verbose | info | warn | error', String, options.logLevel || 'info')
    .option('-s, --logSilent <logSilent>', 'silent mode', String, options.logSilent || 'false')
    .option('-c, --cors <items>', 'comma-delimited list of Access-Control-Allow-Origin addresses in the form of "http(s)://hostname:port" (or "*")', listToArray, options.cors || '')
    .parse(process.argv);

  var SearchIndex = require('search-index');
  this.si = new SearchIndex(this.program);
  this.morgan = require('morgan');
  this.app = new this.express();
  this.app.listen(this.program.port);
  this.app.use(this.morgan('tiny'));
  this.app.use(this.express.static(this.path.join(__dirname,
                                   '../node_modules/norch-bootstrap')));
  this.multer = require('multer');
  //to save uploaded files do "app.use(multer({ dest: './tmp/'}));"
  this.app.use(this.multer());
  this.app.use(this.bodyParser.json());

  if (this.program.cors && this.program.cors.length >= 1){
    this.allowCrossDomain = function(req, res, next) {
        // NOTE: correct way would be to only emit if we match on req.host
        // SEE: http://www.w3.org/TR/cors/#access-control-allow-origin-response-header
        // This would greatly simplify the code because we could use the object overload of
        // res.header({ Access-Control-Allow-Origin: origin, Access-Control-Allow-Methods: 'GET..', ...});
        // Drawback would be a slightly more complicated implementation when passing "*"
        this.program.cors.forEach(function(origin) {
            res.header('Access-Control-Allow-Origin', origin);
        });
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        return next();
    }.bind(this);

    this.app.use(this.allowCrossDomain);
  }

  //curl --form document=@testdata.json http://localhost:3030/indexer
  //--form facetOn=topics
  this.app.post('/indexer', function (req, res) {
    var filters = [],
    options = {},
    jsonBatch;
    options.filters = [];
    if (req.body.filterOn)
      options.filters = req.body.filterOn.split(',');
    options.batchName = 'batch' + Date.now();
    if (req.files.document) {
      that.fs.readFile(req.files.document.path, {'encoding': 'utf8'},
                  function (err, batch) {
                    if (err) {
                      res.status(500).send('Error reading file');
                      return;
                    }
                    options.batchName = req.files.document.name;
                    try {
                      jsonBatch = JSON.parse(batch);
                    } catch (e) {
                      res.status(500).send("Failed parsing document to JSON.\n" + e);
                      return;
                    }
                    that.si.add(options, jsonBatch, function (err) {
                      if (err) {
                        res.send(err);
                      } else {
                        res.send('Batch indexed');
                      }
                    });
                  });
    } else {
      if (typeof req.body.document !== 'object') {
        try {
          jsonBatch = JSON.parse(req.body.document);
        } catch (e) {
          res.status(500).send("Failed parsing document to JSON.\n" + e);
          return;
        }
      } else {
        jsonBatch = req.body.document;
      }
      that.si.add(options, jsonBatch, function (err) {
        if (err) {
          res.send(err);
        } else {
          res.send('Batch indexed');
        }
      });

    }

  });

  if (process.argv.indexOf('-h') == -1) {
    this.http.createServer(this.app).listen(this.app.get('port'), this.app.get('hostname'), function(){
      console.log();
      console.log('      ___           ___           ___           ___           ___      '.red);
      console.log('     /\\'.white + '__\\'.red + '         /\\'.white + '  \\'.red + '         /\\'.white + '  \\'.red + '         /\\'.white + '  \\'.red + '         /\\'.white + '__\\     '.red);
      console.log('    /::|'.white + '  |'.red + '       /::\\'.white + '  \\'.red + '       /::\\'.white + '  \\'.red + '       /::\\'.white + '  \\'.red + '       /:/'.white + '  /     '.red);
      console.log('   /:|:|'.white + '  |'.red + '      /:/\\:\\'.white + '  \\'.red + '     /:/\\:\\'.white + '  \\'.red + '     /:/\\:\\'.white + '  \\'.red + '     /:/'.white + '__/      '.red);
      console.log('  /:/|:|'.white + '  |__'.red + '   /:/  \\:\\'.white + '  \\'.red + '   /::\\'.white + '~'.red + '\\:\\'.white + '  \\'.red + '   /:/  \\:\\'.white + '  \\'.red + '   /::\\'.white + '  \\ ___  '.red);
      console.log(' /:/ |:| /\\'.white + '__\\'.red + ' /:/'.white + '__/'.red + ' \\:\\'.white + '__\\'.red + ' /:/\\:\\ \\:\\'.white + '__\\'.red + ' /:/'.white + '__/'.red + ' \\:\\'.white + '__\\'.red + ' /:/\\:\\  /\\'.white + '__\\ '.red);
      console.log(' \\/'.white + '__'.red + '|:|/:/'.white + '  /'.red + ' \\:\\'.white + '  \\'.red + ' /:/'.white + '  /'.red + ' \\/'.white + '_'.red + '|::\\/:/'.white + '  /'.red + ' \\:\\'.white + '  \\'.red + '  \\/'.white + '__/'.red + ' \\/'.white + '__'.red + '\\:\\/:/'.white + '  / '.red);
      console.log('     |:/:/'.white + '  /'.red + '   \\:\\  /:/'.white + '  /'.red + '     |:|::/'.white + '  /'.red + '   \\:\\'.white + '  \\'.red + '            \\::/'.white + '  /  '.red);
      console.log('     |::/'.white + '  /'.red + '     \\:\\/:/'.white + '  /'.red + '      |:|\\/'.white + '__/'.red + '     \\:\\'.white + '  \\'.red + '           /:/'.white + '  /   '.red);
      console.log('     /:/'.white + '  /'.red + '       \\::/'.white + '  /'.red + '       |:|'.white + '  |'.red + '        \\:\\'.white + '__\\'.red + '         /:/'.white + '  /    '.red);
      console.log('     \\/'.white + '__/'.red + '         \\/'.white + '__/'.red + '         \\|'.white + '__|'.red + '         \\/'.white + '__/'.red + '         \\/'.white + '__/     '.red);
      console.log();
      console.log('MIT license, 2013-2014'.red);
      console.log('http://fergiemcdowall.github.io/Norch'.red);
      console.log();
      console.log('Norch server listening on hostname '
                  + that.program.hostname + ' on port '
                  + that.program.port);
      console.log();
    });
  }


  function getQuery(req) {
    //default values
    var offsetDefault = 0,
    pagesizeDefault = 10,
    q = {};
    if (req.query['q']) {
      q['query'] = {};
      if( Object.prototype.toString.call(req.query['q']) === '[object Object]' ) {
        var queryObject = req.query['q'];
        for (var k in queryObject) {
          q['query'][k] = queryObject[k].toLowerCase().split(/\s+/);
        }
      }
      else {
        q['query']['*'] = req.query['q'].toLowerCase().split(/\s+/);
      }
    }
    if (req.query['facetRanges']) {
      try {
        q['facetRanges'] = req.query['facetRanges'];
        for (var fr in q['facetRanges'])
          q['facetRanges'][fr] = JSON.parse(q['facetRanges'][fr]);
      }
      catch (e) {console.log('error parsing facetRanges: ' + e);}
    }
    if (req.query['fieldedQuery'])
      q['fieldedQuery'] = req.query.fieldedQuery;

    if (req.query['offset'])
      q['offset'] = req.query['offset'];
    else
      q['offset'] = offsetDefault;

    if (req.query['pagesize'])
      q['pageSize'] = req.query['pagesize'];
    else
      q['pageSize'] = pagesizeDefault;

    if (req.query['facets'])
      q['facets'] = req.query['facets'].toLowerCase().split(',');
    if (req.query['facetSort'])
      q['facetSort'] = req.query.facetSort;
    if (req.query['weight'])
      q['weight'] = req.query.weight;
    if (req.query['teaser'])
      q['teaser'] = req.query.teaser;
    //&filter[topics][]=cocoa&filter[places][]=usa
    if (req.query['filter'])
      q['filter'] = req.query.filter;
//    console.log(JSON.stringify(q, null, 2));
    return q;
  }

  this.app.get('/matcher', function(req, res) {
    that.si.match(req.query['beginsWith'], function(err, matches) {
      res.send(matches);
    });
  });


  this.app.get('/getDoc', function(req, res) {
    that.si.get(req.query['docID'], function(err, msg) {
      res.send(msg);
    });
  });


  this.app.get('/empty', function(req, res) {
    that.si.empty(function(err) {
      if (!err) res.send({'success':true, 'message':'index emptied'});
      else res.send(
        {'success':false,
         'message':'there was a problem- try manually deleting ' + that.program.indexPath}
      );
    });
  });


  //curl http://localhost:3030/snapshot -o snapshot.gz
  this.app.get('/snapShot', function(req, res) {
    that.si.snapShot(function(readStream) {
      readStream.pipe(res);
    });
  });


  //curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: application/gzip"
  this.app.post('/replicate', function(req, res) {
    that.si.replicate(req, function(msg){
      res.send('completed');
    });
  });


  this.app.get('/indexPeek', function(req, res) {
    that.si.indexPeek(req.query['start'], req.query['stop'], function(msg) {
      res.send(msg);
    });
  });


  this.app.get('/tellMeAboutMyNorch', function(req, res) {
    that.si.tellMeAboutMySearchIndex(function(msg) {
      res.send(msg);
    });
  });


  this.app.post('/delete', function(req, res) {
    that.si.del(req.body.docID, function(msg) {
      res.send(msg);
    });
  });

  //curl localhost:3030/search?q=aberdeen\&weight=%22category%22:10
  this.app.get('/search', function(req, res) {
    var q = getQuery(req);
    that.si.search(q, function(err, result) {
      res.send(result);
    });
  });
}
