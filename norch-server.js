
/**
 * Module dependencies.
 */

var express = require('express')
, http = require('http')
, path = require('path')
, fs = require('fs')
, norch = require('./norch-lib.js');

var app = express();


// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

norch.calibrate(function(msg) {
  console.log('start up calibration completed');
});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


function getQuery(req) {
  //default values
  var offsetDefault = 0;
  var pagesizeDefault = 10;

  var q = {};
  q['query'] = "*";
  if (req.query['q']) {
    q['query'] = req.query['q'].toLowerCase().split(' ');
  }
  if (req.query['offset']) {
    q['offset'] = req.query['offset'];
  } else {
    q['offset'] = offsetDefault;
  }
  if (req.query['pagesize']) {
    q['pagesize'] = req.query['pagesize'];
  } else {
    q['pagesize'] = pagesizeDefault;
  }
  if (req.query['facets']) {
    q['facets'] = req.query['facets'].toLowerCase().split(',');
  }
  if (req.query['weight']) {
    q['weight'] = req.query.weight;
  }
  //&filter[topics][]=cocoa&filter[places][]=usa
  if (req.query['filter']) {
    q['filter'] = req.query.filter;
  }
  console.log(q);
  return q;
}


app.get('/', function(req, res) {
  res.sendfile('public/search.html');
});


app.get('/calibrate', function(req, res) {
  norch.calibrate(function(msg) {
    res.send(msg);
  });
});


app.get('/README.md', function(req, res) {
  res.sendfile('README.md');
});


app.get('/indexPeek', function(req, res) {
  norch.indexPeek(req.query['start'], req.query['stop'], function(msg) {
    res.send(msg);
  });
});


app.get('/indexData', function(req, res) {
  norch.indexData(function(msg) {
    res.send(msg);
  });
});


app.post('/delete', function(req, res) {
  norch.deleteDoc(req.body.docID, function(msg) {
    res.send(msg);
  });
});


app.get('/searchgui', function(req, res) {
  res.send('Welcome to Norch');
});


//curl localhost:3000/search?q=aberdeen\&weight=%22category%22:10
app.get('/search', function(req, res) {
  q = getQuery(req);
  norch.search(q, function(msg) {
    res.send(msg);
  });
});


//curl --form document=@testdata.json http://localhost:3000/indexer
//--form facetOn=topics
app.post('/indexer', function(req, res) {
  var filters = [];
  if (req.body.filterOn) {
    filters = req.body.filterOn.split(',');
  }
  
  var batch = fs.readFileSync(req.files.document.path, 'utf8');
  norch.index(batch, filters, function(msg) {
    norch.calibrate(function(msg) {
      res.send(msg);
    });
  });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
