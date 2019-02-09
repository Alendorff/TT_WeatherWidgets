const request = require('request');
const redisClient = require('../utils/redisClient');

const weatherCodesIcon = {
	A:"rain",
	BD:"cloud",
	BN:"cloud",
	BR:"cloud",
	BS:"snow",
	BY:"rain",
	F:"cloud",
	FR:"snowflake",
	H:"cloud",
	IC:"snowflake",
	IF:"cloud",
	IP:"snow",
	K:"cloud",
	L:"rain",
	R:"rain",
	RW:"rain",
	RS:"rain",
	SI:"snow",
	WM:"snow",
	S:"snow",
	SW:"snow",
	T:"thunder",
	UP:"rain",
	VA:"cloud",
	WP:"rain",
	ZF:"cloud",
	ZL:"snowflake",
	ZR:"rain",
	ZY:"rain",
	SUN:"sun",
	CL:"sun",
	FW:"sun",
	SC:"cloud",
	BK:"cloud",
	OV:"cloud"
};

const weatherCodesMeaning = {
	A:"Град",
	BD:"Пыльная буря",
	BN:"Песчаная буря",
	BR:"Туман",
	BS:"Метель",
	BY:"Морось",
	F:"Туман",
	FR:"Мороз",
	H:"Туман",
	IC:"Мороз",
	IF:"Ледяной туман",
	IP:"Ледяной дождь",
	K:"Дым",
	L:"Морось",
	R:"Дождь",
	RW:"Сильный дождь",
	RS:"Дождь со снегом",
	SI:"Снег с дождем",
	WM:"Снег с дождем",
	S:"Снег",
	SW:"Снегопад",
	T:"Гроза",
	UP:"Осадки",
	VA:"Вулканический пепел",
	WP:"Водяной смерч",
	ZF:"Ледяной туман",
	ZL:"Ледяная морось",
	ZR:"Ледяной дождь",
	ZY:"Ледяная морось",
	SUN:"Солнечно.",
	CL:"Солнечно. Без осадков.",
	FW:"Переменная облачность. Без осадков.",
	SC:"Переменная облачность. Без осадков.",
	BK:"Облачно. Без осадков.",
	OV:"Сильная облачность. Без осадков."
};

const cityCode = {
	"санкт-петербург": "st.petersberg",
	"москва"		 : "moscow",
	"нижний новгород": "nizhny-novgorod"
};

const cityAPICode = {
	"st.petersberg": "St. Petersburg, ru",
	"moscow": "moscow,ru",
	"nizhny-novgorod": "56.298448, 43.933416"
};

exports.cityCode = cityCode;
exports.weatherCodesIcon = weatherCodesIcon;
exports.weatherCodesMeaning = weatherCodesMeaning;
exports.getWeather = getWeather;
exports.translateWeatherCode = translateWeatherCode;
exports.getIconType = getIconType;

/**
* Get cached weather from Redis. If expired, update and get again.
* @param cityArg название города на русском
* @param callback Always returns forecast for 7 days.
*/
function getWeather(cityArg, callback) {
	if (!cityArg) return callback(Error('getWeather: city must be specified'));
	
	let city = cityCode[cityArg.toLowerCase()];
	if (!city) return callback(Error(`No such city "${cityArg}"`))

		redisClient.hgetall(`city:${city}`, (err, res) => {
			if (err) return callback(err);
			if (res) {
				console.log(`Found weather for city ${city}`);
				callback(null, res);						
			} else {
				updateWeather(city, function (err, cityWeather) {
					if (err) return callback(err);
					callback(null, cityWeather);
				});
			}
		});
}

/**
* Sends request to weather API provider, parses it, stores in Redis 
* and returns updated forecast for city.
* @param callback(err, object) 
*	object sample {tempDay0: 10, weatherDay0: "SUN", ..., tempDay6: -1, weatherDay6: "SW"}
*/
function updateWeather(cityCode, callback) {
	let cityId = cityAPICode[cityCode];
	if (!cityId) return callback(Error(`Cant find cityAPICode for city "${cityCode}"`));

	// Actual keys here
    // TODO configure keys
	let clientKey = "hYJN884p1MqNMaDrHCxsO";
	let clientSecret = "bD2HESPjJeG3lczhPqoXLFtvKgZyUzXvCaxkplab";

	let urlAPI = `https://api.aerisapi.com/forecasts/${cityId}?client_id=${clientKey}&client_secret=${clientSecret}`;

	request(urlAPI, function (err, response, body) {
		if (err) return callback(err);
		if (!body) return callback(Error('Weather API does not response'));


		let forecast = JSON.parse(body);
		if (!forecast.response || !forecast.response[0] || !forecast.response[0].periods) {
			return callback(Error('Weather API response corrupted'));
		}

		forecast = forecast.response[0].periods;

		let day = 7;
		let cityWeather = {};

		while(day--) {
			cityWeather[`tempDay${day}`] = forecast[day].avgTempC;
			cityWeather[`weatherDay${day}`] = forecast[day].weatherPrimaryCoded.slice(-2);
		}
		
		//TODO config TTL. Weather for cityCode will unavailable after 3600 sec
		let TTL = 3600;
		redisClient.hmsetWithTTL(`city:${cityCode}`, cityWeather, TTL, function (err){
			if (err) callback(err);
			else callback(null, cityWeather);
		});
	});
}

function translateWeatherCode(weatherCode) {
	return weatherCodesMeaning[weatherCode] || "Солнечно";
}

function getIconType(weatherCode) {
	return weatherCodesIcon[weatherCode] || "sun";
}