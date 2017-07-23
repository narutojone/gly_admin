/**
 * UPM
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var UPMEvent = new Schema({
	users: [{user: {type: Schema.Types.ObjectId, ref: 'user'}, clusterId: String, deviceId: String}],
	venue: {type: Schema.Types.ObjectId, ref: 'venue'},
	event: {type: Schema.Types.ObjectId, ref: 'event'},
	location: {type: [Number], required: true},
	radius: {type: Number, required: true},
	bounding: {'type': {type: String}, coordinates: mongoose.Schema.Types.Mixed},
});

var UPMFriend = new Schema({
	users: [{type: Schema.Types.ObjectId, ref:'user'}]
});

UPMEvent.index({users: true});
UPMEvent.index({bounding: '2dsphere'});
UPMFriend.index({users: true});

UPMEvent.plugin(timestamps);

module.exports.Event = mongoose.model('upmEvent', UPMEvent);
module.exports.Friend = mongoose.model('upmFriend', UPMFriend)
