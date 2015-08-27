var express = require('express');
var path = require('path');
var _ = require('lodash');

var routeLoader = require(path.resolve('./lib/route-loader'));
var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));

var	router = express.Router();

var schemas = [];

module.exports = function(app, options) {
	// Create a db interface
	var dbInterface = new MonetDBInterface(options);

	function schemaExists(req, res, next) {
		dbInterface.getAllSchemas().then(function(result) {
			// Flatten the array
			schemas = _.flatten(result.data);
			if (schemas.indexOf(req.params.schema) < 0) {
				return res.status(404).send('Schema ' + req.params.schema + ' not found');
			}
			// All good, move on
			next();
		}, function(err) {
			res.status(500).send(err);
		});
	}

	// Prefix all routes with /schema
	app.use('/schema', router);

	// List all schemas
	router.get('/_all', function(req, res) {
		dbInterface.getAllSchemas().then(function(result) {
			schemas = _.flatten(result.data);
			res.send(schemas);
		}, function(err) {
			res.status(500).send(err);
		});
	});
	router.get('/', function(req, res) {
		dbInterface.getAllSchemas().then(function(result) {
			schemas = _.flatten(result.data);
			res.send(schemas);
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// Add all sub-routes
	// Prefix with /:schema
	var	subRouter = express.Router();
	router.use('/:schema', schemaExists, function(req, res, next) {
		options.schema = req.params.schema;
		next();
	}, subRouter);
	// Load all routes in the directory
	var allRoutes = routeLoader.addRoutes(path.join(__dirname, '_schema'), subRouter, options);
	subRouter.get('/_api', function(req, res) {
		// List the possible sub endpoints
		res.send(allRoutes);
	});
	subRouter.get('/', function(req, res) {
		// List the possible sub endpoints
		res.send(allRoutes);
	});
};
