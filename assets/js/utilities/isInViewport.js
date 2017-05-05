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
  const returnArray = [];
  let verdict = true;

  //  Add the boolean for all applicable sides to the returnArray
  if (sides.top) {
    returnArray.push(
      rect.top >= (0 - (height * allowance))
    );
  }

  if (sides.right) {
    returnArray.push(
      rect.right <= (width + (width * allowance))
    );
  }

  if (sides.bottom) {
    returnArray.push(
      rect.bottom <= (height + (height * allowance))
    );
  }

  if (sides.left) {
    returnArray.push(
      rect.left >= (0 - (width * allowance))
    );
  }

  //  If any applicable sides return false,
  //  set the overall verdict to false
  for (const side of returnArray) {
    if (!side) {
      verdict = false;
    }
  }

  //  Return the final verdict
  return verdict;
}


/*
 *  Exports
 */
export { isInViewport as default };
