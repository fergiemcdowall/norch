/**
 * Module dependencies.
 */

var express = require('express'),
http = require('http'),
path = require('path'),
fs = require('fs'),
si = require('search-index'),
colors = require('colors');
app = express();

// all environments
module.exports = function(options) {
  app.set('port', options.port);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, '../public')));
  http.createServer(app).listen(app.get('port'), function(){
    console.log();
    console.log('      ___'.red);
    console.log('     /\\  \\'.red);
    console.log('    /'.red + '::'.blue + '\\  \\'.red);
    console.log('   /'.red + ':'.blue + '/\\'.red + ':'.blue + '\\  \\'.red);
    console.log('  /'.red + '::'.blue + '\\~\\'.red + ':'.blue + '\\  \\'.red);
    console.log(' /'.red + ':'.blue + '/\\'.red + ':'.blue + '\\ \\'.red + ':'.blue + '\\__\\'.red);
    console.log(' \\/__\\'.red + ':'.blue + '\\ \\/__/'.red);
    console.log('      \\'.red + ':'.blue + '\\__\\ ___'.red);
    console.log('       \\/__//\\  \\'.red);
    console.log('           /'.red + '::'.blue + '\\  \\'.red);
    console.log('          /'.red + ':'.blue + '/\\'.red + ':'.blue + '\\  \\'.red);
    console.log('         /'.red + ':'.blue + '/  \\'.red + ':'.blue + '\\  \\'.red);
    console.log('        /'.red + ':'.blue + '/__/ \\'.red + ':'.blue + '\\__\\'.red);
    console.log('        \\'.red + ':'.blue + '\\  \\ /'.red + ':'.blue + '/  /'.red);
    console.log('         \\'.red + ':'.blue + '\\  /'.red + ':'.blue + '/  /___'.red);
    console.log('          \\'.red + ':'.blue + '\\/'.red + ':'.blue + '/  //\\  \\'.red);
    console.log('           \\'.red + '::'.blue + '/  //'.red + '::'.blue + '\\  \\'.red);
    console.log('            \\/__//'.red + ':'.blue + '/\\'.red + ':'.blue + '\\  \\'.red);
    console.log('                /'.red + '::'.blue + '\\~\\'.red + ':'.blue + '\\  \\'.red);
    console.log('               /'.red + ':'.blue + '/\\'.red + ':'.blue + '\\ \\'.red + ':'.blue + '\\__\\'.red);
    console.log('               \\/_|'.red + '::'.blue + '\\/'.red + ':'.blue + '/  /'.red);
    console.log('                  |'.red + ':'.blue + '|'.red + '::'.blue + '/  /___'.red);
    console.log('                  |'.red + ':'.blue + '|\\/__//\\  \\'.red);
    console.log('                  |'.red + ':'.blue + '|  | /'.red + '::'.blue + '\\  \\'.red);
    console.log('                   \\|__|/'.red + ':'.blue + '/\\'.red + ':'.blue + '\\  \\'.red);
    console.log('                       /'.red + '::'.blue + '\\~\\'.red + ':'.blue + '\\  \\'.red);
    console.log('                      /'.red + ':'.blue + '/\\'.red + ':'.blue + '\\ \\'.red + ':'.blue + '\\__\\'.red);
    console.log('                      \\/__\\'.red + ':'.blue + '\\/'.red + ':'.blue + '/  /'.red);
    console.log('                           \\'.red + '::'.blue + '/  /___'.red);
    console.log('                           /'.red + ':'.blue + '/  //\\  \\'.red);
    console.log('                          /'.red + ':'.blue + '/  //'.red + '::'.blue + '\\  \\'.red);
    console.log('                          \\/__//'.red + ':'.blue + '/\\'.red + ':'.blue + '\\  \\'.red);
    console.log('                              /'.red + ':'.blue + '/  \\'.red + ':'.blue + '\\  \\'.red);
    console.log('                             /'.red + ':'.blue + '/__/_\\'.red + ':'.blue + '\\__\\'.red);
    console.log('                             \\'.red + ':'.blue + '\\  /\\ \\/__/'.red);
    console.log('                              \\'.red + ':'.blue + '\\ \\'.red + ':'.blue + '\\__\\ ___'.red);
    console.log('                               \\'.red + ':'.blue + '\\/'.red + ':'.blue + '/  //\\  \\'.red);
    console.log('                                \\'.red + '::'.blue + '/  //'.red + '::'.blue + '\\  \\'.red);
    console.log('                                 \\/__//'.red + ':'.blue + '/\\'.red + ':'.blue + '\\  \\'.red);
    console.log('                                     /'.red + '::'.blue + '\\~\\'.red + ':'.blue + '\\  \\'.red);
    console.log('                                    /'.red + ':'.blue + '/\\'.red + ':'.blue + '\\ \\'.red + ':'.blue + '\\__\\'.red);
    console.log('                                    \\'.red + ':'.blue + '\\~\\'.red + ':'.blue + '\\ \\/__/'.red);
    console.log('                                     \\'.red + ':'.blue + '\\ \\'.red + ':'.blue + '\\__\\'.red);
    console.log('                                      \\'.red + ':'.blue + '\\ \\/__/'.red);
    console.log('MIT license, 2013'.red + '                      \\'.red + ':'.blue + '\\__\\'.red);
    console.log('http://fergiemcdowall.github.io/Forage'.red + '  \\/__/'.red);
    console.log();
    console.log('Forage server listening on port ' + app.get('port'));
    console.log();
  });  
};


function getQuery(req) {
  //default values
  var offsetDefault = 0,
      pagesizeDefault = 10,
      q = {};
  q['query'] = "*";
  if (req.query['q']) {
    q['query'] = req.query['q'].toLowerCase().split(' ');
  }
  if (req.query['searchFields']) {
    q['searchFields'] = req.query.searchFields;
  }
  if (req.query['offset']) {
    q['offset'] = req.query['offset'];
  } else {
    q['offset'] = offsetDefault;
  }
  if (req.query['pagesize']) {
    q['pageSize'] = req.query['pagesize'];
  } else {
    q['pageSize'] = pagesizeDefault;
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
  res.sendfile(path.join(__dirname, '../public/search.html'));
});


app.get('/calibrate', function(req, res) {
  si.calibrate(function(msg) {
    res.send(msg);
  });
});


app.get('/README.md', function(req, res) {
  res.sendfile('README.md');
});


app.get('/indexPeek', function(req, res) {
  si.indexPeek(req.query['start'], req.query['stop'], function(msg) {
    res.send(msg);
  });
});


app.get('/indexData', function(req, res) {
  si.indexData(function(msg) {
    res.send(msg);
  });
});


app.post('/delete', function(req, res) {
  si.deleteDoc(req.body.docID, function(msg) {
    res.send(msg);
  });
});


app.get('/searchgui', function(req, res) {
  res.send('Welcome to Forage');
});


//curl localhost:3000/search?q=aberdeen\&weight=%22category%22:10
app.get('/search', function(req, res) {
  var q = getQuery(req);
  si.search(q, function(msg) {
    res.send(msg);
  });
});


//curl --form document=@testdata.json http://localhost:3000/indexer
//--form facetOn=topics
app.post('/indexer', function(req, res) {
  console.log('requested indexer');
  var filters = [];
  if (req.body.filterOn) {
    filters = req.body.filterOn.split(',');
  }
  fs.readFile(req.files.document.path, {'encoding': 'utf8'}, function(err, batch) {
    if(err) return res.send(500, 'Error reading document');
    si.index(batch, req.files.document.name, filters, function(msg) {
      res.send(msg);
    });
  });
});

