var fs = require('fs')
var Readable = require('stream').Readable
var through = require('through2')
var readdirp = require('readdirp')
var once = require('once')
var split = require('split')
var xtend = require('xtend')
var combine = require('stream-combiner')

function createDuplexStream (filename, opts) {
  filename = filename || ''
  opts = opts || {}
  // Thanks!
  // http://blog.stevenlevithan.com/archives/match-quoted-string
  opts.regex = opts.regex || /_\(((["'])(?:(?=(\\?))\3.)*?\2)\)/g
  //console.log('getText', filename)

  var lineNum = 0

  return combine(
    split(),
    through(function (line, enc, cb) {
      line = line.toString()
      //console.log('Got line', filename, line)

      var matches
      var first = true

      while ((matches = opts.regex.exec(line)) !== null) {
        //console.log(matches)
        var entry = ''

        if (first) {
          entry += '#: ' + filename + ':' + lineNum + '\n'
          first = false
        }

        entry += 'msgid ' + matches[1] + '\n'
        entry += 'msgstr ' + matches[1] + '\n\n'

        this.push(entry)
      }

      lineNum++
      opts.regex.lastIndex = 0
      cb()
    })
  )
}

module.exports = createDuplexStream

module.exports.createReadStream = function (files, opts) {
  if (!Array.isArray(files)) files = [files]

  var index = 0
  var readable = new Readable()

  readable._read = function () {
    var push = true

    while (push && index < files.length) {
      push = this.push(files[index])
      index++
    }

    this.push(null)
  }

  return readable.pipe(createFileDuplexStream(opts))
}

function getText (filename, opts) {
  return fs.createReadStream(filename).pipe(createDuplexStream(filename, opts))
}

var READDIRP_OPTS = {
  fileFilter: ['!.*', '!*.png', '!*.jpg', '!*.gif', , '!*.zip', , '!*.gz'],
  directoryFilter: ['!.*', '!node_modules', '!coverage']
}

function createFileDuplexStream (opts) {
  opts = opts || {}
  opts.readdirp = opts.readdirp || {}

  return through(function (filename, enc, cb) {
    var self = this
    filename = filename.toString()
    cb = once(cb)

    fs.stat(filename, function (er, stats) {
      if (stats.isFile()) {
        getText(filename, opts)
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

        readdirp(xtend(READDIRP_OPTS, opts.readdirp, {root: filename}))
          .on('data', function (entry) {
            //console.log('Got entry', entry.fullPath)

            total++

            getText(entry.fullPath, opts)
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