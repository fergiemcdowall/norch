// use this script to run a norch from a node prompt
// "> node runNorch.js" instead of "norch"

var program = require('commander')
program.version(require('../package.json').version)
  .option('-o, --siOptions <siOptions>', 'specify search-index options', String, "{}")
  .option('-p, --port <port>', 'specify the port, defaults to PORT or 3030', Number, process.env.PORT || 3030)
  .option('-i, --norchHome <norchHome>', 'specify the name of the directory that stores the data and the logs, defaults to norch-index', String, 'norch-index')
  .option('-l, --logLevel <logLevel>', 'specify the loglevel- silly | debug | verbose | info | warn | error', String, 'info')
  .option('-m, --machineReadable', 'machine readable, logo not printed, all stdout/stderr is JSON')
  .parse(process.argv)

var options = {}
options.norchHome = program.norchHome
options.logLevel = program.logLevel
options.port = program.port
options.machineReadable = program.machineReadable || false
options.siOptions = JSON.parse(program.siOptions)

require('./norch.js')(options, function (err, norch) {
  if (err) console.log(err)
  // what to do here?
  return norch
})
