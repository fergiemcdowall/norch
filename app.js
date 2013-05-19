
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , levelup = require('levelup')
  , natural = require('natural')
  , norch = require('./norch.js');




  var reverseIndex = levelup('./reverseIndex');
  TfIdf = natural.TfIdf,
  tfidf = new natural.TfIdf();  //need this line?

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
    norch.search(req, 0, {}, reverseIndex, function(msg) {
      res.send(msg);
    });
  });


//curl --form document=@testdata.json http://localhost:3000/indexer
  app.post('/indexer', function(req, res) {
    var batch = JSON.parse(fs.readFileSync(req.files.document.path, 'utf8'));
    var indexer = norch.indexDoc;
    for (docID in batch) {
      console.log(docID);
      indexer(docID, batch[docID], reverseIndex);
    }
    res.send('indexed\n');
  });



  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
