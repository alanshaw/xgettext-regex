# xgettext-regex

Minimum viable xgettext .pot file generator. Uses a configurable regex to get translation keys.

## Examples

```sh
cat foo.js | xgettext-regex # Output to stdout
xgettext-regex foo.js -o foo.po # Output to foo.po
xgettext-regex app-dir -o app.po # Recursive read directory
```

```js
var fs = require('fs')
var xgettext = require('xgettext-regex')

var src = '/path/to/file'
var dest = '/path/to/en-GB.po'
var opts = {}

fs.createReadStream(src)
  .pipe(xgettext(src, opts))
  .pipe(fs.createWriteStream(dest))
```

```js
var fs = require('fs')
var xgettext = require('xgettext-regex')

var files = ['/path/to/file.js', '/path/to/html/dir']
var opts = {}

xgettext.createReadStream(files, opts))
  .pipe(fs.createWriteStream('/path/to/en-GB.po'))
```

## Options

```js
opts = {
    /* i18n funciton name */
    fn: '_',
    /* The regex used to match i18n function calls */
    regex: /_\(((["'])(?:(?=(\\?))\3.)*?\2)\)/g,
    /* Capture index for the i18n text in the above regex */
    regexTextCaptureIndex: 1,
    /* readdirp filters etc. */
    readdirp: {
      fileFilter: ['!.*', '!*.png', '!*.jpg', '!*.gif', , '!*.zip', , '!*.gz'],
      directoryFilter: ['!.*', '!node_modules', '!coverage']
    }
}
```

## PO header

Remember to add a utf8 charset header to the output if you're using non-ASCII characters e.g.

```
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\n"
```