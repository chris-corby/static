/*------------------------------------------------------------------------------

  scrollToY.js

  Based on: http://stackoverflow.com/questions/8917921/cross-browser-javascript-
  not-jquery-scroll-to-top-animation#answer-26808520

  Usage:
  scrollToY(0, 0.8, 'easeInOutQuint');

  ----------------------------------------------------------------------------*/

//
//  scrollToY.js
//
//  Based on: http://stackoverflow.com/questions/8917921/cross-browser-javascript-not-jquery-scroll-
//  to-top-animation#answer-26808520

/*
 *  Imports
 */
import '../polyfills/requestanimationframe';

/* eslint-disable */
function scrollToY(target, timing, easing) {
  
  //  Vars
  var scrollY     = window.scrollY || document.documentElement.scrollTop,
    currentTime   = 0,
    easingEquations;
  
  //  Easing equations
  //  https://github.com/danro/easing-js/blob/master/easing.js
  easingEquations = {
    easeOutSine: function (pos) {
        return Math.sin(pos * (Math.PI / 2));
    },
    easeInOutSine: function (pos) {
        return (-0.5 * (Math.cos(Math.PI * pos) - 1));
    },
    easeInOutQuint: function (pos) {
        if ((pos /= 0.5) < 1) {
            return 0.5 * Math.pow(pos, 5);
        }
        return 0.5 * (Math.pow((pos - 2), 5) + 2);
    }
  };

  //  Animation loop
  function tick() {
    currentTime += (1 / 60);

    var p = currentTime / timing,
      t = easingEquations[easing](p);

    if (p < 1) {
      //  Requires requestanimationframe.js polyfill
      requestAnimationFrame(tick);

      window.scrollTo(0, scrollY + ((target - scrollY) * t));
    } else {
      window.scrollTo(0, target);
    }
  }

  //  Call animation loop once to begin
  tick();
}
/* eslint-enable */


/*
 *  Exports
 */
export { scrollToY as default };
