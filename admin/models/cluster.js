/**
 * Cluster of user photos
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var Clusters = new Schema({
	deviceId: {type: String, index: true},
	user: {type: Schema.Types.ObjectId, ref:'user', index: true},
	clusters: [{
		id: {type: String, index: true},
		startDate: {type: Date, required: true},
		endDate: {type: Date, required: true},
		location: {type: [Number], index: '2dsphere'},
		locationName: String,
		radius: {type: Number, required: true},
		photosCount: {type:Number},
		timeZone: String,
		createdAt: {type: Date, 'default': Date.now},
		addedAt: {type: Date}
	}],
});

Clusters.plugin(timestamps);

module.exports = mongoose.model('clusters', Clusters);
