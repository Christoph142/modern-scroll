// ==UserScript==
// @name          modern scroll
// @description	  takes scrolling in Opera to a whole new level
// @author        Christoph D.
// ==/UserScript==

// request/cancelAnimationFrame polyfill by Erik Möller (http://my.opera.com/emoller)
(function() {
    var lastTime = 0;
    /*var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelRequestAnimationFrame = window[vendors[x]+
          'CancelRequestAnimationFrame'];
    }*/
	
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = Date.now();
            var timeToCall = Math.max(0, 16 + lastTime - currTime);
			lastTime = currTime + timeToCall;
            var id = window.setTimeout(function() { callback(lastTime); }, timeToCall);
            
            return id;
        };

    if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(id){ window.clearTimeout(id); };
}());