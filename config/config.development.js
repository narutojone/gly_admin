/**
 * Development configuration
 */

var config = require('./config.global');
var path = require('path');
var mongoose = require('mongoose');

config.env = 'development';
config.hostUrl = 'http://192.168.1.20:3000';
config.domainName = '192.168.1.20:3000';
config.mongo.uri = process.env.MONGO_URI || 'mongodb://pei:pei116@localhost/glimpsable-dev';
config.resourceDir = 'F:/Sources/Web/glimpsable_admin/resources';

config.apn.cert = __dirname + "/keys/apns-dev-cert.pem";
config.apn.key = __dirname + "/keys/apns-dev-key.pem";

module.exports = config;
