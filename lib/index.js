const Encrypt = require('./encrypt');
const Find = require('./find');
const Lock = require('./lock');

const keyPrefix = '$';
const sep = 0;
module.exports = class SharedArrayBufferStore {
  constructor({
    keyBuffer,
    keyBufferLength = 1024 * 1024 * 5,
    valueBuffer,
    valueBufferLength = 1024 * 1024 * 100,
    reservedLength = 1,
    encrypt = Encrypt
  } = {}) {
    this.keyBuffer = keyBuffer || new SharedArrayBuffer(keyBufferLength * Uint32Array.BYTES_PER_ELEMENT);
    this.valueBuffer = valueBuffer || new SharedArrayBuffer(valueBufferLength * Uint32Array.BYTES_PER_ELEMENT);
    this.keyArray = new Uint32Array(this.keyBuffer);
    this.valueArray = new Uint32Array(this.valueBuffer);
    this.encrypt = encrypt;
    this.reservedLength = reservedLength;
    this.keyPrefixLength = this.keyArray.length.toString().length;
    this.valuePrefixLength = this.valueArray.length.toString().length;
    this.keyLock = new Lock(this.keyBuffer, 0);
    this.valueLock = new Lock(this.valueBuffer, 0);
  }
  padStart(str, len) {
    return str.toString().padStart(len, '0');
  }
  getKeyStorePos() {
    const prefixLength = this.keyPrefixLength;
    const prefix = this.keyArray.slice(this.reservedLength, this.reservedLength + prefixLength);
    const pos = parseInt(this.encrypt.decode(prefix), '10') || 0;
    if (!pos) return prefixLength + this.reservedLength + 1;
    return pos;
  }
  updateKeyStorePos(pos) {
    const prefixLength = this.keyPrefixLength;
    pos = this.padStart(pos, prefixLength);
    const buf = this.encrypt.encode(pos);
    for (let i = 0; i < prefixLength; i++) {
      this.keyArray[i + this.reservedLength] = buf[i];
    }
  }
  getValueStorePos() {
    const prefixLength = this.valuePrefixLength;
    const prefix = this.valueArray.slice(this.reservedLength, this.reservedLength + prefixLength);
    const pos = parseInt(this.encrypt.decode(prefix), '10') || 0;
    if (!pos) return this.reservedLength + prefixLength + 1;
    return pos;
  }
  updateValueStorePos(pos) {
    const prefixLength = this.valuePrefixLength;
    pos = this.padStart(pos, prefixLength);
    const buf = this.encrypt.encode(pos);
    for (let i = 0; i < prefixLength; i++) {
      this.valueArray[i + this.reservedLength] = buf[i];
    }
  }
  /**
   * get key buffer
   * @param {String} key
   */
  getKeyBuf(key) {
    if (typeof key !== 'string') return key;
    return this.encrypt.encode(`${keyPrefix}${key}`);
  }
  getRealKey(keyArray) {
    const str = this.encrypt.decode(keyArray);
    return str.slice(keyPrefix.length);
  }
  /**
   * @param {String} key
   */
  getKeyStoreProps(key) {
    const keyBuf = this.getKeyBuf(key);
    const keyPos = this.getKeyStorePos();
    const pos = Find(this.keyArray, keyBuf, this.keyPrefixLength + this.reservedLength, keyPos, sep);
    // if key not exist, return
    if (pos === undefined) return;
    // get start and length
    const startPos = pos + keyBuf.length + 1;
    let start = this.keyArray.slice(startPos, startPos + this.valuePrefixLength);
    let length = this.keyArray.slice(startPos + this.valuePrefixLength + 1, startPos + 2 * this.valuePrefixLength + 1);
    start = parseInt(this.encrypt.decode(start), '10');
    length = parseInt(this.encrypt.decode(length), '10');
    return [start, length, pos];
  }

  addKey(key, start, length) {
    key = this.getKeyBuf(key);
    start = this.encrypt.encode(this.padStart(start, this.valuePrefixLength));
    length = this.encrypt.encode(this.padStart(length, this.valuePrefixLength));
    let pos = this.getKeyStorePos();
    const newPos = pos + key.length + start.length + length.length + 3;
    for (let i = 0, len = key.length; i < len; i++) {
      this.keyArray[pos + i] = key[i];
    }
    pos += key.length + 1;
    for (let i = 0, len = start.length; i < len; i++) {
      this.keyArray[pos + i] = start[i];
    }
    pos += start.length + 1;
    for (let i = 0, len = length.length; i < len; i++) {
      this.keyArray[pos + i] = length[i];
    }
    if (pos + length.length > this.keyArray.length) {
      throw new Error('keyArray size is not enough');
    }
    this.updateKeyStorePos(newPos);
  }

  updateKey(key, pos, start, length) {
    key = this.getKeyBuf(key);
    start = this.encrypt.encode(this.padStart(start, this.valuePrefixLength));
    length = this.encrypt.encode(this.padStart(length, this.valuePrefixLength));
    pos = pos + key.length + 1;
    for (let i = 0, len = start.length; i < len; i++) {
      this.keyArray[pos + i] = start[i];
    }
    pos += start.length + 1;
    for (let i = 0, len = length.length; i < len; i++) {
      this.keyArray[pos + i] = length[i];
    }
  }

  updateValueBuffer(buffer, pos) {
    buffer = this.encrypt.encode(buffer);
    for (let i = 0, len = buffer.length; i < len; i++) {
      this.valueArray[pos + i] = buffer[i];
    }
    if (pos + buffer.length > this.valueArray.length) {
      throw new Error(`valueArray size is not enough`);
    }
  }
  lock() {
    this.keyLock.lock();
    this.valueLock.lock();
  }
  unlock() {
    this.keyLock.unlock();
    this.valueLock.unlock();
  }

  get(key, encoding) {
    this.lock();
    const props = this.getKeyStoreProps(key);
    let data;
    if (props) {
      const result = this.valueArray.slice(props[0], props[0] + props[1]);
      data = this.encrypt.decode(result, encoding);
    }
    this.unlock();
    return data;
  }

  set(key, value, encoding) {
    this.lock();
    key = this.getKeyBuf(key);
    value = this.encrypt.encode(value, encoding);
    const valueLength = value.length;
    const keyProps = this.getKeyStoreProps(key);
    const pos = this.getValueStorePos();
    // key not exist
    if (!keyProps) {
      this.addKey(key, pos, valueLength);
      this.updateValueStorePos(pos + valueLength);
      this.updateValueBuffer(value, pos);
    } else {
      if (keyProps[1] >= valueLength) {
        if (keyProps[1] > valueLength) {
          this.updateKey(key, keyProps[2], keyProps[0], valueLength);
        }
        this.updateValueBuffer(value, keyProps[0]);
      } else {
        this.updateKey(key, keyProps[2], pos, valueLength);
        this.updateValueBuffer(value, pos);
      }
    }
    this.unlock();
  }
  delete(key) {
    this.lock();
    key = this.getKeyBuf(key);
    const keyProps = this.getKeyStoreProps(key);
    if (keyProps) {
      const end = keyProps[2] + key.length + 2 * this.valuePrefixLength + 3;
      for (let i = keyProps[2]; i < end; i++) {
        this.keyArray[i] = sep;
      }
    }
    this.unlock();
  }
  /**
   * get all keys
   */
  keys() {
    this.lock();
    const keyPos = this.getKeyStorePos();
    let startPos = this.reservedLength + this.keyPrefixLength + 1;
    const keys = [];
    const key = [];
    const stepLen = this.valuePrefixLength * 2 + 2;
    while (startPos < keyPos) {
      const item = this.keyArray[startPos];
      if (item === sep) {
        if (key.length === 0) {
          startPos++;
          continue;
        }
        keys.push(this.getRealKey(key));
        key.length = 0;
        startPos += stepLen;
      } else {
        key.push(item);
      }
      startPos++;
    }
    this.unlock();
    return keys;
  }
};
