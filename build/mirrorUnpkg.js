const fs = require('fs')

const files = [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js'
]

Promise.all(
  files.map(f =>
    fetch('https://unpkg.com/swagger-ui-dist@4.5.0/' + f)
      .then(res => res.text())
      .then(text => fs.promises.writeFile('www_root/openapi/' + f, text))
  )
)
