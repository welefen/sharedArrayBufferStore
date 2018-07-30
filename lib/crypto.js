const crypto = {
  encode(str, encoding = 'utf8') {
    return Buffer.from(str + '', encoding);
  },
  decode(buffer, encoding = 'utf8') {
    if (encoding === null) return Buffer.from(buffer);
    return Buffer.from(buffer).toString(encoding);
  }
};

module.exports = crypto;
