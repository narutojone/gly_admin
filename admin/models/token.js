/**
 * Token
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var Token = new Schema({
	user: {type: mongoose.Schema.Types.ObjectId, ref:'user', required: true, index: true},
	token: {type: String, index: true},
	expire: Date,
});

Token.plugin(timestamps);

module.exports = mongoose.model('token', Token);
