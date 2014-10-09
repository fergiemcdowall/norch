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
program = require('commander'),
morgan = require('morgan'),

program
  .version('0.2.3')
  .option('-p, --port <port>', 'specify the port, defaults to 3030', Number, 3030)
  .option('-n, --hostname <hostname>', 'specify the hostname, defaults to 0.0.0.0 (INADDR_ANY)', String, '0.0.0.0')
  .parse(process.argv);

app.listen(program.port);
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname,
                                   '../node_modules/norch-bootstrap')));

var multer = require('multer');
//to save uploaded files do "app.use(multer({ dest: './tmp/'}));"
app.use(multer());


//curl --form document=@testdata.json http://localhost:3030/indexer
//--form facetOn=topics
app.post('/indexer', function(req, res) {
  var filters = [];
  if (req.body.filterOn) {
    filters = req.body.filterOn.split(',');
  }
  if (req.files.document) {
    fs.readFile(req.files.document.path, {'encoding': 'utf8'}, function(err, batch) {
      if(err) return res.status(500).send('Error reading document');

      try {
          si.add(JSON.parse(batch), req.files.document.name, filters, function (msg) {
              res.send(msg);
          });
      } catch (e) {
          res.status(500).send("Failed to index document.\n")
      }
    });
  }
  else {
    si.add(JSON.parse(req.body.document), 'JSON', filters, function(msg) {
      res.send(msg);
    });
  }
});


if (process.argv.indexOf('-h') == -1) {
  http.createServer(app).listen(app.get('port'), app.get('hostname'), function(){
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
    console.log('Norch server listening on hostname ' + program.hostname + ' on port ' + program.port);
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
  if (req.query['fieldedQuery']) {
    q['fieldedQuery'] = req.query.fieldedQuery;
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
  if (req.query['teaser']) {
    q['teaser'] = req.query.teaser;
  }
  //&filter[topics][]=cocoa&filter[places][]=usa
  if (req.query['filter']) {
    q['filter'] = req.query.filter;
  }
  console.log(q);
  return q;
}

app.get('/matcher', function(req, res) {
  si.match(req.query['beginsWith'], function(msg) {
    res.send(msg);
  });
});


app.get('/getDoc', function(req, res) {
  si.get(req.query['docID'], function(msg) {
    res.send(msg);
  });
});


app.get('/calibrate', function(req, res) {
  si.calibrate(function(msg) {
    res.send(msg);
  });
});


app.get('/empty', function(req, res) {
  si.empty(function(msg) {
    res.send(msg);
  });
});


//curl http://localhost:3030/snapshot -o snapshot.gz
app.get('/snapShot', function(req, res) {
  si.snapShot(function(readStream) {
    readStream.pipe(res);
  });
});


//curl -X POST http://localhost:3030/replicate --data-binary @snapshot.gz -H "Content-Type: tion/gzip"
app.post('/replicate', function(req, res) {
  si.replicate(req, function(msg){
    res.send('completed');
  });
});


app.get('/README.md', function(req, res) {
  res.sendFile('README.md');
});


app.get('/package.json', function(req, res) {
  res.set('Content-Type', 'text/plain').sendFile('package.json');;
});


app.get('/indexPeek', function(req, res) {
  si.indexPeek(req.query['start'], req.query['stop'], function(msg) {
    res.send(msg);
  });
});


app.get('/indexData', function(req, res) {
  si.add(function(msg) {
    res.send(msg);
  });
});


app.post('/delete', function(req, res) {
  si.del(req.body.docID, function(msg) {
    res.send(msg);
  });
});


app.get('/searchgui', function(req, res) {
  res.send('Welcome to Norch');
});


//curl localhost:3030/search?q=aberdeen\&weight=%22category%22:10
app.get('/search', function(req, res) {
  var q = getQuery(req);
  si.search(q, function(msg) {
    res.send(msg);
  });
});
