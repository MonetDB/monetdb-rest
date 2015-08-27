var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));

var	router = express.Router();

module.exports = function(app, options) {
	// Create a db interface
	var dbInterface = new MonetDBInterface(options);

	// Prefix all routes with /query
	app.use('/query', router);

	// Execute a query
	router.get('/?', function(req, res) {
		if (!req.query.q) {
			return res.status(400).send('No query provided');
		}
		dbInterface.executeQuery(req.query.q)
			.then(function (result) {
				res.status(200).send(result.data);
			}, function (err) {
				res.status(500).send(err);
			});
	});

	// Execute a query
	router.post('/', bodyParser.text(), function(req, res) {
		if (!req.body) {
			return res.status(400).send('No query provided');
		}
		dbInterface.executeQuery(req.body)
			.then(function (result) {
				res.status(200).send(result.data);
			}, function (err) {
				res.status(500).send(err);
			});
	});
};
