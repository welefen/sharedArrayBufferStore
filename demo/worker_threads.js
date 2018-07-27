// node >= v10
// node --experimental-worker worker_threads.js

const {
  Worker, isMainThread, parentPort, workerData
} = require('worker_threads');
const files = require('./files');
const SharedArrayBufferStore = require('../lib/index');

if (isMainThread) {
  const instance = new SharedArrayBufferStore();

  files.forEach(item => {
    instance.set(item.file, item.content);
  });
  const workers = [];
  const workerLength = 4;
  let currentIndex = 0;
  const allTimes = {};
  [...new Array(workerLength)].forEach(item => {
    const worker = new Worker(__filename, {
      workerData: {
        keyBuffer: instance.keyBuffer,
        valueBuffer: instance.valueBuffer
      }
    });
    worker.on('message', d => {
      promises[d.file].resolve();
      allTimes[d.file] = d.time;
      const data = files[currentIndex++];
      data && worker.postMessage({file: data.file, time: Date.now()});
    });
    worker.on('error', err => {
      console.error('error', err);
    });
    workers.push(worker);
  });
  const promises = {};
  setTimeout(() => {
    files.map((item, index) => {
      if (index < workerLength) {
        workers[index].postMessage({file: item.file, time: Date.now()});
        currentIndex = index;
      }
      const obj = {};
      obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
      });
      promises[item.file] = obj;
    });
    const all = Object.values(promises).map(item => item.promise);
    const start = Date.now();
    Promise.all(all).then(() => {
      console.error(allTimes);
      console.error('all times', Date.now() - start);
    });
  }, 1000);
} else {
  const UglifyJS = require('uglify-es');
  // let fileNums = 0;
  const instance = new SharedArrayBufferStore({
    keyBuffer: workerData.keyBuffer,
    valueBuffer: workerData.valueBuffer
  });
  parentPort.on('message', data => {
    // console.log('receive', data.file, Date.now() - data.time, threadId, ++fileNums);
    const content = instance.get(data.file, 'utf8');
    const start = Date.now();
    const result = UglifyJS.minify(content);
    instance.set(data.file, result.code);
    parentPort.postMessage({file: data.file, time: Date.now() - start});
  });
}
