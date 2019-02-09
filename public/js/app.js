$(document).on('ready', function() {
    'use strict';

    var editCity = $('#setWidgetCity');
    var editDays = $('#setWidgetDays');
    var editOrientation = $('#setWidgetOrientation');

    var createButton = $('#createWidget');

    var pickedWidget = null;
    // creating a new one widget
    $(createButton).on('click', function() {
        createButton.disabled = true;
        createButton.addClass('disabled');
        if (pickedWidget) {
            // случай изменения существующего виджета
            $.ajax({
                url: '/widgets/' + pickedWidget.data().id,
                method: 'PUT',
                data: {
                    city: $('#setWidgetCity')[0].value,
                    days: $('#setWidgetDays')[0].value,
                    orientation: $('#setWidgetOrientation')[0].value,
                },
                error: function (jqXHR, status, err) {
                    console.error("Can't create new widget.");
                    console.error(jqXHR);
                    animateWithColors(pickedWidget.contents().find('.w'), '#cd0000', 1000);
                },
                success: function (response) {
                    var w = response.widget;
                    console.info("Widget successfully changed. " + w.id);

                    var p = pickedWidget.parent();
                    pickedWidget.remove();
                    pickedWidget = null;

                    var iframe = "<iframe src=" + "/widgets/" + w.id + " onload='javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+\"px\";" +
                        "o.style.width=o.contentWindow.document.body.scrollWidth+\"px\";}(this));' style='border:none;overflow:hidden;' " +
                        "data-id=" + w.id + " data-city=" + w.city + " data-days=" + w.days + " data-orientation=" + w.orientation + "></iframe>";

                    p.append(iframe);
                    p.find('iframe').on('load', function() {
                        animateWithColors($(this).contents().find('.w'), '#65E25D', 1000, '#fff', 700);
                    });

                    createButton[0].innerText = 'Создать';
                },
                complete: function () {
                    createButton.disabled = false;
                    createButton.removeClass('disabled');
                }
            });
        } else {
            // создание нового виджета
            $.ajax({
                url: '/widgets',
                method: 'POST',
                data: {
                    city: $('#setWidgetCity')[0].value,
                    days: $('#setWidgetDays')[0].value,
                    orientation: $('#setWidgetOrientation')[0].value,
                },
                error: function (jqXHR, status, err) {
                    console.error("Can't create new widget.");
                    console.error(jqXHR);
                },
                success: function (response) {
                    console.info("New widget created. " + response.widget.id);
                    addWidget(response.widget);
                },
                complete: function () {
                    createButton.disabled = false;
                    createButton.removeClass('disabled');
                }
            });
        }
    });

    function addWidget(w) {
        var iframe = "<iframe src=" + "/widgets/" + w.id + " onload='javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+\"px\";" +
                    "o.style.width=o.contentWindow.document.body.scrollWidth+\"px\";}(this));' style='border:none;overflow:hidden;' " +
                    "data-id=" + w.id + " data-city=" + w.city + " data-days=" + w.days + " data-orientation=" + w.orientation + "></iframe>";

        var widget = $('<div class="widget-container"><div id=' + w.id + '" class="widget-controls">'
            + '<span class="code-btn"></span><span class="edit-btn"></span><span class="remove-btn"></span></div><br>'
            + iframe + '</div>');

        $(widget).find('iframe').on('load', function() {
            animateWithColors($(this).contents().find('.w'), '#65E25D', 1000, '#fff', 700);
        });

        widget.prependTo('.widgets');
    }

    // control buttons logic
    $('.widgets').on('click', function(e) {
        var cn = e.target.className;
        if (cn !== 'code-btn' && cn !== 'edit-btn' && cn !== 'remove-btn') {
            if (pickedWidget) {
                createButton[0].innerText = 'Создать';
                animateWithColors(pickedWidget.contents().find('.w'), '#fff', 600); // unpicked
                pickedWidget = null;
            }
            return;
        }

        var wId = e.target.parentNode.id;
        if (cn === 'code-btn') {
            // Копировать код встраивания
            var link = document.origin + '/widgets' + wId;
            var code = $(e.target.parentNode.parentNode).find('iframe')[0].outerHTML;
            code = code.replace('src="', 'src="' + document.origin);
            window.prompt("Скопировать код для вставки: Ctrl+C, Enter", code);
        } else if (cn === 'edit-btn') {
            // Редактирование виджета

            if (pickedWidget) {
                cancelWidgetColorHighlighting(pickedWidget);
                // просто отменить выделение при повторном нажатии
                if (wId === pickedWidget.data().id) {
                    pickedWidget = null;
                    createButton[0].innerText = 'Создать';
                    return;
                }
            }

            pickedWidget = $(e.target.parentNode.parentNode).find('iframe');
            animateWithColors(pickedWidget.contents().find('.w'), '#f5eb7a', 600); // picked

            editCity[0].value = pickedWidget.data().city;
            editDays[0].value = pickedWidget.data().days;
            editOrientation[0].value = pickedWidget.data().orientation;

            createButton[0].innerText = 'Изменить';

        } else if (cn === 'remove-btn') {
            if (!confirm('Удаление виджета сделает его недоступным на всех страницах, где он встроен. Вы уверены, что хотите удалить виджет?')) return;

            $.ajax({
                method: 'DELETE',
                url: '/widgets/' + wId,
                error: function (jqXHR, status, err) {
                    console.error("Can't delete widget.");
                    console.error(jqXHR);
                    animateWithColors($(e.target.parentNode.parentNode).find('iframe').contents().find('.w'), '#cd0000', 1000, '#fff', 1000);
                },
                success: function () {
                    console.info("Widget deleted.");
                    animateWithColors($(e.target.parentNode.parentNode).find('iframe').contents().find('.w'), '#cd0000', 1000);
                    // если удаляемый был выбранным
                    if (pickedWidget && wId === pickedWidget.data().id) {
                        pickedWidget = null;
                        createButton[0].innerText = 'Создать';
                    }
                    setTimeout(function() {
                        e.target.parentNode.parentNode.remove();
                    }, 1000);
                }
            })
        }
    });

    function animateWithColors(selector, color, duration, nextColor, nextDuration) {
        selector.css({
            'background-color': color,
            '-webkit-transition': 'background-color ' + duration + 'ms ease-in-out',
            '-moz-transition': 'background-color ' + duration + 'ms ease-in-out',
            '-o-transition': 'background-color ' + duration + 'ms ease-in-out',
            '-ms-transition': 'background-color ' + duration + 'ms ease-in-out',
            'transition': 'background-color ' + duration + 'ms ease-in-out'
        });
        if (nextColor) {
            setTimeout(function() {
                selector.css({
                    'background-color': nextColor,
                    '-webkit-transition': 'background-color ' + nextDuration + 'ms ease-in-out',
                    '-moz-transition': 'background-color ' + nextDuration + 'ms ease-in-out',
                    '-o-transition': 'background-color ' + nextDuration + 'ms ease-in-out',
                    '-ms-transition': 'background-color ' + nextDuration + 'ms ease-in-out',
                    'transition': 'background-color ' + nextDuration + 'ms ease-in-out'
                })
            }, duration);
        }
    }

    function cancelWidgetColorHighlighting($pickedIFrame) {
        animateWithColors($pickedIFrame.contents().find('.w'), '#fff', 1000);
    }

    $(window).scroll(function() {
        if ($(window).scrollTop() > 130) {
            $('.widget-edit-form').addClass('sticky');
        } else {
            $('.widget-edit-form').removeClass('sticky');
        }
    });

});

