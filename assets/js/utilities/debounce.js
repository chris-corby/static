/*------------------------------------------------------------------------------

  debounce.js

  See: https://davidwalsh.name/javascript-debounce-function

  Returns a function, that, as long as it continues to be invoked, will not be
  triggered. The function will be called after it stops being called for N
  milliseconds. If `immediate` is passed, trigger the function on the leading
  edge, instead of the trailing.

  Usage:
  const resize = debounce(() => {
    [...]
  }, 250);

  window.removeEventListener('resize', resize);

  ----------------------------------------------------------------------------*/

/* eslint-disable */
function debounce(func, wait, immediate) {
  var timeout,
    context,
    args,
    later,
    callNow;

  return function () {
    context = this;
    args = arguments;
    later = function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}
/* eslint-enable */


/*
 *  Exports
 */
export default debounce;
