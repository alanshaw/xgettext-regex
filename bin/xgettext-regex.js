#!/usr/bin/env node
var fs = require('fs')
var argv = require('minimist')(process.argv.slice(2))
var path = require('path')
var xgettext = require('../')

var outFile = argv.o || argv.output

if (argv._.length) {
  var files = argv._.map(function (filename) { return path.resolve(filename) })
  var readable = xgettext.createReadStream(files)
  if (outFile) {
    readable.pipe(fs.createWriteStream(outFile))
  } else {
    readable.pipe(process.stdout)
  }
} else {
  if (outFile) {
    process.stdin.pipe(xgettext()).pipe(fs.createWriteStream(outFile))
  } else {
    process.stdin.pipe(xgettext()).pipe(process.stdout)
  }
}