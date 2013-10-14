var cheerio = require('cheerio');
var http = require('http');
var urllib = require('url');
var colors = require('colors');
var fs = require('fs');

var program = require('commander');
program
  .version('0.2.3')
  .option('-d, --directory <directory>', 'specify the fetch directory,'
          + ' defaults to fetch/ (MUST END WITH SLASH /)',
          String, 'fetch/')
  .option('-n, --hostname <hostname>', 'specify the hostname,',
          String, 'www.google.com')
  .option('-s, --starturl <starturl>',
          'specify the URL to start fetching from',
          String, '/')
  .parse(process.argv);

if (!fs.existsSync(program.directory)) { // or fs.existsSync
  fs.mkdirSync(program.directory);
}

var startURL = program.starturl;
var host = program.hostname;
var discoveredURLs = [startURL];
var crawledURLs = [];



// Utility function that downloads a URL and invokes
// callback with the data.
function download(url, callback) {
  http.get('http://' + host + url, function(res) {
    if (res.headers["content-type"].indexOf('html') == -1) {
      console.log(res.statusCode.toString().magenta
                  + ' ' + res.headers["content-type"]
                  + ': ' + url.toString().red + ' (SKIPPING)'.red);
      callback(null);
    }
    else {
      var data = "";
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on("end", function() {
        console.log(res.statusCode.toString().magenta
                    + ' ' + res.headers["content-type"]
                    + ': ' + url.toString().green);
        callback(data);
      });
    }
  }).on("error", function() {
    callback(null);
  });
}

crawlPage = function(url) {
  download(url, function(data) {
    if (data) {
      var $ = cheerio.load(data);
      $("a").each(function(i, e) {
        var link = $(e);
        if (!link.attr("href"))
          return
        if (urllib.parse(link.attr("href")).host != host)
          return
        var urlPath = urllib.parse(link.attr("href")).pathname;
        if (crawledURLs.indexOf(urlPath) != -1)
          return
        crawledURLs.push(urlPath);
        discoveredURLs.push(urlPath);
      });
      fs.writeFile(program.directory + encodeURIComponent(url), data, function(err) {
        if(err) {
          console.log(err);
        } else {
          //success
        }
      }); 
    }
    if (discoveredURLs.length > 0)
      crawlPage(discoveredURLs.shift())
    else
      console.log('finished fetch');
  });
}

crawlPage(startURL);
