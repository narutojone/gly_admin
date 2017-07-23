/**
 * Activity
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var ActivityType = Object.freeze({
	FollowUser: 0,
	ContributeToEvent: 1,
	CommentEvent: 2,
	LikePhoto: 3,
	CommentPhoto: 4,
	PurchasePhoto: 5,
	MentionOnEvent: 6,
	MentionOnPhoto: 7,
	ContributeToEvent2: 8,
	CommentPhoto2: 9,
	FlagPhoto: 10,
	UPM: 11,
	TagOnEvent: 12,
});

var Activity = new Schema({
	issuer: {type: Schema.Types.ObjectId, ref:'user', required: true, index: true},
//	receivers: {type: [{type: Schema.Types.ObjectId, ref:'user'}], required: true, index: true},
	receiver: {type: Schema.Types.ObjectId, ref:'user', required: true, index: true},
	type: {type: Number, required: true},
	readAt: Date,
	event: {type: Schema.Types.ObjectId, ref:'event'},
	photo: {type: Schema.Types.ObjectId, ref:'photo'},
	upm: {type: Schema.Types.ObjectId, ref:'upm'},
	invitation: {type: Schema.Types.ObjectId, ref:'invitation'},
	count: Number,
	deviceId: {type: String, index: true},
});

Activity.plugin(timestamps);

module.exports.model = mongoose.model('activity', Activity);
module.exports.type = ActivityType;
