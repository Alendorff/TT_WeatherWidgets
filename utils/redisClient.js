const redis = require('redis');
// TODO create with options from config
const redisClient = redis.createClient();

redisClient.on("error", function (err) {
	console.log("REDIS: Error " + err);
});

redisClient.__proto__.hmsetWithTTL = function (key, obj, TTL, callback) {
	let self = this;
	self.hmset(key, obj, function (err) {
		if (err) return callback(err);
		self.send_command("EXPIRE", [key, TTL], function(err) {
			if (err) callback (err);
			else callback(null);
		})
	});
}

module.exports = redisClient;
