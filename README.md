# MonetDB RESTful Proxy
[![Build Status](https://travis-ci.org/MonetDB/monetdb-rest-proxt.svg)](https://travis-ci.org/MonetDB/monetdb-rest-proxy)
[![npm version](https://badge.fury.io/js/monetdb-rest.svg)](http://badge.fury.io/js/monetdb-rest)

A proxy for MonetDB that provides a RESTful interface and extended documents support. It currently intended for as an experiment, rather than a complete replacement of the MonetDB SQL interface and MAPI protocol. Having said that, the proxy is meant to be extensible (see below).

# Installation and start
Run `npm install` to install any dependencies

Run `npm start` to start the MonetDB RESTful Proxy. The Node.js process will start on port `8888`.

# API
## Database management
HTTP method | URI path | Body | Description
---    | --- | --- | ---
GET    | /database/_all | | List all attached databases
PUT    | /database/`<database-name>` | Content-Type: application/json<br /> {<br />  "host" : "`<hostname>`",<br />  "port" : `<port>`,<br />   "user" : "`<username>`",<br />  "password" : "`<password>`"<br /> } | Attach a database with the specified name and connection
DELETE | /database/`<database-name>` | | Detach the database with the specified name
GET    | /database/`<database-name>`/_connection | | Show the database connection info
GET    | /database/`<database-name>`/_api | | List all available endpoints at database level

## Data management
HTTP method | URI path | Body | Description
---    | --- | --- | ---
GET    | /database/`<database-name>`/schema/_all | | List all schemas
GET    | /database/`<database-name>`/schema/`<schema-name>`/_api | | List all available endpoints at schema level
GET    | /database/`<database-name>`/schema/`<schema-name>`/table/_all | | List all available tables for the schema
POST   | /database/`<database-name>`/schema/`<schema-name>`/table/ | Content-Type: application/json<br /> {<br />  "table" : "`<table-name>`",<br />  "columns" : {<br />    "`<column-name-1>`": "`<data-type-1>`",<br />    "`<column-name-2>`": "`<data-type-2>`"<br /> }<br />} | Create a new table with the specified name and columns
GET    | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>`/_info | | Show table info
GET    | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>`/_all | | Get all rows and columns
POST   | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>` | Content-Type: application/json<br /> {<br />  "values": [`<value-1>`, `<value-2>`]<br />} | Insert values into table
POST   | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>` | Content-Type: application/json<br /> {<br />  "values" : {<br />    "`<column-name-1>`": `<value-1>`,<br />    "`<column-name-2>`": `<value-2>`<br />  }<br />}| Insert values into the specified columns on a table
GET    | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>`?columns=`<column-name-1>`,`<column-name-2>` | | Get all values for the specified columns
GET    | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>`?filter_`<column-name>`=`<value>` | | Get all matching the filter
GET    | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>`?orderBy=`<column-name>` | | Order the results but a column-name
GET    | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>`?limit=`<value>` | | Limit the results to the specified number of first values
PUT    | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>`?filter_`<column-name>`=`<value>` | Content-Type: application/json<br /> {<br />  "`<column-name-1>`": `<updated-value-1>`,<br />  "`<column-name-2>`": `<updated-value-2>`<br />} | Update the records matching the filter with the specified values
DELETE | /database/`<database-name>`/schema/`<schema-name>`/table/`<table-name>` | | Delete the records matching the filter
GET    | /database/`<database-name>`/schema/`<schema-name>`/view/_all | | Shows all views for the specified schema
POST   | /database/`<database-name>`/schema/`<schema-name>`/view/ | Content-Type: application/json<br /> {<br />  "view": "`<view-name>`",<br />  "query": "`<SQL-query>`"<br />} | Create a view with the specified name and SQL query
GET    | /database/`<database-name>`/schema/`<schema-name>`/view/`<view-name>`/_info | | Get the view info
GET    | /database/`<database-name>`/schema/`<schema-name>`/view/`<view-name>` | | Get the view records
DELETE | /database/`<database-name>`/schema/`<schema-name>`/view/`<view-name>` | | Delete the view
GET    | /database/`<database-name>`/query?q=`<query>` | | Executes the URI-encoded SQL query
POST   | /database/`<database-name>`/query | Content-Type: text/plain<br /> `SQL Query` | Executes the raw SQL query in the body
GET    | /database/`<database-name>`/function/`<function-name>`?a=`<value-1>`&b=`<value-2>` | | Calls the SQL function with the provided parameters

### Strings, spaces and nulls
* String values with white space in a path parameters need to be URL encoded, e.g. `/database/demo/schema/sys/table/cities?filter_city=Amsterdam%20Zuid`
* JSON `null` values are passed to the database as null values.

## Document management
To start working with document one must first create a schema `documents` and a table `documents` with the following columns: `_id int`, `body json`. If the schema and table are no found in the attache database, the proxy can create them with a `POST` to `/database/<database-name>/document/_init`.

HTTP method | URI path | Body | Description
---    | --- | --- | ---
POST   | /database/`<database-name>`/document/_init | | Initialise the document storage schema and table
GET    | /database/`<database-name>`/document/_all | | List all documents
POST   | /database/`<database-name>`/document/ | Content-Type: application/json<br /> Document body | Store a document with a auto-generated ID
PUT    | /database/`<database-name>`/document/`<document-id>` | Content-Type: application/json<br /> Document body | Store or update a document with the specified document ID. If the document exits, replace it
GET    | /database/`<database-name>`/document/`<document-id>` | | Get the document with the specified document ID
DELETE | /database/`<database-name>`/document/`<document-id>` | | Delete the document with the specified document ID
GET | /database/`<database-name>`/document/`<document-id>`/_find?`<key>`=`<value>` | | Get all documents matching the specified filter

# Extensions
The MonetDB RESTful Proxy is designed to be extensible, allowing developers to write their own endpoints and interfaces and dropping in place.

Routes are handed by the _Express_ Node.js framework router.
The `routes` directory contains all the URL path routes and endpoints in hierarchical order. Each directory contains an `index.js` file which scans the directory contents and registers all files as routes, ignoring only the entries prefixed with `_`. Endpoints or sub-routes are defined in each of the files or sub-directories. If you want to add another level to the route, use the `addRoutes` function from `lib/router-loader.js`, to add a new set of endpoints at the desired level.

For example, the `routes` directory contains an `index.js` that scans the directory and a `database.js` file (added by the index) for database level operations - like creating a new database connection. In `database.js` a new rotue is added using `addRoutes`, referring to `routes/_database` directory and its contents. This adds the document, function, query and schema routes, which all appear as URL paths for specific database, as seen in the API documentation above.

If you want to add a new route, e.g. _join_, you need to write a `join.js`, following the example of another 'query.js', and drop the file in `routes/_database`. After restarting the database you will be able to execute queries to the defined endpoints at `/database/<database-name>/join`.

Alternatively, if you want to extend the search operations that can be performed on all documents, you need only work on the `routes/_database/_document/find.js` file.
