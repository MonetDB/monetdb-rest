var monetdb = require('monetdb');
var Q = require('q');
var _ = require('lodash');

var connectionOptions = null;
var connection = null;

function MonetDBInterface(opt) {
	// Pass the connectionOptions
	connectionOptions = opt;
	// Also, set the Q
	connectionOptions.q = Q;
}

function connect() {
	// Check if we already have a connection
	if (connection) {
		return connection;
	}

	connection = monetdb.connect(connectionOptions, function(err) {
		if (err) {
			console.log(err);
		}
	});

	return connection;
}

function keyToStringArray(array, str) {
	var result = [];
	for (var key in array) {
		result.push(key + ' = ' + str);
	}

	return result;
}

function filterToString(array) {
	var values = [];

	var filter_arr = [];
	var orderBy_arr = [];
	var groupBy_arr = [];
	var limit = '';
	for (var key in array) {
		if (key.substring(0, 7) == 'filter_') {
			// TODO: sign different from =
			filter_arr.push(key.substring(key.indexOf('_') + 1) + ' = ?');
			if (isNaN(array[key])) {
				values.push(array[key]);
			} else {
				values.push(+array[key]);
			}
		} else if (key == 'orderBy') {
			orderBy_arr.push(array[key]);
		} else if (key == 'groupBy') {
			groupBy_arr.push(array[key]);
		} else if (key == 'limit') {
			limit = 'LIMIT ' + array[key];
		}
	}

	var filter = '';
	if (filter_arr.length > 0) {
		filter = 'WHERE ' + filter_arr.join(' AND ');
	}
	var orderBy = '';
	if (orderBy_arr.length > 0) {
		orderBy = 'ORDER BY ' + orderBy_arr.join(', ');
	}
	var groupBy = '';
	if (groupBy_arr.length > 0) {
		groupBy = 'GROUP BY ' + groupBy_arr.join(', ');
	}

	var query_string = filter + ' ' + orderBy + ' ' + groupBy + ' ' + limit;

	return {
		query_string: query_string.trim(),
		values: values
	}
}

MonetDBInterface.prototype.select = function(schema, table, options) {
	var conn = connect();

	var columns = '';
	if (!options.columns || options.columns.length == 0) {
		columns = '*';
	} else {
		columns = options.columns.join(', ');
	}

	if (!options.filter) {
		return conn.queryQ('SELECT ' + columns + ' FROM ' + schema + '.' + table);
	}
	var filter = filterToString(options.filter);
	return conn.queryQ('SELECT ' + columns + ' FROM ' + schema + '.' + table +
		' ' + filter.query_string,
		filter.values);
};

MonetDBInterface.prototype.insert = function(schema, table, options) {
	var conn = connect();

	if (!options.columns) {
		return conn.queryQ('INSERT INTO ' + schema + '.' + table +
				// Crete an string of comma-separated ? the size of the number of values
			' VALUES ( ' + _.range(options.values.length).map(function() {return '?'}).join(', ') + ' )',
			options.values);
	}
	return conn.queryQ('INSERT INTO ' + schema + '.' + table +
		' ( ' + options.columns.join(', ') + ' ) ' +
			// Crete an string of comma-separated ? the size of the number of values
		' VALUES ( ' + _.range(options.values.length).map(function() {return '?'}).join(', ') + ' )',
		options.values);
};

MonetDBInterface.prototype.update = function(schema, table, options) {
	var conn = connect();

	if (!options.filter) {
		return conn.queryQ('UPDATE ' + schema + '.' + table +
				// Crete an string of comma-separated 'key = ?' the size of the number of values
			' SET ' + keyToStringArray(options.values, '?').join(', '),
			_.values(options.values));
	}
	var filter = filterToString(options.filter);
	return conn.queryQ('UPDATE ' + schema + '.' + table +
			// Crete an string of comma-separated 'key = ?' the size of the number of values
		' SET ' + keyToStringArray(options.values, '?').join(', ') +
		' ' + filter.query_string,
		_.values(options.values).concat(filter.values));
};

MonetDBInterface.prototype.deleteRow = function(schema, table, options) {
	var conn = connect();

	if (!options.filter) {
		return conn.queryQ('DELETE FROM ' + schema + '.' + table);
	}
	var filter = filterToString(options.filter);
	return conn.queryQ('DELETE FROM ' + schema + '.' + table +
		' ' + filter.query_string,
		filter.values);
};

MonetDBInterface.prototype.createTable = function(schema, table, options) {
	var conn = connect();

	return conn.queryQ('CREATE TABLE ' + schema + '.' + table + ' ( ' + options.columns + ' )');
};

MonetDBInterface.prototype.dropTable = function(schema, table) {
	var conn = connect();

	return conn.queryQ('DROP TABLE ' + schema + '.' + table);
};

MonetDBInterface.prototype.createView = function(schema, view, options) {
	var conn = connect();

	return conn.queryQ('CREATE VIEW ' + schema + '.' + view + ' AS ' + options.query);
};

MonetDBInterface.prototype.dropView = function(schema, view) {
	var conn = connect();

	return conn.queryQ('DROP VIEW ' + schema + '.' + view);
};

MonetDBInterface.prototype.executeQuery = function(query, options) {
	var conn = connect();

	return conn.queryQ(query, options);
};

MonetDBInterface.prototype.executeFunction = function(name, params) {
	var conn = connect();

	if (params.length > 0) {
		var parameters = params[0];
		for (i = 1; i < params.length; ++i) {
			parameters = parameters + ', ' + params[i];
		}
		return conn.queryQ('CALL ' + name + ' ( ' + parameters + ' )');
	}
	return conn.queryQ('CALL ' + name + '()');
};

MonetDBInterface.prototype.getAllSchemas = function() {
	return MonetDBInterface.prototype.select('sys', 'schemas', {
		columns : 	['name']
	});
};

MonetDBInterface.prototype.getAllTables = function(schema, type) {
	return MonetDBInterface.prototype.executeQuery('SELECT name from sys.tables ' +
		'WHERE system = false AND type = ? ' +
		'AND EXISTS ( SELECT schema_id FROM sys.schemas WHERE schema_id = schemas.id AND schemas.name = ? )', [type, schema]);
};

MonetDBInterface.prototype.getAllColumns = function(schema, table) {
	return MonetDBInterface.prototype.executeQuery('SELECT name, type FROM sys.columns ' +
		'WHERE table_id IN (SELECT id FROM sys.tables ' +
		'WHERE name = ? AND schema_id IN (SELECT id FROM sys.schemas WHERE name = ? ))', [table, schema]);
};

module.exports = MonetDBInterface;
