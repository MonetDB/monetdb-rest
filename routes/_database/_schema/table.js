var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var _ = require('lodash');

var routeLoader = require(path.resolve('./lib/route-loader'));
var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));

var	router = express.Router();

var tables = [];

module.exports = function(app, options) {
	// Create a db interface
	var dbInterface = new MonetDBInterface(options);

	function tableExists(req, res, next) {
		dbInterface.getAllTables(options.schema, 0).then(function(result) {
			tables = _.flatten(result.data);
			if (tables.indexOf(req.params.table) < 0) {
				return res.status(404).send('Table ' + req.params.table + ' not found');
			}
			// All god, move on
			next();
		}, function(err) {
			res.status(500).send(err);
		});
	}

	// Prefix all routes with /table
	app.use('/table', router);

	// Create application/json parser
	router.use(bodyParser.json());

	// List all tables
	router.get('/_all', function(req, res) {
		dbInterface.getAllTables(options.schema, 0).then(function(result) {
			tables = _.flatten(result.data);
			res.send(tables);
		}, function(err) {
			res.status(500).send(err);
		});
	});
	router.get('/', function(req, res) {
		dbInterface.getAllTables(options.schema, 0).then(function(result) {
			tables = _.flatten(result.data);
			res.send(tables);
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// Create a table
	router.post('/', function(req, res) {
		if (!req.body || !req.body.table || !req.body.columns) {
			return res.sendStatus(400);
		}

		var columnsString = '';
		for (var key in req.body.columns) {
			if (columnsString.length > 0) {
				columnsString = columnsString + ', ';
			}
			columnsString = columnsString + key + ' ' + req.body.columns[key];
		}

		dbInterface.createTable(options.schema, req.body.table, {
			columns	: columnsString
		}).then(function (result) {
			tables.push(req.body.table);
			res.status(201).send('Table ' + req.body.table + ' created');
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Delete a table
	router.delete('/:table$', tableExists, function(req, res) {
		dbInterface.dropTable(options.schema, req.params.table).then(function(result) {
			_.remove(tables, req.params.table);
			res.status(204).send('Table ' + req.params.table + ' dropped');
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// Add all sub-routes for table item operations
	// Prefix with /:table
	var	subRouter = express.Router();
	router.use('/:table', tableExists, function(req, res, next) {
		options.table = req.params.table;
		next();
	}, subRouter);
	// Load all routes in the directory
	routeLoader.addRoutes(path.join(__dirname, '_table'), subRouter, options);
};
