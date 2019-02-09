'use strict';

const Widget = require('../models/widget');
const template = require('../utils/template');

const bodyParser = require('body-parser');
const express = require('express');
const widgetRoute = express();

widgetRoute.use(bodyParser.urlencoded({ extended: false, type: "*/x-www-form-urlencoded" }));
widgetRoute.use(bodyParser.json({ type: 'application/*+json' }));

widgetRoute.post('/widgets', function (req, res) {
	let w = new Widget(req.body.city, req.body.days, req.body.orientation);
	w.save(function (err) {
		if (err) {
			res.status(500).send(err);
			return;
		}
        res.status(201).send({widget: w});
	});
});

widgetRoute.get('/widgets/:id', function (req, res, next) {
	if (!req.params.id) return next(req, res);

	new Widget().getById(req.params.id, function(err, w) {
		if (err) return next(err);
		template.populateTemplateObj(w, function(err, templateObj) {
			if (err) throw err;

			// оставить только нужное количество дней
            templateObj.days = templateObj.days.slice(0, w.days);

			if (w.orientation === "Вертикальная") {
				templateObj.wHeight = (w.days === 7) ? '400px' : '190px';
				if (w.days === 1) {
					res.render('widgets/w-v1.pug', templateObj);
				} else {
					res.render('widgets/w-v3-v7.pug', templateObj);
				}
			} else {
				// Горизонтальные виджеты
                res.render(`widgets/w-h${w.days}.pug`, templateObj);
			}
		});
	});
});

widgetRoute.put('/widgets/:id', function (req, res, next) {
    if (!req.body || !req.params.id) return next(req, res);

    new Widget().getById(req.params.id, function(err, widget) {
        if (err) throw err;
        if (!widget) res.status(404).send({error: `Widget with id=${req.params.id} not found`});

        if (req.body.city) widget.city = req.body.city;
        if (req.body.days) widget.days = parseInt(req.body.days);
        if (req.body.orientation) widget.orientation = req.body.orientation;

        widget.save(function (err) {
            if (err) return next(err);
            res.send({widget: widget});
        });
    });
});

widgetRoute.delete('/widgets/:id', function (req, res, next) {
    Widget.deleteById(req.params.id, function(err) {
        if (err) return next(err);
        res.sendStatus(200);
    });
});

widgetRoute.get('/widgets', function (req, res, next) {
    Widget.getAllWidgets(function (err, widgets) {
        if (err) return next(err);
        widgets.sort(function(w1, w2){ return w1.days - w2.days;})
        res.render('widgets.pug', {widgets: widgets});
        // template.devRender(res, '../views/widgets.pug', {widgets: widgets});
    });
});


module.exports = widgetRoute;