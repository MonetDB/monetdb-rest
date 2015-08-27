var express = require('express');

/**
 * Loads all the files indexed (by index.js) the given directory and adds them as routes to the router.
 *
 * @param path Location from which all files will be loaded as routes
 * @param router Router to add the new routes to
 * @param options Configuration options
 * @returns {Array} The routes as an array
 */
exports.addRoutes = function(path, router, options) {
	// Add the routes in the directory
	var routes = require(path);

	// Loop over all keys to pass the router
	var allRoutes = Object.keys(routes);
	allRoutes.forEach(function(key) {
		routes[key](router, options);
	});

	// Return the array
	return allRoutes;
};
