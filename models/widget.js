const utils = require('../utils/myUtils');
const redisClient = require('../utils/redisClient');
const weather = require('../utils/weather');

class Widget {
    constructor (city="Москва", days=1, orientation="Вертикальная") {
        this.id = "widget:" + utils.getUid();
        this.city = city;
        this.days = days;
        this.orientation = orientation;
    }

    save(callback) {
        redisClient.hmset(`${this.id}`, {
            "city": this.city,
            "days": this.days,
            "orientation": this.orientation
        }, callback);
    }

    getById(id, callback) {
        redisClient.hgetall(id, (err, res) => {
            if (err) throw err;
            if (res) {
                console.log(`Found widget with id ${id}`);
                this.id = id;
                this.city = res.city;
                this.days = parseInt(res.days);
                this.orientation = res.orientation;
                callback(null, this);
            } else {
                callback(new Error(`Not found widget with id ${id}. Get failed`));
            }
        });
    }

    static deleteById(id, callback) {
        redisClient.del(id, callback);
    }

    static getAllWidgetIds(callback) {
        // уродливое решение, но получение всех-всех виджетов не нужно, если есть привязка пользователь->[виджеты]
        redisClient.send_command("SCAN", [0, "MATCH", "widget:*", "COUNT", 1000000], function (err, res) {
            if (err) {
                console.error(err);
                return;
            }
            if (!res || !res[1]) return callback(null, null);
            console.dir(res);
            callback(null, res[1]);
        });
    }

    static getAllWidgets(callback) {
        Widget.getAllWidgetIds(function(err, IDs) {
            if (err) return callback(err);
            if (!IDs) return callback(null, null);

            let promises = [];

            for (let i = 0; i < IDs.length; i++) {
                promises.push(
                    new Promise(function (resolve, reject) {
                        let id = IDs[i];
                        new Widget().getById(IDs[i], function (err, newWidget) {
                            if (err) return reject(err);
                            if (!newWidget) return reject(Error(`No widget with ${id} found`));
                            resolve(newWidget);
                        });
                    })
                );
            }

            Promise.all(promises).then(function (results) {
                console.dir(results);
                callback(null, results);
            }, function (err) {
                console.error(err);
                callback(err);
            });
        });
    }
}

module.exports = Widget;

// let w = new Widget("Санкт-Петербург");
// let c;
// w.save(() => {
// 	console.log('Saved');
// 	c = new Widget().getById(w.id, (err, result) => c = result);
// });
