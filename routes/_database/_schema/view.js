var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var _ = require('lodash');

var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));

var	router = express.Router();

var views = [];

module.exports = function(app, options) {
	// Create a db interface
	var dbInterface = new MonetDBInterface(options);

	function viewExists(req, res, next) {
		dbInterface.getAllTables(options.schema, 1).then(function (result) {
			views = _.flatten(result.data);
			if (views.indexOf(req.params.view) < 0) {
				return res.status(404).send('View ' + req.params.view + ' not found');
			}
			// All god, move on
			next();
		}, function (err) {
			res.status(500).send(err);
		});
	}

	function getViewQuery(req, res) {
		return dbInterface.executeQuery('SELECT query FROM sys.tables ' +
		'WHERE name = \'' + req.params.view + '\' AND schema_id IN (SELECT id FROM sys.schemas WHERE name = \'' + options.schema + '\')');
	}

	// Prefix all routes with /view
	app.use('/view', router);

	// Create application/json parser
	router.use(bodyParser.json());

	// List all views
	router.get('/_all', function (req, res) {
		dbInterface.getAllTables(options.schema, 1).then(function (result) {
			views = _.flatten(result.data);
			res.send(views);
		}, function (err) {
			res.status(500).send(err);
		});
	});
	router.get('/', function (req, res) {
		dbInterface.getAllTables(options.schema, 1).then(function (result) {
			views = _.flatten(result.data);
			res.send(views);
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Show row(s)
	router.get('/:view/?', viewExists, function(req, res) {
		if (req.query.columns) {
			var columns = req.query.columns.split(',')
		}
		dbInterface.select(options.schema, req.params.view, {
			columns : 	columns
		}).then(function(result) {
			res.send(result.data);
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// Show view columns and query
	router.get('/:view/_info', viewExists, function(req, res) {
		var table = {
			"view": req.params.view,
			"columns": {
			}
		};

		dbInterface.getAllColumns(options.schema, req.params.view).then(function(result) {
			for (var i = 0; i < result.data.length; i++) {
				table.columns[result.data[i][0]] = result.data[i][1];
			}
		}, function(err) {
			return res.status(500).send(err);
		}).then(function(result) {
			getViewQuery(req, res).then(function(result) {
				var query = result.data[0][0];
				// Cut query
				table.query = query.substring(query.indexOf('as ') + 3);
				return res.send(table);
			}, function(err) {
				return res.status(500).send(err);
			})
		});
	});

	// Create a view
	router.post('/', function (req, res) {
		if (!req.body || !req.body.view || !req.body.query) {
			res.sendStatus(400);
		}
		dbInterface.createView(options.schema, req.body.view, {
			query: req.body.query
		}).then(function (result) {
			views.push(req.body.view);
			res.status(201).send('View ' + req.body.view + ' created');
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Create a view
	router.put('/:view/', function (req, res) {
		if (!req.body || !req.body.query) {
			res.sendStatus(400);
		}
		dbInterface.createView(options.schema, req.params.view, {
			query: req.body.query
		}).then(function (result) {
			views.push(req.params.view);
			res.status(201).send('View ' + req.params.view + ' created');
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Delete a view
	router.delete('/:view', viewExists, function (req, res) {
		dbInterface.dropView(options.schema, req.params.view).then(function (result) {
			_.remove(views, req.params.view);
			res.status(204).send('View ' + req.params.view + ' dropped');
		}, function (err) {
			res.status(500).send(err);
		});
	});
};
