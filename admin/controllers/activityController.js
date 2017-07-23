/**
 * Activity Controller
 */

var Activity = require('../models/activity').model;
var ActivityType = require('../models/activity').type;
var User = require('../models/user');
var Event = require('../models/event');
var Photo = require('../models/photo');
var async = require('async');
var Installation = require('../models/installation');
var config = require('../../config');
var apn = require('apn');
var apnConnection = require('../../config/apnConnection'); 
var mongoose = require('mongoose');

exports.activitiesOfMine = function (req, res, next) {
	var requestDate = new Date(req.query.requestAt * 1000);
	var limit = 20;
	var skip = 0;
	var deivceId = req.body.deviceId;
	if (req.query.limit)
		limit = parseInt(req.query.limit);
	if (req.query.skip)
		skip = parseInt(req.query.skip);
	
	async.waterfall([
	    function checkAndRefreshBadge(callback) {
	    	if (skip > 0)
	    		return callback(null, req.user.badgeNumber);
	    	Activity
	    	.count({receiver: req.user, readAt: {$exists: false}}, function(err, count) {
	    		if (req.user.badgeNumber == count) {
		    		return callback(null, count);
	    		}
	    		req.user.badgeNumber = count;
	  	    	req.user.save(function (err, user) {
	  	    		callback(null, count);
	  	    	});
	    	});
	    },
	    function loadActivities(badge, callback) {
	    	Activity
	    	.find({receiver: req.user, createdAt: {$lte: requestDate}})
	    	.sort('-createdAt')
	    	.limit(limit + 1)
	    	.skip(skip)
	    	.populate('issuer', 'username hasProfile')
	    	.exec(function (err, activities, stats) {
	    		if (err) return next(err);
	    		
	    		var results = [];
	    		var hasMore = false;
	    		if (activities) {
	    			if (activities.length > limit) {
	    				hasMore = true;
	    				activities.pop();
	    			}
	    			for (var i=0; i<activities.length; i++) {
	    				results.push(activityJson(activities[i]));
	    			}
	    		}
	    		callback(null, results, hasMore, badge);
	    	});
	    }
	 ], function(err, results, hasMore, badge) {
		if (err) return next(err);
		if (badge > 999)
			badge = 999;
		res.json({success:true, results:results, hasMore:hasMore, badge: badge, onboard: true});
  	});
};

exports.activityDetails = function (req, res, next) {
	var activityId = req.params.id;
   	Activity
	.findById(activityId) 
	.populate('issuer', 'username hasProfile')
	.exec(function(err, activity) {
		if (err) next(err);
		
		res.json({success:true, activity: activityJson(activity)});
	});
};

exports.readActivities = function (req, res, next) {
	var activities = req.body.activities;
	var now = Date.now();

	async.waterfall([
  	    function setReadDate(callback) {
	  	  	Activity
	  		.update({_id: {$in: activities}, readAt: {$exists: false}},
	  				{$set: {readAt: now}},
	  				{multi: true},
	  				function (err, count) {
	  					callback(err, count);
	  				});
  	    },
  	    function updateBadgeNumber(count, callback) {
  	    	req.user.badgeNumber -= count;
  	    	if (req.user.badgeNumber < 0)
  	    		req.user.badgeNumber = 0;
  	    	req.user.save(function (err, user) {
  	    		callback(null, count);
  	    	});
  	    }
  	], function(err, count) {
		if (err) return next(err);
		var badgeNumber = req.user.badgeNumber;
		if (badgeNumber > 999)
			badgeNumber = 999;
		res.json({success:true, read:count, badge: badgeNumber, date: Math.floor(now / 1000)});
  	});
};

function sendPushWithMessage(users, badge, message, payload, callback) {
	Installation.find({user: {$in: users}, deviceToken: {$exists: true}, active: true}, function(err, results) {
		if (!results || results.length < 1) return callback();

		var tokens = [];
		for (var i=0; i<results.length; i++) {
			tokens.push(results[i].deviceToken);
		}
		var push = new apn.Notification();
		push.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour from now
		push.badge = badge;
		push.sound = "Default";
		push.alert = message;
		payload.date = Math.floor(Date.now() / 1000);
		push.payload = payload;
		push.contentAvailable = true;
		apnConnection.pushNotification(push, tokens);
		callback();
	});
}

exports.sendPushWithMessage = sendPushWithMessage;

function sendPush(issuer, activity, receiver, alert, payload, callback) {
	Installation.find({user: receiver.id, deviceToken: {$exists: true}, active: true}, function(err, results) {
		console.log("Sending push to " + results.length + " devices...");
		if (!results || results.length < 1) {
			if (callback)
				callback();
			return;
		}

		var tokens = [];
		for (var i=0; i<results.length; i++) {
			tokens.push(results[i].deviceToken);
		}

		var push = new apn.Notification();
		push.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour from now
		push.badge = receiver.badgeNumber;
		push.sound = "Default";
		if (!alert) {
			alert = {"loc-key":"ACTIVITY_" + activity.type,"loc-args":[issuer.username]};
		}
		push.alert = alert;
		
		if (!payload) payload = {};
		payload.a = activity.id;
		payload.u = issuer.id;
		payload.d = Math.floor(Date.now() / 1000);
		payload.t = activity.type;
		push.payload = payload;
		push.contentAvailable = true;
		apnConnection.pushNotification(push, tokens);
		if (callback)
			callback();
	});
}

function sendPushToDevice(issuer, activity, receiver, alert, payload, deviceId, callback) {
	Installation.find({user: receiver, deviceId: deviceId, deviceToken: {$exists: true}, active: true, appVersion: {$gt: 2.01}}, function(err, results) {
		if (!results || results.length < 1) return callback();

		var tokens = [];
		for (var i=0; i<results.length; i++) {
			tokens.push(results[i].deviceToken);
		}

		var push = new apn.Notification();
		push.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour from now
		push.badge = receiver.badgeNumber;
		push.sound = "Default";
		if (!alert) {
			alert = {"loc-key":"ACTIVITY_" + activity.type,"loc-args":[issuer.username]};
		}
		push.alert = alert;
		
		if (!payload) payload = {};
		payload.a = activity.id;
		payload.u = issuer.id;
		payload.d = Math.floor(Date.now() / 1000);
		payload.t = activity.type;
		push.payload = payload;
		push.contentAvailable = true;
		apnConnection.pushNotification(push, tokens);
		if (callback)
			callback();
	});
}

exports.didFollowUser = function (user, req, done) {
	async.waterfall([
	    function addActivity(callback) {
	    	var newActivity = new Activity();
	    	newActivity.issuer = req.user;
	    	newActivity.receiver = user;
	    	newActivity.type = ActivityType.FollowUser;
	    	newActivity.save(function (err) {
	    		callback(err, newActivity);
	        });
	    },
	    function addBadgeAndSendPush(activity, callback) {
	    	User.findByIdAndUpdate(user.id, {$inc: {badgeNumber: 1}}, function (err, user) {
		    	sendPush(req.user, activity, user, null, null, callback);
	    	});
	    }
	], function(err, user) {
		done();
	});
};

exports.didContributeToEvent = function (event, req, done) {
	async.waterfall([
 	    function addActivityToAuthor(callback) {
 	    	if (event.author.equals(req.user._id)) {
 	    		return callback(null, null);
 	    	}
	 	   	var newActivity = new Activity();
	 		newActivity.issuer = req.user;
	 		newActivity.receiver = event.author;
	 		newActivity.type = ActivityType.ContributeToEvent;
	 		newActivity.event = event;
	 		newActivity.count = req.body.photos;
	 		newActivity.save(function (err) {
	 			if (err) return callback(null, null);
 	    		callback(null, newActivity);
	 	    });
 	    },
 	    function addBadgeAndSendPushToAuthor(activity, callback) {
 	    	if (!activity) return callback();
 	    	User.findByIdAndUpdate(event.author, {$inc: {badgeNumber: 1}}, function (err, user) {
 	    		var alert = null;
 	    		if (req.body.photos) {
 	    			alert = {"loc-key":"ACTIVITY_" + ActivityType.ContributeToEvent, "loc-args":[req.user.username, req.body.photos]};
 	    		}
		    	sendPush(req.user, activity, user, alert, {e: event.id}, callback);
 	    	});
 	    },
 	    function notifyAttendees(callback) {
 	    	var attendees = event.attendees;
 	    	
 	    	for (var i=attendees.length-1; i>=0; i--) {
 	    		if (event.author.equals(attendees[i]) || req.user._id.equals(attendees[i])) {
 	    			attendees.splice(i, 1);
 	    		}
 	    	}
    		var alert = null;
    		if (req.body.photos) {
    			alert = {"loc-key":"ACTIVITY_" + ActivityType.ContributeToEvent2, "loc-args":[req.user.username, req.body.photos]};
    		}
 	    	async.eachLimit(attendees, 10, function(user, callback) {
 	    		// Do not send push to older version users
 	    		Installation.count({user: user, appVersion: {$lt: 2.00}}, function(err, count) {
 	    			if (err || (count > 0)) return callback();
 	    			
 	 		 	   	var newActivity = new Activity();
 	 		 		newActivity.issuer = req.user;
 	 		 		newActivity.receiver = user;
 	 		 		newActivity.type = ActivityType.ContributeToEvent2;
 	 		 		newActivity.event = event;
 	 		 		newActivity.count = req.body.photos;
 	 		 		newActivity.save(function (err) {
 	 		 			if (!err) {
 	 		 	 	    	User.findByIdAndUpdate(user, {$inc: {badgeNumber: 1}}, function (err, user) {
 		 				    	sendPush(req.user, newActivity, user, alert, {e: event.id}, function(err) {
 		 				    		callback();
 		 				    	});
 	 		 	 	    	});
 	 		 			}
 	 		 			else {
 	 		 				callback();
 	 		 			}
 	 		 	    });
 	    		});
 	    	}, function(err) {
 	    		callback();
 	    	});
 	    }
 	], function(err, user) {
 		done();
 	});
};

exports.didCommentEvent = function (event, req, done) {
	async.waterfall([
  	    function addActivity(callback) {
	  	  	var newActivity = new Activity();
	  		newActivity.issuer = req.user;
	  		newActivity.receiver = event.author;
	  		newActivity.type = ActivityType.CommentEvent;
	  		newActivity.event = event;
	  		newActivity.save(function (err) {
  	    		callback(err, newActivity);
	  	    });
  	    },
  	    function addBadgeAndSendPush(activity, callback) {
  	    	User.findByIdAndUpdate(event.author, {$inc: {badgeNumber: 1}}, function (err, user) {
		    	sendPush(req.user, activity, user, null, {e: event.id},  callback);
  	    	});
  	    }
  	], function(err, user) {
  		done();
  	});
};

exports.didLikePhoto = function (photo, req, done) {
	async.waterfall([
   	    function addActivity(callback) {
	   	 	var newActivity = new Activity();
	   		newActivity.issuer = req.user;
	   		newActivity.receiver = photo.user;
	   		newActivity.type = ActivityType.LikePhoto;
	   		newActivity.photo = photo;
	   		newActivity.save(function (err) {
   	    		callback(err, newActivity);
	   	    });
   	    },
   	    function addBadgeAndSendPush(activity, callback) {
   	    	User.findByIdAndUpdate(photo.user, {$inc: {badgeNumber: 1}}, function (err, user) {
 		    	sendPush(req.user, activity, user, null, {p: photo.id},  callback);
   	    	});
   	    }
   	], function(err, user) {
   		done();
   	});
};

exports.didCommentPhoto = function (photo, req, done) {
	async.waterfall([
	    function addActivity(callback) {
         	var newActivity = new Activity();
        	newActivity.issuer = req.user;
        	newActivity.receiver = photo.user;
        	newActivity.type = ActivityType.CommentPhoto;
        	newActivity.photo = photo;
        	newActivity.save(function (err) {
	    		callback(err, newActivity);
            });
	    },
	    function addBadgeAndSendPush(activity, callback) {
	    	User.findByIdAndUpdate(photo.user, {$inc: {badgeNumber: 1}}, function (err, user) {
	    		sendPush(req.user, activity, user, null, {p: photo.id},  callback);
	    	});
	    }
	], function(err, user) {
		done();
	});
};

exports.didCommentPhoto2 = function (photo, req, commentors, done) {
	async.eachLimit(commentors, 10, function (user, callback) {
 		// Do not send push to older version users
 		Installation.count({user: user, appVersion: {$lt: 2.00}}, function(err, count) {
 			if (err || (count > 0)) return callback();
 			
	     	var newActivity = new Activity();
	    	newActivity.issuer = req.user;
	    	newActivity.receiver = user;
	    	newActivity.type = ActivityType.CommentPhoto2;
	    	newActivity.photo = photo;
	    	newActivity.save(function (err) {
		    	User.findByIdAndUpdate(user, {$inc: {badgeNumber: 1}}, function (err, user) {
		    		sendPush(req.user, newActivity, user, null, {p: photo.id}, callback);
		    	});
	        });
 		});
	}, function(err) {
		done();
	});
};

exports.didPurchasePhoto = function (photo, req, done) {
	async.waterfall([
 	    function addActivity(callback) {
 			var newActivity = new Activity();
 			newActivity.issuer = req.user;
 			newActivity.receiver = photo.user;
 			newActivity.type = ActivityType.PurchasePhoto;
 			newActivity.photo = photo;
 			newActivity.save(function (err) {
 	    		callback(err, newActivity);
 		    });
 	    },
 	    function addBadgeAndSendPush(activity, callback) {
 	    	User.findByIdAndUpdate(photo.user, {$inc: {badgeNumber: 1}}, function (err, user) {
 	    		sendPush(req.user, activity, user, null, {p: photo.id},  callback);
 	    	});
 	    }
 	], function(err, user) {
 		done();
 	});
};

exports.didTagOnEvent = function (invitations, userIds, req, done) {
	async.eachLimit(userIds, 10, function(friendId, callback) {
		var newActivity = new Activity();
		var invitation = invitations[userIds.indexOf(friendId)];
		newActivity.issuer = req.user;
		newActivity.receiver = new mongoose.Types.ObjectId(friendId);
		newActivity.type = ActivityType.TagOnEvent;
		newActivity.invitation = invitation;
		newActivity.save(function (err) {
			if (err) return callback(err);
 	    	User.findByIdAndUpdate(friendId, {$inc: {badgeNumber: 1}}, function (err, user) {
  	    		sendPush(req.user, newActivity, user, null, {i: invitation.id});
 	    		callback();
 	    	});
	    });
	}, function(err) {
		done(err);
	});
};

exports.didMentionOnEvent = function (event, usernames, req, done) {
	User
	.find({username: {$in: usernames, $ne: req.user.username}})
	.select('username badgeNumber')
	.exec(function (err, users, stats) {
		if (!users || users.length < 1) {
			return done();
		}
		async.mapLimit(users, 5, function(user, callback) {
			var newActivity = new Activity();
			newActivity.issuer = req.user;
			newActivity.receiver = user;
			newActivity.type = ActivityType.MentionOnEvent;
			newActivity.event = event;
			newActivity.save(function (err) {
				if (err) return callback(err);
				user.update({$inc: {badgeNumber: 1}}, function (err) {
					user.badgeNumber ++;
	  	    		sendPush(req.user, newActivity, user, null, {e: event.id});
  	  	    		callback(null, user._id);
				});
		    });
		}, function(err, results) {
			done(err, results);
		});
	});
};

exports.didMentionOnPhoto = function (photo, usernames, req, done) {
	User
	.find({username: {$in: usernames, $ne: req.user.username}})
	.select('username badgeNumber')
	.exec(function (err, users, stats) {
		if (!users || users.length < 1) {
			return done();
		}
		async.mapLimit(users, 5, function(user, callback) {
			var newActivity = new Activity();
			newActivity.issuer = req.user;
			newActivity.receiver = user;
			newActivity.type = ActivityType.MentionOnPhoto;
			newActivity.photo = photo;
			newActivity.save(function (err) {
				if (err) return callback(err);
				user.update({$inc: {badgeNumber: 1}}, function (err) {
					user.badgeNumber ++;
	  	    		sendPush(req.user, newActivity, user, null, {p: photo.id});
  	  	    		callback(null, user._id);
				});
		    });
		}, function(err, results) {
			done(err, results);
		});
	});
};

exports.didFlagPhoto = function (photo, req, done) {
	async.each(config.administrators, function(user, callback) {
		async.waterfall([
     	    function addActivity(callback) {
              	var newActivity = new Activity();
             	newActivity.issuer = req.user;
             	newActivity.receiver = user;
             	newActivity.type = ActivityType.FlagPhoto;
             	newActivity.photo = photo;
             	newActivity.save(function (err) {
     	    		callback(err, newActivity);
                 });
     	    },
     	    function addBadgeAndSendPush(activity, callback) {
     	    	User.findByIdAndUpdate(user, {$inc: {badgeNumber: 1}}, function (err, user) {
     	    		sendPush(req.user, activity, user, null, {p: photo.id}, callback);
     	    	});
     	    }
     	], function(err) {
     		callback();
     	});
	}, function(err) {
		done();
	});
};

exports.notifyUPM = function (user, upm, deviceId, clusterId, attendees, done) {
	async.waterfall([
 	    function loadOtherUser(callback) {
 	    	var other = attendees[0];
 	    	if (other == user)
 	    		other = attendees[1];
 	    	User.findById(other, "username", function(err, otherUser) {
 	    		callback(err, otherUser);
 	    	});
 	    },
 	    function addActivity(other, callback) {
          	var newActivity = new Activity();
         	newActivity.issuer = other;
         	newActivity.receiver = user;
         	newActivity.type = ActivityType.UPM;
         	newActivity.upm = upm;
         	newActivity.count = attendees.length;
         	newActivity.save(function (err) {
 	    		callback(err, newActivity, other);
            });
 	    },
 	    function addBadgeAndSendPush(activity, other, callback) {
 	    	var alert;
			if (attendees.length == 2) {
				alert = {"loc-key": "ACTIVITY_" + ActivityType.UPM + "a", "loc-args": [other.username]};
			}
			else {
				alert = {"loc-key": "ACTIVITY_" + ActivityType.UPM + "b", "loc-args": [other.username, attendees.length - 2]};
			}
     	    sendPushToDevice(other, activity, user, alert, {m: upm.id}, deviceId, callback);
 	    }
 	], function(err) {
 		if (done)
 			done();
 	});
};

activityJson = function (activity) {
	var ret = {};
	ret.id = activity.id;
	ret.issuerId = activity.issuer.id;
	ret.username = activity.issuer.username;
	ret.profileUrl = activity.issuer.thumbnailPic;
	ret.hasProfile = activity.issuer.hasProfile;
	ret.type = activity.type;
	ret.read = activity.readAt;
	ret.count = activity.count;
	if (activity.event) {
		ret.eventId = activity.event;
	}
	if (activity.photo) {
		ret.photoId = activity.photo;
	}
	if (activity.upm) {
		ret.upmId = activity.upm;
	}
	if (activity.invitation) {
		ret.invitationId = activity.invitation;
	}
	ret.deviceId = activity.deviceId;
	ret.created = activity.createdAt.getTime() / 1000;
//	ret.updated = activity.updatedAt.getTime() / 1000;
	
	return ret;
};
