/**
 * Database for Glimpsable
 */

var mongoose = require('mongoose');
var config = require('./');

mongoose.connect(config.mongo.uri, {useMongoClient: true});

mongoose.connection.on('connected', function () {
	console.log('Mongoose connection open to ' + config.mongo.uri);
});

mongoose.connection.on('error', function () {
	console.error('Mongoose connection error: ' + config.mongo.uri);
});

mongoose.connection.on('disconnected', function () {
	console.error('Mongoose connection disconnected');
});

process.on('SIGINT', function () {
	mongoose.connection.close(function () {
		console.log('Mongoose connection disconnected through app termination');
		process.exit(0);
	});
});

module.exports = mongoose.connection;
