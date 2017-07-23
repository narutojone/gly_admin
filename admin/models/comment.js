/**
 * Comment
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var Comment = new Schema({
	user: {type: Schema.Types.ObjectId, ref:'user', required: true, index: true},
	event: {type: Schema.Types.ObjectId, ref:'event', index: true},
	photo: {type: Schema.Types.ObjectId, ref:'photo', index: true},
	content: String,
});

Comment.plugin(timestamps);

module.exports = mongoose.model('comment', Comment);
