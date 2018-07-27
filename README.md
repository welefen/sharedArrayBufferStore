# sharedArrayBufferStore

use sharedArrayBuffer to store data

## Install

```
npm install shared-array-buffer-store
```

## How to use

```js
const SharedArrayBufferStore = require('shared-array-buffer-store');
const instance = new SharedArrayBufferStore(options);
//set data
instance.set('name', 'value');
//get data
instance.get('name');
//delete key
instance.delete('name');
// get all keys
const keys = instance.keys();
```

### options

* `keyBuffer` {sharedArrayBuffer} store key buffer
* `keyBufferLength` {Number} store key buffer size, default is `1024 * 1024 * 5`
* `valueBuffer` {sharedArrayBuffer} store value buffer
* `valueBufferLength` {Number} store key buffer size, default is `1024 * 1024 * 100`
* `reservedLength` {Number} reserved size in key buffer and value buffer, default is 1
* `encrypt`
  * `encode(string, encoding)`
  * `decode(buffer, encoding)`