/*------------------------------------------------------------------------------

  isInViewport.js

  Based on: https://gist.github.com/jjmu15/8646226
  Find out if an element is visible in the viewport

  Default Usage:
  isInViewport(el);

  Only check top/right:
  isInViewport(el, { bottom: false, right: false });

  Default with allowance:
  isInViewport(el, undefined, '20%');

  ----------------------------------------------------------------------------*/

function isInViewport(element, sides = { top: true, right: true, bottom: true, left: true }, percentage = '0%') {
  const html = document.documentElement;
  const width = window.innerWidth || html.clientWidth;
  const height = window.innerHeight || html.clientHeight;
  const rect = element.getBoundingClientRect();
  //  allowance gives a percentage of leeway on all sides
  //  20% becomes an allowance of 0.2
  const allowance = (parseInt(percentage, 10) / 100);

  //  Add the boolean for all applicable sides to the returnArray
  if (sides.top) {
    if (!(rect.top >= (0 - (height * allowance)))) return false;
  }

  if (sides.right) {
    if (!(rect.right <= (width + (width * allowance)))) return false;
  }

  if (sides.bottom) {
    if (!(rect.bottom <= (height + (height * allowance)))) return false;
  }

  if (sides.left) {
    if (!(rect.left >= (0 - (width * allowance)))) return false;
  }

  //  If all check passed, return true 
  return true;
}


/*
 *  Exports
 */
export { isInViewport as default };
