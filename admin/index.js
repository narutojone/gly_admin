
/*
 * GET home page.
 */

var database = require('../config/database');
var User = require('./models/user');
var async = require('async');

exports.index = function(req, res, next) {
	// res.render('index', {title: "Glimpsable"});
	if (!req.isAuthenticated() && req.user){
		res.redirect('/login');
	}
	else {
		res.redirect('/dashboard');
	}
};

exports.showDashboard = function(req, res, next) {
	async.parallel([
		function userCount(callback) {
			User.count({}, function(err, count) {
				callback(err, count);
			});
		},
	], function(err, results) {
		res.render('dashboard', {
			currentMenu: 0,
			currentUsername: req.user.username,
			message: false,
			userCount: results[0]
		});
	});
};
