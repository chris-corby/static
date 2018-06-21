/*------------------------------------------------------------------------------

  findParentWithTag.js

  Given an element, this function will return the closest parent with
  a given tag, or otherwise null.

  By default it will check itself, but can switch off

  Usage:
  findParentWithTag(el, 'A');

  ----------------------------------------------------------------------------*/

function findParentWithTag(element, tag, includingSelf = true) {
  let el = element;

  //  Check self
  if (includingSelf && el.tagName === tag) {
    return el;
  }

  //  Otherwise check parents
  while (el.parentNode) {
    el = el.parentNode;
    if (el.tagName === tag) {
      return el;
    }
  }
  return null;
}


/*
 *  Exports
 */
export default findParentWithTag;
