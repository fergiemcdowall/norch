var fs = require('fs');
var request = require('request');


var program = require('commander');
program
  .version('0.2.3')
  .option('-d, --documentdirectory <documentdirectory>', 'specify the document directory,'
          + ' defaults to crawl/doc/ (MUST END WITH SLASH /)',
          String, 'doc/')
  .option('-e, --endpoint <endpoint>', 'specify the forage endpoint,',
          String, 'http://localhost:3000/indexer')
  .parse(process.argv);

var docdir = program.documentdirectory;


fs.readdir(docdir, function(err, files){
  if (err) throw err;
  files.forEach(function(file) {
    var r = request.post(program.endpoint)
    var form = r.form()
    form.append('document', fs.createReadStream(docdir + file));
  });
});
