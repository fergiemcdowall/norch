
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


//curl localhost:3000/search?q=aberdeen\&weight=%22category%22:10
app.get('/search', function(req, res) {
  norch.search(req, function(msg) {
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
