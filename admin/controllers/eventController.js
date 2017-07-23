var Event = require('../models/event');
var User = require('../models/user');
var Photo = require('../models/photo');
var config = require('../../config');
var mongoose = require('mongoose');
var gpsUtils = require('gps-util');
var Venue = require('../models/venue').model;
var VenueType = require('../models/venue').type;
var Invitation = require('../models/invitation').model;
var InvitationStatus = require('../models/invitation').status;
var activityController = require('./activityController');
var async = require('async');
var path = require('path');
var fs = require('fs');
var gm = require('gm');
var mv = require('mv');

exports.showAddEvent = function (req, res, next) {
	async.waterfall([
  	    function loadEventCreators(callback) {
			User.find({role: 'addevent'}, function (err, users) {
				if (err) return callback(err);
				callback(null, users);
			});
  	    },
  	    function getMaximumPopularLevel(creators, callback) {
  	    	Event.findOne({popularLevel: {$exists: true}})
  	    	.sort('-popularLevel')
  	    	.exec(function (err, event) {
  	    		if (event) {
  	    			callback(null, creators, event.popularLevel);
  	    		}
  	    		else {
  	    			callback(null, creators, 0);
  	    		}
  	    	});
  	    },
  	    function showAddEvent(creators, maxPopularLevel, callback) {
    		res.render('admin/addEvent', {
				currentMenu: 31,
				currentUsername: req.user.username,
				message: {},
				creators: creators,
				maxPopularLevel: maxPopularLevel
			});
			callback();
  	    }
  	], function(err) {
  		if (err) {
			res.render('admin/addEvent', {
				currentMenu: 31,
				currentUsername: req.user.username,
				message: {error: "Error occurred"},
				creators: [],
				maxPopularLevel: 0
			});
  		}
  	});
};

exports.addEvent = function (req, res, next) {
	var creatorId = req.body.author;
	var name = req.body.name;
	var description = req.body.desc;
	var locationId = req.body.locationId;
	var locationName = req.body.locationName;
	var lat = parseFloat(req.body.lat);
	var lng = parseFloat(req.body.lng);
	var radius = parseFloat(req.body.radius);
	var privacy = req.body.privacy;
	var start = req.body.start;
	var end = req.body.end;
	var popularity = parseFloat(req.body.popularity);

	async.waterfall([
		function checkParams(callback) {
			if (!creatorId || creatorId == "null") {
				return callback({message: "Choose creator"});
			}
			if (!name) {
				return callback({message: "Add name to the event"});
			}
			if (!lat || !lng || !radius) {
				return callback({message: "Choose location and radius of the event"});
			}
			if (!start || !end) {
				return callback({message: "Choose time range of the event"});
			}
			callback();
		},
  	    function addEvent(callback) {
			var newEvent = new Event();
			var series = [];

			if (req.file) {
				var newPhoto = new Photo();
		    	var tmpPath = path.join(__dirname, '../../', req.file.path);
		        var targetPath = path.join(config.resourceDir, '/photos/', newPhoto.id, req.file.originalname);
				
		    	series.push(function uploadPhoto(callback) {
		    		if (req.file.size < 1) {
		    			return callback(new Error("Wrong file size"));
		    		}
		        	var tmpPath = path.join(__dirname, '../../', req.file.path);
		        	var targetPath = path.join(config.resourceDir, '/photos/', newPhoto.id, req.file.originalname);
		    		fs.mkdir(path.dirname(targetPath), 0777, function (err) {
		    			if (err) return callback(err);
		       	   	 	mv(tmpPath, targetPath, function (err) {
		       	    		callback(err);
		       	   		});
		    		});
		   	    });
				series.push(function saveThumb(callback) {
					var thumbPath = path.join(config.resourceDir, '/thumbs/', newPhoto.id, req.file.originalname);
		    		fs.mkdir(path.dirname(thumbPath), 0777, function (err) {
		    			if (err) return callback(err);
				    	gm(targetPath)
				    	.resize(320, 320)
				    	.write(thumbPath, function (err) {
				    		if (err) return callback(err);
				    		callback();
				    	});
		    		});
			    });
				series.push(function addPhoto(callback) {
					newPhoto.user = new mongoose.Types.ObjectId(creatorId);
					newPhoto.event = newEvent._id;
					newPhoto.dateTaken = new Date();
			    	newPhoto.location = [lng, lat];
			    	var width = parseFloat(req.body.coverWidth);
			    	var height = parseFloat(req.body.coverHeight);

			    	if (width && height) {
				    	newPhoto.width = width;
				    	newPhoto.height = height;
			    	}
			    	else {
			    		return callback(new Error("Wrong image size"));
			    	}
			    	
			    	newPhoto.save(function (err) {
			    		newEvent.photosCount = 1;
			    		callback(err);
			        });
				});
			}
			series.push(function addEvent(callback) {
		    	newEvent.author = new mongoose.Types.ObjectId(creatorId);
		    	newEvent.name = name;
		    	newEvent.description = description;
		    	newEvent.locationId = locationId;
		    	newEvent.locationName = locationName;
		    	newEvent.location = [lng, lat];
		    	newEvent.radius = radius;
		    	var bbox = gpsUtils.getBoundingBox(lat, lng, radius);
		    	newEvent.bounding = {type: 'Polygon', coordinates: [[[bbox[0].lng, bbox[0].lat], [bbox[0].lng, bbox[1].lat], [bbox[1].lng, bbox[1].lat], [bbox[1].lng, bbox[0].lat], [bbox[0].lng, bbox[0].lat]]]};
		    	newEvent.privacy = privacy | 0;
		//    	newEvent.coverWidth = parseFloat(req.body.width);
		//    	newEvent.coverHeight = parseFloat(req.body.height);
		    	newEvent.startDate = new Date(start * 1000);
		    	newEvent.endDate = new Date(end * 1000);
		    	newEvent.attendees = [new mongoose.Types.ObjectId(creatorId)];

		    	if (popularity) {
		    		newEvent.popularLevel = popularity;
		    	}
		    	
		    	newEvent.save(function (err) {
		            if (err) return callback(err);
		        	callback();
		        });
		    });

		    if (req.body.locationId) {
		    	series.push(function updateVenue(callback) {
		    		Venue.findOne({locationId: req.body.locationId}, function(err, venue) {
		    			if (err) return callback(err);
		    			if (!venue) {
		    				venue = new Venue();
							venue.locationId = req.body.locationId;
							venue.locationName = req.body.locationName;
					    	var lat = parseFloat(req.body.lat);
					    	var lng = parseFloat(req.body.lng);
					    	venue.coordinate = [lng, lat];
							venue.radius = parseFloat(req.body.radius);
							venue.eventsCount = 0;
							venue.type = VenueType.Foursquare;
		    			}
		    			venue.eventsCount ++;
						venue.save(function(err) {
							callback(err);
						});
		    		})
		    	});
		    }
			series.push(function updateUser(callback) {
				req.user.update({$inc: {eventsCount: 1}}, function(err) {
					callback();
				});
			});
			if (req.body.comment) {
				series.push(function addComment(callback) {
					var comment = new Comment();
					comment.user = req.user;
					comment.event = newEvent._id;
					comment.content = req.body.comment;
			    	comment.save(function(err) {
		                if (err) return callback(err);
		     	    	callback();
		     	    });
				});
			}
			async.series(series, function (err) {
				if (err) return callback(err);
				console.log("Added event: " + newEvent.id);
				callback();
			});
  	    }
  	], function(err) {
		var message = {};
        if (err)
        	message.error = err.message;
        else
        	message.success = "Added event";
        res.send({message: message});
  	});
};

exports.showSearchEvent = function (req, res, next) {
	var eventNo = req.query.no;
	var query = req.query.q;
	if (query) {
		async.waterfall([
			function totalCount(callback) {
				Event.count({$text: {$search: query}}, function(err, count) {
					callback(null, count);
				});
			},
			function eventDetails(count, callback) {
				if (!eventNo) {
					eventNo = 0;
				}
				Event
				.findOne({$text: {$search: query}})
				// .sort({score: {$meta: 'textScore'}})
				.limit(1)
				.skip(eventNo)
				.exec(function (err, event) {
		  			if (err) return callback(err);
					callback(null, count, event);
				});
			},
	  	], function(err, count, event) {
	  		if (err) {
				res.render('admin/searchEvent', {
					currentMenu: 32,
					currentUsername: req.user.username,
					message: {error: "Error occurred"}
				});
	  		}
	  		else if (event) {
				res.render('admin/searchEvent', {
					currentMenu: 32,
					currentUsername: req.user.username,
					message: {},
					query: query,

					eventId: event.id,
					eventNo: eventNo,
					eventName: event.name,
					description: event.description,
					locationName: event.locationName,
					latitude: event.location[1],
					longitude: event.location[0],
					radius: event.radius,
					startDate: event.startDate,
					endDate: event.endDate,
					totalCount: count,
				});
	  		}
	  		else {
				res.render('admin/searchEvent', {
					currentMenu: 32,
					currentUsername: req.user.username,
					query: query,
					message: {error: "There's no event"}
				});
	  		}
	  	});
	}
	else {
		res.render('admin/searchEvent', {
			currentMenu: 32,
			currentUsername: req.user.username,
			message: {},
			query: ""
		});
	}
};

exports.blastEvent = function (req, res, next) {
	var eventId = req.body.eventId;

	async.waterfall([
		function checkParams(callback) {
			if (!eventId) {
				return callback({message: "Invalid identifier"});
			}
			callback();
		},
  	    function blastEvent(callback) {
  	    	var invitations = [];
  	    	var userIds = [];
			User.find().stream()
			.on('data', function(user) {
				if (user.username == 'glimpsable') {
					return;
				}

				var invitationObject = new Invitation();
				invitationObject.srcUser = req.user._id;
				invitationObject.dstUser = user._id;
				invitationObject.event = eventId;
				invitationObject.save(function(err) {
					
				});
				invitations.push(invitationObject);
				userIds.push(user.id);
			}).on('error', function(err) {
				console.log('Stream error: ' + err);
				if (invitations.length > 0) {
					activityController.didTagOnEvent(invitations, userIds, req, function() {
					});
				}
				callback({message: "Error occurred while sending invitations"});
			}).on('close', function() {
				console.log("Sent " + invitations.length + " invitations");
				if (invitations.length > 0) {
					activityController.didTagOnEvent(invitations, userIds, req, function() {
					});
				}
				callback();
			});
  	    }
  	], function(err) {
		var message = {};
        if (err)
        	message.error = err.message;
        else
        	message.success = "Sent to all users";
        res.send({message: message});
  	});
};
