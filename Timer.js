/*
 * Timer.js: A periodic timer for Node.js and the browser.
 *
 * Copyright (c) 2012 Arthur Klepchukov, Jarvis Badgley, Florian Schäfer
 * Licensed under the BSD license (BSD_LICENSE.txt)
 *
 * Version: 0.0.1
 *
 */
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Timer = factory();
    }
})(this, function () {

    function timeStringToMilliseconds(timeString) {
        if (typeof timeString === 'string') {

            if (isNaN(parseInt(timeString, 10))) {
                timeString = '1' + timeString;
            }

            var match = timeString
                .replace(/[^a-z0-9\.]/g, '')
                .match(/(?:(\d+(?:\.\d+)?)(?:days?|d))?(?:(\d+(?:\.\d+)?)(?:hours?|hrs?|h))?(?:(\d+(?:\.\d+)?)(?:minutes?|mins?|m\b))?(?:(\d+(?:\.\d+)?)(?:seconds?|secs?|s))?(?:(\d+(?:\.\d+)?)(?:milliseconds?|ms))?/);

            if (match[0]) {
                return parseFloat(match[1] || 0) * 86400000 +  // days
                    parseFloat(match[2] || 0) * 3600000 +   // hours
                    parseFloat(match[3] || 0) * 60000 +     // minutes
                    parseFloat(match[4] || 0) * 1000 +      // seconds
                    parseInt(match[5] || 0, 10);            // milliseconds
            }

            if (!isNaN(parseInt(timeString, 10))) {
                return parseInt(timeString, 10);
            }
        }

        if (typeof timeString === 'number') {
            return timeString;
        }

        return 0;
    }

    function millisecondsToTicks(milliseconds, resolution) {
        return parseInt(milliseconds / resolution, 10) || 1;
    }

    function Timer(resolution) {
        if (this instanceof Timer === false) {
            return new Timer(resolution);
        }

        this._notifications = [];
        this._resolution = timeStringToMilliseconds(resolution) || 1000;
        this._running = false;
        this._ticks = 0;
        this._timer = null;
        this._drift = 0;
        this._maxTicks = 1;
        this._isMaximumTick = false;
    }

    Timer.prototype = {
        start: function () {
            var self = this;
            if (!this._running) {
                this._running = !this._running;
                this._timer = setTimeout(function loopsyloop() {
                    clearTimeout( self._timer );
                    self._timer = null;
                    self._ticks++;
                    if (self._ticks > self._maxTicks) {
                        self._isMaximumTick = true;
                    }
                    for (var i = 0, l = self._notifications.length; i < l; i++) {
                        if (self._notifications[i]) {
                            if (self._ticks >= self._notifications[i].ticks) {
                                self._notifications[i].ticks = self._notifications[i].originalTicks;
                                if ( !self._isMaximumTick ) {
                                    self._notifications[i].ticks += self._ticks;
                                }
                                self._notifications[i].callback.call(
                                    self._notifications[i],
                                    { ticks: self._ticks, resolution: self._resolution }
                                );
                            }
                            if (self._isMaximumTick && self._notifications[i]) {
                                self._notifications[i].ticks -= self._ticks;
                                self._maxTicks = Math.max(self._notifications[i].ticks, self._maxTicks);
                            }
                        }
                    }
                    if (self._isMaximumTick) {
                        self._ticks = 0;
                        self._isMaximumTick = false;
                    }
                    if (self._running) {
                        self._timer = setTimeout(loopsyloop, self._resolution + self._drift);
                        self._drift = 0;
                    }
                }, this._resolution + this._drift);
                this._drift = 0;
            }
            return this;
        },
        stop: function () {
            if (this._running) {
                this._running = !this._running;
                clearTimeout(this._timer);
            }
            return this;
        },
        reset: function () {
            this.stop();
            this._ticks = 0;
            return this;
        },
        clear: function () {
            this.reset();
            this._notifications = [];
            return this;
        },
        ticks: function () {
            return this._ticks;
        },
        resolution: function () {
            return this._resolution;
        },
        running: function () {
            return this._running;
        },
        bind: function (when, callback, originalCallback) {
            if (when && callback) {
                var ticks = millisecondsToTicks(timeStringToMilliseconds(when), this._resolution);
                this._notifications.push({
                    ticks: ticks + (!this._isMaximumTick ? this._ticks : 0),
                    originalTicks: ticks,
                    callback: callback,
                    originalCallback: originalCallback || callback
                });
            }
            return originalCallback || callback;
        },
        unbind: function (callback) {
            if (!callback) {
                this._notifications = [];
                this._maxTicks = 1;
            } else {
                var delta = 0;
                for (var i = 0, l = this._notifications.length; i < l; i++) {
                    if (this._notifications[i] && this._notifications[i].originalCallback === callback) {
                            this._notifications.splice(i - delta, 1);
                            delta++;
                    }
                }
            }
            return this;
        },
        drift: function (timeDrift) {
            this._drift = timeDrift;
            return this;
        }
    };

    Timer.prototype.every = Timer.prototype.bind;
    Timer.prototype.after = function (when, callback) {
        var self = this;
        return Timer.prototype.bind.call(self, when, function fn () {
            Timer.prototype.unbind.call(self, callback);
            callback.apply(this, arguments);
        }, callback);
    };

    return Timer;

});