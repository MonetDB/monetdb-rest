var express = require('express');
var path = require('path');

var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));

var	router = express.Router();

module.exports = function(app, options) {
	// Create a db interface
	var dbInterface = new MonetDBInterface(options);

	// Prefix all routes with /function
	app.use('/function', router);

	// Execute a function
	router.get('/:id', function(req, res) {
		// Get only the values
		var values = new Array;
		for(var key in req.query) {
			values.push(req.query[key]);
		}
		dbInterface.executeFunction(req.params.id, values)
			.then(function (result) {
				res.status(200).send(result.data);
			}, function (err) {
				res.status(500).send(err);
			});
	});
};
