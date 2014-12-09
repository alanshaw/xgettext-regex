var fs = require('fs')
var through = require('through2')
var readdirp = require('readdirp')
var once = require('once')
var split = require('split')
var xtend = require('xtend')
var combine = require('stream-combiner')

function createGetTextStream () {
  //console.log('getText', filename)

  var lineNum = 0
  var getTextRegex = /_\('(.+?)'\)/g

  return combine(
    split(),
    through(function (line, enc, cb) {
      line = line.toString()
      //console.log('Got line', filename, line)

      var matches
      var first = true

      while ((matches = getTextRegex.exec(line)) !== null) {
        var entry = ''

        if (first) {
          entry += '#: ' + filename + ':' + lineNum + '\n'
          first = false
        }

        var str = matches[1].replace('"', '\\"')

        entry += 'msgid "' + str + '"\n'
        entry += 'msgstr "' + str + '"\n\n'

        this.push(entry)
      }

      lineNum++
      cb()
    })
  )
}

module.exports = createGetTextStream

function getText (filename) {
  return fs.createReadStream(filename)
    .pipe(split())
    .pipe(createGetTextStream())
}

var READDIRP_DEFAULTS = {
  fileFilter: ['!.*', '!*.png', '!*.jpg', '!*.gif', , '!*.zip', , '!*.gz'],
  directoryFilter: ['!.*', '!node_modules', '!coverage']
}

module.exports = function (opts) {
  opts = opts || {}
  opts.readdirp = opts.readdirp || {}

  return through(function (filename, enc, cb) {
    var self = this
    filename = filename.toString()
    cb = once(cb)

    fs.stat(filename, function (er, stats) {
      if (stats.isFile()) {
        getText(filename)
          .on('data', function (entry) {self.push(entry)})
          .on('error', function (er) {
            console.error('File getText error', filename, er)
            cb(er)
          })
          .on('end', function () {
            //console.log('File getText end', filename)
            cb()
          })
      } else if (stats.isDirectory()) {
        var total = 0
        var complete = 0
        var readdirpComplete = false

        readdirp(xtend(READDIRP_DEFAULTS, opts.readdirp, {root: filename}))
          .on('data', function (entry) {
            //console.log('Got entry', entry.fullPath)

            total++

            getText(entry.fullPath)
              .on('data', function (entry) {self.push(entry)})
              .on('error', function (er) {
                console.error('Directory getText error', entry.fullPath, er)
                cb(er)
              })
              .on('end', function () {
                //console.log('Directory getText end', entry.fullPath)
                complete++
                if (total == complete && readdirpComplete) cb()
              })
          })
          .on('error', function (er) {
            console.error('Directory error', filename, er)
            cb(er)
          })
          .on('end', function () {
            //console.log('Directory end', filename)
            readdirpComplete = true
          })
      }
    })
  })
}