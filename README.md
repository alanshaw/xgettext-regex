# xgettext-regex

Minimum viable xgettext .po file generator. Uses a configurable regex to get translation keys.

## Examples

```sh
cat foo.js | xgettext-regex # Output to stdout
xgettext-regex foo.js -o foo.po # Output to foo.po
xgettext-regex app-dir -o app.po # Recursive read directory
```

```js
var fs = require('fs')
var xgettext = require('xgettext-regex')

var opts = {}

fs.createReadStream('/path/to/file')
  .pipe(xgettext(opts))
  .pipe(fs.createWriteStream('/path/to/en-GB.po'))
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