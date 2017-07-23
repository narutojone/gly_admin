/**
 * Installation
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var Installation = new Schema({
	deviceId: {type: String, index: true, required: true},
	user: {type: Schema.Types.ObjectId, ref:'user', index: true},
	appVersion: String,
	badge: Number,
	deviceToken: {type: String, index: true},
	deviceType: String,
	osVersion: String,
	timeZone: String,
	active: {type: Boolean, 'default': true},
});

Installation.plugin(timestamps);

module.exports = mongoose.model('installation', Installation);
