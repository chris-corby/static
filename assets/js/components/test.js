//
//  test.js

/*
 *  Imports
 */

/*
 *  Test
 */
const test = (function () {
  function showItsWorking() {
    console.log('its working');
  }
 

  //  Public: initialise
  function init() {
    showItsWorking();
  }

  //  Public API
  return {
    init
  };
}()); //  IIFE


/*
 *  Exports
 */
export { test as default };
