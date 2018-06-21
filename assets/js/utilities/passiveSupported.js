/*------------------------------------------------------------------------------

  passiveSupported.js

  See: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

  Detects whether browser supports the passive option on an event listener.
  Passing the passive option tells the browser that the event will never get
  e.preventDefault, it can therefore perform the event without having to worry
  about the code to come. This can greatly improve scrolling performance.

  Unless tested, older browsers will always set the 3rd param as true as a test
  for capture, so it has to be checked against.

  Usage:
  window.addEventListener('scroll', scrollFunction, (passiveSupported ? { passive: true } : false));

  ----------------------------------------------------------------------------*/

function passiveSupported() {
  let supported = false;

  try {
    const options = Object.defineProperty({}, 'passive', {
      get: function () {
        supported = true;
      }
    });

    window.addEventListener('test', null, options);
  } catch (err) {}

  //  Return the final verdict
  return supported;
}


/*
 *  Exports
 */
export default passiveSupported;
