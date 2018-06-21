//
//  state.js

/*
 *  Imports
 */

const state = (function (html, body) {
  const sizeEl = document.querySelector('.js-state-size');
  const header = document.querySelector('.js-header');
  const cache = {
    header,
    headerHeight: header.offsetHeight,
    windowHeight: window.innerHeight || html.clientHeight || body.clientHeight,
    windowWidth: window.innerWidth || html.clientWidth || body.clientWidth
  };
  let scrollPosition;

  //  Private: set up vars, abstracted for use after ajax
  function setUpVars() {
  }

  //  Private: stop scroll
  function noScroll(stopScrolling = true) {
    //  Stop Scrolling
    if (stopScrolling) {
      //  Save current scroll position
      scrollPosition = window.pageYOffset;

      //  Add class to body
      body.classList.add('noscroll');

      //  Add offset to the body equal to the scroll
      body.style.top = `${-scrollPosition}px`;

    //  Allow Scrolling
    } else {
      //  Remove class from body
      body.classList.remove('noscroll');

      //  Remove offset from body
      body.style.top = '';

      //  Scroll back to previous position
      window.scrollTo(0, scrollPosition);
    }
  }

  //  Private: update vars on resize
  //  Don't debounce this as these vars are needed very quickly in
  //  other places
  function onResize() {
    cache.headerHeight = header.offsetHeight;
    cache.windowHeight = window.innerHeight || html.clientHeight || body.clientHeight;
    cache.windowWidth = window.innerWidth || html.clientWidth || body.clientWidth;
  }

  //  Public: return the responsive size
  function returnSize() {
    const zed = parseInt(window.getComputedStyle(sizeEl, null).getPropertyValue('z-index'), 10);
    return zed;
  }

  //  Public: check whether this current screen size is mobile
  function isMobile() {
    const size = returnSize();
    const verdict = (size < 4) || false;
    return verdict;
  }

  //  Private: set up resize listener
  function setUpResize() {
    window.addEventListener('resize', onResize);
  }

  //  Public: initialise
  function init() {
    setUpResize();
  }

  //  Public API
  return {
    init,
    isMobile,
    returnSize,
    noScroll,

    //  Vars
    cache
  };
}(document.documentElement, document.body)); //  IIFE


/*
 *  Exports
 */
export { state as default };
