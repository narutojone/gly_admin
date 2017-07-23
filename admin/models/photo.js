/**
 * Photo
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config');
var timestamps = require('mongoose-timestamp');

var Photo = new Schema({
	event: {type: Schema.Types.ObjectId, ref:'event', required: true, index: true},
	user: {type: Schema.Types.ObjectId, ref:'user', required: true, index: true},
	dateTaken: {type: Date, required: true, index: true},
	location: {type: [Number], index: '2dsphere', required: true},
	isVideo: Boolean,
	width: Number,
	height: Number,
	commentsCount: Number,
	likes: [{user: {type: Schema.Types.ObjectId, ref:'user'}, date: Date}],
	likesCount: Number,
	flags: [{user: {type: Schema.Types.ObjectId, ref:'user'}, date: Date}],
	flagsCount: Number,
	leadLevel: {type: Number, index: true},
});

Photo.virtual('photoUrl').get(function () {
	return config.hostUrl + '/image/photos/' + this.id;
});

Photo.virtual('videoUrl').get(function () {
	return config.hostUrl + '/image/videos/' + this.id;
});

Photo.virtual('thumbnailUrl').get(function () {
	return config.hostUrl + '/image/thumbs/' + this.id;
});

Photo.plugin(timestamps);

module.exports = mongoose.model('photo', Photo);
