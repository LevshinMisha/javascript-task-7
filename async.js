'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

let setMaxTime = (time, promise) => () => new Promise((resolve, reject) => {
    promise().then(resolve, reject);
    setTimeout(() => reject(new Error('Timeout ¯\\_(ツ)_/¯ ')), time);
});

class Pool {
    constructor(promises, maxCount, maxTime) {
        this.promises = promises.map((promise, i) => {
            return { promise: setMaxTime(maxTime, promise), index: i };
        });
        this.promisesCount = promises.length;
        this.maxCount = maxCount;
        this.finished = 0;
        this.results = [];
    }

    start() {
        return new Promise(func => {
            if (this.maxCount > 0 && this.promisesCount) {
                let firstPromises = this.promises.slice(0, this.maxCount);
                this.promises = this.promises.slice(this.maxCount);
                firstPromises.forEach(promiseObj => {
                    this.run(func, promiseObj.promise, promiseObj.index);
                });
            } else {
                func(this.results);
            }
        });
    }

    run(func, promise, index) {
        promise()
            .then(result => this.onResult(func, result, index))
            .catch(result => this.onResult(func, result, index));
    }

    onResult(func, index, result) {
        this.results[index] = result;
        this.finished++;
        if (this.promisesCount === this.finished) {
            func(this.results);
        } else if (this.promises.length) {
            let promiseObj = this.promises.shift();
            this.run(func, promiseObj.promise, promiseObj.index);
        }
    }
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 */

function runParallel(jobs, parallelNum, timeout = 1000) {
    return new Pool(jobs, parallelNum, timeout).start();
}
