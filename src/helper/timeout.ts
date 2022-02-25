export class TimeoutError extends Error {
    constructor() {
        super('TimeoutError');
        this.name = 'CustomError';
        Object.setPrototypeOf(this, TimeoutError.prototype);
    }
}

export const timeout = function (promise: any, timeoutMillis: number = 500) {
    const error = new TimeoutError();
    let timeout: NodeJS.Timeout;

    return Promise.race([
        promise,
        new Promise(function (resolve, reject) {
            timeout = setTimeout(function () {
                reject(error);
            }, timeoutMillis);
        }),
    ]).then(function (v) {
        clearTimeout(timeout);
        return v;
    }, function (err) {
        clearTimeout(timeout);
        throw err;
    });
};