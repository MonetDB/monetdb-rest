exports.parseDocumentsArray = function(data) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        result[i] = {
            id: data[i][0],
            body: JSON.parse(data[i][1])
        }
    }
    return result;
};
