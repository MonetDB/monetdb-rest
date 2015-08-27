var express = require('express');
var path = require('path');

var MonetDBInterface = require(path.resolve('./lib/monetdb-interface'));
var documentOps = require(path.resolve('./lib/document-operations'));


module.exports = function(app, options) {
    var schema  = 'documents';
    var table = 'documents';

    // Create a db interface
    var dbInterface = new MonetDBInterface(options);

    // Find a document
    app.get('/_find?', function(req, res) {
        var key = Object.keys(req.query)[0];
        var value = req.query[key];
        dbInterface.executeQuery('SELECT * from ' + schema + '.' + table + ' ' +
            'WHERE json.filter(body, \'$.' + key +  '\') LIKE \'%' + value + '%\'')
            .then(function(result) {
                res.send(documentOps.parseDocumentsArray(result.data));
            }, function(err) {
                res.status(500).send(err);
            });
    });
};
