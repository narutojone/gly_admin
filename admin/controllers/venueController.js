
var async = require('async');
var Event = require('../models/event');
var User = require('../models/user');
var config = require('../../config');
var Venue = require('../models/venue').model;
var VenueType = require('../models/venue').type;


exports.showVenues = function (req, res, next) {
	var venueNo = req.query.no;
	var locationId = req.query.id;
	async.waterfall([
  	    function totalCount(callback) {
  	    	Venue.count(function(err, count) {
  	    		callback(null, count);
  	    	});
  	    },
  	    function venueDetails(count, callback) {
  	    	var venueQuery;

			if (locationId) {
  	    		venueQuery = Venue.find({locationId: locationId});
  	    	}
  	    	else {
  	    		if (!venueNo)
  	    			venueNo = 0;
  	    		venueQuery = Venue
					.find()
					.sort({createdAt: 1})
					.skip(venueNo)
					.limit(1);
  	    	}
  	    	venueQuery
			.exec(function(err, results) {
				if (results && results.length > 0) {
					var venue = results[0];
					callback(null, count, venue);
				}
				else {
					callback(null, count, null);
				}
			});
  	    }
  	], function(err, count, venue) {
  		if (err) {
			res.render('admin/searchEvent', {
				currentMenu: 1,
				currentUsername: req.user.username,
				message: {error: "Error occurred"}
			});
  		}
  		else if (venue) {
			res.render('admin/venue', {
				currentMenu: 1,
				currentUsername: req.user.username,
				venueNo: venueNo,
				locationName: venue.locationName,
				locationId: venue.locationId,
				latitude: venue.coordinate[1],
				longitude: venue.coordinate[0],
				radius: venue.radius,
				eventsCount: venue.eventsCount,
				readonly: venue.type != VenueType.Eventful,
				totalCount: count,

				message: {}
			});
  		}
  		else {
			res.render('admin/venue', {
				currentMenu: 1,
				currentUsername: req.user.username,
				message: {error: "There's no venue"}
			});
  		}
  	});
};

exports.updateVenue = function (req, res, next) {
	var locationId = req.body.locationId;
	var latitude = parseFloat(req.body.latitude);
	var longitude = parseFloat(req.body.longitude);
	var radius = parseFloat(req.body.radius);
	var locationName = req.body.locationName;

	async.waterfall([
		function checkParams(callback) {
			if (!locationId) {
				return callback({message: "Invalid venue id"});
			}
			callback();
		},
  	    function updateVenue(callback) {
  	    	Venue.update(
  	    		{locationId: locationId},
  	    		{
  	    			$set: {coordinate: [longitude, latitude], radius: radius, locationName: locationName}
  	    		},
  	    		{multi: true},
  	    		function(err, venue) {
  	    			callback(err);
  	    		}
  	    	);
  	    },
  	    function updateEvents(callback) {
		 	Event.update(
		 		{locationId: locationId},
				{
					$set: {location: [longitude, latitude], radius: radius, locationName: locationName}
				},
				{multi: true},
				function (err) {
					callback(err);
				}
		 	);
  	    }
  	], function(err) {
		var message = {};
        if (err)
        	message.error = err.message;
        else
        	message.success = "Updated venue locations"
        res.send({message: message});
  	});
};

exports.searchVenue = function (req, res, next) {
	var locationName = req.body.locationName;

	async.waterfall([
  	    function searchVenue(callback) {
  	    	Venue.find({locationName: locationName}, function(err, results) {
  	    		callback(err, results);
  	    	})
  	    },
  	], function(err, venues) {
		var message = {};
        if (err)
        	message.error = err.message;

        var results = [];
        if (venues) {
        	for (var i=0; i<venues.length; i++) {
        		results.push(venues[i].locationId);
        	}
        }
        res.send({message: message, results: results});
  	});
};

exports.mergeVenue = function (req, res, next) {
	var fromId = req.body.from;
	var toId = req.body.to;

	async.waterfall([
		function checkParams(callback) {
			if (!fromId || !toId) {
				return callback({message: "Invalid venue id"});
			}
			callback();
		},
  	    function deleteFromVenue(callback) {
  	    	Venue.findOneAndRemove({locationId: fromId}, function(err, venue) {
  	    		callback(err, venue);
  	    	});
  	    },
  	    function updateToVenue(fromVenue, callback) {
  	    	Venue.update(
  	    		{locationId: toId},
  	    		{
  	    			$addToSet: {mergedVenues: fromId},
  	    			$inc: {eventsCount: fromVenue.eventsCount}
  	    		},
  	    		{upsert: true},
  	    		function(err, venue) {
  	    			callback(err);
  	    		}
  	    	);
  	    },
  	    function updateEvents(callback) {
		 	Event.update(
		 		{locationId: fromId},
				{
					$set: {locationId: toId}
				},
				{multi: true},
				function (err) {
					callback(err);
				}
		 	);
  	    }
  	], function(err) {
		var message = {};
        if (err)
        	message.error = err.message;
        else
        	message.success = "Merged venues"
        res.send({message: message});
  	});
};

exports.deleteVenue = function (req, res, next) {
	var locationId = req.body.locationId;

	async.waterfall([
		function checkParams(callback) {
			if (!locationId) {
				return callback({message: "Invalid venue id"});
			}
			callback();
		},
  	    function deleteEvents(callback) {
		 	Event.remove(
		 		{locationId: locationId},
				function (err) {
					callback(err);
				}
		 	);
  	    },
  	    function deleteVenue(callback) {
  	    	Venue.remove(
  	    		{locationId: locationId},
  	    		function(err, venue) {
  	    			callback(err);
  	    		}
  	    	);
  	    }
  	], function(err) {
		var message = {};
        if (err)
        	message.error = err.message;
        else
        	message.success = "Deleted venue and events related"

        res.send({message: message});
  	});
};

exports.showMapTools = function(req, res, next) {
	res.redirect('http://www.freemaptools.com/radius-around-point.htm?clat=' + req.query.lat + '&clng=' + req.query.lng + '&r=' + req.query.r + '&lc=FFFFFF&lw=1&fc=00FF00');
	// res.redirect('http://www.freemaptools.com/radius-around-point.htm?clat=' + req.query.lat + '&clng=' + req.query.lng + '&r=' + req.query.r + '&lc=FFFFFF&lw=1&fc=00FF00');
};
