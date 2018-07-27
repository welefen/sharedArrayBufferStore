/**
 * search buffer in another buffer
 * @TODO use KMP
 * @param {Buffer} buffer 
 * @param {Buffer} search 
 * @param {Int} start 
 * @param {Int} end 
 * @param {Int} sep 
 */
module.exports = function find(buffer, search, start = 0, end = 0, sep = 0) {
  end = end || buffer.length;
  const len = search.length;
  for(let i = start; i < end; i++){
    if (buffer[i] === sep) continue;
    let j = 0;
    for(j = 0; j < len; j++){
      if (buffer[i + j] !== search[j]) break;
    }
    if (j === len && sep === buffer[i + len]) return i;
  }
}