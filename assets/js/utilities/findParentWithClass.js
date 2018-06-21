/*------------------------------------------------------------------------------

  findParentWithClass.js

  Given an element, this function will return the closest parent with
  a given class, or otherwise null.

  By default it will check itself, but can switch off

  Usage:
  findParentWithClass(el, 'js-element');

  ----------------------------------------------------------------------------*/

function findParentWithClass(element, targetClass, includingSelf = true) {
  const theClass = targetClass;
  let el = element;

  //  Check self
  if (includingSelf && (el.classList !== undefined) && el.classList.contains(theClass)) {
    return el;
  }

  //  Otherwise check parents
  while (el.parentNode) {
    el = el.parentNode;
    //  If this is going to be null, the last parent is the #document (in Chrome
    //  at least), so check that classList exists on the object to avoid errors
    if ((el.classList !== undefined) && (el.classList.contains(theClass))) {
      return el;
    }
  }
  return null;
}


/*
 *  Exports
 */
export default findParentWithClass;
