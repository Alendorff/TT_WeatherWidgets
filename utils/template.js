const pug = require('pug');
const path = require('path');

const weather = require('../utils/weather');
const date = require('../utils/myUtils').date;

exports.populateTemplateObj = function(widget, callback) {
	weather.getWeather(widget.city, function (err, forecast) {
		if (err) return callback(err);
		let templateObj = {
			city: widget.city,
			days: []
		};

		// always 7 days forecast

		let today = new Date();
		let weatherCode;
		for (let i = 0; i < 7; i++) {
			weatherCode = forecast[`weatherDay${i}`];
			templateObj.days[i] = {
				date: date.getLocaleDateStringDM(date.addDays(today, i)),
				t: forecast[`tempDay${i}`],
				icon: weather.getIconType(weatherCode),
				weatherStr: weather.translateWeatherCode(weatherCode)
			}
		}

		callback(null, templateObj);
	});
}

/**
* Frustraiting "nocache" for views.
*/
exports.devRender = function(expressResponse, templateRelativePath, params) {
	try {
		expressResponse.send(
			pug.renderFile(path.join(__dirname, templateRelativePath), params)
		);
	} catch (err) {
		console.error(err);
	}
};