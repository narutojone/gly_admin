/**
 * Venue
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

var VenueType = Object.freeze({
	Foursquare: 0,
	Eventful: 1,
	GooglePlace: 2
});

var Venue = new Schema({
	locationId: {type: String, index: {unique: true}},
	locationName: String,
	eventsCount: Number,
	coordinate: {type: [Number], index: '2dsphere', required: true},
	radius: Number,
	type: Number,
	mergedVenues: [String],
});

Venue.plugin(timestamps);

module.exports.model = mongoose.model('venue', Venue);
module.exports.type = VenueType;
