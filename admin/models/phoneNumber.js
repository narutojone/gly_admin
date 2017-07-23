/**
 * PHone Number
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var PhoneNumber = new Schema({
	number: {type: String, index: true},
	deviceId: {type: String, index: true},
	user: {type: Schema.Types.ObjectId, ref:'user'},
	countryCode: String,
	verified: Boolean,
	verificationCode: String,
	refersCount: Number,
});

PhoneNumber.plugin(timestamps);

module.exports = mongoose.model('phonenumber', PhoneNumber);
