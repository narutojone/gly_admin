/**
 * User
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var Reserve = new Schema({
	username : {type: String, index: true},
	displayName: String,
	description: String,
	url: String,
	twitterId: {type: String, index: true},
	used: Boolean,
});

Reserve.plugin(timestamps);

module.exports = mongoose.model('reserve', Reserve);
