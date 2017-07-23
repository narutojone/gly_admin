
var config = require('../../config')
var database = require('../../config/database');
var Installation = require('../models/installation');
var apn = require('apn');
var apnConnection = require('../../config/apnConnection'); 
var async = require('async');

exports.showPush = function (req, res, next) {
	var venueNo = req.query.no;
	var locationId = req.query.id;
	async.waterfall([
  	    function totalCount(callback) {
			Installation
			.distinct('deviceToken', {deviceToken: {$exists: true}, active: true})
			.count()
			.exec(function(err, count) {
  	    		callback(null, count);
  	    	});
  	    },
  	    function pushDetails(count, callback) {
			res.render('admin/push', {
				currentMenu: 2,
				currentUsername: req.user.username,
				message: {},
				deviceCount: count
			});
			callback();
  	    }
  	], function(err) {
  		if (err) {
			res.render('admin/push', {
				currentMenu: 2,
				currentUsername: req.user.username,
				message: {error: "Error occurred"},
				deviceCount: 0
			});
  		}
  	});
};

exports.sendPush = function (req, res, next) {
	var message = req.body.message;

	Installation
	.distinct('deviceToken', {deviceToken: {$exists: true}, active: true})
	.exec(function(err, tokens) {
		if (!tokens || tokens.length < 1) {
			res.send({message: {error: "There's no active device to send push"}});
			return;
		}
		var push = new apn.Notification();
		push.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour from now
		push.alert = message;
		push.contentAvailable = true;
		apnConnection.pushNotification(push, tokens);
		res.send({message: {success: "Sent push to " + tokens.length + " devices"}});
	});
};
