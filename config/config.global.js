/**
 * Global configuration
 */

var config = module.exports = {};

config.env = 'production';
config.hostUrl = 'http://glimpsable.com:3000';
config.port = 3500;
config.resourceDir = '/data/resources';
config.domainName = 'glimpsable.com';

config.mongo = {};
config.mongo.uri = process.env.MONGO_URI || 'mongodb://localhost/glimpsable';

config.apn = {};
config.apn.cert = __dirname + "/keys/apns-cert.pem";
config.apn.key = __dirname + "/keys/apns-key.pem";

config.administrators = [];
config.autoFollowers = [];
