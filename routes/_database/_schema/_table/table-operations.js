var bodyParser = require('body-parser');
var path = require('path');
var _ = require('lodash');

var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));

module.exports = function(app, options) {
	// Create a db interface
	var dbInterface = new MonetDBInterface(options);

	function listColumns(req, res) {
		dbInterface.getAllColumns(options.schema, options.table).then(function(result) {
			var table = {
				"table": options.table,
				"columns" : {
				}
			};
			for (var i = 0; i < result.data.length; i++) {
				table.columns[result.data[i][0]] = result.data[i][1];
			}
			return res.send(table);
		}, function(err) {
			return res.status(500).send(err);
		});
	}

	// Create application/json parser
	app.use(bodyParser.json());

	// Show row(s)
	app.get('/?', function(req, res) {
		if (!req.query) {
			return res.sendStatus(400);
		}
		if (req.query.columns) {
			var columns = req.query.columns.split(',')
		}
		dbInterface.select(options.schema, options.table, {
			columns : 	columns,
			filter	: 	req.query
		}).then(function(result) {
			res.send(result.data);
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// Add a new row
	app.post('/', function(req, res) {
		if (!req.body || !req.body.values) {
			return res.sendStatus(400);
		}

		var values = [];
		if (Array.isArray(req.body.values)) {
			values = req.body.values;
		} else {
			var columns = Object.keys(req.body.values);
			values = _.values(req.body.values);
		}

		dbInterface.insert(options.schema, options.table, {
			columns	:   columns,
			values  :   values
		}).then(function (result) {
			res.status(201).send(result);
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Update row(s)
	app.put('/?', function(req, res) {
		if (!req.body) {
			return res.sendStatus(400);
		}
		dbInterface.update(options.schema, options.table, {
			values  :   req.body,
			filter  :   req.query
		}).then(function (result) {
			res.send(result);
		}, function (err) {
			res.status(500).send(err);
		});
	});

	// Delete a row
	app.delete('/?', function(req, res) {
		dbInterface.deleteRow(options.schema, options.table, {
			filter  :   req.query
		}).then(function(result) {
			res.status(204).send(result);
		}, function(err) {
			res.status(500).send(err);
		});
	});

	// List column types
	app.get('/_info', function(req, res) {
		listColumns(req, res);
	});
	app.get('/', function(req, res) {
		listColumns(req, res);
	});

	// List rows
	app.get('/_all', function(req, res) {
		dbInterface.select(options.schema, options.table, {}).then(function(result) {
			res.send(result.data);
		}, function(err) {
			res.status(500).send(err);
		});
	});
};
