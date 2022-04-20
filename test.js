require('dotenv').config();
const ar = require('./arquery');
const path = require("path");
const log = require('@manyos/logger').setupLog('test' + path.basename(__filename));

const params = {
    arServer: process.env.AR_SERVER,
    arUser: process.env.AR_USER,
    arPassword: process.env.AR_PASSWORD,
    arPort: process.env.AR_PORT,
    rapiUri: process.env.RAPI_URL,
    cacheTime: 0,
    limitDefault: process.env.LIMIT_DEFAULT || 5,
    limitMax: process.env.LIMIT_MAX
}

const arAdapter = new ar.ARAdapter(params)

/*arAdapter.search('PCT:Product Catalog',`'Product Name'="Windows Account / Groups" and 'Status'="Enabled"`,'Product Name, Product Categorization Tier 1, Product Categorization Tier 2, Product Categorization Tier 3, Manufacturer',{}).then(result => {
    log.debug('result', result)
    log.debug('data', result.data[0])
}).catch(error => {
    log.error('error', error)
})*/


arAdapter.search("MYS:SMILEconnect_QueueData", '1=1', "", {countOnly:true}).then(result => {
    log.debug(result)
})

/*arAdapter.create('HPD:IncidentInterface_Create',{"Description":"MyDoc", "Urgency":1000, "Reported Source": 1000, "Impact":1000, "Login_ID": "Allen", "Service_Type":0}, {}).then(result => {
    log.debug('result', result)
    log.debug('data', result.data[0])
}).catch(error => {
    log.error('error', error)
})*/

/*arAdapter.update('HPD:IncidentInterface_Create','000000000003523',{"Description":"MyDoc2"}, {}).then(result => {
    log.debug('result', result)
    log.debug('data', result.data[0])
}).catch(error => {
    log.error('error', error)
})*/

/*arAdapter.delete('HPD:IncidentInterface_Create',`'1' LIKE "00000000000351%"`, {}).then(result => {
    log.debug('result', result)
}).catch(error => {
    log.error('error', error)
})*/

/*arAdapter.getForms({}).then(result => {
    log.debug('result', result)
}).catch(error => {
    log.error('error', error)
})*/