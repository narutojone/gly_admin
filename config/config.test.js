/**
 * Development configuration
 */

var config = require('./config.global');

config.env = 'test';
config.hostUrl = 'http://glimpsable.com:3210';
config.domainName = 'glimpsable.com:3210';
config.resourceDir = '/data/resources_test';

config.mongo.uri = process.env.MONGO_URI || 'mongodb://glimpsable:glimpsableDEV@localhost/glimpsable-dev';

config.apn.cert = __dirname + "/keys/apns-test-cert.pem";
config.apn.key = __dirname + "/keys/apns-test-key.pem";

module.exports = config;