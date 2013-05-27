
/**
 * Module dependencies.
 */

var express = require('express')
, http = require('http')
, path = require('path')
, fs = require('fs')
, norch = require('./norch.js');

var app = express();


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


function getQuery(req) {
  var q = {};
  q['query'] = req.query['q'].split(' ');
  q['facets'] = req.query['f'].split(',');
  q['weight'] = {};
  var weightURLParam = req.query['w'].split(',');
  for (var i = 0; i < weightURLParam.length; i++) {
    var field = weightURLParam[i].split(':')[0];
    console.log(weightURLParam[i]);
    var weightFactor = weightURLParam[i].split(':')[1];
    q['weight'][field] = weightFactor;
  }
  return q;
}


app.get('/dumpIndex', function(req, res) {
  norch.dumpIndex(req.query['start'], req.query['stop'], function(msg) {
    res.send(msg);
  });
});


//curl localhost:3000/search?q=aberdeen\&weight=%22category%22:10
app.get('/search', function(req, res) {
  q = getQuery(req);
  norch.search(q, function(msg) {
    res.send(msg);
  });
});


//curl --form document=@testdata.json http://localhost:3000/indexer
app.post('/indexer', function(req, res) {
  var batch = fs.readFileSync(req.files.document.path, 'utf8');
  norch.index(batch, function(msg) {
    res.send(msg);
  });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
