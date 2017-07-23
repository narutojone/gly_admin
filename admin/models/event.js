/**
 * Event
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config');
var timestamps = require('mongoose-timestamp');

var Event = new Schema({
	author: {type: Schema.Types.ObjectId, ref:'user', required: true, index: true},
	name: {type: String, required: true},
	description: {type: String},
	startDate: {type: Date, required: true},
	endDate: {type: Date, required: true},
	attendees: [{type: Schema.Types.ObjectId, ref:'user'}],
	attendsCount: {type: Number, index: true, 'default': 1},
	location: {type: [Number], required: true},
	bounding: {'type': {type: String}, coordinates: mongoose.Schema.Types.Mixed},
//	loc: {type: {type: String, default: 'Point'}, coordinates: {type: [Number], index: '2dsphere'}},
	locationId: String,
	locationName: {type: String},
	radius: {type: Number, required: true},
	photosCount: {type:Number, index: true},
	comments: [{user: {type: Schema.Types.ObjectId, ref:'user'}, username: String, date: Date, content: String}],
	commentsCount: Number,
	hideMap: Boolean,
	privacy: Number,
	removed: Boolean,
	hashtags: [{type: Schema.Types.ObjectId, ref:'hashtag'}],
	flags: [{user: {type: Schema.Types.ObjectId, ref:'user'}, date: Date}],
	invitees: [{user: {type: Schema.Types.ObjectId, ref:'user'}, status: Number}], // for ACL
//	coverWidth: Number,
//	coverHeight: Number,
	timeZone: String,
	photoLikesCount: {type: Number, index: true},
	photoCommentsCount: {type: Number, index: true},
	popularLevel: {type: Number, index: true},
	eventfulId: {type: String, index: true},
});

Event.index({name: 'text', locationName: 'text', description: 'text'});
Event.index({bounding: '2dsphere'});

Event.virtual('coverUrl').get(function () {
	return config.hostUrl + '/image/event/cover/' + this.id;
});

Event.virtual('thumbnailUrl').get(function () {
	return config.hostUrl + '/image/event/thumb/' + this.id;
});

Event.plugin(timestamps);

module.exports = mongoose.model('event', Event);
