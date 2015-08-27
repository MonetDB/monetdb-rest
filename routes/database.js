var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var routeLoader = require(path.resolve('./lib/route-loader'));

var	router = express.Router();

var databases = {};

function dbExists(req, res, next) {
	if (!databases[req.params.db]) {
		return res.status(404).send('Database ' + req.params.db + ' not found');
	}
	next();
}

module.exports = function(app, options) {
	// Create application/json parser
	app.use(bodyParser.json());

	// Prefix all routes with /database
	app.use('/database', router);

	// List all databases
	router.get('/_all', function(req, res) {
		res.send(databases);
	});
	router.get('/', function(req, res) {
		res.send(databases);
	});

	// Add or update database (to connect to)
	router.put('/:db', function(req, res) {
		// Create a new DB object
		var database = {
			// If no connections options are provided, we are going to use the defaults
			host		:	process.env.dbhost || 'localhost',
			port		:	process.env.dbport || 50000,
			dbname		:	process.env.dbname || 'demo',
			user     	:	process.env.dbuser || 'monetdb',
			password 	:	process.env.dbpass || 'monetdb'
		};
		// Get options set in the request body
		if (req.body) {
			if (req.body.host) {
				database.host = req.body.host;
			}
			if (req.body.port) {
				database.port = req.body.port;
			}
			if (req.body.dbname) {
				database.dbname = req.body.dbname;
			}
			if (req.body.user) {
				database.user = req.body.user;
			}
			if (req.body.password) {
				database.password = req.body.password;
			}
		}

		databases[req.params.db] = database;
		console.log('Database connection added: ' + req.params.db + '{mapi://' + database.user + '@' + database.host + ':' + database.port + '/' + database.dbname + '}');
		res.send(database);
	});

	// Delete a database connection
	router.delete('/:db', dbExists, function(req, res) {
		delete databases[req.params.db];
		console.log('Database connection deleted: ' + req.params.db);
		res.sendStatus(204);
	});

	router.get('/:db/_connection', function(req, res) {
		// List the possible sub endpoints
		res.send(databases[req.params.db]);
	});

	// Add all sub-routes
	// Prefix with /:db
	var	subRouter = express.Router();
	router.use('/:db', dbExists, function(req, res, next) {
		options = databases[req.params.db];

		// !!! We need to do this deliberately here to avoid pre-loading of the sub-routes is empty options
		// Load all routes in the directory
		var allRoutes = routeLoader.addRoutes(path.join(__dirname, '_database'), subRouter, options);
		subRouter.get('/_api', function(req, res) {
			// List the possible sub endpoints
			res.send(allRoutes);
		});
		subRouter.get('/', function(req, res) {
			// List the possible sub endpoints
			res.send(allRoutes);
		});
		next();
	}, subRouter);
};
