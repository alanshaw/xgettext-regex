var fs = require('fs')
var path = require('path')
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
  opts.fn = opts.fn || '_'
  // Thanks!
  // http://blog.stevenlevithan.com/archives/match-quoted-string
  opts.regex = opts.regex || new RegExp(opts.fn + '\\(((["\'])(?:(?=(\\\\?))\\3.)*?\\2)\\)', 'g')
  opts.regexTextCaptureIndex = opts.regexTextCaptureIndex || 1

  var lineNum = 0

  return combine(
    split(),
    through(function (line, enc, cb) {
      line = line.toString()

      var matches
      var first = true

      while ((matches = opts.regex.exec(line)) !== null) {
        var entry = '\n'

        if (first) {
          entry += '#: ' + filename + ':' + lineNum + '\n'
          first = false
        }

        var text = matches[opts.regexTextCaptureIndex]

        if (text[0] == "'") {
          text = text.slice(1, -1)
          text = text.replace(/\\'/g, "'")
          text = '"' + text.replace(/"/g, '\\"') + '"'
        }

        entry += 'msgid ' + text + '\n'
        entry += 'msgstr ' + text + '\n'

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

  return readable.pipe(createDuplexFileStream(opts))
}

function getText (filename, opts) {
  return fs.createReadStream(filename).pipe(createDuplexStream(filename, opts))
}

var READDIRP_OPTS = {
  fileFilter: ['!.*', '!*.png', '!*.jpg', '!*.gif', , '!*.zip', , '!*.gz'],
  directoryFilter: ['!.*', '!node_modules', '!coverage']
}

function createDuplexFileStream (opts) {
  opts = opts || {}
  opts.readdirp = opts.readdirp || {}

  return through(function (filename, enc, cb) {
    var self = this
    filename = filename.toString()
    cb = once(cb)

    self.push('#, fuzzy\n')
    self.push('msgid ""\n')
    self.push('msgstr ""\n')
    self.push('"Content-Type: text/plain; charset=UTF-8\\n"\n')

    fs.stat(filename, function (er, stats) {
      if (er) return cb(er)

      if (stats.isFile()) {
        getText(filename, opts)
          .on('data', function (entry) {self.push(entry)})
          .on('error', function (er) {
            console.error('File getText error', filename, er)
            cb(er)
          })
          .on('end', function () {
            cb()
          })
      } else if (stats.isDirectory()) {
        var total = 0
        var complete = 0
        var readdirpComplete = false

        readdirp(xtend(READDIRP_OPTS, opts.readdirp, {root: filename}))
          .on('data', function (entry) {
            total++

            getText(entry.fullPath, opts)
              .on('data', function (entry) {self.push(entry)})
              .on('error', function (er) {
                console.error('Directory getText error', entry.fullPath, er)
                cb(er)
              })
              .on('end', function () {
                complete++
                if (total == complete && readdirpComplete) cb()
              })
          })
          .on('error', function (er) {
            console.error('Directory error', filename, er)
            cb(er)
          })
          .on('end', function () {
            readdirpComplete = true
          })
      }
    })
  })
}