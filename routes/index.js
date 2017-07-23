
/*
 * GET home page.
 */

var appController = require('../admin');
var userController = require('../admin/controllers/userController');
var pushController = require('../admin/controllers/pushController');
var venueController = require('../admin/controllers/venueController');
var eventController = require('../admin/controllers/eventController');
var multer = require('multer');

var upload = multer({dest: "./uploads"});

exports.setupAll = function(router) {
	router.get('/', appController.index);

	router.get('/login', userController.showLogin);
	router.post('/login', userController.postLogin);

	router.all('/*', userController.validateAuth);
	router.get('/logout', userController.logout);
	router.get('/dashboard', appController.showDashboard);

	router.get('/venue', venueController.showVenues);
	router.post('/venue', venueController.updateVenue);
	router.delete('/venue', venueController.deleteVenue);
	router.post('/venue/search', venueController.searchVenue);
	router.post('/venue/merge', venueController.mergeVenue);
	router.get('/venue/map', venueController.showMapTools);

	router.get('/push', pushController.showPush);
	router.post('/push', pushController.sendPush);

	router.get('/event/add', eventController.showAddEvent);
	// router.route('/event/add').post(upload.single('cover'), eventController.addEvent);
	router.post('/event/add', upload.single('cover'), eventController.addEvent);

	router.get('/event/search', eventController.showSearchEvent);
	router.post('/event/blast', eventController.blastEvent);
};
