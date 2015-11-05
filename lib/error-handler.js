exports.logAndReturnError = function(res, err) {
    throw err;
    res.status(500).send(err.message);
};
