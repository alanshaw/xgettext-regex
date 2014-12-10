#!/usr/bin/env node
var fs = require('fs')
var argv = require('minimist')(process.argv.slice(2))
var path = require('path')
var xgettext = require('../')

if (argv.v || argv.version) {
  return console.log(require('../package.json').version)
}

if (argv.h || argv.help) {
  return fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout)
}

var outFile = argv.o || argv.outfile
var opts = {
  fn: (argv.f || argv.fn)
}

if (argv._.length) {
  var files = argv._.map(function (filename) { return path.resolve(filename) })
  var readable = xgettext.createReadStream(files, opts)

  if (outFile) {
    readable.pipe(fs.createWriteStream(outFile))
  } else {
    readable.pipe(process.stdout)
  }
} else {
  var duplex = xgettext('process.stdin', opts)

  if (outFile) {
    process.stdin.pipe(duplex).pipe(fs.createWriteStream(outFile))
  } else {
    process.stdin.pipe(duplex).pipe(process.stdout)
  }
}