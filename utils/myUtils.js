const crypto = require("crypto");

exports.getUid = function (bytes=4) {
	return crypto.randomBytes(bytes).toString("hex");
};

const ruMonthNames = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 
					'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'];

exports.date = {
	getLocaleDateStringDM: function (date) {
		return `${date.getDate()} ${ruMonthNames[date.getMonth()]}`;
	},
	addDays: function (date, days) {
		var result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}
};
