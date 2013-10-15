var fs = require('fs');
var cheerio = require('cheerio');
var urllib = require('url');

var program = require('commander');
program
  .version('0.2.3')
  .option('-f, --fetchdirectory <fetchdirectory>', 'specify the fetch directory,'
          + ' defaults to crawl/fetch/ (MUST END WITH SLASH /)',
          String, 'fetch/')
  .option('-d, --documentdirectory <documentdirectory>', 'specify the document directory,'
          + ' defaults to crawl/doc/ (MUST END WITH SLASH /)',
          String, 'doc/')
  .parse(process.argv);


var fetchdir = program.fetchdirectory;
var docdir = program.documentdirectory;

if (!fs.existsSync(docdir)) {
  fs.mkdirSync(docdir);
}

fs.readdir(fetchdir, function(err, files){
  if (err) throw err;
  files.forEach(function(file) {

    var html = fs.readFileSync(fetchdir + file).toString();
    if(!html) {
      console.log('weirdness');
    } else {
      var $ = cheerio.load(html);
      var doc = {};
      $("meta").each(function(i, e) {
        var meta = $(e);
        doc[meta.attr('name')] = doc[meta.attr('content')];
      });
      $("title").each(function(i, e) {
        var title = $(e);
        doc['title'] = title.text();
      });
      $("div.entry-content").each(function(i, e) {
        var body = $(e);
        doc['body'] = body.text().replace(/\s+/g, ' ');
      });

      var batch = {};
      batch[file] = doc;
      var saved = fs.writeFileSync(docdir + file, JSON.stringify(batch), 'utf8');      
    }

  });
});
