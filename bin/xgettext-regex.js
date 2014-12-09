#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2))
var path = require('path')
var xgettext = require('../')

if (argv._.length) {
  var files = argv._.map(function (filename) { return path.resolve(filename) }
  var readable = xgettext.createReadStream(files)
  if (argv.o || argv.output) {
    readable.pipe(fs.createWriteStream(argv.o || argv.output))
  } else {
    readable.pipe(process.stdout)
  }
} else {
  process.stdin.pipe(xgettext()).pipe(process.stdout)
}