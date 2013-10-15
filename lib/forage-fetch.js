var cheerio = require('cheerio');
var http = require('http');
var https = require('https');
var urllib = require('url');
var colors = require('colors');
var fs = require('fs');

var program = require('commander');
program
  .version('0.2.4')
  .option('-d, --directory <directory>', 'specify the fetch directory,'
          + ' defaults to fetch/ (MUST END WITH SLASH /)',
          String, 'fetch/')
  .option('-n, --hostname <hostname>', 'specify the hostname',
          String, 'www.google.com')
  .option('-p, --protocol <protocol>',
          'specify the protocol, defaults to http://',
          String, 'http')
  .option('-s, --starturl <starturl>',
          'specify the URL to start fetching from',
          String, '/')
  .parse(process.argv);

var directory = program.directory;
if (directory.slice(-1) != '/')
  directory += '/';
if (!fs.existsSync(directory)) { // or fs.existsSync
  fs.mkdirSync(directory);
}
var protocol = program.protocol;
if (protocol.slice(-3) != '://')
  protocol += '://';

var startURL = program.starturl;
var host = program.hostname;
var discoveredURLs = [startURL];
var crawledURLs = [];


function download(url, callback) {
  var fullURL = protocol + host + url;
  if (protocol == 'http://') {
    http.get(fullURL, function(res) {
      if (!res.headers["content-type"]) {
        callback(null);
      }
      else if (res.headers["content-type"].indexOf('html') == -1) {
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
  else if (protocol == 'https://') {
    https.get(fullURL, function(res) {
      if (!res.headers["content-type"]) {
        callback(null);
      }
      else if (res.headers["content-type"].indexOf('html') == -1) {
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
}

crawlPage = function(url) {
  download(url, function(data) {
    if (data) {
      var $ = cheerio.load(data);
      $("a").each(function(i, e) {
        var link = $(e);
        if (!link.attr('href'))
          return
        if (!link.attr('href').host) {
          //good! this is a relative URL
        }
        else if (link.attr('href').host != host) {
          return; //skip, this is an external URL
        }
        var urlPath = urllib.parse(link.attr('href')).pathname;
        if (crawledURLs.indexOf(urlPath) != -1)
          return
     //   console.log(urlPath);
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
    if (discoveredURLs.length > 0) {
      crawlPage(discoveredURLs.shift())
    }
    else
      console.log('finished fetch');
  });
}

crawlPage(startURL);
