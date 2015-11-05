var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var uuid = require('node-uuid');
var _ = require('lodash');

var routeLoader = require(path.resolve('./lib/route-loader'));
var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));
var errorHandler = require(path.resolve('./lib/error-handler'));

var	router = express.Router();

module.exports = function(app, options) {
	var schema  = 'documents';
	var table = 'documents';

	// Create a db interface
	var dbInterface = new MonetDBInterface(options);

	function documentExists(id) {
		return dbInterface.select(schema, table, {
			columns : ['_id'],
			filter : {
				filter__id: id
			}
		});
	}

	// Prefix all routes with /document
	app.use('/document', router);

	// Create application/json parser
	router.use(bodyParser.json());

	// Add all routes for document item operations
	routeLoader.addRoutes(path.join(__dirname, '_document'), router, options);

	// Initialise the document schema and table
	router.post('/_init', function(req, res) {
		dbInterface.getAllSchemas().then(function(result) {
			var schemas = _.flatten(result.data);
			if (schemas.indexOf(schema) < 0) {
				dbInterface.executeQuery('CREATE SCHEMA documents');
			}
		}, function(err) {
			res.status(500).send(err);
		}).then(function (result) {
			dbInterface.getAllTables(schema, 0).then(function(result) {
				var tables = _.flatten(result.data);
				if (tables.indexOf(table) < 0) {
					dbInterface.createTable(schema, table, {
							columns : '_id  string, body json'
						}
					)
				}
				// All god, move on
			}, function(err) {
				res.status(500).send(err);
			});
		}).then(function (result) {
			res.status(201).send('Document schema and table initialised');
		});
	});

	// List all documents
	router.get('/_all', function(req, res) {
		dbInterface.select(schema, table, {
			columns : 	[]
		}).then(function(result) {
			res.send(result.data);
		}, function(err) {
			res.status(500).send(err);
		});
	});
	router.get('/', function(req, res) {
		dbInterface.select(schema, table, {
			columns : 	[]
		}).then(function(result) {
			res.send(result.data);
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// Return a single document
	router.get('/:id', function(req, res) {
		dbInterface.select(schema, table, {
			columns : 	[],
			filter  :   {
				filter__id: req.params.id
			}
		}).then(function(result) {
			if (result.rows > 0) {
				res.send(documentOps.parseDocumentsArray(result.data)[0]);
			} else {
				res.status(400).send('Document ' + req.params.id + ' not found');
			}
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// Create a new document
	router.post('/', function(req, res) {
		if (!req.body) {
			return res.sendStatus(400);
		}
		var id = uuid.v4();
		dbInterface.insert(schema, table, {
			columns	:	['_id', 'body'],
			values	:   [id, req.body]
		}).then(function (result) {
			res.status(201).send('Document ' + id + ' created');
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Update or create a document
	router.put('/:id', function(req, res) {
		if (!req.body) {
			res.sendStatus(400);
		}
		documentExists(req.params.id).then(function (result) {
			if (result.data.length > 0) {
				dbInterface.update(schema, table, {
					values: {
						body : req.body
					},
					filter: {
						filter__id: req.params.id
					}
				}).then(function (result) {
					res.send(result);
				}, function (err) {
					res.status(500).send(err);
				});
			} else {
				dbInterface.insert(schema, table, {
					columns	:	['_id', 'body'],
					values	:	[req.params.id, req.body]
				}).then(function (result) {
					res.status(201).send('Document ' + req.params.id + ' created');
				}, function (err) {
					res.status(500).send(err);
				});
			}
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Delete a document
	router.delete('/:id', function(req, res) {
		documentExists(req.params.id).then(function (result) {
			if (result.data.length > 0) {
				dbInterface.deleteRow(schema, table, {
					filter: {
						filter__id: req.params.id
					}
				}).then(function (result) {
					res.status(204).send(result);
				}, function (err) {
					res.status(500).send(err);
				});
			} else {
				res.status(400).send('Document ' + req.params.id + ' not found');
			}
		}, function (err) {
			res.status(500).send(err);
		});
	});
};
