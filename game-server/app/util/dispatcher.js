var crc = require('crc');

module.exports.dispatch = function(id, connectors) {
	var index = Math.abs(crc.crc32(id)) % connectors.length;
	return connectors[index];
};