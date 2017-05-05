(function () {
'use strict';

(function(window, document, undefined){
	/*jshint eqnull:true */
	'use strict';
	var polyfill;
	var config = (window.lazySizes && lazySizes.cfg) || window.lazySizesConfig;
	var img = document.createElement('img');
	var supportSrcset = ('sizes' in img) && ('srcset' in img);
	var regHDesc = /\s+\d+h/g;
	var fixEdgeHDescriptor = (function(){
		var regDescriptors = /\s+(\d+)(w|h)\s+(\d+)(w|h)/;
		var forEach = Array.prototype.forEach;

		return function(edgeMatch){
			var img = document.createElement('img');
			var removeHDescriptors = function(source){
				var ratio;
				var srcset = source.getAttribute(lazySizesConfig.srcsetAttr);
				if(srcset){
					if(srcset.match(regDescriptors)){
						if(RegExp.$2 == 'w'){
							ratio = RegExp.$1 / RegExp.$3;
						} else {
							ratio = RegExp.$3 / RegExp.$1;
						}

						if(ratio){
							source.setAttribute('data-aspectratio', ratio);
						}
					}
					source.setAttribute(lazySizesConfig.srcsetAttr, srcset.replace(regHDesc, ''));
				}
			};
			var handler = function(e){
				var picture = e.target.parentNode;

				if(picture && picture.nodeName == 'PICTURE'){
					forEach.call(picture.getElementsByTagName('source'), removeHDescriptors);
				}
				removeHDescriptors(e.target);
			};

			var test = function(){
				if(!!img.currentSrc){
					document.removeEventListener('lazybeforeunveil', handler);
				}
			};

			if(edgeMatch[1]){
				document.addEventListener('lazybeforeunveil', handler);

				if(true || edgeMatch[1] > 14){
					img.onload = test;
					img.onerror = test;

					img.srcset = 'data:,a 1w 1h';

					if(img.complete){
						test();
					}
				}
			}
		};
	})();


	if(!config){
		config = {};
		window.lazySizesConfig = config;
	}

	if(!config.supportsType){
		config.supportsType = function(type/*, elem*/){
			return !type;
		};
	}

	if(window.picturefill || config.pf){return;}

	if(window.HTMLPictureElement && supportSrcset){

		if(document.msElementsFromPoint){
			fixEdgeHDescriptor(navigator.userAgent.match(/Edge\/(\d+)/));
		}

		config.pf = function(){};
		return;
	}

	config.pf = function(options){
		var i, len;
		if(window.picturefill){return;}
		for(i = 0, len = options.elements.length; i < len; i++){
			polyfill(options.elements[i]);
		}
	};

	// partial polyfill
	polyfill = (function(){
		var ascendingSort = function( a, b ) {
			return a.w - b.w;
		};
		var regPxLength = /^\s*\d+\.*\d*px\s*$/;
		var reduceCandidate = function (srces) {
			var lowerCandidate, bonusFactor;
			var len = srces.length;
			var candidate = srces[len -1];
			var i = 0;

			for(i; i < len;i++){
				candidate = srces[i];
				candidate.d = candidate.w / srces.w;

				if(candidate.d >= srces.d){
					if(!candidate.cached && (lowerCandidate = srces[i - 1]) &&
						lowerCandidate.d > srces.d - (0.13 * Math.pow(srces.d, 2.2))){

						bonusFactor = Math.pow(lowerCandidate.d - 0.6, 1.6);

						if(lowerCandidate.cached) {
							lowerCandidate.d += 0.15 * bonusFactor;
						}

						if(lowerCandidate.d + ((candidate.d - srces.d) * bonusFactor) > srces.d){
							candidate = lowerCandidate;
						}
					}
					break;
				}
			}
			return candidate;
		};

		var parseWsrcset = (function(){
			var candidates;
			var regWCandidates = /(([^,\s].[^\s]+)\s+(\d+)w)/g;
			var regMultiple = /\s/;
			var addCandidate = function(match, candidate, url, wDescriptor){
				candidates.push({
					c: candidate,
					u: url,
					w: wDescriptor * 1
				});
			};

			return function(input){
				candidates = [];
				input = input.trim();
				input
					.replace(regHDesc, '')
					.replace(regWCandidates, addCandidate)
				;

				if(!candidates.length && input && !regMultiple.test(input)){
					candidates.push({
						c: input,
						u: input,
						w: 99
					});
				}

				return candidates;
			};
		})();

		var runMatchMedia = function(){
			if(runMatchMedia.init){return;}

			runMatchMedia.init = true;
			addEventListener('resize', (function(){
				var timer;
				var matchMediaElems = document.getElementsByClassName('lazymatchmedia');
				var run = function(){
					var i, len;
					for(i = 0, len = matchMediaElems.length; i < len; i++){
						polyfill(matchMediaElems[i]);
					}
				};

				return function(){
					clearTimeout(timer);
					timer = setTimeout(run, 66);
				};
			})());
		};

		var createSrcset = function(elem, isImage){
			var parsedSet;
			var srcSet = elem.getAttribute('srcset') || elem.getAttribute(config.srcsetAttr);

			if(!srcSet && isImage){
				srcSet = !elem._lazypolyfill ?
					(elem.getAttribute(config.srcAttr) || elem.getAttribute('src')) :
					elem._lazypolyfill._set
				;
			}

			if(!elem._lazypolyfill || elem._lazypolyfill._set != srcSet){

				parsedSet = parseWsrcset( srcSet || '' );
				if(isImage && elem.parentNode){
					parsedSet.isPicture = elem.parentNode.nodeName.toUpperCase() == 'PICTURE';

					if(parsedSet.isPicture){
						if(window.matchMedia){
							lazySizes.aC(elem, 'lazymatchmedia');
							runMatchMedia();
						}
					}
				}

				parsedSet._set = srcSet;
				Object.defineProperty(elem, '_lazypolyfill', {
					value: parsedSet,
					writable: true
				});
			}
		};

		var getX = function(elem){
			var dpr = window.devicePixelRatio || 1;
			var optimum = lazySizes.getX && lazySizes.getX(elem);
			return Math.min(optimum || dpr, 2.5, dpr);
		};

		var matchesMedia = function(media){
			if(window.matchMedia){
				matchesMedia = function(media){
					return !media || (matchMedia(media) || {}).matches;
				};
			} else {
				return !media;
			}

			return matchesMedia(media);
		};

		var getCandidate = function(elem){
			var sources, i, len, media, source, srces, src, width;

			source = elem;
			createSrcset(source, true);
			srces = source._lazypolyfill;

			if(srces.isPicture){
				for(i = 0, sources = elem.parentNode.getElementsByTagName('source'), len = sources.length; i < len; i++){
					if( config.supportsType(sources[i].getAttribute('type'), elem) && matchesMedia( sources[i].getAttribute('media')) ){
						source = sources[i];
						createSrcset(source);
						srces = source._lazypolyfill;
						break;
					}
				}
			}

			if(srces.length > 1){
				width = source.getAttribute('sizes') || '';
				width = regPxLength.test(width) && parseInt(width, 10) || lazySizes.gW(elem, elem.parentNode);
				srces.d = getX(elem);
				if(!srces.src || !srces.w || srces.w < width){
					srces.w = width;
					src = reduceCandidate(srces.sort(ascendingSort));
					srces.src = src;
				} else {
					src = srces.src;
				}
			} else {
				src = srces[0];
			}

			return src;
		};

		var p = function(elem){
			if(supportSrcset && elem.parentNode && elem.parentNode.nodeName.toUpperCase() != 'PICTURE'){return;}
			var candidate = getCandidate(elem);

			if(candidate && candidate.u && elem._lazypolyfill.cur != candidate.u){
				elem._lazypolyfill.cur = candidate.u;
				candidate.cached = true;
				elem.setAttribute(config.srcAttr, candidate.u);
				elem.setAttribute('src', candidate.u);
			}
		};

		p.parse = parseWsrcset;

		return p;
	})();

	if(config.loadedClass && config.loadingClass){
		(function(){
			var sels = [];
			['img[sizes$="px"][srcset].', 'picture > img:not([srcset]).'].forEach(function(sel){
				sels.push(sel + config.loadedClass);
				sels.push(sel + config.loadingClass);
			});
			config.pf({
				elements: document.querySelectorAll(sels.join(', '))
			});
		})();

	}
})(window, document);

/**
 * Some versions of iOS (8.1-) do load the first candidate of a srcset candidate list, if width descriptors with the sizes attribute is used.
 * This tiny extension prevents this wasted download by creating a picture structure around the image.
 * Note: This extension is already included in the ls.respimg.js file.
 *
 * Usage:
 *
 * <img
 * 	class="lazyload"
 * 	data-sizes="auto"
 * 	data-srcset="small.jpg 640px,
 * 		medium.jpg 980w,
 * 		large.jpg 1280w"
 * 	/>
 */

(function(document){
	'use strict';
	var regPicture;
	var img = document.createElement('img');

	if(('srcset' in img) && !('sizes' in img) && !window.HTMLPictureElement){
		regPicture = /^picture$/i;
		document.addEventListener('lazybeforeunveil', function(e){
			var elem, parent, srcset, sizes, isPicture;
			var picture, source;
			if(e.defaultPrevented ||
				lazySizesConfig.noIOSFix ||
				!(elem = e.target) ||
				!(srcset = elem.getAttribute(lazySizesConfig.srcsetAttr)) ||
				!(parent = elem.parentNode) ||
				(
					!(isPicture = regPicture.test(parent.nodeName || '')) &&
					!(sizes = elem.getAttribute('sizes') || elem.getAttribute(lazySizesConfig.sizesAttr))
				)
			){return;}

			picture = isPicture ? parent : document.createElement('picture');

			if(!elem._lazyImgSrc){
				Object.defineProperty(elem, '_lazyImgSrc', {
					value: document.createElement('source'),
					writable: true
				});
			}
			source = elem._lazyImgSrc;

			if(sizes){
				source.setAttribute('sizes', sizes);
			}

			source.setAttribute(lazySizesConfig.srcsetAttr, srcset);
			elem.setAttribute('data-pfsrcset', srcset);
			elem.removeAttribute(lazySizesConfig.srcsetAttr);

			if(!isPicture){
				parent.insertBefore(picture, elem);
				picture.appendChild(elem);
			}
			picture.insertBefore(source, elem);
		});
	}
})(document);

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var lazysizes = createCommonjsModule(function (module) {
(function(window, factory) {
	var lazySizes = factory(window, window.document);
	window.lazySizes = lazySizes;
	if('object' == 'object' && module.exports){
		module.exports = lazySizes;
	}
}(window, function l(window, document) {
	'use strict';
	/*jshint eqnull:true */
	if(!document.getElementsByClassName){return;}

	var lazySizesConfig;

	var docElem = document.documentElement;

	var Date = window.Date;

	var supportPicture = window.HTMLPictureElement;

	var _addEventListener = 'addEventListener';

	var _getAttribute = 'getAttribute';

	var addEventListener = window[_addEventListener];

	var setTimeout = window.setTimeout;

	var requestAnimationFrame = window.requestAnimationFrame || setTimeout;

	var requestIdleCallback = window.requestIdleCallback;

	var regPicture = /^picture$/i;

	var loadEvents = ['load', 'error', 'lazyincluded', '_lazyloaded'];

	var regClassCache = {};

	var forEach = Array.prototype.forEach;

	var hasClass = function(ele, cls) {
		if(!regClassCache[cls]){
			regClassCache[cls] = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		}
		return regClassCache[cls].test(ele[_getAttribute]('class') || '') && regClassCache[cls];
	};

	var addClass = function(ele, cls) {
		if (!hasClass(ele, cls)){
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').trim() + ' ' + cls);
		}
	};

	var removeClass = function(ele, cls) {
		var reg;
		if ((reg = hasClass(ele,cls))) {
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').replace(reg, ' '));
		}
	};

	var addRemoveLoadEvents = function(dom, fn, add){
		var action = add ? _addEventListener : 'removeEventListener';
		if(add){
			addRemoveLoadEvents(dom, fn);
		}
		loadEvents.forEach(function(evt){
			dom[action](evt, fn);
		});
	};

	var triggerEvent = function(elem, name, detail, noBubbles, noCancelable){
		var event = document.createEvent('CustomEvent');

		event.initCustomEvent(name, !noBubbles, !noCancelable, detail || {});

		elem.dispatchEvent(event);
		return event;
	};

	var updatePolyfill = function (el, full){
		var polyfill;
		if( !supportPicture && ( polyfill = (window.picturefill || lazySizesConfig.pf) ) ){
			polyfill({reevaluate: true, elements: [el]});
		} else if(full && full.src){
			el.src = full.src;
		}
	};

	var getCSS = function (elem, style){
		return (getComputedStyle(elem, null) || {})[style];
	};

	var getWidth = function(elem, parent, width){
		width = width || elem.offsetWidth;

		while(width < lazySizesConfig.minSize && parent && !elem._lazysizesWidth){
			width =  parent.offsetWidth;
			parent = parent.parentNode;
		}

		return width;
	};

	var rAF = (function(){
		var running, waiting;
		var firstFns = [];
		var secondFns = [];
		var fns = firstFns;

		var run = function(){
			var runFns = fns;

			fns = firstFns.length ? secondFns : firstFns;

			running = true;
			waiting = false;

			while(runFns.length){
				runFns.shift()();
			}

			running = false;
		};

		var rafBatch = function(fn, queue){
			if(running && !queue){
				fn.apply(this, arguments);
			} else {
				fns.push(fn);

				if(!waiting){
					waiting = true;
					(document.hidden ? setTimeout : requestAnimationFrame)(run);
				}
			}
		};

		rafBatch._lsFlush = run;

		return rafBatch;
	})();

	var rAFIt = function(fn, simple){
		return simple ?
			function() {
				rAF(fn);
			} :
			function(){
				var that = this;
				var args = arguments;
				rAF(function(){
					fn.apply(that, args);
				});
			}
		;
	};

	var throttle = function(fn){
		var running;
		var lastTime = 0;
		var gDelay = 125;
		var RIC_DEFAULT_TIMEOUT = 666;
		var rICTimeout = RIC_DEFAULT_TIMEOUT;
		var run = function(){
			running = false;
			lastTime = Date.now();
			fn();
		};
		var idleCallback = requestIdleCallback ?
			function(){
				requestIdleCallback(run, {timeout: rICTimeout});
				if(rICTimeout !== RIC_DEFAULT_TIMEOUT){
					rICTimeout = RIC_DEFAULT_TIMEOUT;
				}
			}:
			rAFIt(function(){
				setTimeout(run);
			}, true);

		return function(isPriority){
			var delay;
			if((isPriority = isPriority === true)){
				rICTimeout = 44;
			}

			if(running){
				return;
			}

			running =  true;

			delay = gDelay - (Date.now() - lastTime);

			if(delay < 0){
				delay = 0;
			}

			if(isPriority || (delay < 9 && requestIdleCallback)){
				idleCallback();
			} else {
				setTimeout(idleCallback, delay);
			}
		};
	};

	//based on http://modernjavascript.blogspot.de/2013/08/building-better-debounce.html
	var debounce = function(func) {
		var timeout, timestamp;
		var wait = 99;
		var run = function(){
			timeout = null;
			func();
		};
		var later = function() {
			var last = Date.now() - timestamp;

			if (last < wait) {
				setTimeout(later, wait - last);
			} else {
				(requestIdleCallback || run)(run);
			}
		};

		return function() {
			timestamp = Date.now();

			if (!timeout) {
				timeout = setTimeout(later, wait);
			}
		};
	};


	var loader = (function(){
		var lazyloadElems, preloadElems, isCompleted, resetPreloadingTimer, loadMode, started;

		var eLvW, elvH, eLtop, eLleft, eLright, eLbottom;

		var defaultExpand, preloadExpand, hFac;

		var regImg = /^img$/i;
		var regIframe = /^iframe$/i;

		var supportScroll = ('onscroll' in window) && !(/glebot/.test(navigator.userAgent));

		var shrinkExpand = 0;
		var currentExpand = 0;

		var isLoading = 0;
		var lowRuns = -1;

		var resetPreloading = function(e){
			isLoading--;
			if(e && e.target){
				addRemoveLoadEvents(e.target, resetPreloading);
			}

			if(!e || isLoading < 0 || !e.target){
				isLoading = 0;
			}
		};

		var isNestedVisible = function(elem, elemExpand){
			var outerRect;
			var parent = elem;
			var visible = getCSS(document.body, 'visibility') == 'hidden' || getCSS(elem, 'visibility') != 'hidden';

			eLtop -= elemExpand;
			eLbottom += elemExpand;
			eLleft -= elemExpand;
			eLright += elemExpand;

			while(visible && (parent = parent.offsetParent) && parent != document.body && parent != docElem){
				visible = ((getCSS(parent, 'opacity') || 1) > 0);

				if(visible && getCSS(parent, 'overflow') != 'visible'){
					outerRect = parent.getBoundingClientRect();
					visible = eLright > outerRect.left &&
						eLleft < outerRect.right &&
						eLbottom > outerRect.top - 1 &&
						eLtop < outerRect.bottom + 1
					;
				}
			}

			return visible;
		};

		var checkElements = function() {
			var eLlen, i, rect, autoLoadElem, loadedSomething, elemExpand, elemNegativeExpand, elemExpandVal, beforeExpandVal;

			if((loadMode = lazySizesConfig.loadMode) && isLoading < 8 && (eLlen = lazyloadElems.length)){

				i = 0;

				lowRuns++;

				if(preloadExpand == null){
					if(!('expand' in lazySizesConfig)){
						lazySizesConfig.expand = docElem.clientHeight > 500 && docElem.clientWidth > 500 ? 500 : 370;
					}

					defaultExpand = lazySizesConfig.expand;
					preloadExpand = defaultExpand * lazySizesConfig.expFactor;
				}

				if(currentExpand < preloadExpand && isLoading < 1 && lowRuns > 2 && loadMode > 2 && !document.hidden){
					currentExpand = preloadExpand;
					lowRuns = 0;
				} else if(loadMode > 1 && lowRuns > 1 && isLoading < 6){
					currentExpand = defaultExpand;
				} else {
					currentExpand = shrinkExpand;
				}

				for(; i < eLlen; i++){

					if(!lazyloadElems[i] || lazyloadElems[i]._lazyRace){continue;}

					if(!supportScroll){unveilElement(lazyloadElems[i]);continue;}

					if(!(elemExpandVal = lazyloadElems[i][_getAttribute]('data-expand')) || !(elemExpand = elemExpandVal * 1)){
						elemExpand = currentExpand;
					}

					if(beforeExpandVal !== elemExpand){
						eLvW = innerWidth + (elemExpand * hFac);
						elvH = innerHeight + elemExpand;
						elemNegativeExpand = elemExpand * -1;
						beforeExpandVal = elemExpand;
					}

					rect = lazyloadElems[i].getBoundingClientRect();

					if ((eLbottom = rect.bottom) >= elemNegativeExpand &&
						(eLtop = rect.top) <= elvH &&
						(eLright = rect.right) >= elemNegativeExpand * hFac &&
						(eLleft = rect.left) <= eLvW &&
						(eLbottom || eLright || eLleft || eLtop) &&
						((isCompleted && isLoading < 3 && !elemExpandVal && (loadMode < 3 || lowRuns < 4)) || isNestedVisible(lazyloadElems[i], elemExpand))){
						unveilElement(lazyloadElems[i]);
						loadedSomething = true;
						if(isLoading > 9){break;}
					} else if(!loadedSomething && isCompleted && !autoLoadElem &&
						isLoading < 4 && lowRuns < 4 && loadMode > 2 &&
						(preloadElems[0] || lazySizesConfig.preloadAfterLoad) &&
						(preloadElems[0] || (!elemExpandVal && ((eLbottom || eLright || eLleft || eLtop) || lazyloadElems[i][_getAttribute](lazySizesConfig.sizesAttr) != 'auto')))){
						autoLoadElem = preloadElems[0] || lazyloadElems[i];
					}
				}

				if(autoLoadElem && !loadedSomething){
					unveilElement(autoLoadElem);
				}
			}
		};

		var throttledCheckElements = throttle(checkElements);

		var switchLoadingClass = function(e){
			addClass(e.target, lazySizesConfig.loadedClass);
			removeClass(e.target, lazySizesConfig.loadingClass);
			addRemoveLoadEvents(e.target, rafSwitchLoadingClass);
		};
		var rafedSwitchLoadingClass = rAFIt(switchLoadingClass);
		var rafSwitchLoadingClass = function(e){
			rafedSwitchLoadingClass({target: e.target});
		};

		var changeIframeSrc = function(elem, src){
			try {
				elem.contentWindow.location.replace(src);
			} catch(e){
				elem.src = src;
			}
		};

		var handleSources = function(source){
			var customMedia, parent;

			var sourceSrcset = source[_getAttribute](lazySizesConfig.srcsetAttr);

			if( (customMedia = lazySizesConfig.customMedia[source[_getAttribute]('data-media') || source[_getAttribute]('media')]) ){
				source.setAttribute('media', customMedia);
			}

			if(sourceSrcset){
				source.setAttribute('srcset', sourceSrcset);
			}

			//https://bugzilla.mozilla.org/show_bug.cgi?id=1170572
			if(customMedia){
				parent = source.parentNode;
				parent.insertBefore(source.cloneNode(), source);
				parent.removeChild(source);
			}
		};

		var lazyUnveil = rAFIt(function (elem, detail, isAuto, sizes, isImg){
			var src, srcset, parent, isPicture, event, firesLoad;

			if(!(event = triggerEvent(elem, 'lazybeforeunveil', detail)).defaultPrevented){

				if(sizes){
					if(isAuto){
						addClass(elem, lazySizesConfig.autosizesClass);
					} else {
						elem.setAttribute('sizes', sizes);
					}
				}

				srcset = elem[_getAttribute](lazySizesConfig.srcsetAttr);
				src = elem[_getAttribute](lazySizesConfig.srcAttr);

				if(isImg) {
					parent = elem.parentNode;
					isPicture = parent && regPicture.test(parent.nodeName || '');
				}

				firesLoad = detail.firesLoad || (('src' in elem) && (srcset || src || isPicture));

				event = {target: elem};

				if(firesLoad){
					addRemoveLoadEvents(elem, resetPreloading, true);
					clearTimeout(resetPreloadingTimer);
					resetPreloadingTimer = setTimeout(resetPreloading, 2500);

					addClass(elem, lazySizesConfig.loadingClass);
					addRemoveLoadEvents(elem, rafSwitchLoadingClass, true);
				}

				if(isPicture){
					forEach.call(parent.getElementsByTagName('source'), handleSources);
				}

				if(srcset){
					elem.setAttribute('srcset', srcset);
				} else if(src && !isPicture){
					if(regIframe.test(elem.nodeName)){
						changeIframeSrc(elem, src);
					} else {
						elem.src = src;
					}
				}

				if(srcset || isPicture){
					updatePolyfill(elem, {src: src});
				}
			}

			if(elem._lazyRace){
				delete elem._lazyRace;
			}
			removeClass(elem, lazySizesConfig.lazyClass);

			rAF(function(){
				if( !firesLoad || (elem.complete && elem.naturalWidth > 1)){
					if(firesLoad){
						resetPreloading(event);
					} else {
						isLoading--;
					}
					switchLoadingClass(event);
				}
			}, true);
		});

		var unveilElement = function (elem){
			var detail;

			var isImg = regImg.test(elem.nodeName);

			//allow using sizes="auto", but don't use. it's invalid. Use data-sizes="auto" or a valid value for sizes instead (i.e.: sizes="80vw")
			var sizes = isImg && (elem[_getAttribute](lazySizesConfig.sizesAttr) || elem[_getAttribute]('sizes'));
			var isAuto = sizes == 'auto';

			if( (isAuto || !isCompleted) && isImg && (elem.src || elem.srcset) && !elem.complete && !hasClass(elem, lazySizesConfig.errorClass)){return;}

			detail = triggerEvent(elem, 'lazyunveilread').detail;

			if(isAuto){
				 autoSizer.updateElem(elem, true, elem.offsetWidth);
			}

			elem._lazyRace = true;
			isLoading++;

			lazyUnveil(elem, detail, isAuto, sizes, isImg);
		};

		var onload = function(){
			if(isCompleted){return;}
			if(Date.now() - started < 999){
				setTimeout(onload, 999);
				return;
			}
			var afterScroll = debounce(function(){
				lazySizesConfig.loadMode = 3;
				throttledCheckElements();
			});

			isCompleted = true;

			lazySizesConfig.loadMode = 3;

			throttledCheckElements();

			addEventListener('scroll', function(){
				if(lazySizesConfig.loadMode == 3){
					lazySizesConfig.loadMode = 2;
				}
				afterScroll();
			}, true);
		};

		return {
			_: function(){
				started = Date.now();

				lazyloadElems = document.getElementsByClassName(lazySizesConfig.lazyClass);
				preloadElems = document.getElementsByClassName(lazySizesConfig.lazyClass + ' ' + lazySizesConfig.preloadClass);
				hFac = lazySizesConfig.hFac;

				addEventListener('scroll', throttledCheckElements, true);

				addEventListener('resize', throttledCheckElements, true);

				if(window.MutationObserver){
					new MutationObserver( throttledCheckElements ).observe( docElem, {childList: true, subtree: true, attributes: true} );
				} else {
					docElem[_addEventListener]('DOMNodeInserted', throttledCheckElements, true);
					docElem[_addEventListener]('DOMAttrModified', throttledCheckElements, true);
					setInterval(throttledCheckElements, 999);
				}

				addEventListener('hashchange', throttledCheckElements, true);

				//, 'fullscreenchange'
				['focus', 'mouseover', 'click', 'load', 'transitionend', 'animationend', 'webkitAnimationEnd'].forEach(function(name){
					document[_addEventListener](name, throttledCheckElements, true);
				});

				if((/d$|^c/.test(document.readyState))){
					onload();
				} else {
					addEventListener('load', onload);
					document[_addEventListener]('DOMContentLoaded', throttledCheckElements);
					setTimeout(onload, 20000);
				}

				if(lazyloadElems.length){
					checkElements();
					rAF._lsFlush();
				} else {
					throttledCheckElements();
				}
			},
			checkElems: throttledCheckElements,
			unveil: unveilElement
		};
	})();


	var autoSizer = (function(){
		var autosizesElems;

		var sizeElement = rAFIt(function(elem, parent, event, width){
			var sources, i, len;
			elem._lazysizesWidth = width;
			width += 'px';

			elem.setAttribute('sizes', width);

			if(regPicture.test(parent.nodeName || '')){
				sources = parent.getElementsByTagName('source');
				for(i = 0, len = sources.length; i < len; i++){
					sources[i].setAttribute('sizes', width);
				}
			}

			if(!event.detail.dataAttr){
				updatePolyfill(elem, event.detail);
			}
		});
		var getSizeElement = function (elem, dataAttr, width){
			var event;
			var parent = elem.parentNode;

			if(parent){
				width = getWidth(elem, parent, width);
				event = triggerEvent(elem, 'lazybeforesizes', {width: width, dataAttr: !!dataAttr});

				if(!event.defaultPrevented){
					width = event.detail.width;

					if(width && width !== elem._lazysizesWidth){
						sizeElement(elem, parent, event, width);
					}
				}
			}
		};

		var updateElementsSizes = function(){
			var i;
			var len = autosizesElems.length;
			if(len){
				i = 0;

				for(; i < len; i++){
					getSizeElement(autosizesElems[i]);
				}
			}
		};

		var debouncedUpdateElementsSizes = debounce(updateElementsSizes);

		return {
			_: function(){
				autosizesElems = document.getElementsByClassName(lazySizesConfig.autosizesClass);
				addEventListener('resize', debouncedUpdateElementsSizes);
			},
			checkElems: debouncedUpdateElementsSizes,
			updateElem: getSizeElement
		};
	})();

	var init = function(){
		if(!init.i){
			init.i = true;
			autoSizer._();
			loader._();
		}
	};

	(function(){
		var prop;

		var lazySizesDefaults = {
			lazyClass: 'lazyload',
			loadedClass: 'lazyloaded',
			loadingClass: 'lazyloading',
			preloadClass: 'lazypreload',
			errorClass: 'lazyerror',
			//strictClass: 'lazystrict',
			autosizesClass: 'lazyautosizes',
			srcAttr: 'data-src',
			srcsetAttr: 'data-srcset',
			sizesAttr: 'data-sizes',
			//preloadAfterLoad: false,
			minSize: 40,
			customMedia: {},
			init: true,
			expFactor: 1.5,
			hFac: 0.8,
			loadMode: 2
		};

		lazySizesConfig = window.lazySizesConfig || window.lazysizesConfig || {};

		for(prop in lazySizesDefaults){
			if(!(prop in lazySizesConfig)){
				lazySizesConfig[prop] = lazySizesDefaults[prop];
			}
		}

		window.lazySizesConfig = lazySizesConfig;

		setTimeout(function(){
			if(lazySizesConfig.init){
				init();
			}
		});
	})();

	return {
		cfg: lazySizesConfig,
		autoSizer: autoSizer,
		loader: loader,
		init: init,
		uP: updatePolyfill,
		aC: addClass,
		rC: removeClass,
		hC: hasClass,
		fire: triggerEvent,
		gW: getWidth,
		rAF: rAF,
	};
}
));
});

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

//
//  main.js

//  Polyfills

//  LazySizes
//  Components
//  On Load Functions
test.init();

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbGF6eXNpemVzL3BsdWdpbnMvcmVzcGltZy9scy5yZXNwaW1nLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xhenlzaXplcy9sYXp5c2l6ZXMuanMiLCIuLi9jb21wb25lbnRzL3Rlc3QuanMiLCIuLi9tYWluLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpe1xuXHQvKmpzaGludCBlcW51bGw6dHJ1ZSAqL1xuXHQndXNlIHN0cmljdCc7XG5cdHZhciBwb2x5ZmlsbDtcblx0dmFyIGNvbmZpZyA9ICh3aW5kb3cubGF6eVNpemVzICYmIGxhenlTaXplcy5jZmcpIHx8IHdpbmRvdy5sYXp5U2l6ZXNDb25maWc7XG5cdHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblx0dmFyIHN1cHBvcnRTcmNzZXQgPSAoJ3NpemVzJyBpbiBpbWcpICYmICgnc3Jjc2V0JyBpbiBpbWcpO1xuXHR2YXIgcmVnSERlc2MgPSAvXFxzK1xcZCtoL2c7XG5cdHZhciBmaXhFZGdlSERlc2NyaXB0b3IgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgcmVnRGVzY3JpcHRvcnMgPSAvXFxzKyhcXGQrKSh3fGgpXFxzKyhcXGQrKSh3fGgpLztcblx0XHR2YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGVkZ2VNYXRjaCl7XG5cdFx0XHR2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG5cdFx0XHR2YXIgcmVtb3ZlSERlc2NyaXB0b3JzID0gZnVuY3Rpb24oc291cmNlKXtcblx0XHRcdFx0dmFyIHJhdGlvO1xuXHRcdFx0XHR2YXIgc3Jjc2V0ID0gc291cmNlLmdldEF0dHJpYnV0ZShsYXp5U2l6ZXNDb25maWcuc3Jjc2V0QXR0cik7XG5cdFx0XHRcdGlmKHNyY3NldCl7XG5cdFx0XHRcdFx0aWYoc3Jjc2V0Lm1hdGNoKHJlZ0Rlc2NyaXB0b3JzKSl7XG5cdFx0XHRcdFx0XHRpZihSZWdFeHAuJDIgPT0gJ3cnKXtcblx0XHRcdFx0XHRcdFx0cmF0aW8gPSBSZWdFeHAuJDEgLyBSZWdFeHAuJDM7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyYXRpbyA9IFJlZ0V4cC4kMyAvIFJlZ0V4cC4kMTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYocmF0aW8pe1xuXHRcdFx0XHRcdFx0XHRzb3VyY2Uuc2V0QXR0cmlidXRlKCdkYXRhLWFzcGVjdHJhdGlvJywgcmF0aW8pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzb3VyY2Uuc2V0QXR0cmlidXRlKGxhenlTaXplc0NvbmZpZy5zcmNzZXRBdHRyLCBzcmNzZXQucmVwbGFjZShyZWdIRGVzYywgJycpKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdHZhciBoYW5kbGVyID0gZnVuY3Rpb24oZSl7XG5cdFx0XHRcdHZhciBwaWN0dXJlID0gZS50YXJnZXQucGFyZW50Tm9kZTtcblxuXHRcdFx0XHRpZihwaWN0dXJlICYmIHBpY3R1cmUubm9kZU5hbWUgPT0gJ1BJQ1RVUkUnKXtcblx0XHRcdFx0XHRmb3JFYWNoLmNhbGwocGljdHVyZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc291cmNlJyksIHJlbW92ZUhEZXNjcmlwdG9ycyk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVtb3ZlSERlc2NyaXB0b3JzKGUudGFyZ2V0KTtcblx0XHRcdH07XG5cblx0XHRcdHZhciB0ZXN0ID0gZnVuY3Rpb24oKXtcblx0XHRcdFx0aWYoISFpbWcuY3VycmVudFNyYyl7XG5cdFx0XHRcdFx0ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbGF6eWJlZm9yZXVudmVpbCcsIGhhbmRsZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRpZihlZGdlTWF0Y2hbMV0pe1xuXHRcdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdsYXp5YmVmb3JldW52ZWlsJywgaGFuZGxlcik7XG5cblx0XHRcdFx0aWYodHJ1ZSB8fCBlZGdlTWF0Y2hbMV0gPiAxNCl7XG5cdFx0XHRcdFx0aW1nLm9ubG9hZCA9IHRlc3Q7XG5cdFx0XHRcdFx0aW1nLm9uZXJyb3IgPSB0ZXN0O1xuXG5cdFx0XHRcdFx0aW1nLnNyY3NldCA9ICdkYXRhOixhIDF3IDFoJztcblxuXHRcdFx0XHRcdGlmKGltZy5jb21wbGV0ZSl7XG5cdFx0XHRcdFx0XHR0ZXN0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fSkoKTtcblxuXG5cdGlmKCFjb25maWcpe1xuXHRcdGNvbmZpZyA9IHt9O1xuXHRcdHdpbmRvdy5sYXp5U2l6ZXNDb25maWcgPSBjb25maWc7XG5cdH1cblxuXHRpZighY29uZmlnLnN1cHBvcnRzVHlwZSl7XG5cdFx0Y29uZmlnLnN1cHBvcnRzVHlwZSA9IGZ1bmN0aW9uKHR5cGUvKiwgZWxlbSovKXtcblx0XHRcdHJldHVybiAhdHlwZTtcblx0XHR9O1xuXHR9XG5cblx0aWYod2luZG93LnBpY3R1cmVmaWxsIHx8IGNvbmZpZy5wZil7cmV0dXJuO31cblxuXHRpZih3aW5kb3cuSFRNTFBpY3R1cmVFbGVtZW50ICYmIHN1cHBvcnRTcmNzZXQpe1xuXG5cdFx0aWYoZG9jdW1lbnQubXNFbGVtZW50c0Zyb21Qb2ludCl7XG5cdFx0XHRmaXhFZGdlSERlc2NyaXB0b3IobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvRWRnZVxcLyhcXGQrKS8pKTtcblx0XHR9XG5cblx0XHRjb25maWcucGYgPSBmdW5jdGlvbigpe307XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uZmlnLnBmID0gZnVuY3Rpb24ob3B0aW9ucyl7XG5cdFx0dmFyIGksIGxlbjtcblx0XHRpZih3aW5kb3cucGljdHVyZWZpbGwpe3JldHVybjt9XG5cdFx0Zm9yKGkgPSAwLCBsZW4gPSBvcHRpb25zLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcblx0XHRcdHBvbHlmaWxsKG9wdGlvbnMuZWxlbWVudHNbaV0pO1xuXHRcdH1cblx0fTtcblxuXHQvLyBwYXJ0aWFsIHBvbHlmaWxsXG5cdHBvbHlmaWxsID0gKGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGFzY2VuZGluZ1NvcnQgPSBmdW5jdGlvbiggYSwgYiApIHtcblx0XHRcdHJldHVybiBhLncgLSBiLnc7XG5cdFx0fTtcblx0XHR2YXIgcmVnUHhMZW5ndGggPSAvXlxccypcXGQrXFwuKlxcZCpweFxccyokLztcblx0XHR2YXIgcmVkdWNlQ2FuZGlkYXRlID0gZnVuY3Rpb24gKHNyY2VzKSB7XG5cdFx0XHR2YXIgbG93ZXJDYW5kaWRhdGUsIGJvbnVzRmFjdG9yO1xuXHRcdFx0dmFyIGxlbiA9IHNyY2VzLmxlbmd0aDtcblx0XHRcdHZhciBjYW5kaWRhdGUgPSBzcmNlc1tsZW4gLTFdO1xuXHRcdFx0dmFyIGkgPSAwO1xuXG5cdFx0XHRmb3IoaTsgaSA8IGxlbjtpKyspe1xuXHRcdFx0XHRjYW5kaWRhdGUgPSBzcmNlc1tpXTtcblx0XHRcdFx0Y2FuZGlkYXRlLmQgPSBjYW5kaWRhdGUudyAvIHNyY2VzLnc7XG5cblx0XHRcdFx0aWYoY2FuZGlkYXRlLmQgPj0gc3JjZXMuZCl7XG5cdFx0XHRcdFx0aWYoIWNhbmRpZGF0ZS5jYWNoZWQgJiYgKGxvd2VyQ2FuZGlkYXRlID0gc3JjZXNbaSAtIDFdKSAmJlxuXHRcdFx0XHRcdFx0bG93ZXJDYW5kaWRhdGUuZCA+IHNyY2VzLmQgLSAoMC4xMyAqIE1hdGgucG93KHNyY2VzLmQsIDIuMikpKXtcblxuXHRcdFx0XHRcdFx0Ym9udXNGYWN0b3IgPSBNYXRoLnBvdyhsb3dlckNhbmRpZGF0ZS5kIC0gMC42LCAxLjYpO1xuXG5cdFx0XHRcdFx0XHRpZihsb3dlckNhbmRpZGF0ZS5jYWNoZWQpIHtcblx0XHRcdFx0XHRcdFx0bG93ZXJDYW5kaWRhdGUuZCArPSAwLjE1ICogYm9udXNGYWN0b3I7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmKGxvd2VyQ2FuZGlkYXRlLmQgKyAoKGNhbmRpZGF0ZS5kIC0gc3JjZXMuZCkgKiBib251c0ZhY3RvcikgPiBzcmNlcy5kKXtcblx0XHRcdFx0XHRcdFx0Y2FuZGlkYXRlID0gbG93ZXJDYW5kaWRhdGU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gY2FuZGlkYXRlO1xuXHRcdH07XG5cblx0XHR2YXIgcGFyc2VXc3Jjc2V0ID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgY2FuZGlkYXRlcztcblx0XHRcdHZhciByZWdXQ2FuZGlkYXRlcyA9IC8oKFteLFxcc10uW15cXHNdKylcXHMrKFxcZCspdykvZztcblx0XHRcdHZhciByZWdNdWx0aXBsZSA9IC9cXHMvO1xuXHRcdFx0dmFyIGFkZENhbmRpZGF0ZSA9IGZ1bmN0aW9uKG1hdGNoLCBjYW5kaWRhdGUsIHVybCwgd0Rlc2NyaXB0b3Ipe1xuXHRcdFx0XHRjYW5kaWRhdGVzLnB1c2goe1xuXHRcdFx0XHRcdGM6IGNhbmRpZGF0ZSxcblx0XHRcdFx0XHR1OiB1cmwsXG5cdFx0XHRcdFx0dzogd0Rlc2NyaXB0b3IgKiAxXG5cdFx0XHRcdH0pO1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0KXtcblx0XHRcdFx0Y2FuZGlkYXRlcyA9IFtdO1xuXHRcdFx0XHRpbnB1dCA9IGlucHV0LnRyaW0oKTtcblx0XHRcdFx0aW5wdXRcblx0XHRcdFx0XHQucmVwbGFjZShyZWdIRGVzYywgJycpXG5cdFx0XHRcdFx0LnJlcGxhY2UocmVnV0NhbmRpZGF0ZXMsIGFkZENhbmRpZGF0ZSlcblx0XHRcdFx0O1xuXG5cdFx0XHRcdGlmKCFjYW5kaWRhdGVzLmxlbmd0aCAmJiBpbnB1dCAmJiAhcmVnTXVsdGlwbGUudGVzdChpbnB1dCkpe1xuXHRcdFx0XHRcdGNhbmRpZGF0ZXMucHVzaCh7XG5cdFx0XHRcdFx0XHRjOiBpbnB1dCxcblx0XHRcdFx0XHRcdHU6IGlucHV0LFxuXHRcdFx0XHRcdFx0dzogOTlcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBjYW5kaWRhdGVzO1xuXHRcdFx0fTtcblx0XHR9KSgpO1xuXG5cdFx0dmFyIHJ1bk1hdGNoTWVkaWEgPSBmdW5jdGlvbigpe1xuXHRcdFx0aWYocnVuTWF0Y2hNZWRpYS5pbml0KXtyZXR1cm47fVxuXG5cdFx0XHRydW5NYXRjaE1lZGlhLmluaXQgPSB0cnVlO1xuXHRcdFx0YWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciB0aW1lcjtcblx0XHRcdFx0dmFyIG1hdGNoTWVkaWFFbGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2xhenltYXRjaG1lZGlhJyk7XG5cdFx0XHRcdHZhciBydW4gPSBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBpLCBsZW47XG5cdFx0XHRcdFx0Zm9yKGkgPSAwLCBsZW4gPSBtYXRjaE1lZGlhRWxlbXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuXHRcdFx0XHRcdFx0cG9seWZpbGwobWF0Y2hNZWRpYUVsZW1zW2ldKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVyKTtcblx0XHRcdFx0XHR0aW1lciA9IHNldFRpbWVvdXQocnVuLCA2Nik7XG5cdFx0XHRcdH07XG5cdFx0XHR9KSgpKTtcblx0XHR9O1xuXG5cdFx0dmFyIGNyZWF0ZVNyY3NldCA9IGZ1bmN0aW9uKGVsZW0sIGlzSW1hZ2Upe1xuXHRcdFx0dmFyIHBhcnNlZFNldDtcblx0XHRcdHZhciBzcmNTZXQgPSBlbGVtLmdldEF0dHJpYnV0ZSgnc3Jjc2V0JykgfHwgZWxlbS5nZXRBdHRyaWJ1dGUoY29uZmlnLnNyY3NldEF0dHIpO1xuXG5cdFx0XHRpZighc3JjU2V0ICYmIGlzSW1hZ2Upe1xuXHRcdFx0XHRzcmNTZXQgPSAhZWxlbS5fbGF6eXBvbHlmaWxsID9cblx0XHRcdFx0XHQoZWxlbS5nZXRBdHRyaWJ1dGUoY29uZmlnLnNyY0F0dHIpIHx8IGVsZW0uZ2V0QXR0cmlidXRlKCdzcmMnKSkgOlxuXHRcdFx0XHRcdGVsZW0uX2xhenlwb2x5ZmlsbC5fc2V0XG5cdFx0XHRcdDtcblx0XHRcdH1cblxuXHRcdFx0aWYoIWVsZW0uX2xhenlwb2x5ZmlsbCB8fCBlbGVtLl9sYXp5cG9seWZpbGwuX3NldCAhPSBzcmNTZXQpe1xuXG5cdFx0XHRcdHBhcnNlZFNldCA9IHBhcnNlV3NyY3NldCggc3JjU2V0IHx8ICcnICk7XG5cdFx0XHRcdGlmKGlzSW1hZ2UgJiYgZWxlbS5wYXJlbnROb2RlKXtcblx0XHRcdFx0XHRwYXJzZWRTZXQuaXNQaWN0dXJlID0gZWxlbS5wYXJlbnROb2RlLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgPT0gJ1BJQ1RVUkUnO1xuXG5cdFx0XHRcdFx0aWYocGFyc2VkU2V0LmlzUGljdHVyZSl7XG5cdFx0XHRcdFx0XHRpZih3aW5kb3cubWF0Y2hNZWRpYSl7XG5cdFx0XHRcdFx0XHRcdGxhenlTaXplcy5hQyhlbGVtLCAnbGF6eW1hdGNobWVkaWEnKTtcblx0XHRcdFx0XHRcdFx0cnVuTWF0Y2hNZWRpYSgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBhcnNlZFNldC5fc2V0ID0gc3JjU2V0O1xuXHRcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbSwgJ19sYXp5cG9seWZpbGwnLCB7XG5cdFx0XHRcdFx0dmFsdWU6IHBhcnNlZFNldCxcblx0XHRcdFx0XHR3cml0YWJsZTogdHJ1ZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIGdldFggPSBmdW5jdGlvbihlbGVtKXtcblx0XHRcdHZhciBkcHIgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xuXHRcdFx0dmFyIG9wdGltdW0gPSBsYXp5U2l6ZXMuZ2V0WCAmJiBsYXp5U2l6ZXMuZ2V0WChlbGVtKTtcblx0XHRcdHJldHVybiBNYXRoLm1pbihvcHRpbXVtIHx8IGRwciwgMi41LCBkcHIpO1xuXHRcdH07XG5cblx0XHR2YXIgbWF0Y2hlc01lZGlhID0gZnVuY3Rpb24obWVkaWEpe1xuXHRcdFx0aWYod2luZG93Lm1hdGNoTWVkaWEpe1xuXHRcdFx0XHRtYXRjaGVzTWVkaWEgPSBmdW5jdGlvbihtZWRpYSl7XG5cdFx0XHRcdFx0cmV0dXJuICFtZWRpYSB8fCAobWF0Y2hNZWRpYShtZWRpYSkgfHwge30pLm1hdGNoZXM7XG5cdFx0XHRcdH07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gIW1lZGlhO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbWF0Y2hlc01lZGlhKG1lZGlhKTtcblx0XHR9O1xuXG5cdFx0dmFyIGdldENhbmRpZGF0ZSA9IGZ1bmN0aW9uKGVsZW0pe1xuXHRcdFx0dmFyIHNvdXJjZXMsIGksIGxlbiwgbWVkaWEsIHNvdXJjZSwgc3JjZXMsIHNyYywgd2lkdGg7XG5cblx0XHRcdHNvdXJjZSA9IGVsZW07XG5cdFx0XHRjcmVhdGVTcmNzZXQoc291cmNlLCB0cnVlKTtcblx0XHRcdHNyY2VzID0gc291cmNlLl9sYXp5cG9seWZpbGw7XG5cblx0XHRcdGlmKHNyY2VzLmlzUGljdHVyZSl7XG5cdFx0XHRcdGZvcihpID0gMCwgc291cmNlcyA9IGVsZW0ucGFyZW50Tm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc291cmNlJyksIGxlbiA9IHNvdXJjZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuXHRcdFx0XHRcdGlmKCBjb25maWcuc3VwcG9ydHNUeXBlKHNvdXJjZXNbaV0uZ2V0QXR0cmlidXRlKCd0eXBlJyksIGVsZW0pICYmIG1hdGNoZXNNZWRpYSggc291cmNlc1tpXS5nZXRBdHRyaWJ1dGUoJ21lZGlhJykpICl7XG5cdFx0XHRcdFx0XHRzb3VyY2UgPSBzb3VyY2VzW2ldO1xuXHRcdFx0XHRcdFx0Y3JlYXRlU3Jjc2V0KHNvdXJjZSk7XG5cdFx0XHRcdFx0XHRzcmNlcyA9IHNvdXJjZS5fbGF6eXBvbHlmaWxsO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKHNyY2VzLmxlbmd0aCA+IDEpe1xuXHRcdFx0XHR3aWR0aCA9IHNvdXJjZS5nZXRBdHRyaWJ1dGUoJ3NpemVzJykgfHwgJyc7XG5cdFx0XHRcdHdpZHRoID0gcmVnUHhMZW5ndGgudGVzdCh3aWR0aCkgJiYgcGFyc2VJbnQod2lkdGgsIDEwKSB8fCBsYXp5U2l6ZXMuZ1coZWxlbSwgZWxlbS5wYXJlbnROb2RlKTtcblx0XHRcdFx0c3JjZXMuZCA9IGdldFgoZWxlbSk7XG5cdFx0XHRcdGlmKCFzcmNlcy5zcmMgfHwgIXNyY2VzLncgfHwgc3JjZXMudyA8IHdpZHRoKXtcblx0XHRcdFx0XHRzcmNlcy53ID0gd2lkdGg7XG5cdFx0XHRcdFx0c3JjID0gcmVkdWNlQ2FuZGlkYXRlKHNyY2VzLnNvcnQoYXNjZW5kaW5nU29ydCkpO1xuXHRcdFx0XHRcdHNyY2VzLnNyYyA9IHNyYztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzcmMgPSBzcmNlcy5zcmM7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNyYyA9IHNyY2VzWzBdO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc3JjO1xuXHRcdH07XG5cblx0XHR2YXIgcCA9IGZ1bmN0aW9uKGVsZW0pe1xuXHRcdFx0aWYoc3VwcG9ydFNyY3NldCAmJiBlbGVtLnBhcmVudE5vZGUgJiYgZWxlbS5wYXJlbnROb2RlLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgIT0gJ1BJQ1RVUkUnKXtyZXR1cm47fVxuXHRcdFx0dmFyIGNhbmRpZGF0ZSA9IGdldENhbmRpZGF0ZShlbGVtKTtcblxuXHRcdFx0aWYoY2FuZGlkYXRlICYmIGNhbmRpZGF0ZS51ICYmIGVsZW0uX2xhenlwb2x5ZmlsbC5jdXIgIT0gY2FuZGlkYXRlLnUpe1xuXHRcdFx0XHRlbGVtLl9sYXp5cG9seWZpbGwuY3VyID0gY2FuZGlkYXRlLnU7XG5cdFx0XHRcdGNhbmRpZGF0ZS5jYWNoZWQgPSB0cnVlO1xuXHRcdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShjb25maWcuc3JjQXR0ciwgY2FuZGlkYXRlLnUpO1xuXHRcdFx0XHRlbGVtLnNldEF0dHJpYnV0ZSgnc3JjJywgY2FuZGlkYXRlLnUpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRwLnBhcnNlID0gcGFyc2VXc3Jjc2V0O1xuXG5cdFx0cmV0dXJuIHA7XG5cdH0pKCk7XG5cblx0aWYoY29uZmlnLmxvYWRlZENsYXNzICYmIGNvbmZpZy5sb2FkaW5nQ2xhc3Mpe1xuXHRcdChmdW5jdGlvbigpe1xuXHRcdFx0dmFyIHNlbHMgPSBbXTtcblx0XHRcdFsnaW1nW3NpemVzJD1cInB4XCJdW3NyY3NldF0uJywgJ3BpY3R1cmUgPiBpbWc6bm90KFtzcmNzZXRdKS4nXS5mb3JFYWNoKGZ1bmN0aW9uKHNlbCl7XG5cdFx0XHRcdHNlbHMucHVzaChzZWwgKyBjb25maWcubG9hZGVkQ2xhc3MpO1xuXHRcdFx0XHRzZWxzLnB1c2goc2VsICsgY29uZmlnLmxvYWRpbmdDbGFzcyk7XG5cdFx0XHR9KTtcblx0XHRcdGNvbmZpZy5wZih7XG5cdFx0XHRcdGVsZW1lbnRzOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbHMuam9pbignLCAnKSlcblx0XHRcdH0pO1xuXHRcdH0pKCk7XG5cblx0fVxufSkod2luZG93LCBkb2N1bWVudCk7XG5cbi8qKlxuICogU29tZSB2ZXJzaW9ucyBvZiBpT1MgKDguMS0pIGRvIGxvYWQgdGhlIGZpcnN0IGNhbmRpZGF0ZSBvZiBhIHNyY3NldCBjYW5kaWRhdGUgbGlzdCwgaWYgd2lkdGggZGVzY3JpcHRvcnMgd2l0aCB0aGUgc2l6ZXMgYXR0cmlidXRlIGlzIHVzZWQuXG4gKiBUaGlzIHRpbnkgZXh0ZW5zaW9uIHByZXZlbnRzIHRoaXMgd2FzdGVkIGRvd25sb2FkIGJ5IGNyZWF0aW5nIGEgcGljdHVyZSBzdHJ1Y3R1cmUgYXJvdW5kIHRoZSBpbWFnZS5cbiAqIE5vdGU6IFRoaXMgZXh0ZW5zaW9uIGlzIGFscmVhZHkgaW5jbHVkZWQgaW4gdGhlIGxzLnJlc3BpbWcuanMgZmlsZS5cbiAqXG4gKiBVc2FnZTpcbiAqXG4gKiA8aW1nXG4gKiBcdGNsYXNzPVwibGF6eWxvYWRcIlxuICogXHRkYXRhLXNpemVzPVwiYXV0b1wiXG4gKiBcdGRhdGEtc3Jjc2V0PVwic21hbGwuanBnIDY0MHB4LFxuICogXHRcdG1lZGl1bS5qcGcgOTgwdyxcbiAqIFx0XHRsYXJnZS5qcGcgMTI4MHdcIlxuICogXHQvPlxuICovXG5cbihmdW5jdGlvbihkb2N1bWVudCl7XG5cdCd1c2Ugc3RyaWN0Jztcblx0dmFyIHJlZ1BpY3R1cmU7XG5cdHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblxuXHRpZigoJ3NyY3NldCcgaW4gaW1nKSAmJiAhKCdzaXplcycgaW4gaW1nKSAmJiAhd2luZG93LkhUTUxQaWN0dXJlRWxlbWVudCl7XG5cdFx0cmVnUGljdHVyZSA9IC9ecGljdHVyZSQvaTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdsYXp5YmVmb3JldW52ZWlsJywgZnVuY3Rpb24oZSl7XG5cdFx0XHR2YXIgZWxlbSwgcGFyZW50LCBzcmNzZXQsIHNpemVzLCBpc1BpY3R1cmU7XG5cdFx0XHR2YXIgcGljdHVyZSwgc291cmNlO1xuXHRcdFx0aWYoZS5kZWZhdWx0UHJldmVudGVkIHx8XG5cdFx0XHRcdGxhenlTaXplc0NvbmZpZy5ub0lPU0ZpeCB8fFxuXHRcdFx0XHQhKGVsZW0gPSBlLnRhcmdldCkgfHxcblx0XHRcdFx0IShzcmNzZXQgPSBlbGVtLmdldEF0dHJpYnV0ZShsYXp5U2l6ZXNDb25maWcuc3Jjc2V0QXR0cikpIHx8XG5cdFx0XHRcdCEocGFyZW50ID0gZWxlbS5wYXJlbnROb2RlKSB8fFxuXHRcdFx0XHQoXG5cdFx0XHRcdFx0IShpc1BpY3R1cmUgPSByZWdQaWN0dXJlLnRlc3QocGFyZW50Lm5vZGVOYW1lIHx8ICcnKSkgJiZcblx0XHRcdFx0XHQhKHNpemVzID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ3NpemVzJykgfHwgZWxlbS5nZXRBdHRyaWJ1dGUobGF6eVNpemVzQ29uZmlnLnNpemVzQXR0cikpXG5cdFx0XHRcdClcblx0XHRcdCl7cmV0dXJuO31cblxuXHRcdFx0cGljdHVyZSA9IGlzUGljdHVyZSA/IHBhcmVudCA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3BpY3R1cmUnKTtcblxuXHRcdFx0aWYoIWVsZW0uX2xhenlJbWdTcmMpe1xuXHRcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbSwgJ19sYXp5SW1nU3JjJywge1xuXHRcdFx0XHRcdHZhbHVlOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKSxcblx0XHRcdFx0XHR3cml0YWJsZTogdHJ1ZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdHNvdXJjZSA9IGVsZW0uX2xhenlJbWdTcmM7XG5cblx0XHRcdGlmKHNpemVzKXtcblx0XHRcdFx0c291cmNlLnNldEF0dHJpYnV0ZSgnc2l6ZXMnLCBzaXplcyk7XG5cdFx0XHR9XG5cblx0XHRcdHNvdXJjZS5zZXRBdHRyaWJ1dGUobGF6eVNpemVzQ29uZmlnLnNyY3NldEF0dHIsIHNyY3NldCk7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZSgnZGF0YS1wZnNyY3NldCcsIHNyY3NldCk7XG5cdFx0XHRlbGVtLnJlbW92ZUF0dHJpYnV0ZShsYXp5U2l6ZXNDb25maWcuc3Jjc2V0QXR0cik7XG5cblx0XHRcdGlmKCFpc1BpY3R1cmUpe1xuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHBpY3R1cmUsIGVsZW0pO1xuXHRcdFx0XHRwaWN0dXJlLmFwcGVuZENoaWxkKGVsZW0pO1xuXHRcdFx0fVxuXHRcdFx0cGljdHVyZS5pbnNlcnRCZWZvcmUoc291cmNlLCBlbGVtKTtcblx0XHR9KTtcblx0fVxufSkoZG9jdW1lbnQpO1xuIiwiKGZ1bmN0aW9uKHdpbmRvdywgZmFjdG9yeSkge1xuXHR2YXIgbGF6eVNpemVzID0gZmFjdG9yeSh3aW5kb3csIHdpbmRvdy5kb2N1bWVudCk7XG5cdHdpbmRvdy5sYXp5U2l6ZXMgPSBsYXp5U2l6ZXM7XG5cdGlmKHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuXHRcdG1vZHVsZS5leHBvcnRzID0gbGF6eVNpemVzO1xuXHR9XG59KHdpbmRvdywgZnVuY3Rpb24gbCh3aW5kb3csIGRvY3VtZW50KSB7XG5cdCd1c2Ugc3RyaWN0Jztcblx0Lypqc2hpbnQgZXFudWxsOnRydWUgKi9cblx0aWYoIWRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUpe3JldHVybjt9XG5cblx0dmFyIGxhenlTaXplc0NvbmZpZztcblxuXHR2YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuXHR2YXIgRGF0ZSA9IHdpbmRvdy5EYXRlO1xuXG5cdHZhciBzdXBwb3J0UGljdHVyZSA9IHdpbmRvdy5IVE1MUGljdHVyZUVsZW1lbnQ7XG5cblx0dmFyIF9hZGRFdmVudExpc3RlbmVyID0gJ2FkZEV2ZW50TGlzdGVuZXInO1xuXG5cdHZhciBfZ2V0QXR0cmlidXRlID0gJ2dldEF0dHJpYnV0ZSc7XG5cblx0dmFyIGFkZEV2ZW50TGlzdGVuZXIgPSB3aW5kb3dbX2FkZEV2ZW50TGlzdGVuZXJdO1xuXG5cdHZhciBzZXRUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQ7XG5cblx0dmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgc2V0VGltZW91dDtcblxuXHR2YXIgcmVxdWVzdElkbGVDYWxsYmFjayA9IHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrO1xuXG5cdHZhciByZWdQaWN0dXJlID0gL15waWN0dXJlJC9pO1xuXG5cdHZhciBsb2FkRXZlbnRzID0gWydsb2FkJywgJ2Vycm9yJywgJ2xhenlpbmNsdWRlZCcsICdfbGF6eWxvYWRlZCddO1xuXG5cdHZhciByZWdDbGFzc0NhY2hlID0ge307XG5cblx0dmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcblxuXHR2YXIgaGFzQ2xhc3MgPSBmdW5jdGlvbihlbGUsIGNscykge1xuXHRcdGlmKCFyZWdDbGFzc0NhY2hlW2Nsc10pe1xuXHRcdFx0cmVnQ2xhc3NDYWNoZVtjbHNdID0gbmV3IFJlZ0V4cCgnKFxcXFxzfF4pJytjbHMrJyhcXFxcc3wkKScpO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVnQ2xhc3NDYWNoZVtjbHNdLnRlc3QoZWxlW19nZXRBdHRyaWJ1dGVdKCdjbGFzcycpIHx8ICcnKSAmJiByZWdDbGFzc0NhY2hlW2Nsc107XG5cdH07XG5cblx0dmFyIGFkZENsYXNzID0gZnVuY3Rpb24oZWxlLCBjbHMpIHtcblx0XHRpZiAoIWhhc0NsYXNzKGVsZSwgY2xzKSl7XG5cdFx0XHRlbGUuc2V0QXR0cmlidXRlKCdjbGFzcycsIChlbGVbX2dldEF0dHJpYnV0ZV0oJ2NsYXNzJykgfHwgJycpLnRyaW0oKSArICcgJyArIGNscyk7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciByZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKGVsZSwgY2xzKSB7XG5cdFx0dmFyIHJlZztcblx0XHRpZiAoKHJlZyA9IGhhc0NsYXNzKGVsZSxjbHMpKSkge1xuXHRcdFx0ZWxlLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAoZWxlW19nZXRBdHRyaWJ1dGVdKCdjbGFzcycpIHx8ICcnKS5yZXBsYWNlKHJlZywgJyAnKSk7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBhZGRSZW1vdmVMb2FkRXZlbnRzID0gZnVuY3Rpb24oZG9tLCBmbiwgYWRkKXtcblx0XHR2YXIgYWN0aW9uID0gYWRkID8gX2FkZEV2ZW50TGlzdGVuZXIgOiAncmVtb3ZlRXZlbnRMaXN0ZW5lcic7XG5cdFx0aWYoYWRkKXtcblx0XHRcdGFkZFJlbW92ZUxvYWRFdmVudHMoZG9tLCBmbik7XG5cdFx0fVxuXHRcdGxvYWRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihldnQpe1xuXHRcdFx0ZG9tW2FjdGlvbl0oZXZ0LCBmbik7XG5cdFx0fSk7XG5cdH07XG5cblx0dmFyIHRyaWdnZXJFdmVudCA9IGZ1bmN0aW9uKGVsZW0sIG5hbWUsIGRldGFpbCwgbm9CdWJibGVzLCBub0NhbmNlbGFibGUpe1xuXHRcdHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuXG5cdFx0ZXZlbnQuaW5pdEN1c3RvbUV2ZW50KG5hbWUsICFub0J1YmJsZXMsICFub0NhbmNlbGFibGUsIGRldGFpbCB8fCB7fSk7XG5cblx0XHRlbGVtLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuXHRcdHJldHVybiBldmVudDtcblx0fTtcblxuXHR2YXIgdXBkYXRlUG9seWZpbGwgPSBmdW5jdGlvbiAoZWwsIGZ1bGwpe1xuXHRcdHZhciBwb2x5ZmlsbDtcblx0XHRpZiggIXN1cHBvcnRQaWN0dXJlICYmICggcG9seWZpbGwgPSAod2luZG93LnBpY3R1cmVmaWxsIHx8IGxhenlTaXplc0NvbmZpZy5wZikgKSApe1xuXHRcdFx0cG9seWZpbGwoe3JlZXZhbHVhdGU6IHRydWUsIGVsZW1lbnRzOiBbZWxdfSk7XG5cdFx0fSBlbHNlIGlmKGZ1bGwgJiYgZnVsbC5zcmMpe1xuXHRcdFx0ZWwuc3JjID0gZnVsbC5zcmM7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBnZXRDU1MgPSBmdW5jdGlvbiAoZWxlbSwgc3R5bGUpe1xuXHRcdHJldHVybiAoZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCBudWxsKSB8fCB7fSlbc3R5bGVdO1xuXHR9O1xuXG5cdHZhciBnZXRXaWR0aCA9IGZ1bmN0aW9uKGVsZW0sIHBhcmVudCwgd2lkdGgpe1xuXHRcdHdpZHRoID0gd2lkdGggfHwgZWxlbS5vZmZzZXRXaWR0aDtcblxuXHRcdHdoaWxlKHdpZHRoIDwgbGF6eVNpemVzQ29uZmlnLm1pblNpemUgJiYgcGFyZW50ICYmICFlbGVtLl9sYXp5c2l6ZXNXaWR0aCl7XG5cdFx0XHR3aWR0aCA9ICBwYXJlbnQub2Zmc2V0V2lkdGg7XG5cdFx0XHRwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gd2lkdGg7XG5cdH07XG5cblx0dmFyIHJBRiA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBydW5uaW5nLCB3YWl0aW5nO1xuXHRcdHZhciBmaXJzdEZucyA9IFtdO1xuXHRcdHZhciBzZWNvbmRGbnMgPSBbXTtcblx0XHR2YXIgZm5zID0gZmlyc3RGbnM7XG5cblx0XHR2YXIgcnVuID0gZnVuY3Rpb24oKXtcblx0XHRcdHZhciBydW5GbnMgPSBmbnM7XG5cblx0XHRcdGZucyA9IGZpcnN0Rm5zLmxlbmd0aCA/IHNlY29uZEZucyA6IGZpcnN0Rm5zO1xuXG5cdFx0XHRydW5uaW5nID0gdHJ1ZTtcblx0XHRcdHdhaXRpbmcgPSBmYWxzZTtcblxuXHRcdFx0d2hpbGUocnVuRm5zLmxlbmd0aCl7XG5cdFx0XHRcdHJ1bkZucy5zaGlmdCgpKCk7XG5cdFx0XHR9XG5cblx0XHRcdHJ1bm5pbmcgPSBmYWxzZTtcblx0XHR9O1xuXG5cdFx0dmFyIHJhZkJhdGNoID0gZnVuY3Rpb24oZm4sIHF1ZXVlKXtcblx0XHRcdGlmKHJ1bm5pbmcgJiYgIXF1ZXVlKXtcblx0XHRcdFx0Zm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZucy5wdXNoKGZuKTtcblxuXHRcdFx0XHRpZighd2FpdGluZyl7XG5cdFx0XHRcdFx0d2FpdGluZyA9IHRydWU7XG5cdFx0XHRcdFx0KGRvY3VtZW50LmhpZGRlbiA/IHNldFRpbWVvdXQgOiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUpKHJ1bik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0cmFmQmF0Y2guX2xzRmx1c2ggPSBydW47XG5cblx0XHRyZXR1cm4gcmFmQmF0Y2g7XG5cdH0pKCk7XG5cblx0dmFyIHJBRkl0ID0gZnVuY3Rpb24oZm4sIHNpbXBsZSl7XG5cdFx0cmV0dXJuIHNpbXBsZSA/XG5cdFx0XHRmdW5jdGlvbigpIHtcblx0XHRcdFx0ckFGKGZuKTtcblx0XHRcdH0gOlxuXHRcdFx0ZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIHRoYXQgPSB0aGlzO1xuXHRcdFx0XHR2YXIgYXJncyA9IGFyZ3VtZW50cztcblx0XHRcdFx0ckFGKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0Zm4uYXBwbHkodGhhdCwgYXJncyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdDtcblx0fTtcblxuXHR2YXIgdGhyb3R0bGUgPSBmdW5jdGlvbihmbil7XG5cdFx0dmFyIHJ1bm5pbmc7XG5cdFx0dmFyIGxhc3RUaW1lID0gMDtcblx0XHR2YXIgZ0RlbGF5ID0gMTI1O1xuXHRcdHZhciBSSUNfREVGQVVMVF9USU1FT1VUID0gNjY2O1xuXHRcdHZhciBySUNUaW1lb3V0ID0gUklDX0RFRkFVTFRfVElNRU9VVDtcblx0XHR2YXIgcnVuID0gZnVuY3Rpb24oKXtcblx0XHRcdHJ1bm5pbmcgPSBmYWxzZTtcblx0XHRcdGxhc3RUaW1lID0gRGF0ZS5ub3coKTtcblx0XHRcdGZuKCk7XG5cdFx0fTtcblx0XHR2YXIgaWRsZUNhbGxiYWNrID0gcmVxdWVzdElkbGVDYWxsYmFjayA/XG5cdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRyZXF1ZXN0SWRsZUNhbGxiYWNrKHJ1biwge3RpbWVvdXQ6IHJJQ1RpbWVvdXR9KTtcblx0XHRcdFx0aWYocklDVGltZW91dCAhPT0gUklDX0RFRkFVTFRfVElNRU9VVCl7XG5cdFx0XHRcdFx0cklDVGltZW91dCA9IFJJQ19ERUZBVUxUX1RJTUVPVVQ7XG5cdFx0XHRcdH1cblx0XHRcdH06XG5cdFx0XHRyQUZJdChmdW5jdGlvbigpe1xuXHRcdFx0XHRzZXRUaW1lb3V0KHJ1bik7XG5cdFx0XHR9LCB0cnVlKVxuXHRcdDtcblxuXHRcdHJldHVybiBmdW5jdGlvbihpc1ByaW9yaXR5KXtcblx0XHRcdHZhciBkZWxheTtcblx0XHRcdGlmKChpc1ByaW9yaXR5ID0gaXNQcmlvcml0eSA9PT0gdHJ1ZSkpe1xuXHRcdFx0XHRySUNUaW1lb3V0ID0gNDQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHJ1bm5pbmcpe1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHJ1bm5pbmcgPSAgdHJ1ZTtcblxuXHRcdFx0ZGVsYXkgPSBnRGVsYXkgLSAoRGF0ZS5ub3coKSAtIGxhc3RUaW1lKTtcblxuXHRcdFx0aWYoZGVsYXkgPCAwKXtcblx0XHRcdFx0ZGVsYXkgPSAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihpc1ByaW9yaXR5IHx8IChkZWxheSA8IDkgJiYgcmVxdWVzdElkbGVDYWxsYmFjaykpe1xuXHRcdFx0XHRpZGxlQ2FsbGJhY2soKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNldFRpbWVvdXQoaWRsZUNhbGxiYWNrLCBkZWxheSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fTtcblxuXHQvL2Jhc2VkIG9uIGh0dHA6Ly9tb2Rlcm5qYXZhc2NyaXB0LmJsb2dzcG90LmRlLzIwMTMvMDgvYnVpbGRpbmctYmV0dGVyLWRlYm91bmNlLmh0bWxcblx0dmFyIGRlYm91bmNlID0gZnVuY3Rpb24oZnVuYykge1xuXHRcdHZhciB0aW1lb3V0LCB0aW1lc3RhbXA7XG5cdFx0dmFyIHdhaXQgPSA5OTtcblx0XHR2YXIgcnVuID0gZnVuY3Rpb24oKXtcblx0XHRcdHRpbWVvdXQgPSBudWxsO1xuXHRcdFx0ZnVuYygpO1xuXHRcdH07XG5cdFx0dmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbGFzdCA9IERhdGUubm93KCkgLSB0aW1lc3RhbXA7XG5cblx0XHRcdGlmIChsYXN0IDwgd2FpdCkge1xuXHRcdFx0XHRzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQocmVxdWVzdElkbGVDYWxsYmFjayB8fCBydW4pKHJ1bik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiBmdW5jdGlvbigpIHtcblx0XHRcdHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cblx0XHRcdGlmICghdGltZW91dCkge1xuXHRcdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fTtcblxuXG5cdHZhciBsb2FkZXIgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgbGF6eWxvYWRFbGVtcywgcHJlbG9hZEVsZW1zLCBpc0NvbXBsZXRlZCwgcmVzZXRQcmVsb2FkaW5nVGltZXIsIGxvYWRNb2RlLCBzdGFydGVkO1xuXG5cdFx0dmFyIGVMdlcsIGVsdkgsIGVMdG9wLCBlTGxlZnQsIGVMcmlnaHQsIGVMYm90dG9tO1xuXG5cdFx0dmFyIGRlZmF1bHRFeHBhbmQsIHByZWxvYWRFeHBhbmQsIGhGYWM7XG5cblx0XHR2YXIgcmVnSW1nID0gL15pbWckL2k7XG5cdFx0dmFyIHJlZ0lmcmFtZSA9IC9eaWZyYW1lJC9pO1xuXG5cdFx0dmFyIHN1cHBvcnRTY3JvbGwgPSAoJ29uc2Nyb2xsJyBpbiB3aW5kb3cpICYmICEoL2dsZWJvdC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSk7XG5cblx0XHR2YXIgc2hyaW5rRXhwYW5kID0gMDtcblx0XHR2YXIgY3VycmVudEV4cGFuZCA9IDA7XG5cblx0XHR2YXIgaXNMb2FkaW5nID0gMDtcblx0XHR2YXIgbG93UnVucyA9IC0xO1xuXG5cdFx0dmFyIHJlc2V0UHJlbG9hZGluZyA9IGZ1bmN0aW9uKGUpe1xuXHRcdFx0aXNMb2FkaW5nLS07XG5cdFx0XHRpZihlICYmIGUudGFyZ2V0KXtcblx0XHRcdFx0YWRkUmVtb3ZlTG9hZEV2ZW50cyhlLnRhcmdldCwgcmVzZXRQcmVsb2FkaW5nKTtcblx0XHRcdH1cblxuXHRcdFx0aWYoIWUgfHwgaXNMb2FkaW5nIDwgMCB8fCAhZS50YXJnZXQpe1xuXHRcdFx0XHRpc0xvYWRpbmcgPSAwO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgaXNOZXN0ZWRWaXNpYmxlID0gZnVuY3Rpb24oZWxlbSwgZWxlbUV4cGFuZCl7XG5cdFx0XHR2YXIgb3V0ZXJSZWN0O1xuXHRcdFx0dmFyIHBhcmVudCA9IGVsZW07XG5cdFx0XHR2YXIgdmlzaWJsZSA9IGdldENTUyhkb2N1bWVudC5ib2R5LCAndmlzaWJpbGl0eScpID09ICdoaWRkZW4nIHx8IGdldENTUyhlbGVtLCAndmlzaWJpbGl0eScpICE9ICdoaWRkZW4nO1xuXG5cdFx0XHRlTHRvcCAtPSBlbGVtRXhwYW5kO1xuXHRcdFx0ZUxib3R0b20gKz0gZWxlbUV4cGFuZDtcblx0XHRcdGVMbGVmdCAtPSBlbGVtRXhwYW5kO1xuXHRcdFx0ZUxyaWdodCArPSBlbGVtRXhwYW5kO1xuXG5cdFx0XHR3aGlsZSh2aXNpYmxlICYmIChwYXJlbnQgPSBwYXJlbnQub2Zmc2V0UGFyZW50KSAmJiBwYXJlbnQgIT0gZG9jdW1lbnQuYm9keSAmJiBwYXJlbnQgIT0gZG9jRWxlbSl7XG5cdFx0XHRcdHZpc2libGUgPSAoKGdldENTUyhwYXJlbnQsICdvcGFjaXR5JykgfHwgMSkgPiAwKTtcblxuXHRcdFx0XHRpZih2aXNpYmxlICYmIGdldENTUyhwYXJlbnQsICdvdmVyZmxvdycpICE9ICd2aXNpYmxlJyl7XG5cdFx0XHRcdFx0b3V0ZXJSZWN0ID0gcGFyZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHRcdFx0XHRcdHZpc2libGUgPSBlTHJpZ2h0ID4gb3V0ZXJSZWN0LmxlZnQgJiZcblx0XHRcdFx0XHRcdGVMbGVmdCA8IG91dGVyUmVjdC5yaWdodCAmJlxuXHRcdFx0XHRcdFx0ZUxib3R0b20gPiBvdXRlclJlY3QudG9wIC0gMSAmJlxuXHRcdFx0XHRcdFx0ZUx0b3AgPCBvdXRlclJlY3QuYm90dG9tICsgMVxuXHRcdFx0XHRcdDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdmlzaWJsZTtcblx0XHR9O1xuXG5cdFx0dmFyIGNoZWNrRWxlbWVudHMgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBlTGxlbiwgaSwgcmVjdCwgYXV0b0xvYWRFbGVtLCBsb2FkZWRTb21ldGhpbmcsIGVsZW1FeHBhbmQsIGVsZW1OZWdhdGl2ZUV4cGFuZCwgZWxlbUV4cGFuZFZhbCwgYmVmb3JlRXhwYW5kVmFsO1xuXG5cdFx0XHRpZigobG9hZE1vZGUgPSBsYXp5U2l6ZXNDb25maWcubG9hZE1vZGUpICYmIGlzTG9hZGluZyA8IDggJiYgKGVMbGVuID0gbGF6eWxvYWRFbGVtcy5sZW5ndGgpKXtcblxuXHRcdFx0XHRpID0gMDtcblxuXHRcdFx0XHRsb3dSdW5zKys7XG5cblx0XHRcdFx0aWYocHJlbG9hZEV4cGFuZCA9PSBudWxsKXtcblx0XHRcdFx0XHRpZighKCdleHBhbmQnIGluIGxhenlTaXplc0NvbmZpZykpe1xuXHRcdFx0XHRcdFx0bGF6eVNpemVzQ29uZmlnLmV4cGFuZCA9IGRvY0VsZW0uY2xpZW50SGVpZ2h0ID4gNTAwICYmIGRvY0VsZW0uY2xpZW50V2lkdGggPiA1MDAgPyA1MDAgOiAzNzA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0ZGVmYXVsdEV4cGFuZCA9IGxhenlTaXplc0NvbmZpZy5leHBhbmQ7XG5cdFx0XHRcdFx0cHJlbG9hZEV4cGFuZCA9IGRlZmF1bHRFeHBhbmQgKiBsYXp5U2l6ZXNDb25maWcuZXhwRmFjdG9yO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoY3VycmVudEV4cGFuZCA8IHByZWxvYWRFeHBhbmQgJiYgaXNMb2FkaW5nIDwgMSAmJiBsb3dSdW5zID4gMiAmJiBsb2FkTW9kZSA+IDIgJiYgIWRvY3VtZW50LmhpZGRlbil7XG5cdFx0XHRcdFx0Y3VycmVudEV4cGFuZCA9IHByZWxvYWRFeHBhbmQ7XG5cdFx0XHRcdFx0bG93UnVucyA9IDA7XG5cdFx0XHRcdH0gZWxzZSBpZihsb2FkTW9kZSA+IDEgJiYgbG93UnVucyA+IDEgJiYgaXNMb2FkaW5nIDwgNil7XG5cdFx0XHRcdFx0Y3VycmVudEV4cGFuZCA9IGRlZmF1bHRFeHBhbmQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y3VycmVudEV4cGFuZCA9IHNocmlua0V4cGFuZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvcig7IGkgPCBlTGxlbjsgaSsrKXtcblxuXHRcdFx0XHRcdGlmKCFsYXp5bG9hZEVsZW1zW2ldIHx8IGxhenlsb2FkRWxlbXNbaV0uX2xhenlSYWNlKXtjb250aW51ZTt9XG5cblx0XHRcdFx0XHRpZighc3VwcG9ydFNjcm9sbCl7dW52ZWlsRWxlbWVudChsYXp5bG9hZEVsZW1zW2ldKTtjb250aW51ZTt9XG5cblx0XHRcdFx0XHRpZighKGVsZW1FeHBhbmRWYWwgPSBsYXp5bG9hZEVsZW1zW2ldW19nZXRBdHRyaWJ1dGVdKCdkYXRhLWV4cGFuZCcpKSB8fCAhKGVsZW1FeHBhbmQgPSBlbGVtRXhwYW5kVmFsICogMSkpe1xuXHRcdFx0XHRcdFx0ZWxlbUV4cGFuZCA9IGN1cnJlbnRFeHBhbmQ7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoYmVmb3JlRXhwYW5kVmFsICE9PSBlbGVtRXhwYW5kKXtcblx0XHRcdFx0XHRcdGVMdlcgPSBpbm5lcldpZHRoICsgKGVsZW1FeHBhbmQgKiBoRmFjKTtcblx0XHRcdFx0XHRcdGVsdkggPSBpbm5lckhlaWdodCArIGVsZW1FeHBhbmQ7XG5cdFx0XHRcdFx0XHRlbGVtTmVnYXRpdmVFeHBhbmQgPSBlbGVtRXhwYW5kICogLTE7XG5cdFx0XHRcdFx0XHRiZWZvcmVFeHBhbmRWYWwgPSBlbGVtRXhwYW5kO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlY3QgPSBsYXp5bG9hZEVsZW1zW2ldLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG5cdFx0XHRcdFx0aWYgKChlTGJvdHRvbSA9IHJlY3QuYm90dG9tKSA+PSBlbGVtTmVnYXRpdmVFeHBhbmQgJiZcblx0XHRcdFx0XHRcdChlTHRvcCA9IHJlY3QudG9wKSA8PSBlbHZIICYmXG5cdFx0XHRcdFx0XHQoZUxyaWdodCA9IHJlY3QucmlnaHQpID49IGVsZW1OZWdhdGl2ZUV4cGFuZCAqIGhGYWMgJiZcblx0XHRcdFx0XHRcdChlTGxlZnQgPSByZWN0LmxlZnQpIDw9IGVMdlcgJiZcblx0XHRcdFx0XHRcdChlTGJvdHRvbSB8fCBlTHJpZ2h0IHx8IGVMbGVmdCB8fCBlTHRvcCkgJiZcblx0XHRcdFx0XHRcdCgoaXNDb21wbGV0ZWQgJiYgaXNMb2FkaW5nIDwgMyAmJiAhZWxlbUV4cGFuZFZhbCAmJiAobG9hZE1vZGUgPCAzIHx8IGxvd1J1bnMgPCA0KSkgfHwgaXNOZXN0ZWRWaXNpYmxlKGxhenlsb2FkRWxlbXNbaV0sIGVsZW1FeHBhbmQpKSl7XG5cdFx0XHRcdFx0XHR1bnZlaWxFbGVtZW50KGxhenlsb2FkRWxlbXNbaV0pO1xuXHRcdFx0XHRcdFx0bG9hZGVkU29tZXRoaW5nID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGlmKGlzTG9hZGluZyA+IDkpe2JyZWFrO31cblx0XHRcdFx0XHR9IGVsc2UgaWYoIWxvYWRlZFNvbWV0aGluZyAmJiBpc0NvbXBsZXRlZCAmJiAhYXV0b0xvYWRFbGVtICYmXG5cdFx0XHRcdFx0XHRpc0xvYWRpbmcgPCA0ICYmIGxvd1J1bnMgPCA0ICYmIGxvYWRNb2RlID4gMiAmJlxuXHRcdFx0XHRcdFx0KHByZWxvYWRFbGVtc1swXSB8fCBsYXp5U2l6ZXNDb25maWcucHJlbG9hZEFmdGVyTG9hZCkgJiZcblx0XHRcdFx0XHRcdChwcmVsb2FkRWxlbXNbMF0gfHwgKCFlbGVtRXhwYW5kVmFsICYmICgoZUxib3R0b20gfHwgZUxyaWdodCB8fCBlTGxlZnQgfHwgZUx0b3ApIHx8IGxhenlsb2FkRWxlbXNbaV1bX2dldEF0dHJpYnV0ZV0obGF6eVNpemVzQ29uZmlnLnNpemVzQXR0cikgIT0gJ2F1dG8nKSkpKXtcblx0XHRcdFx0XHRcdGF1dG9Mb2FkRWxlbSA9IHByZWxvYWRFbGVtc1swXSB8fCBsYXp5bG9hZEVsZW1zW2ldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKGF1dG9Mb2FkRWxlbSAmJiAhbG9hZGVkU29tZXRoaW5nKXtcblx0XHRcdFx0XHR1bnZlaWxFbGVtZW50KGF1dG9Mb2FkRWxlbSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dmFyIHRocm90dGxlZENoZWNrRWxlbWVudHMgPSB0aHJvdHRsZShjaGVja0VsZW1lbnRzKTtcblxuXHRcdHZhciBzd2l0Y2hMb2FkaW5nQ2xhc3MgPSBmdW5jdGlvbihlKXtcblx0XHRcdGFkZENsYXNzKGUudGFyZ2V0LCBsYXp5U2l6ZXNDb25maWcubG9hZGVkQ2xhc3MpO1xuXHRcdFx0cmVtb3ZlQ2xhc3MoZS50YXJnZXQsIGxhenlTaXplc0NvbmZpZy5sb2FkaW5nQ2xhc3MpO1xuXHRcdFx0YWRkUmVtb3ZlTG9hZEV2ZW50cyhlLnRhcmdldCwgcmFmU3dpdGNoTG9hZGluZ0NsYXNzKTtcblx0XHR9O1xuXHRcdHZhciByYWZlZFN3aXRjaExvYWRpbmdDbGFzcyA9IHJBRkl0KHN3aXRjaExvYWRpbmdDbGFzcyk7XG5cdFx0dmFyIHJhZlN3aXRjaExvYWRpbmdDbGFzcyA9IGZ1bmN0aW9uKGUpe1xuXHRcdFx0cmFmZWRTd2l0Y2hMb2FkaW5nQ2xhc3Moe3RhcmdldDogZS50YXJnZXR9KTtcblx0XHR9O1xuXG5cdFx0dmFyIGNoYW5nZUlmcmFtZVNyYyA9IGZ1bmN0aW9uKGVsZW0sIHNyYyl7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRlbGVtLmNvbnRlbnRXaW5kb3cubG9jYXRpb24ucmVwbGFjZShzcmMpO1xuXHRcdFx0fSBjYXRjaChlKXtcblx0XHRcdFx0ZWxlbS5zcmMgPSBzcmM7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciBoYW5kbGVTb3VyY2VzID0gZnVuY3Rpb24oc291cmNlKXtcblx0XHRcdHZhciBjdXN0b21NZWRpYSwgcGFyZW50O1xuXG5cdFx0XHR2YXIgc291cmNlU3Jjc2V0ID0gc291cmNlW19nZXRBdHRyaWJ1dGVdKGxhenlTaXplc0NvbmZpZy5zcmNzZXRBdHRyKTtcblxuXHRcdFx0aWYoIChjdXN0b21NZWRpYSA9IGxhenlTaXplc0NvbmZpZy5jdXN0b21NZWRpYVtzb3VyY2VbX2dldEF0dHJpYnV0ZV0oJ2RhdGEtbWVkaWEnKSB8fCBzb3VyY2VbX2dldEF0dHJpYnV0ZV0oJ21lZGlhJyldKSApe1xuXHRcdFx0XHRzb3VyY2Uuc2V0QXR0cmlidXRlKCdtZWRpYScsIGN1c3RvbU1lZGlhKTtcblx0XHRcdH1cblxuXHRcdFx0aWYoc291cmNlU3Jjc2V0KXtcblx0XHRcdFx0c291cmNlLnNldEF0dHJpYnV0ZSgnc3Jjc2V0Jywgc291cmNlU3Jjc2V0KTtcblx0XHRcdH1cblxuXHRcdFx0Ly9odHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0xMTcwNTcyXG5cdFx0XHRpZihjdXN0b21NZWRpYSl7XG5cdFx0XHRcdHBhcmVudCA9IHNvdXJjZS5wYXJlbnROb2RlO1xuXHRcdFx0XHRwYXJlbnQuaW5zZXJ0QmVmb3JlKHNvdXJjZS5jbG9uZU5vZGUoKSwgc291cmNlKTtcblx0XHRcdFx0cGFyZW50LnJlbW92ZUNoaWxkKHNvdXJjZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciBsYXp5VW52ZWlsID0gckFGSXQoZnVuY3Rpb24gKGVsZW0sIGRldGFpbCwgaXNBdXRvLCBzaXplcywgaXNJbWcpe1xuXHRcdFx0dmFyIHNyYywgc3Jjc2V0LCBwYXJlbnQsIGlzUGljdHVyZSwgZXZlbnQsIGZpcmVzTG9hZDtcblxuXHRcdFx0aWYoIShldmVudCA9IHRyaWdnZXJFdmVudChlbGVtLCAnbGF6eWJlZm9yZXVudmVpbCcsIGRldGFpbCkpLmRlZmF1bHRQcmV2ZW50ZWQpe1xuXG5cdFx0XHRcdGlmKHNpemVzKXtcblx0XHRcdFx0XHRpZihpc0F1dG8pe1xuXHRcdFx0XHRcdFx0YWRkQ2xhc3MoZWxlbSwgbGF6eVNpemVzQ29uZmlnLmF1dG9zaXplc0NsYXNzKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoJ3NpemVzJywgc2l6ZXMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHNyY3NldCA9IGVsZW1bX2dldEF0dHJpYnV0ZV0obGF6eVNpemVzQ29uZmlnLnNyY3NldEF0dHIpO1xuXHRcdFx0XHRzcmMgPSBlbGVtW19nZXRBdHRyaWJ1dGVdKGxhenlTaXplc0NvbmZpZy5zcmNBdHRyKTtcblxuXHRcdFx0XHRpZihpc0ltZykge1xuXHRcdFx0XHRcdHBhcmVudCA9IGVsZW0ucGFyZW50Tm9kZTtcblx0XHRcdFx0XHRpc1BpY3R1cmUgPSBwYXJlbnQgJiYgcmVnUGljdHVyZS50ZXN0KHBhcmVudC5ub2RlTmFtZSB8fCAnJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmaXJlc0xvYWQgPSBkZXRhaWwuZmlyZXNMb2FkIHx8ICgoJ3NyYycgaW4gZWxlbSkgJiYgKHNyY3NldCB8fCBzcmMgfHwgaXNQaWN0dXJlKSk7XG5cblx0XHRcdFx0ZXZlbnQgPSB7dGFyZ2V0OiBlbGVtfTtcblxuXHRcdFx0XHRpZihmaXJlc0xvYWQpe1xuXHRcdFx0XHRcdGFkZFJlbW92ZUxvYWRFdmVudHMoZWxlbSwgcmVzZXRQcmVsb2FkaW5nLCB0cnVlKTtcblx0XHRcdFx0XHRjbGVhclRpbWVvdXQocmVzZXRQcmVsb2FkaW5nVGltZXIpO1xuXHRcdFx0XHRcdHJlc2V0UHJlbG9hZGluZ1RpbWVyID0gc2V0VGltZW91dChyZXNldFByZWxvYWRpbmcsIDI1MDApO1xuXG5cdFx0XHRcdFx0YWRkQ2xhc3MoZWxlbSwgbGF6eVNpemVzQ29uZmlnLmxvYWRpbmdDbGFzcyk7XG5cdFx0XHRcdFx0YWRkUmVtb3ZlTG9hZEV2ZW50cyhlbGVtLCByYWZTd2l0Y2hMb2FkaW5nQ2xhc3MsIHRydWUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoaXNQaWN0dXJlKXtcblx0XHRcdFx0XHRmb3JFYWNoLmNhbGwocGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzb3VyY2UnKSwgaGFuZGxlU291cmNlcyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihzcmNzZXQpe1xuXHRcdFx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKCdzcmNzZXQnLCBzcmNzZXQpO1xuXHRcdFx0XHR9IGVsc2UgaWYoc3JjICYmICFpc1BpY3R1cmUpe1xuXHRcdFx0XHRcdGlmKHJlZ0lmcmFtZS50ZXN0KGVsZW0ubm9kZU5hbWUpKXtcblx0XHRcdFx0XHRcdGNoYW5nZUlmcmFtZVNyYyhlbGVtLCBzcmMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRlbGVtLnNyYyA9IHNyYztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihzcmNzZXQgfHwgaXNQaWN0dXJlKXtcblx0XHRcdFx0XHR1cGRhdGVQb2x5ZmlsbChlbGVtLCB7c3JjOiBzcmN9KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZihlbGVtLl9sYXp5UmFjZSl7XG5cdFx0XHRcdGRlbGV0ZSBlbGVtLl9sYXp5UmFjZTtcblx0XHRcdH1cblx0XHRcdHJlbW92ZUNsYXNzKGVsZW0sIGxhenlTaXplc0NvbmZpZy5sYXp5Q2xhc3MpO1xuXG5cdFx0XHRyQUYoZnVuY3Rpb24oKXtcblx0XHRcdFx0aWYoICFmaXJlc0xvYWQgfHwgKGVsZW0uY29tcGxldGUgJiYgZWxlbS5uYXR1cmFsV2lkdGggPiAxKSl7XG5cdFx0XHRcdFx0aWYoZmlyZXNMb2FkKXtcblx0XHRcdFx0XHRcdHJlc2V0UHJlbG9hZGluZyhldmVudCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlzTG9hZGluZy0tO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzd2l0Y2hMb2FkaW5nQ2xhc3MoZXZlbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0cnVlKTtcblx0XHR9KTtcblxuXHRcdHZhciB1bnZlaWxFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW0pe1xuXHRcdFx0dmFyIGRldGFpbDtcblxuXHRcdFx0dmFyIGlzSW1nID0gcmVnSW1nLnRlc3QoZWxlbS5ub2RlTmFtZSk7XG5cblx0XHRcdC8vYWxsb3cgdXNpbmcgc2l6ZXM9XCJhdXRvXCIsIGJ1dCBkb24ndCB1c2UuIGl0J3MgaW52YWxpZC4gVXNlIGRhdGEtc2l6ZXM9XCJhdXRvXCIgb3IgYSB2YWxpZCB2YWx1ZSBmb3Igc2l6ZXMgaW5zdGVhZCAoaS5lLjogc2l6ZXM9XCI4MHZ3XCIpXG5cdFx0XHR2YXIgc2l6ZXMgPSBpc0ltZyAmJiAoZWxlbVtfZ2V0QXR0cmlidXRlXShsYXp5U2l6ZXNDb25maWcuc2l6ZXNBdHRyKSB8fCBlbGVtW19nZXRBdHRyaWJ1dGVdKCdzaXplcycpKTtcblx0XHRcdHZhciBpc0F1dG8gPSBzaXplcyA9PSAnYXV0byc7XG5cblx0XHRcdGlmKCAoaXNBdXRvIHx8ICFpc0NvbXBsZXRlZCkgJiYgaXNJbWcgJiYgKGVsZW0uc3JjIHx8IGVsZW0uc3Jjc2V0KSAmJiAhZWxlbS5jb21wbGV0ZSAmJiAhaGFzQ2xhc3MoZWxlbSwgbGF6eVNpemVzQ29uZmlnLmVycm9yQ2xhc3MpKXtyZXR1cm47fVxuXG5cdFx0XHRkZXRhaWwgPSB0cmlnZ2VyRXZlbnQoZWxlbSwgJ2xhenl1bnZlaWxyZWFkJykuZGV0YWlsO1xuXG5cdFx0XHRpZihpc0F1dG8pe1xuXHRcdFx0XHQgYXV0b1NpemVyLnVwZGF0ZUVsZW0oZWxlbSwgdHJ1ZSwgZWxlbS5vZmZzZXRXaWR0aCk7XG5cdFx0XHR9XG5cblx0XHRcdGVsZW0uX2xhenlSYWNlID0gdHJ1ZTtcblx0XHRcdGlzTG9hZGluZysrO1xuXG5cdFx0XHRsYXp5VW52ZWlsKGVsZW0sIGRldGFpbCwgaXNBdXRvLCBzaXplcywgaXNJbWcpO1xuXHRcdH07XG5cblx0XHR2YXIgb25sb2FkID0gZnVuY3Rpb24oKXtcblx0XHRcdGlmKGlzQ29tcGxldGVkKXtyZXR1cm47fVxuXHRcdFx0aWYoRGF0ZS5ub3coKSAtIHN0YXJ0ZWQgPCA5OTkpe1xuXHRcdFx0XHRzZXRUaW1lb3V0KG9ubG9hZCwgOTk5KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dmFyIGFmdGVyU2Nyb2xsID0gZGVib3VuY2UoZnVuY3Rpb24oKXtcblx0XHRcdFx0bGF6eVNpemVzQ29uZmlnLmxvYWRNb2RlID0gMztcblx0XHRcdFx0dGhyb3R0bGVkQ2hlY2tFbGVtZW50cygpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlzQ29tcGxldGVkID0gdHJ1ZTtcblxuXHRcdFx0bGF6eVNpemVzQ29uZmlnLmxvYWRNb2RlID0gMztcblxuXHRcdFx0dGhyb3R0bGVkQ2hlY2tFbGVtZW50cygpO1xuXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBmdW5jdGlvbigpe1xuXHRcdFx0XHRpZihsYXp5U2l6ZXNDb25maWcubG9hZE1vZGUgPT0gMyl7XG5cdFx0XHRcdFx0bGF6eVNpemVzQ29uZmlnLmxvYWRNb2RlID0gMjtcblx0XHRcdFx0fVxuXHRcdFx0XHRhZnRlclNjcm9sbCgpO1xuXHRcdFx0fSwgdHJ1ZSk7XG5cdFx0fTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRfOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRzdGFydGVkID0gRGF0ZS5ub3coKTtcblxuXHRcdFx0XHRsYXp5bG9hZEVsZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShsYXp5U2l6ZXNDb25maWcubGF6eUNsYXNzKTtcblx0XHRcdFx0cHJlbG9hZEVsZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShsYXp5U2l6ZXNDb25maWcubGF6eUNsYXNzICsgJyAnICsgbGF6eVNpemVzQ29uZmlnLnByZWxvYWRDbGFzcyk7XG5cdFx0XHRcdGhGYWMgPSBsYXp5U2l6ZXNDb25maWcuaEZhYztcblxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aHJvdHRsZWRDaGVja0VsZW1lbnRzLCB0cnVlKTtcblxuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aHJvdHRsZWRDaGVja0VsZW1lbnRzLCB0cnVlKTtcblxuXHRcdFx0XHRpZih3aW5kb3cuTXV0YXRpb25PYnNlcnZlcil7XG5cdFx0XHRcdFx0bmV3IE11dGF0aW9uT2JzZXJ2ZXIoIHRocm90dGxlZENoZWNrRWxlbWVudHMgKS5vYnNlcnZlKCBkb2NFbGVtLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlLCBhdHRyaWJ1dGVzOiB0cnVlfSApO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRvY0VsZW1bX2FkZEV2ZW50TGlzdGVuZXJdKCdET01Ob2RlSW5zZXJ0ZWQnLCB0aHJvdHRsZWRDaGVja0VsZW1lbnRzLCB0cnVlKTtcblx0XHRcdFx0XHRkb2NFbGVtW19hZGRFdmVudExpc3RlbmVyXSgnRE9NQXR0ck1vZGlmaWVkJywgdGhyb3R0bGVkQ2hlY2tFbGVtZW50cywgdHJ1ZSk7XG5cdFx0XHRcdFx0c2V0SW50ZXJ2YWwodGhyb3R0bGVkQ2hlY2tFbGVtZW50cywgOTk5KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCB0aHJvdHRsZWRDaGVja0VsZW1lbnRzLCB0cnVlKTtcblxuXHRcdFx0XHQvLywgJ2Z1bGxzY3JlZW5jaGFuZ2UnXG5cdFx0XHRcdFsnZm9jdXMnLCAnbW91c2VvdmVyJywgJ2NsaWNrJywgJ2xvYWQnLCAndHJhbnNpdGlvbmVuZCcsICdhbmltYXRpb25lbmQnLCAnd2Via2l0QW5pbWF0aW9uRW5kJ10uZm9yRWFjaChmdW5jdGlvbihuYW1lKXtcblx0XHRcdFx0XHRkb2N1bWVudFtfYWRkRXZlbnRMaXN0ZW5lcl0obmFtZSwgdGhyb3R0bGVkQ2hlY2tFbGVtZW50cywgdHJ1ZSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmKCgvZCR8XmMvLnRlc3QoZG9jdW1lbnQucmVhZHlTdGF0ZSkpKXtcblx0XHRcdFx0XHRvbmxvYWQoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdsb2FkJywgb25sb2FkKTtcblx0XHRcdFx0XHRkb2N1bWVudFtfYWRkRXZlbnRMaXN0ZW5lcl0oJ0RPTUNvbnRlbnRMb2FkZWQnLCB0aHJvdHRsZWRDaGVja0VsZW1lbnRzKTtcblx0XHRcdFx0XHRzZXRUaW1lb3V0KG9ubG9hZCwgMjAwMDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYobGF6eWxvYWRFbGVtcy5sZW5ndGgpe1xuXHRcdFx0XHRcdGNoZWNrRWxlbWVudHMoKTtcblx0XHRcdFx0XHRyQUYuX2xzRmx1c2goKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aHJvdHRsZWRDaGVja0VsZW1lbnRzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRjaGVja0VsZW1zOiB0aHJvdHRsZWRDaGVja0VsZW1lbnRzLFxuXHRcdFx0dW52ZWlsOiB1bnZlaWxFbGVtZW50XG5cdFx0fTtcblx0fSkoKTtcblxuXG5cdHZhciBhdXRvU2l6ZXIgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgYXV0b3NpemVzRWxlbXM7XG5cblx0XHR2YXIgc2l6ZUVsZW1lbnQgPSByQUZJdChmdW5jdGlvbihlbGVtLCBwYXJlbnQsIGV2ZW50LCB3aWR0aCl7XG5cdFx0XHR2YXIgc291cmNlcywgaSwgbGVuO1xuXHRcdFx0ZWxlbS5fbGF6eXNpemVzV2lkdGggPSB3aWR0aDtcblx0XHRcdHdpZHRoICs9ICdweCc7XG5cblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKCdzaXplcycsIHdpZHRoKTtcblxuXHRcdFx0aWYocmVnUGljdHVyZS50ZXN0KHBhcmVudC5ub2RlTmFtZSB8fCAnJykpe1xuXHRcdFx0XHRzb3VyY2VzID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzb3VyY2UnKTtcblx0XHRcdFx0Zm9yKGkgPSAwLCBsZW4gPSBzb3VyY2VzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcblx0XHRcdFx0XHRzb3VyY2VzW2ldLnNldEF0dHJpYnV0ZSgnc2l6ZXMnLCB3aWR0aCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYoIWV2ZW50LmRldGFpbC5kYXRhQXR0cil7XG5cdFx0XHRcdHVwZGF0ZVBvbHlmaWxsKGVsZW0sIGV2ZW50LmRldGFpbCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dmFyIGdldFNpemVFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW0sIGRhdGFBdHRyLCB3aWR0aCl7XG5cdFx0XHR2YXIgZXZlbnQ7XG5cdFx0XHR2YXIgcGFyZW50ID0gZWxlbS5wYXJlbnROb2RlO1xuXG5cdFx0XHRpZihwYXJlbnQpe1xuXHRcdFx0XHR3aWR0aCA9IGdldFdpZHRoKGVsZW0sIHBhcmVudCwgd2lkdGgpO1xuXHRcdFx0XHRldmVudCA9IHRyaWdnZXJFdmVudChlbGVtLCAnbGF6eWJlZm9yZXNpemVzJywge3dpZHRoOiB3aWR0aCwgZGF0YUF0dHI6ICEhZGF0YUF0dHJ9KTtcblxuXHRcdFx0XHRpZighZXZlbnQuZGVmYXVsdFByZXZlbnRlZCl7XG5cdFx0XHRcdFx0d2lkdGggPSBldmVudC5kZXRhaWwud2lkdGg7XG5cblx0XHRcdFx0XHRpZih3aWR0aCAmJiB3aWR0aCAhPT0gZWxlbS5fbGF6eXNpemVzV2lkdGgpe1xuXHRcdFx0XHRcdFx0c2l6ZUVsZW1lbnQoZWxlbSwgcGFyZW50LCBldmVudCwgd2lkdGgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgdXBkYXRlRWxlbWVudHNTaXplcyA9IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgaTtcblx0XHRcdHZhciBsZW4gPSBhdXRvc2l6ZXNFbGVtcy5sZW5ndGg7XG5cdFx0XHRpZihsZW4pe1xuXHRcdFx0XHRpID0gMDtcblxuXHRcdFx0XHRmb3IoOyBpIDwgbGVuOyBpKyspe1xuXHRcdFx0XHRcdGdldFNpemVFbGVtZW50KGF1dG9zaXplc0VsZW1zW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR2YXIgZGVib3VuY2VkVXBkYXRlRWxlbWVudHNTaXplcyA9IGRlYm91bmNlKHVwZGF0ZUVsZW1lbnRzU2l6ZXMpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdF86IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGF1dG9zaXplc0VsZW1zID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShsYXp5U2l6ZXNDb25maWcuYXV0b3NpemVzQ2xhc3MpO1xuXHRcdFx0XHRhZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBkZWJvdW5jZWRVcGRhdGVFbGVtZW50c1NpemVzKTtcblx0XHRcdH0sXG5cdFx0XHRjaGVja0VsZW1zOiBkZWJvdW5jZWRVcGRhdGVFbGVtZW50c1NpemVzLFxuXHRcdFx0dXBkYXRlRWxlbTogZ2V0U2l6ZUVsZW1lbnRcblx0XHR9O1xuXHR9KSgpO1xuXG5cdHZhciBpbml0ID0gZnVuY3Rpb24oKXtcblx0XHRpZighaW5pdC5pKXtcblx0XHRcdGluaXQuaSA9IHRydWU7XG5cdFx0XHRhdXRvU2l6ZXIuXygpO1xuXHRcdFx0bG9hZGVyLl8oKTtcblx0XHR9XG5cdH07XG5cblx0KGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHByb3A7XG5cblx0XHR2YXIgbGF6eVNpemVzRGVmYXVsdHMgPSB7XG5cdFx0XHRsYXp5Q2xhc3M6ICdsYXp5bG9hZCcsXG5cdFx0XHRsb2FkZWRDbGFzczogJ2xhenlsb2FkZWQnLFxuXHRcdFx0bG9hZGluZ0NsYXNzOiAnbGF6eWxvYWRpbmcnLFxuXHRcdFx0cHJlbG9hZENsYXNzOiAnbGF6eXByZWxvYWQnLFxuXHRcdFx0ZXJyb3JDbGFzczogJ2xhenllcnJvcicsXG5cdFx0XHQvL3N0cmljdENsYXNzOiAnbGF6eXN0cmljdCcsXG5cdFx0XHRhdXRvc2l6ZXNDbGFzczogJ2xhenlhdXRvc2l6ZXMnLFxuXHRcdFx0c3JjQXR0cjogJ2RhdGEtc3JjJyxcblx0XHRcdHNyY3NldEF0dHI6ICdkYXRhLXNyY3NldCcsXG5cdFx0XHRzaXplc0F0dHI6ICdkYXRhLXNpemVzJyxcblx0XHRcdC8vcHJlbG9hZEFmdGVyTG9hZDogZmFsc2UsXG5cdFx0XHRtaW5TaXplOiA0MCxcblx0XHRcdGN1c3RvbU1lZGlhOiB7fSxcblx0XHRcdGluaXQ6IHRydWUsXG5cdFx0XHRleHBGYWN0b3I6IDEuNSxcblx0XHRcdGhGYWM6IDAuOCxcblx0XHRcdGxvYWRNb2RlOiAyXG5cdFx0fTtcblxuXHRcdGxhenlTaXplc0NvbmZpZyA9IHdpbmRvdy5sYXp5U2l6ZXNDb25maWcgfHwgd2luZG93LmxhenlzaXplc0NvbmZpZyB8fCB7fTtcblxuXHRcdGZvcihwcm9wIGluIGxhenlTaXplc0RlZmF1bHRzKXtcblx0XHRcdGlmKCEocHJvcCBpbiBsYXp5U2l6ZXNDb25maWcpKXtcblx0XHRcdFx0bGF6eVNpemVzQ29uZmlnW3Byb3BdID0gbGF6eVNpemVzRGVmYXVsdHNbcHJvcF07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0d2luZG93LmxhenlTaXplc0NvbmZpZyA9IGxhenlTaXplc0NvbmZpZztcblxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdGlmKGxhenlTaXplc0NvbmZpZy5pbml0KXtcblx0XHRcdFx0aW5pdCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KSgpO1xuXG5cdHJldHVybiB7XG5cdFx0Y2ZnOiBsYXp5U2l6ZXNDb25maWcsXG5cdFx0YXV0b1NpemVyOiBhdXRvU2l6ZXIsXG5cdFx0bG9hZGVyOiBsb2FkZXIsXG5cdFx0aW5pdDogaW5pdCxcblx0XHR1UDogdXBkYXRlUG9seWZpbGwsXG5cdFx0YUM6IGFkZENsYXNzLFxuXHRcdHJDOiByZW1vdmVDbGFzcyxcblx0XHRoQzogaGFzQ2xhc3MsXG5cdFx0ZmlyZTogdHJpZ2dlckV2ZW50LFxuXHRcdGdXOiBnZXRXaWR0aCxcblx0XHRyQUY6IHJBRixcblx0fTtcbn1cbikpO1xuIiwiLy9cbi8vICB0ZXN0LmpzXG5cbi8qXG4gKiAgSW1wb3J0c1xuICovXG5cbi8qXG4gKiAgVGVzdFxuICovXG5jb25zdCB0ZXN0ID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gc2hvd0l0c1dvcmtpbmcoKSB7XG4gICAgY29uc29sZS5sb2coJ2l0cyB3b3JraW5nJyk7XG4gIH1cbiBcblxuICAvLyAgUHVibGljOiBpbml0aWFsaXNlXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgc2hvd0l0c1dvcmtpbmcoKTtcbiAgfVxuXG4gIC8vICBQdWJsaWMgQVBJXG4gIHJldHVybiB7XG4gICAgaW5pdFxuICB9O1xufSgpKTsgLy8gIElJRkVcblxuXG4vKlxuICogIEV4cG9ydHNcbiAqL1xuZXhwb3J0IHsgdGVzdCBhcyBkZWZhdWx0IH07XG4iLCIvL1xuLy8gIG1haW4uanNcblxuLy8gIFBvbHlmaWxsc1xuXG4vLyAgTGF6eVNpemVzXG5pbXBvcnQgJ2xhenlzaXplcy9wbHVnaW5zL3Jlc3BpbWcvbHMucmVzcGltZyc7ICAvLyAgcmVzcG9uc2l2ZSBpbWFnZSBwb2x5ZmlsbFxuaW1wb3J0ICdsYXp5c2l6ZXMnO1xuXG4vLyAgQ29tcG9uZW50c1xuaW1wb3J0IHRlc3QgZnJvbSAnLi9jb21wb25lbnRzL3Rlc3QnO1xuXG4vLyAgT24gTG9hZCBGdW5jdGlvbnNcbnRlc3QuaW5pdCgpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLENBQUMsU0FBUyxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQzs7Q0FFckMsWUFBWSxDQUFDO0NBQ2IsSUFBSSxRQUFRLENBQUM7Q0FDYixJQUFJLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsZUFBZSxDQUFDO0NBQzNFLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDeEMsSUFBSSxhQUFhLEdBQUcsQ0FBQyxPQUFPLElBQUksR0FBRyxNQUFNLFFBQVEsSUFBSSxHQUFHLENBQUMsQ0FBQztDQUMxRCxJQUFJLFFBQVEsR0FBRyxVQUFVLENBQUM7Q0FDMUIsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLFVBQVU7RUFDbkMsSUFBSSxjQUFjLEdBQUcsNEJBQTRCLENBQUM7RUFDbEQsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7O0VBRXRDLE9BQU8sU0FBUyxTQUFT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
