const files = require('./files');
const cluster = require('cluster');

if (cluster.isMaster) {
  const workers = [];
  const workerLength = 4;
  let currentIndex = 0;
  const allTimes = {};
  [...new Array(workerLength)].forEach(item => {
    const worker = cluster.fork();
    worker.on('message', d => {
      promises[d.file].resolve();
      allTimes[d.file] = d.time;
      const data = files[currentIndex++];
      data && worker.send({file: data.file, index: currentIndex - 1, time: Date.now()});
    });
    worker.on('error', err => {
      console.error('error', err);
    });
    workers.push(worker);
  });
  const promises = {};
  setTimeout(() => {
    files.forEach((item, index) => {
      if (index < workerLength) {
        workers[index].send({file: item.file, index, time: Date.now()});
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
  }, 2000);
} else {
  const UglifyJS = require('uglify-es');
  process.on('message', data => {
    // console.log(data.filepath, `workerId:${cluster.worker.id}`, `fileNums:${++fileNums}`)
    const content = files[data.index].content;
    const start = Date.now();
    UglifyJS.minify(content);
    process.send({file: data.file, time: Date.now() - start});
  });
};
