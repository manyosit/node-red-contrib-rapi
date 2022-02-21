require('dotenv').config();
const ar = require('./arquery');
const path = require("path");
//const log = require('@manyos/logger').setupLog('test' + path.basename(__filename));

const params = {
    arServer: process.env.AR_SERVER,
    arUser: process.env.AR_USER,
    arPassword: process.env.AR_PASSWORD,
    arPort: process.env.AR_PORT,
    rapiUri: process.env.RAPI_URL,
    cacheTime: process.env.AR_CACHE_TTL,
    limitDefault: process.env.LIMIT_DEFAULT || 100,
    limitMax: process.env.LIMIT_MAX
}


module.exports = function(RED) {
    function RapiSearchNode(config) {
        RED.nodes.createNode(this, config);
        this.form = config.form;
        this.query = config.query;
        this.fields = config.fields;
        this.arAdapter = new ar.ARAdapter(params)
        const node = this;

        node.on('input', async function(msg, send, done) {
            try {
                msg.payload = await node.arAdapter.search(node.form || msg.form, node.query || msg.query, node.fields || msg.fields)
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
        this.form = config.form;
        this.query = config.query;
        this.fields = config.fields;
        this.arAdapter = new ar.ARAdapter(params)
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
        this.form = config.form;
        this.query = config.query;
        this.arAdapter = new ar.ARAdapter(params)
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
        this.form = config.form;
        this.id = config.id;
        this.arAdapter = new ar.ARAdapter(params)
        const node = this;

        node.on('input', async function(msg, send, done) {
            try {
                msg.payload = await node.arAdapter.update(node.form || msg.form, node.id || msg.id, msg.payload)
                node.send(msg);
            } catch (error) {
                done(error)
            }
        });
    }
    RED.nodes.registerType("rapi-update", RapiUpdateNode);
}