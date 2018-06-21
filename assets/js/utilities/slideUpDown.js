/*------------------------------------------------------------------------------

  slideUpDown.js

  Usage:
  slideUp(parent);
  slideDown(parent, child);

  ----------------------------------------------------------------------------*/

/*
 *  slideUp
 */
function slideUp(parentEl) {
  const activeClass = 'is-active';
  const parent = parentEl;

  //  Remove the active class from the parent
  if (parent.classList.contains(activeClass)) {
    parent.classList.remove(activeClass);
  }

  //  Reset the max-height of the parent
  parent.style.maxHeight = '0px';
}

/*
 *  slideDown
 */
function slideDown(parentEl, childEl) {
  const parent = parentEl;
  const child = childEl;
  //  Get current max-height of parent (used on resize)
  const parentMax = parent.style.maxHeight;
  //  Get the height of the child
  const childHeight = child.offsetHeight;
  const activeClass = 'is-active';

  //  If parent max-height is not enough, reset
  if (parseInt(parentMax, 10) !== childHeight) {
    //  Add the active class to the parent
    if (!parent.classList.contains(activeClass)) {
      parent.classList.add(activeClass);
    }

    //  Set the max-height of the parent to the height of the child
    parent.style.maxHeight = `${childHeight}px`;
  }
}

/*
 *  Exports
 */
export { slideUp, slideDown };
