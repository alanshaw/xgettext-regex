var fs = require('fs')
var Readable = require('stream').Readable
var test = require('tape')
var concat = require('concat-stream')
var xgettext = require('../')

test('Can create .pot from code', function (t) {
  t.plan(1)

  var src = new Readable
  src._read = function () {
    this.push('_("foobar")\n\n')
    this.push(null)
  }

  src
    .pipe(xgettext())
    .pipe(concat({encoding: 'string'}, function (pot) {
      t.ok(pot.indexOf('msgid "foobar"') > -1, 'msgid "foobar" exists')
      t.end()
    }))
})

test('Can deal with single quotes', function (t) {
  t.plan(1)

  var src = new Readable
  src._read = function () {
    this.push("blah;\n_('foobar')")
    this.push(null)
  }

  src
    .pipe(xgettext())
    .pipe(concat({encoding: 'string'}, function (pot) {
      t.ok(pot.indexOf('msgid "foobar"') > -1, 'msgid "foobar" exists')
      t.end()
    }))
})

test('Can deal with escaped quotes', function (t) {
  t.plan(2)

  var src = new Readable
  src._read = function () {
    this.push("\n_('foobar\\'s');\nif(true){_(\"air \\\"quotes\\\"\")}")
    this.push(null)
  }

  src
    .pipe(xgettext())
    .pipe(concat({encoding: 'string'}, function (pot) {
      t.ok(pot.indexOf('msgid "foobar\'s"') > -1, 'msgid "foobar\'s" exists')
      t.ok(pot.indexOf('msgid "air \\"quotes\\""') > -1, 'msgid "air \\"quotes\\"" exists')
      t.end()
    }))
})

test('Can create .pot from single file', function (t) {
  t.plan(1)

  xgettext.createReadStream(__dirname + '/fixtures/index.jade')
    .pipe(concat({encoding: 'string'}, function (pot) {
      t.ok(pot.indexOf('msgid "index.js"') > -1, 'msgid "index.js" exists')
      t.end()
    }))
})

test('Can change i18n function', function (t) {
  t.plan(1)

  var src = new Readable
  src._read = function () {
    this.push("blah;\ni18n('foobar')")
    this.push(null)
  }

  src
    .pipe(xgettext('src', {fn: 'i18n'}))
    .pipe(concat({encoding: 'string'}, function (pot) {
      t.ok(pot.indexOf('msgid "foobar"') > -1, 'msgid "foobar" exists')
      t.end()
    }))
})

test('Can create .pot from multiple files/directories', function (t) {
  t.plan(6)

  fs.readdir(__dirname + '/fixtures', function (er, files) {
    t.ifError(er, 'No error getting fixtures dir listing')

    files = files.map(function (f) {
      return __dirname + '/fixtures/' + f
    })

    xgettext.createReadStream(files)
      .pipe(concat({encoding: 'string'}, function (pot) {
        // app.js
        t.ok(pot.indexOf('msgid "app.js"') > -1, 'msgid "app.js" exists')
        t.ok(pot.indexOf('msgid "There\'s pie in them hills"') > -1, 'msgid "There\'s pie in them hills" exists')
        // plugin.js
        t.ok(pot.indexOf('msgid "w00t!"') > -1, 'msgid "w00t!" exists')
        // index.jade
        t.ok(pot.indexOf('msgid "index.js"') > -1, 'msgid "index.js" exists')
        // index.php
        t.ok(pot.indexOf('msgid "php hypertext preprocessor"') > -1, 'msgid "php hypertext preprocessor" exists')
        t.end()
      }))
  })
})