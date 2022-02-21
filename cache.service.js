const NodeCache = require ('node-cache/index');
const path = require('path');
const log = require('@manyos/logger').setupLog('SMILEconnect_' + path.basename(__filename));

class Cache {

    constructor(ttlSeconds) {
        log.debug('cache created. ttl seconds:', ttlSeconds);
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false });
    }

    get(key, storeFunction, bypassCache) {
        const value = this.cache.get(key);
        if (value && (!(bypassCache === true) || bypassCache === undefined)) {
            return Promise.resolve(value);
        }

        return storeFunction().then((result) => {
            this.cache.set(key, result);
            return result;
        });
    }

    del(keys) {
        log.debug('Delete cache keys', keys);
        this.cache.del(keys);
    }

    delStartWith(startStr = '') {
        if (!startStr) {
            return;
        }

        const keys = this.cache.keys();
        for (const key of keys) {
            if (key.indexOf(startStr) === 0) {
                this.del(key);
            }
        }
    }

    flush() {
        this.cache.flushAll();
    }

    getTtl(key) {
        return this.cache.getTtl(key);
    }
}


module.exports = Cache;