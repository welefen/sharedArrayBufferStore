const test = require('ava');
const SharedArrayBufferStore = require('../lib/index');

test('init', t => {
  const instance = new SharedArrayBufferStore();
  t.is(instance.keyArray instanceof Uint32Array, true);
  t.is(instance.valueArray instanceof Uint32Array, true);
});

test('change length', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 10,
    valueBufferLength: 20
  });
  t.is(instance.keyArray.length, 10);
  t.is(instance.valueArray.length, 20);
});

test('get, key is undefined', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 10,
    valueBufferLength: 20
  });
  t.is(instance.get('test'), undefined);
});

test('get and set', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  t.is(instance.get('name'), 'test');
});

test('get and set, length not enough', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 10,
    valueBufferLength: 20
  });
  try {
    instance.set('name', 'test');
    t.is(1, 2);
  } catch (e) {
    t.is(e instanceof Error, true);
  }
});

test('get and set, reset', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.set('name', 'test2');
  t.is(instance.get('name'), 'test2');
});

test('get and set, reset2', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.set('name', 't');
  t.is(instance.get('name'), 't');
});

test('get and set, reset4', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.set('name', 'wwww');
  t.is(instance.get('name'), 'wwww');
});

test('get, buffer', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.set('name', 't');
  const data = instance.get('name', null);
  t.is(data instanceof Buffer, true);
  t.is(data[0], 116);
});

test('delete', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.delete('name');
  // console.log(instance.keyArray)
  t.is(instance.get('name'), undefined);
});

test('delete 2', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.delete('name');
  t.is(instance.get('name'), undefined);
});

test('delete 3', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.delete('name2');
  t.is(instance.get('name'), 'test');
});

test('delete 4', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.set('name1', 'test');
  instance.delete('name');
  t.is(instance.get('name1'), 'test');
});

test('get keys', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.set('name1', 'test');
  instance.delete('name');
  t.deepEqual(instance.keys(), ['name1']);
});

test('get keys 2', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  instance.set('name', 'test');
  instance.set('name1', 'test');
  t.deepEqual(instance.keys(), ['name', 'name1']);
});

test('get keys 3', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 200
  });
  t.deepEqual(instance.keys(), []);
});

test('set error', t => {
  const instance = new SharedArrayBufferStore({
    keyBufferLength: 100,
    valueBufferLength: 20
  });
  try {
    instance.set('value', 'fasdfafasdfasdfasdfafd');
    t.is(1, 2);
  } catch (e) {
    t.is(e instanceof Error, true);
  }
});
