require('browserify')(require('path').join(__dirname, '/test.js'))
  .bundle()
  .pipe(require('browser-run')())
  .pipe(process.stdout)
