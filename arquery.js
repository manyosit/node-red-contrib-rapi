require('dotenv').config();
const fetch = require('node-fetch');
const path = require('path');
const log = require('@manyos/logger').setupLog('adapterFoundation' + path.basename(__filename));
const CacheService = require ('./cache.service');
let remedyCache
const objectHash = require('object-hash');

class ARAdapter {
    params = {}
    constructor(params) {
        this.params = params;
        remedyCache = new CacheService(params.cacheTime || 0); // Create a new cache service instance
    }

    async search(form, query, fields, options) {
        if (options === undefined) {
            options = {}
        }
        const key = objectHash({form, query, fields, options});
        const params = this.params;

        const port = this.getPort()

        const getLimits = this.getLimits;

        const setOptions = this.setUriOptions

        return remedyCache.get(key, async function() {
            let fullQuery = query;
            fullQuery = encodeURIComponent(fullQuery);

            const limits = {};

            const arOptions = {
                method: "GET",
                headers: {
                    'User-Agent': 'mode-red-rapi',
                    'Content-Type': 'application/json'
                }
            }
            log.debug('Use options for query', options);

            limits.globalDefault = Number.parseInt(params.limitDefault);
            limits.globalMax = Number.parseInt(params.limitMax);
            if (options) {
                limits.clientMax = Number.parseInt(options.clientLimit);
                limits.clientRequested = Number.parseInt(options.limit);
            }
            const limit = getLimits(limits);

            let uri = params.rapiUri
                + "/" + params.arServer
                + "/" + form
                + "/" + fullQuery
                + "?port=" + port
                + "&fields=" + fields;

            uri = setOptions(uri, options)

            //Use limit
            if (limit) {
                uri = uri + "&maxEntries=" + limit;
            }
            log.debug('start request on:', uri);

            const authHeader = `Basic ${encode64(`${params.arUser}:${params.arPassword}`)}`
            arOptions.headers['Authorization'] = authHeader

            const fetchResponse = await fetch(uri, arOptions)
            // catch errors
            if (fetchResponse && fetchResponse.status && fetchResponse.status >= 400) {
                log.debug('fetchResponse', fetchResponse)
                throw {status: fetchResponse.status, statusText: await fetchResponse.text()}
            }
            log.debug('fetchResponse', fetchResponse)

            const jsonValue = await fetchResponse.json()
            if (jsonValue.status && jsonValue.status === 'success') {
                jsonValue.data = jsonValue.data.map(x => x.values);
            }
            return jsonValue

        }, options.bypassCache);
    }

    async getForms(options) {
        if (options === undefined) {
            options = {}
        }
        const key = objectHash({options});
        const params = this.params;

        const port = this.getPort()

        const setOptions = this.setUriOptions

        return remedyCache.get(key, async function() {

            const options = {
                method: "GET",
                headers: {
                    'User-Agent': 'mode-red-rapi',
                    'Content-Type': 'application/json'
                }
            }
            log.debug('Use options for query', options);

            let uri = params.rapiUri
                + "/" + params.arServer
                + "?port=" + port;

            uri = setOptions(uri, options)

            log.debug('start request on:', uri);

            const authHeader = `Basic ${encode64(`${params.arUser}:${params.arPassword}`)}`
            options.headers['Authorization'] = authHeader

            const fetchResponse = await fetch(uri, options)
            // catch errors
            if (fetchResponse && fetchResponse.status && fetchResponse.status >= 400) {
                log.debug('fetchResponse', fetchResponse)
                throw {status: fetchResponse.status, statusText: await fetchResponse.text()}
            }
            log.debug('fetchResponse', fetchResponse)

            const jsonValue = await fetchResponse.json()

            return jsonValue.forms.sort()

        }, options.bypassCache);
    }

    async create(form, entry, options) {
        const params = this.params;
        log.debug('Use options for create', options);

        let uri = params.rapiUri
            + "/" + params.arServer
            + "/" + form
            + "?port=" + this.getPort();

        uri = this.setUriOptions(uri, options)

        log.debug('start request on:', uri);

        const arOptions = {
            method: 'POST',
            headers: {},
            body: JSON.stringify({"entry1": entry})
        };

        log.debug('start request:', arOptions);

        const authHeader = `Basic ${encode64(`${params.arUser}:${params.arPassword}`)}`
        arOptions.headers['Authorization'] = authHeader

        const fetchResponse = await fetch(uri, arOptions)
        // catch errors
        if (fetchResponse && fetchResponse.status && fetchResponse.status >= 400) {
            log.debug('fetchResponse', fetchResponse)
            throw {status: fetchResponse.status, statusText: await fetchResponse.text()}
        }
        log.debug('fetchResponse', fetchResponse)

        const value = await fetchResponse.json()
        log.debug('value', value)
        if (value && value.entry1 && typeof value.entry1 === 'string' && value.entry1.startsWith('null - ')) {
            throw new Error(value.entry1);
        }
        return {
            id: value.entry1,
            status: "created"
        };
    }

    async update(form, id, entryData, options) {
        const params = this.params;
        //Apply mapping

        let uri = params.rapiUri
            + "/" + params.arServer
            + "/" + form
            + "?port=" + this.getPort();

        uri = this.setUriOptions(uri, options)

        log.debug('start request on:', uri);

        let arOptions = {
            method: 'PUT',
            headers: {},
            body: JSON.stringify({
                id,
                values: entryData
            })
        };
        //arOptions.body[id] = entryData

        log.debug('start request with:', arOptions);
        log.debug('start request on:', uri);

        const authHeader = `Basic ${encode64(`${params.arUser}:${params.arPassword}`)}`
        arOptions.headers['Authorization'] = authHeader

        const fetchResponse = await fetch(uri, arOptions)
        // catch errors
        if (fetchResponse && fetchResponse.status && fetchResponse.status >= 400) {
            log.debug('fetchResponse', fetchResponse)
            throw {status: fetchResponse.status, statusText: await fetchResponse.text()}
        }

        const value = await fetchResponse.text()

        log.debug('RAPI update return', value);
        if (value && value.startsWith('[message:success, ')) {
            return {
                id,
                status:"updated"
            }
        } else {
            throw value
        }
    }

    async delete(form, query, options) {
        const params = this.params;
        //Apply mapping

        let fullQuery = query;
        fullQuery = encodeURIComponent(fullQuery);

        let uri = params.rapiUri
            + "/" + params.arServer
            + "/" + form
            + "/" + fullQuery
            + "?port=" + this.getPort();

        uri = this.setUriOptions(uri, options)

        log.debug('start request on:', uri);

        let arOptions = {
            method: 'DELETE',
            headers: {}
        };
        //arOptions.body[id] = entryData

        log.debug('start request with:', arOptions);
        log.debug('start request on:', uri);

        const authHeader = `Basic ${encode64(`${params.arUser}:${params.arPassword}`)}`
        arOptions.headers['Authorization'] = authHeader

        const fetchResponse = await fetch(uri, arOptions)
        // catch errors
        if (fetchResponse && fetchResponse.status && fetchResponse.status >= 400) {
            log.debug('fetchResponse', fetchResponse)
            throw {status: fetchResponse.status, statusText: await fetchResponse.text()}
        }

        const value = await fetchResponse.json()
        return value
    }

    async setAttachment(form, entryId, attachmentFieldId, file, options) {
        const params = this.params;

        let uri = params.rapiUri
            + "/" + params.arServer
            + "/" + form
            + "/setAttachment"
            + "/" + entryId
            + "/" + attachmentFieldId
            + "?port=" + this.getPort();

        uri = this.setUriOptions(uri, options)

        const myFormData = {};
        myFormData[file.name] = {
            value: file.data,
            options: {
                filename: file.name,
                contentType: file.mimetype
            }
        };

        let arOptions = {
            method: 'POST',
            uri: uri,
            timeout: 3000000,
            formData: myFormData
        };
        //arOptions.body[id] = entryData

        log.debug('start set Attachment request with:', arOptions);
        log.debug('start request on:', uri);

        let response = await request(arOptions).auth(params.arUser, params.arPassword, true)
        log.debug('RAPI update return', response);
        if (response && response.endsWith(`:'success']`)) {
            return {
                status:'success',
                message: 'Attachment set'
            }
        } else {
            throw response
        }
    }

    async getAttachment(form, entryId, attachmentFieldId, options) {
        const params = this.params;

        let uri = params.rapiUri
            + "/" + params.arServer
            + "/" + form
            + "/getAttachment"
            + "/" + entryId
            + "/" + attachmentFieldId
            + "?port=" + this.getPort();

        uri = this.setUriOptions(uri, options)

        const arOptions = {
            method: 'GET',
            uri: uri,
            encoding: null,
            resolveWithFullResponse: true,
            timeout: 600000 // 10 min.
        };

        log.debug('start attachment read request on:', uri);
        const response = await request(arOptions).auth(params.arUser, params.arPassword, true)
        log.debug('RAPI return', response.headers);
        const fileName = response.headers['content-disposition'].split(';')[1].split('=')[1];
        log.debug('filename', fileName);
        const file = {
            data : response.body,
            fileName : fileName
        }
        return file
    }

    getPort() {
        const params = this.params;
        //set port
        let port = 0;

        if (params.arPort && params.arPort != undefined)
            port = params.arPort;

        return port
    }

    setUriOptions(uri, options) {
        if (options != null && options != undefined) {
            if (options.dateFormat != null && options.dateFormat != undefined) {
                uri = uri + "&dateFormat=" + options.dateFormat;
            }
            if (options.offset != null && options.offset != undefined) {
                uri = uri + "&firstEntry=" + options.offset;
            }

            if (options.sort != null && options.sort != undefined) {
                const sortString = prepareSortString(options.sort);
                if (sortString != null && sortString != undefined) {
                    uri = uri + "&sort=" + sortString;
                }
            }
            //todo Test
            if (options.impersonateUser) {
                uri = uri + "&impersonateUser=" + options.impersonateUser;
            }

            if (options.translateSelectionFields !== undefined && options.translateSelectionFields === false) {
                uri = uri + "&translateSelectionFields=false";
            }

            if (options.countOnly && options.countOnly === true) {
                uri = uri + "&countOnly=true";
            }
        }
        return uri
    }

    getLimits(limits) {
        log.debug('Defined limits', limits);
        const max = limits.clientMax || limits.globalMax;
        const requested = limits.clientRequested || limits.globalDefault;
        log.debug('max', max);
        log.debug('requested', requested);
        let limit = undefined;
        if (max && requested) {
            if (requested > max) {
                limit = max;
            } else {
                limit = requested;
            }
        } else if (requested) {
            limit = requested;
        } else if (max) {
            limit = max;
        } else {
            limit = undefined;
        }
        log.debug('Use limit', limit);
        return limit;
    }
}

function prepareSortString(sortOptions) {
    log.debug('prepare sortString', sortOptions);
    const sortArray = [];
    Object.keys(sortOptions).forEach(sortKey => {
        if (sortOptions[sortKey] === -1) {
            sortArray.push('-'+sortKey);
        } else {
            sortArray.push(sortKey);
        }
    });
    log.debug('sortString', sortArray.toString());
    return sortArray.toString();
}

function encode64(value) {
    const buf = Buffer.from(value, 'utf8');
    return buf.toString('base64')
}

module.exports = {
    ARAdapter
};