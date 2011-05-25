/**
 * Timed
 * Copyright (c) 2011 Jarvis Badgley, Arthur Klepchukov
 * https://github.com/ChiperSoft/Timed
 * Licensed under the BSD license (BSD_LICENSE.txt)
 *
 * @author <a href="mailto:chipersoft@gmail.com">Jarvis Badgley</a>
 * @version 1.1
 */


(function (context) {
	/**
	 * Accepts more human-readable arguments for creating JavaScript timers and 
	 * converts them to values that can be inspected and passed along to 
	 * setTimeout or setInterval.
	 * If the time when the timer should run is negative or faster than 
	 * the default it uses the default delay and default units.
	 */
	function create_timer() {
		var parsed = {when : null, callback : null},
			ac = arguments.length;
	
		//parse callback function
		parsed.callback = arguments[ac - 1];
		if (typeof parsed.callback !== 'function') throw ("Timed.after and Timed.every - Require a callback as the last argument");
		
		//parse the first argument. if array, merge, otherwise force string. If a second argument is passed, append it as well.
		var period = (arguments[0] instanceof Array?arguments[0].join(''):String(arguments[0])) + (ac===3?String(arguments[1]):'');
		
		if (isNaN(parseInt(period,10))) period = '1'+period;
		
		var match = period.toLowerCase().replace(/[^a-z0-9\.]/g, "").match(/(?:(\d+(?:\.\d+)?)(?:days?|d))?(?:(\d+(?:\.\d+)?)(?:hours?|hrs?|h))?(?:(\d+(?:\.\d+)?)(?:minutes?|mins?|m))?(?:(\d+(?:\.\d+)?)(?:seconds?|secs?|s))?(?:(\d+(?:\.\d+)?)(?:milliseconds?|ms))?/);
		
		if (match[0]) {
			parsed.when = 
				parseFloat(match[1]||0)*86400000 + //days
				parseFloat(match[2]||0)*3600000 +  //hours
				parseFloat(match[3]||0)*60000 +  //minutes
				parseFloat(match[4]||0)*1000 +	//seconds
				  parseInt(match[5]||0,10);		//milliseconds
				
		} else if (ac===3 || !(parsed.when = parseInt(arguments[0],10))) {
			throw ("Timed.after and Timed.every - Could not parse delay arguments, check your syntax");
		}
		
		return parsed;
	}
	

	var Timed = {
		/**
		 * Syntactic sugar for setTimeout.
		 *		setTimeout(function() { ... }, 300000); // becomes:
		 *		Timed.after(5, "minutes", function() { ... });
		 *
		 *		// other valid calls:
		 *		Timed.after(100, function() { ... }); // 100 milliseconds
		 *		Timed.after("9.7", function() { ... }); // 9.7 milliseconds
		 *		Timed.after("50sec", function() { ... }); // 50 seconds
		 *		Timed.after("33", "hours", function() { ... }); // 33 hours
		 *
		 * Valid time units include millisecond, second, minute, hour, & day
		 * along with all their common abbreviations and pluralizations.
		 */
		after : function after() {
			var timer = create_timer.apply(this, arguments);
			return setTimeout(timer.callback, timer.when);
		},

		/**
		 * Syntactic sugar for setTimeout.
		 *
		 *		setInterval(function() { ... }, 300000); // becomes:
		 *		Timed.every(5, "minutes", function() { ... });
		 *
		 * Supports the same syntax and arguments as Timed.after
		 */
		every : function every() {
			var timer = create_timer.apply(this, arguments);
			return setInterval(timer.callback, timer.when);
		}
	};

	var oldTimed = context.Timed;
	Timed.noConflict = function () {
		context.Timed = oldTimed;
		return this;
	};
	context.Timed = Timed;

})(this);