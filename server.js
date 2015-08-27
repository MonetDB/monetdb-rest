var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var routeLoader = require('./lib/route-loader');

var app = express();
var router = express.Router();

// Start the server
var port = process.env.port || 8888;
app.listen(port, function() {
	console.log('MonetDB RESTful Proxy started on port ' + port);
});
// MonetDB favicon
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Attached the router to the root
app.use('/', router);
// Welcome message
router.get('/', function(req, res) {
	res.send('MonetDB RESTful Proxy');
});

// Add all routes
routeLoader.addRoutes(path.resolve('./routes'), router, {});

// Return 404 for non-existing routes
router.use(function(req, res) {
	res.sendStatus(404);
});

exports = app;
