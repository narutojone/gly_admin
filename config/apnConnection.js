/**
 * Push notification
 */

var async = require('async');
var config = require('./');
var apn = require('apn');
config.apn.errorCallback = function(err, notification) {
	console.error('Push error: ' + err + ', Notification: ' + notification);
};
// var apnConnection = new apn.Connection(config.apn);

// process.on('SIGINT', function () {
// 	apnConnection.close();
// });

// var Installation = require('../admin/models/installation');
// var options = config.apn;
// var feedback = new apn.Feedback(options);
// feedback.on("feedback", function (devices) {
// 	async.eachLimit(devices, 10, function (device, callback) {
// 		Installation.update({deviceToken: device.toString(), active: true, updatedAt: {$lte: new Date(device.time * 1000)}}, {active: false});
// 	});
// });
// feedback.on('feedbackError', console.error);

// module.exports = apnConnection;
