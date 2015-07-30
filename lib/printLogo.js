module.exports = function(program) {
  var colors = require('colors');
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
  console.log('Norch server listening on hostname ' +
              program.hostname + ' on port ' +
              program.port);
  console.log();
}
