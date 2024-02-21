require('dotenv').config();
const ar = require('./arquery');
const path = require("path");
//const log = require('@manyos/logger').setupLog('test' + path.basename(__filename));

/*const params = {
    arServer: process.env.AR_SERVER,
    arUser: process.env.AR_USER,
    arPassword: process.env.AR_PASSWORD,
    arPort: process.env.AR_PORT,
    rapiUri: process.env.RAPI_URL,
    cacheTime: process.env.AR_CACHE_TTL,
    limitDefault: process.env.LIMIT_DEFAULT || 100,
    limitMax: process.env.LIMIT_MAX
}*/

//const myAdapter = new ar.ARAdapter(params)

module.exports = function(RED) {

    function RapiSearchNode(config) {
        RED.nodes.createNode(this, config);

        if (config.form) {
            this.formConfig = RED.nodes.getNode(config.form);
            this.form = this.formConfig.remedyForm;
        }

        this.query = config.query;
        this.fields = config.fields;
        this.bypassCache = config.bypassCache;

        if (config.server) {
            this.serverConfig = RED.nodes.getNode(config.server);
        }

        this.arAdapter = new ar.ARAdapter(setParams(this.serverConfig))

        const node = this;

        node.on('input', async function(msg, send, done) {
            try {
                const options = {}
                options.bypassCache = node.bypassCache || msg.bypassCache;
                msg.payload = await node.arAdapter.search(node.form || msg.form, node.query || msg.query, node.fields || msg.fields, options)
                //msg.payload = msg.payload.toLowerCase() + ' ' + node.form;
                node.send(msg);
            } catch (error) {
                done(error)
            }
        });
    }
    RED.nodes.registerType("rapi-search", RapiSearchNode);

    function RapiCreateNode(config) {
        RED.nodes.createNode(this, config);

        if (config.form) {
            this.formConfig = RED.nodes.getNode(config.form);
            this.form = this.formConfig.remedyForm;
        }

        this.query = config.query;
        this.fields = config.fields;

        if (config.server) {
            this.serverConfig = RED.nodes.getNode(config.server);
        }

        this.arAdapter = new ar.ARAdapter(setParams(this.serverConfig))

        const node = this;

        node.on('input', async function(msg, send, done) {
            try {
                msg.payload = await node.arAdapter.create(node.form || msg.form, msg.payload)
                node.send(msg);
            } catch (error) {
                done(error)
            }
        });
    }
    RED.nodes.registerType("rapi-create", RapiCreateNode);

    function RapiDeleteNode(config) {
        RED.nodes.createNode(this, config);
        if (config.form) {
            this.formConfig = RED.nodes.getNode(config.form);
            this.form = this.formConfig.remedyForm;
        }
        this.query = config.query;

        if (config.server) {
            this.serverConfig = RED.nodes.getNode(config.server);
        }

        this.arAdapter = new ar.ARAdapter(setParams(this.serverConfig))

        const node = this;

        node.on('input', async function(msg, send, done) {
            try {
                msg.payload = await node.arAdapter.delete(node.form || msg.form, node.query || msg.query)
                node.send(msg);
            } catch (error) {
                done(error)
            }
        });
    }
    RED.nodes.registerType("rapi-delete", RapiDeleteNode);

    function RapiUpdateNode(config) {
        RED.nodes.createNode(this, config);
        if (config.form) {
            this.formConfig = RED.nodes.getNode(config.form);
            this.form = this.formConfig.remedyForm;
        }
        this.requestId = config.requestId;
        this.enableMerge = config.enableMerge;
        this.multiMatchOption = config.multiMatchOption;
        this.mergeHandleDuplicates = config.mergeHandleDuplicates;
        this.mergeSkipRequired = config.mergeSkipRequired;
        this.mergeSkipPattern = config.mergeSkipPattern;
        this.mergeIgnoreFilter = config.mergeIgnoreFilter;
        this.mergeDisableAssoc = config.mergeDisableAssoc;
        this.query = config.query;

        if (config.server) {
            this.serverConfig = RED.nodes.getNode(config.server);
        }

        this.arAdapter = new ar.ARAdapter(setParams(this.serverConfig))

        const node = this;

        node.on('input', async function(msg, send, done) {
            let mergeValue = undefined;
            if (this.enableMerge === true) {
                mergeValue = parseInt(this.mergeHandleDuplicates);
                if (this.mergeSkipRequired) {
                    mergeValue += 1024;
                }
                if (this.mergeSkipPattern) {
                    mergeValue += 2048;
                }
                if (this.mergeIgnoreFilter) {
                    mergeValue += 4096;
                }
                if (this.mergeDisableAssoc) {
                    mergeValue += 8192;
                }
            }
            let multiMatchOption = undefined;
            if (this.multiMatchOption) {
                multiMatchOption = parseInt(this.multiMatchOption);
            }

            const query = node.query || msg.query;
            try {
                msg.payload = await node.arAdapter.update(node.form || msg.form, node.requestId || msg.requestId, msg.payload, {mergeValue, query, multiMatchOption})
                node.send(msg);
            } catch (error) {
                done(error)
            }
        });
    }
    RED.nodes.registerType("rapi-update", RapiUpdateNode);

    function remedyFormNode(n) {
        RED.nodes.createNode(this, n);
        this.remedyForm = n.remedyForm;
    }
    RED.nodes.registerType("remedyForm", remedyFormNode);

    function remedyServerNode(n) {
        RED.nodes.createNode(this, n);
        const node = this;
        if (node.credentials) {
            node.user = node.credentials.user;
            node.password = node.credentials.password;
        }
        this.server = n.server;
        this.url = n.url;
        this.credentials = n.credentials;
        this.port = n.port;
    }
    RED.nodes.registerType("remedyServer", remedyServerNode, {
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

    RED.httpAdmin.get("/forms", RED.auth.needsPermission('forms.read'), async function(req,res) {
        const node = RED.nodes.getNode(req.params.id);
        console.log ('node found', req.params);
        const myAdapter = node.arAdapter;
        const forms = await myAdapter.getForms()
        res.json(forms);
    });

    function setParams(serverConfig) {
        if (serverConfig) {
            return {
                arServer: serverConfig.server,
                arPort: serverConfig.port,
                rapiUri: serverConfig.url,
                arUser: serverConfig.user,
                arPassword: serverConfig.password,
                cacheTime: serverConfig.cacheTime || process.env.AR_CACHE_TTL,
                limitDefault: serverConfig.limitDefault || process.env.LIMIT_DEFAULT || 100,
                limitMax: serverConfig.limitMax || process.env.LIMIT_MAX
            }
        } else {
            throw "Server not configured"
        }
    }
}