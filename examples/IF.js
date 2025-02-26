(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
		typeof define === 'function' && define.amd ? define(['exports'], factory) :
			(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.IF = {}));
})(this, (function (exports) { 'use strict';

	/**
	 * RouteParams
	 * The router params of current state call
	 */
	class RouteParams
	{
		/**
		 *
		 * @param {object} [params={}]
		 * @param {object} [query={}]
		 */
		constructor( params = {}, query = {} )
		{
			this._p = params;
			this._q = query;
		}

		/**
		 * Get param object
		 * @returns {Object}
		 */
		getParams()
		{
			return this._p;
		}

		/**
		 * Get param value by given key. If key does not exists, the defaultValue is returned
		 * @param {string} key - Param key
		 * @param {*|null} [defaultValue=null] - The default return value if given key does not exists
		 * @returns {*|null}
		 */
		getParam( key, defaultValue = null )
		{
			if ( this._p && this._p.hasOwnProperty( key ) )
			{
				return this._p[ key ];
			}
			else
			{
				return defaultValue;
			}
		}

		/**
		 * Get query value by given key. If key does not exitss, the defaultValue is returned
		 * @param {string} key - Query key
		 * @param {*|null} [defaultValue=null] - The default return value if given key does not exists
		 * @returns {*|null}
		 */
		getQuery( key, defaultValue = null )
		{
			if ( this._q && this._q.hasOwnProperty( key ) )
			{
				return this._q[ key ];
			}
			else
			{
				return defaultValue;
			}
		}

		/**
		 * Get query object
		 * @returns {Object}
		 */
		getQueries()
		{
			return this._q;
		}
	}

	/**
	 * State class. Parent state class. Extend this class for your state logic.
	 *
	 * @example
	 * Create a state called MyState with is executed when the url 'my-state' is called. When executed,
	 * it prints 'Hello from MyState' to the console.
	 *
	 * class MyState extends State
	 * {
	 *     asnyc enter()
	 *     {
	 *         console.log( "Hello from MyState" );
	 *     }
	 * }
	 */
	class State
	{
		/**
		 * ID of state. Should be an unique identifier. If not set it will be auto-generated.
		 * @type {string|null}
		 */
		static ID = null;

		/**
		 * Route(s) which trigger this state
		 * @type {string|array}
		 */
		static ROUTE = "/";

		/**
		 *
		 * @param {App} app - App instance
		 * @param {RouteParams=} routeParams - Current route params
		 */
		constructor( app, routeParams )
		{
			this.app = app;
			this.routeParams = null === routeParams ? new RouteParams() : routeParams;
		}

		/**
		 * Return current ID
		 *
		 * @returns {string}
		 */
		getId()
		{
			return this.constructor.ID;
		}

		/**
		 * Called before entering state.
		 * @returns {boolean}
		 */
		canEnter()
		{
			return true;
		}

		/**
		 * Called before exiting state.
		 * @returns {boolean}
		 */
		canExit()
		{
			return true;
		}

		/**
		 * Called when canEnter() function returns false.
		 * @returns {string|null} - Return redirect route.
		 */
		getRedirectUrl()
		{
			return null;
		}

		/**
		 * Called when entering scene and after canEnter() call returned true.
		 * @returns {Promise<void>}
		 */
		async enter()
		{
		}

		/**
		 * Called when exiting scene and after canExit() call return true.
		 * @returns {Promise<void>}
		 */
		async exit()
		{
		}

		getParams()
		{
			return this.routeParams.getParams();
		}

		getParam( key, defaultValue = null )
		{
			return this.routeParams.getParam( key, defaultValue );
		}

		getQueries()
		{
			return this.routeParams.getQueries();
		}

		getQuery( key, defaultValue = null )
		{
			return this.routeParams.getQuery( key, defaultValue );
		}

	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	// start: ObservableSlim

	/*
	 * 	Observable Slim
	 *	Version 0.1.6
	 * 	https://github.com/elliotnb/observable-slim
	 *
	 * 	Licensed under the MIT license:
	 * 	http://www.opensource.org/licenses/MIT
	 *
	 *	Observable Slim is a singleton that allows you to observe changes made to an object and any nested
	 *	children of that object. It is intended to assist with one-way data binding, that is, in MVC parlance,
	 *	reflecting changes in the model to the view. Observable Slim aspires to be as lightweight and easily
	 *	understood as possible. Minifies down to roughly 3000 characters.
	 */
	const ObservableSlim = (function() {
		// An array that stores all of the observables created through the public create() method below.
		var observables = [];
		// An array of all the objects that we have assigned Proxies to
		var targets = [];

		// An array of arrays containing the Proxies created for each target object. targetsProxy is index-matched with
		// 'targets' -- together, the pair offer a Hash table where the key is not a string nor number, but the actual target object
		var targetsProxy = [];

		// this variable tracks duplicate proxies assigned to the same target.
		// the 'set' handler below will trigger the same change on all other Proxies tracking the same target.
		// however, in order to avoid an infinite loop of Proxies triggering and re-triggering one another, we use dupProxy
		// to track that a given Proxy was modified from the 'set' handler
		var dupProxy = null;

		var _getProperty = function(obj, path) {
			return path.split('.').reduce(function(prev, curr) {
				return prev ? prev[curr] : undefined
			}, obj || self)
		};

		/**
		 * Create a new ES6 `Proxy` whose changes we can observe through the `observe()` method.
		 * @param {object} target Plain object that we want to observe for changes.
		 * @param {boolean|number} domDelay If `true`, then the observed changes to `target` will be batched up on a 10ms delay (via `setTimeout()`).
		 * If `false`, then the `observer` function will be immediately invoked after each individual change made to `target`. It is helpful to set
		 * `domDelay` to `true` when your `observer` function makes DOM manipulations (fewer DOM redraws means better performance). If a number greater
		 * than zero, then it defines the DOM delay in milliseconds.
		 * @param {function(ObservableSlimChange[])} [observer] Function that will be invoked when a change is made to the proxy of `target`.
		 * When invoked, this function is passed a single argument: an array of `ObservableSlimChange` detailing each change that has been made.
		 * @param {object} originalObservable The original observable created by the user, exists for recursion purposes, allows one observable to observe
		 * change on any nested/child objects.
		 * @param {{target: object, property: string}[]} originalPath Array of objects, each object having the properties `target` and `property`:
		 * `target` is referring to the observed object itself and `property` referring to the name of that object in the nested structure.
		 * The path of the property in relation to the target on the original observable, exists for recursion purposes, allows one observable to observe
		 * change on any nested/child objects.
		 * @returns {ProxyConstructor} Proxy of the target object.
		 */
		var _create = function(target, domDelay, originalObservable, originalPath) {

			var observable = originalObservable || null;

			// record the nested path taken to access this object -- if there was no path then we provide the first empty entry
			var path = originalPath || [{"target":target,"property":""}];

			// in order to accurately report the "previous value" of the "length" property on an Array
			// we must use a helper property because intercepting a length change is not always possible as of 8/13/2018 in
			// Chrome -- the new `length` value is already set by the time the `set` handler is invoked
			if (target instanceof Array) {
				if (!target.hasOwnProperty("__length"))
					Object.defineProperty(target, "__length", { enumerable: false, value: target.length, writable: true });
				else
					target.__length = target.length;
			}

			var changes = [];

			/**
			 * Returns a string of the nested path (in relation to the top-level observed object) of the property being modified or deleted.
			 * @param {object} target Plain object that we want to observe for changes.
			 * @param {string} property Property name.
			 * @param {boolean} [jsonPointer] Set to `true` if the string path should be formatted as a JSON pointer rather than with the dot notation
			 * (`false` as default).
			 * @returns {string} Nested path (e.g., `hello.testing.1.bar` or, if JSON pointer, `/hello/testing/1/bar`).
			 */
			var _getPath = function(target, property, jsonPointer) {

				var fullPath = "";
				var lastTarget = null;

				// loop over each item in the path and append it to full path
				for (var i = 0; i < path.length; i++) {

					// if the current object was a member of an array, it's possible that the array was at one point
					// mutated and would cause the position of the current object in that array to change. we perform an indexOf
					// lookup here to determine the current position of that object in the array before we add it to fullPath
					if (lastTarget instanceof Array && !isNaN(path[i].property)) {
						path[i].property = lastTarget.indexOf(path[i].target);
					}

					fullPath = fullPath + "." + path[i].property;
					lastTarget = path[i].target;
				}

				// add the current property
				fullPath = fullPath + "." + property;

				// remove the beginning two dots -- ..foo.bar becomes foo.bar (the first item in the nested chain doesn't have a property name)
				fullPath = fullPath.substring(2);

				if (jsonPointer === true) fullPath = "/" + fullPath.replace(/\./g, "/");

				return fullPath;
			};

			var _notifyObservers = function(numChanges) {

				// if the observable is paused, then we don't want to execute any of the observer functions
				if (observable.paused === true) return;

				var domDelayIsNumber = typeof domDelay === 'number';

				// execute observer functions on a 10ms setTimeout, this prevents the observer functions from being executed
				// separately on every change -- this is necessary because the observer functions will often trigger UI updates
				if (domDelayIsNumber || domDelay === true) {
					setTimeout(function() {
						if (numChanges === changes.length) {

							// we create a copy of changes before passing it to the observer functions because even if the observer function
							// throws an error, we still need to ensure that changes is reset to an empty array so that old changes don't persist
							var changesCopy = changes.slice(0);
							changes = [];

							// invoke any functions that are observing changes
							for (var i = 0; i < observable.observers.length; i++) observable.observers[i](changesCopy);

						}
					}, (domDelayIsNumber && domDelay > 0) ? domDelay : 10);
				} else {

					// we create a copy of changes before passing it to the observer functions because even if the observer function
					// throws an error, we still need to ensure that changes is reset to an empty array so that old changes don't persist
					var changesCopy = changes.slice(0);
					changes = [];

					// invoke any functions that are observing changes
					for (var i = 0; i < observable.observers.length; i++) observable.observers[i](changesCopy);

				}
			};

			var handler = {
				get: function(target, property) {

					// implement a simple check for whether or not the object is a proxy, this helps the .create() method avoid
					// creating Proxies of Proxies.
					if (property === "__getTarget") {
						return target;
					} else if (property === "__isProxy") {
						return true;
						// from the perspective of a given observable on a parent object, return the parent object of the given nested object
					} else if (property === "__getParent") {
						return function(i) {
							if (typeof i === "undefined") var i = 1;
							var parentPath = _getPath(target, "__getParent").split(".");
							parentPath.splice(-(i+1),(i+1));
							return _getProperty(observable.parentProxy, parentPath.join("."));
						}
						// return the full path of the current object relative to the parent observable
					} else if (property === "__getPath") {
						// strip off the 12 characters for ".__getParent"
						var parentPath = _getPath(target, "__getParent");
						return parentPath.slice(0, -12);
					}

					// for performance improvements, we assign this to a variable so we do not have to lookup the property value again
					var targetProp = target[property];
					if (target instanceof Date && targetProp instanceof Function && targetProp !== null) {
						return targetProp.bind(target);
					}

					// if we are traversing into a new object, then we want to record path to that object and return a new observable.
					// recursively returning a new observable allows us a single Observable.observe() to monitor all changes on
					// the target object and any objects nested within.
					if (targetProp instanceof Object && targetProp !== null && target.hasOwnProperty(property)) {

						// if we've found a proxy nested on the object, then we want to retrieve the original object behind that proxy
						if (targetProp.__isProxy === true) targetProp = targetProp.__getTarget;

						// if the object accessed by the user (targetProp) already has a __targetPosition AND the object
						// stored at target[targetProp.__targetPosition] is not null, then that means we are already observing this object
						// we might be able to return a proxy that we've already created for the object
						if (targetProp.__targetPosition > -1 && targets[targetProp.__targetPosition] !== null) {

							// loop over the proxies that we've created for this object
							var ttp = targetsProxy[targetProp.__targetPosition];
							for (var i = 0, l = ttp.length; i < l; i++) {

								// if we find a proxy that was setup for this particular observable, then return that proxy
								if (observable === ttp[i].observable) {
									return ttp[i].proxy;
								}
							}
						}

						// if we're arrived here, then that means there is no proxy for the object the user just accessed, so we
						// have to create a new proxy for it

						// create a shallow copy of the path array -- if we didn't create a shallow copy then all nested objects would share the same path array and the path wouldn't be accurate
						var newPath = path.slice(0);
						newPath.push({"target":targetProp,"property":property});
						return _create(targetProp, domDelay, observable, newPath);
					} else {
						return targetProp;
					}
				},
				deleteProperty: function(target, property) {

					// was this change an original change or was it a change that was re-triggered below
					var originalChange = true;
					if (dupProxy === proxy) {
						originalChange = false;
						dupProxy = null;
					}

					// in order to report what the previous value was, we must make a copy of it before it is deleted
					var previousValue = Object.assign({}, target);

					// record the deletion that just took place
					changes.push({
						"type":"delete"
						,"target":target
						,"property":property
						,"newValue":null
						,"previousValue":previousValue[property]
						,"currentPath":_getPath(target, property)
						,"jsonPointer":_getPath(target, property, true)
						,"proxy":proxy
					});

					if (originalChange === true) {

						// perform the delete that we've trapped if changes are not paused for this observable
						if (!observable.changesPaused) delete target[property];

						for (var a = 0, l = targets.length; a < l; a++) if (target === targets[a]) break;

						// loop over each proxy and see if the target for this change has any other proxies
						var currentTargetProxy = targetsProxy[a] || [];

						var b = currentTargetProxy.length;
						while (b--) {
							// if the same target has a different proxy
							if (currentTargetProxy[b].proxy !== proxy) {
								// !!IMPORTANT!! store the proxy as a duplicate proxy (dupProxy) -- this will adjust the behavior above appropriately (that is,
								// prevent a change on dupProxy from re-triggering the same change on other proxies)
								dupProxy = currentTargetProxy[b].proxy;

								// make the same delete on the different proxy for the same target object. it is important that we make this change *after* we invoke the same change
								// on any other proxies so that the previousValue can show up correct for the other proxies
								delete currentTargetProxy[b].proxy[property];
							}
						}

					}

					_notifyObservers(changes.length);

					return true;

				},
				set: function(target, property, value, receiver) {

					// if the value we're assigning is an object, then we want to ensure
					// that we're assigning the original object, not the proxy, in order to avoid mixing
					// the actual targets and proxies -- creates issues with path logging if we don't do this
					if (value && value.__isProxy) value = value.__getTarget;

					// was this change an original change or was it a change that was re-triggered below
					var originalChange = true;
					if (dupProxy === proxy) {
						originalChange = false;
						dupProxy = null;
					}

					// improve performance by saving direct references to the property
					var targetProp = target[property];

					// Only record this change if:
					// 	1. the new value differs from the old one
					//	2. OR if this proxy was not the original proxy to receive the change
					// 	3. OR the modified target is an array and the modified property is "length" and our helper property __length indicates that the array length has changed
					//
					// Regarding #3 above: mutations of arrays via .push or .splice actually modify the .length before the set handler is invoked
					// so in order to accurately report the correct previousValue for the .length, we have to use a helper property.
					if (targetProp !== value || originalChange === false || (property === "length" && target instanceof Array && target.__length !== value)) {

						var foundObservable = true;

						var typeOfTargetProp = (typeof targetProp);

						// determine if we're adding something new or modifying some that already existed
						var type = "update";
						if (typeOfTargetProp === "undefined") type = "add";

						// store the change that just occurred. it is important that we store the change before invoking the other proxies so that the previousValue is correct
						changes.push({
							"type":type
							,"target":target
							,"property":property
							,"newValue":value
							,"previousValue":receiver[property]
							,"currentPath":_getPath(target, property)
							,"jsonPointer":_getPath(target, property, true)
							,"proxy":proxy
						});

						// mutations of arrays via .push or .splice actually modify the .length before the set handler is invoked
						// so in order to accurately report the correct previousValue for the .length, we have to use a helper property.
						if (property === "length" && target instanceof Array && target.__length !== value) {
							changes[changes.length-1].previousValue = target.__length;
							target.__length = value;
						}

						// !!IMPORTANT!! if this proxy was the first proxy to receive the change, then we need to go check and see
						// if there are other proxies for the same project. if there are, then we will modify those proxies as well so the other
						// observers can be modified of the change that has occurred.
						if (originalChange === true) {

							// because the value actually differs than the previous value
							// we need to store the new value on the original target object,
							// but only as long as changes have not been paused
							if (!observable.changesPaused) target[property] = value;


							foundObservable = false;

							var targetPosition = target.__targetPosition;
							var z = targetsProxy[targetPosition].length;

							// find the parent target for this observable -- if the target for that observable has not been removed
							// from the targets array, then that means the observable is still active and we should notify the observers of this change
							while (z--) {
								if (observable === targetsProxy[targetPosition][z].observable) {
									if (targets[targetsProxy[targetPosition][z].observable.parentTarget.__targetPosition] !== null) {
										foundObservable = true;
										break;
									}
								}
							}

							// if we didn't find an observable for this proxy, then that means .remove(proxy) was likely invoked
							// so we no longer need to notify any observer function about the changes, but we still need to update the
							// value of the underlying original objects see below: target[property] = value;
							if (foundObservable) {

								// loop over each proxy and see if the target for this change has any other proxies
								var currentTargetProxy = targetsProxy[targetPosition];
								for (var b = 0, l = currentTargetProxy.length; b < l; b++) {
									// if the same target has a different proxy
									if (currentTargetProxy[b].proxy !== proxy) {

										// !!IMPORTANT!! store the proxy as a duplicate proxy (dupProxy) -- this will adjust the behavior above appropriately (that is,
										// prevent a change on dupProxy from re-triggering the same change on other proxies)
										dupProxy = currentTargetProxy[b].proxy;

										// invoke the same change on the different proxy for the same target object. it is important that we make this change *after* we invoke the same change
										// on any other proxies so that the previousValue can show up correct for the other proxies
										currentTargetProxy[b].proxy[property] = value;

									}
								}

								// if the property being overwritten is an object, then that means this observable
								// will need to stop monitoring this object and any nested objects underneath the overwritten object else they'll become
								// orphaned and grow memory usage. we execute this on a setTimeout so that the clean-up process does not block
								// the UI rendering -- there's no need to execute the clean up immediately
								setTimeout(function() {

									if (typeOfTargetProp === "object" && targetProp !== null) {

										// check if the to-be-overwritten target property still exists on the target object
										// if it does still exist on the object, then we don't want to stop observing it. this resolves
										// an issue where array .sort() triggers objects to be overwritten, but instead of being overwritten
										// and discarded, they are shuffled to a new position in the array
										var keys = Object.keys(target);
										for (var i = 0, l = keys.length; i < l; i++) {
											if (target[keys[i]] === targetProp) return;
										}

										var stillExists = false;

										// now we perform the more expensive search recursively through the target object.
										// if we find the targetProp (that was just overwritten) still exists somewhere else
										// further down in the object, then we still need to observe the targetProp on this observable.
										(function iterate(target) {
											var keys = Object.keys(target);
											for (var i = 0, l = keys.length; i < l; i++) {

												var property = keys[i];
												var nestedTarget = target[property];

												if (nestedTarget instanceof Object && nestedTarget !== null) iterate(nestedTarget);
												if (nestedTarget === targetProp) {
													stillExists = true;
													return;
												}
											}                                    })(target);

										// even though targetProp was overwritten, if it still exists somewhere else on the object,
										// then we don't want to remove the observable for that object (targetProp)
										if (stillExists === true) return;

										// loop over each property and recursively invoke the `iterate` function for any
										// objects nested on targetProp
										(function iterate(obj) {

											var keys = Object.keys(obj);
											for (var i = 0, l = keys.length; i < l; i++) {
												var objProp = obj[keys[i]];
												if (objProp instanceof Object && objProp !== null) iterate(objProp);
											}

											// if there are any existing target objects (objects that we're already observing)...
											var c = -1;
											for (var i = 0, l = targets.length; i < l; i++) {
												if (obj === targets[i]) {
													c = i;
													break;
												}
											}
											if (c > -1) {

												// ...then we want to determine if the observables for that object match our current observable
												var currentTargetProxy = targetsProxy[c];
												var d = currentTargetProxy.length;

												while (d--) {
													// if we do have an observable monitoring the object thats about to be overwritten
													// then we can remove that observable from the target object
													if (observable === currentTargetProxy[d].observable) {
														currentTargetProxy.splice(d,1);
														break;
													}
												}

												// if there are no more observables assigned to the target object, then we can remove
												// the target object altogether. this is necessary to prevent growing memory consumption particularly with large data sets
												if (currentTargetProxy.length == 0) {
													// targetsProxy.splice(c,1);
													targets[c] = null;
												}
											}

										})(targetProp);
									}
								},10000);
							}

							// TO DO: the next block of code resolves test case #29, but it results in poor IE11 performance with very large objects.
							// UPDATE: need to re-evaluate IE11 performance due to major performance overhaul from 12/23/2018.
							//
							// if the value we've just set is an object, then we'll need to iterate over it in order to initialize the
							// observers/proxies on all nested children of the object
							/* if (value instanceof Object && value !== null) {
	                            (function iterate(proxy) {
	                                var target = proxy.__getTarget;
	                                var keys = Object.keys(target);
	                                for (var i = 0, l = keys.length; i < l; i++) {
	                                    var property = keys[i];
	                                    if (target[property] instanceof Object && target[property] !== null) iterate(proxy[property]);
	                                };
	                            })(proxy[property]);
	                        }; */

						}
						if (foundObservable) {
							// notify the observer functions that the target has been modified
							_notifyObservers(changes.length);
						}

					}
					return true;
				}
			};

			var __targetPosition = target.__targetPosition;
			if (!(__targetPosition > -1)) {
				Object.defineProperty(target, "__targetPosition", {
					value: targets.length
					,writable: false
					,enumerable: false
					,configurable: false
				});
			}

			// create the proxy that we'll use to observe any changes
			var proxy = new Proxy(target, handler);

			// we don't want to create a new observable if this function was invoked recursively
			if (observable === null) {
				observable = {"parentTarget":target, "domDelay":domDelay, "parentProxy":proxy, "observers":[],"paused":false,"path":path,"changesPaused":false};
				observables.push(observable);
			}

			// store the proxy we've created so it isn't re-created unnecessarily via get handler
			var proxyItem = {"target":target,"proxy":proxy,"observable":observable};

			// if we have already created a Proxy for this target object then we add it to the corresponding array
			// on targetsProxy (targets and targetsProxy work together as a Hash table indexed by the actual target object).
			if (__targetPosition > -1) {

				// the targets array is set to null for the position of this particular object, then we know that
				// the observable was removed some point in time for this object -- so we need to set the reference again
				if (targets[__targetPosition] === null) {
					targets[__targetPosition] = target;
				}

				targetsProxy[__targetPosition].push(proxyItem);

				// else this is a target object that we had not yet created a Proxy for, so we must add it to targets,
				// and push a new array on to targetsProxy containing the new Proxy
			} else {
				targets.push(target);
				targetsProxy.push([proxyItem]);
			}

			return proxy;
		};

		/**
		 * @typedef {object} ObservableSlimChange Observed change.
		 * @property {"add"|"update"|"delete"} type Change type.
		 * @property {string} property Property name.
		 * @property {string} currentPath Property path with the dot notation (e.g. `foo.0.bar`).
		 * @property {string} jsonPointer Property path with the JSON pointer syntax (e.g. `/foo/0/bar`). See https://datatracker.ietf.org/doc/html/rfc6901.
		 * @property {object} target Target object.
		 * @property {ProxyConstructor} proxy Proxy of the target object.
		 * @property {*} newValue New value of the property.
		 * @property {*} [previousValue] Previous value of the property
		 */

		return {
			/**
			 * Create a new ES6 `Proxy` whose changes we can observe through the `observe()` method.
			 * @param {object} target Plain object that we want to observe for changes.
			 * @param {boolean|number} domDelay If `true`, then the observed changes to `target` will be batched up on a 10ms delay (via `setTimeout()`).
			 * If `false`, then the `observer` function will be immediately invoked after each individual change made to `target`. It is helpful to set
			 * `domDelay` to `true` when your `observer` function makes DOM manipulations (fewer DOM redraws means better performance). If a number greater
			 * than zero, then it defines the DOM delay in milliseconds.
			 * @param {function(ObservableSlimChange[])} [observer] Function that will be invoked when a change is made to the proxy of `target`.
			 * When invoked, this function is passed a single argument: an array of `ObservableSlimChange` detailing each change that has been made.
			 * @returns {ProxyConstructor} Proxy of the target object.
			 */
			create: function(target, domDelay, observer) {

				// test if the target is a Proxy, if it is then we need to retrieve the original object behind the Proxy.
				// we do not allow creating proxies of proxies because -- given the recursive design of ObservableSlim -- it would lead to sharp increases in memory usage
				if (target.__isProxy === true) {
					var target = target.__getTarget;
					//if it is, then we should throw an error. we do not allow creating proxies of proxies
					// because -- given the recursive design of ObservableSlim -- it would lead to sharp increases in memory usage
					//throw new Error("ObservableSlim.create() cannot create a Proxy for a target object that is also a Proxy.");
				}

				// fire off the _create() method -- it will create a new observable and proxy and return the proxy
				var proxy = _create(target, domDelay);

				// assign the observer function
				if (typeof observer === "function") this.observe(proxy, observer);

				// recursively loop over all nested objects on the proxy we've just created
				// this will allow the top observable to observe any changes that occur on a nested object
				(function iterate(proxy) {
					var target = proxy.__getTarget;
					var keys  = Object.keys(target);
					for (var i = 0, l = keys.length; i < l; i++) {
						var property = keys[i];
						if (target[property] instanceof Object && target[property] !== null) iterate(proxy[property]);
					}
				})(proxy);

				return proxy;

			},

			/**
			 * Add a new observer function to an existing proxy.
			 * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
			 * @param {function(ObservableSlimChange[])} observer Function that will be invoked when a change is made to the proxy of `target`.
			 * When invoked, this function is passed a single argument: an array of `ObservableSlimChange` detailing each change that has been made.
			 * @returns {void} Does not return any value.
			 */
			observe: function(proxy, observer) {
				// loop over all the observables created by the _create() function
				var i = observables.length;
				while (i--) {
					if (observables[i].parentProxy === proxy) {
						observables[i].observers.push(observer);
						break;
					}
				}        },

			/**
			 * Prevent any observer functions from being invoked when a change occurs to a proxy.
			 * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
			 * @returns {void} Does not return any value.
			 */
			pause: function(proxy) {
				var i = observables.length;
				var foundMatch = false;
				while (i--) {
					if (observables[i].parentProxy === proxy) {
						observables[i].paused = true;
						foundMatch = true;
						break;
					}
				}
				if (foundMatch == false) throw new Error("ObseravableSlim could not pause observable -- matching proxy not found.");
			},

			/**
			 * Resume execution of any observer functions when a change is made to a proxy.
			 * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
			 * @returns {void} Does not return any value.
			 */
			resume: function(proxy) {
				var i = observables.length;
				var foundMatch = false;
				while (i--) {
					if (observables[i].parentProxy === proxy) {
						observables[i].paused = false;
						foundMatch = true;
						break;
					}
				}
				if (foundMatch == false) throw new Error("ObseravableSlim could not resume observable -- matching proxy not found.");
			},

			/**
			 * Prevent any changes (i.e., `set`, and `deleteProperty`) from being written to the target object.
			 * However, the observer functions will still be invoked to let you know what changes **WOULD** have been made.
			 * This can be useful if the changes need to be approved by an external source before the changes take effect.
			 * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
			 * @returns {void} Does not return any value.
			 */
			pauseChanges: function(proxy){
				var i = observables.length;
				var foundMatch = false;
				while (i--) {
					if (observables[i].parentProxy === proxy) {
						observables[i].changesPaused = true;
						foundMatch = true;
						break;
					}
				}
				if (foundMatch == false) throw new Error("ObseravableSlim could not pause changes on observable -- matching proxy not found.");
			},

			/**
			 * Resume the changes that were taking place prior to the call to `pauseChanges()` method.
			 * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
			 * @returns {void} Does not return any value.
			 */
			resumeChanges: function(proxy){
				var i = observables.length;
				var foundMatch = false;
				while (i--) {
					if (observables[i].parentProxy === proxy) {
						observables[i].changesPaused = false;
						foundMatch = true;
						break;
					}
				}
				if (foundMatch == false) throw new Error("ObseravableSlim could not resume changes on observable -- matching proxy not found.");
			},

			/**
			 * Remove the observable and proxy thereby preventing any further callback observers for changes occurring to the target object.
			 * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
			 * @returns {void} Does not return any value.
			 */
			remove: function(proxy) {

				var matchedObservable = null;
				var foundMatch = false;

				var c = observables.length;
				while (c--) {
					if (observables[c].parentProxy === proxy) {
						matchedObservable = observables[c];
						foundMatch = true;
						break;
					}
				}
				var a = targetsProxy.length;
				while (a--) {
					var b = targetsProxy[a].length;
					while (b--) {
						if (targetsProxy[a][b].observable === matchedObservable) {
							targetsProxy[a].splice(b,1);

							// if there are no more proxies for this target object
							// then we null out the position for this object on the targets array
							// since we are essentially no longer observing this object.
							// we do not splice it off the targets array, because if we re-observe the same
							// object at a later time, the property __targetPosition cannot be redefined.
							if (targetsProxy[a].length === 0) {
								targets[a] = null;
							}                    }
					}            }
				if (foundMatch === true) {
					observables.splice(c,1);
				}
			}
		};
	})();

	/**
	 * Helper class provides static helper functions.
	 */
	class Helper
	{
		/**
		 *
		 * @param {string} str String to trim
		 * @param {string|undefined} characters Characters to trim. Default is empty space.
		 * @param {string|undefined} flags RegExp flag. Default is "g"
		 * @returns {string}
		 */
		static trim ( str, characters = " ", flags = "g" )
		{
			if (typeof str !== "string" || typeof characters !== "string" || typeof flags !== "string")
			{
				throw new TypeError("argument must be string");
			}

			if (!/^[gi]*$/.test(flags))
			{
				throw new TypeError("Invalid flags supplied '" + flags.match(new RegExp("[^gi]*")) + "'");
			}

			characters = characters.replace(/[\[\](){}?*+\^$\\.|\-]/g, "\\$&");

			return str.replace(new RegExp("^[" + characters + "]+|[" + characters + "]+$", flags), '');
		}

		/**
		 * Serialize given from
		 * @param {HTMLFormElement} form - The form element to serialize
		 * @returns {object} - Plain javascript object containing the name and value of given form.
		 */
		static serializeForm( form )
		{
			// todo - check for disabled form elements which cannot be resolved and show an info/warning
			const object = {};
			new FormData( form ).forEach(( value, key) =>
			{
				// Reflect.has in favor of: object.hasOwnProperty(key)
				if( !Reflect.has( object, key ) )
				{
					object[ key ] = value;
					return;
				}

				if( !Array.isArray( object[ key ] ) )
				{
					object[ key ] = [ object[ key ] ];
				}

				object[ key ].push( value );
			});
			return object;
		}

		/**
		 * Creates an unique ID
		 * @returns {string}
		 * @throws {Error} - If crypto module is not available
		 */
		static createUid()
		{
			if ( typeof crypto === 'undefined'  )
			{
				throw new Error( 'Crypto is not available.' );
			}

			return ( [ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11 ).replace( /[018]/g, c =>
				( c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ] & 15 >> c / 4 ).toString( 16 )
			);
		}

		/**
		 * Checks if given value is string
		 *
		 * @param {*} v - Value to check
		 * @returns {boolean}
		 */
		static isString( v )
		{
			return ( typeof v === 'string' || v instanceof String );
		}

		/**
		 * Checks if given value is an array or not
		 *
		 * @param {*} v - Value to check
		 * @returns {boolean}
		 */
		static isArray( v )
		{
			return Array.isArray( v );
		}

		/**
		 * Checks if given value is a plain object
		 *
		 * @see {@link https://github.com/lodash/lodash/blob/master/isPlainObject.js}
		 * @param value
		 * @returns {boolean}
		 */
		static isPlainObject( value )
		{
			if ( !Helper._isObjectLike( value ) || Helper._getTag( value ) != '[object Object]' )
			{
				return false
			}

			if ( Object.getPrototypeOf( value ) === null )
			{
				return true
			}

			let proto = value;
			while ( Object.getPrototypeOf( proto ) !== null)
			{
				proto = Object.getPrototypeOf(proto);
			}

			return Object.getPrototypeOf( value ) === proto
		}

		/**
		 * Checks if given value is a class constructor
		 *
		 * @see {@link https://stackoverflow.com/questions/30758961/how-to-check-if-a-variable-is-an-es6-class-declaration}
		 * @param v
		 * @returns {boolean}
		 */
		static isClass( v )
		{
			return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
		}

		/**
		 * Deep merges two objects into target
		 *
		 * @param {Object} target
		 * @param {Object} sources
		 * @return {Object}
		 * @example
		 *
		 * const merged = mergeDeep({a: 1}, { b : { c: { d: { e: 12345}}}});
		 * // => { a: 1, b: { c: { d: [Object] } } }
		 */
		static deepMerge( target, ...sources )
		{
			if (!sources.length) return target;
			const source = sources.shift();

			if ( Helper.isPlainObject( target ) && Helper.isPlainObject( source ) )
			{
				for ( const key in source )
				{
					if ( Helper.isPlainObject( source[ key ] ) )
					{
						if ( !target[ key ] ) Object.assign( target, { [key]: {} } );
						Helper.deepMerge( target[ key ], source[ key ] );
					}
					else
					{
						Object.assign( target, { [key]: source[key] });
					}
				}
			}

			return Helper.deepMerge( target, ...sources );
		}

		/**
		 * Create an observable object
		 *
		 * @param {function=} onChange - Callback triggered on change. Default is undefined.
		 * @param {object=} objReference - Referenced object which will be transformed to an observable. Default is an empty new object.
		 * @param {boolean=} batchUpDelay - Flag defining if change events are batched up for 10ms before being triggered. Default is true.
		 * @returns {ProxyConstructor}
		 */
		static createObservable( onChange = undefined, objReference = {}, batchUpDelay = true )
		{
			return ObservableSlim.create(
				objReference,
				batchUpDelay,
				onChange
			);
		}

		// Refer to:
		// https://github.com/lodash/lodash/blob/master/isObjectLike.js
		static _isObjectLike( value )
		{
			return typeof value === 'object' && value !== null
		}


		// Refer to:
		// https://github.com/lodash/lodash/blob/master/.internal/getTag.js
		static _getTag( value )
		{
			if ( value == null )
			{
				return value === undefined ? '[object Undefined]' : '[object Null]'
			}
			return Object.prototype.toString.call( value );
		}
	}

	class DefaultBaseState extends State
	{
		static VERTEX_SHADER = `
attribute vec2 inPos;

void main() 
{
    gl_Position = vec4(inPos, 0.0, 1.0);
}
`;
		static FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 fc = fragCoord;
    
    vec3 col = vec3(0.8, 0.2, 0.1);
    for(int j=-2;j<=2;j++){
        for(int k=-2;k<=2;k++){
            vec2 uv = (fc)/iResolution.xy;
            uv += sin(uv.x*(2.0+sin(iTime*0.39))+iTime*0.12)*vec2(j,k)*13.0/iResolution.xy;

            //float i = iTime*0.4+float(j)*0.03;
            float i = iTime*0.1+float(j)*0.03;
            uv.x *= 0.8;            
            
            float y = sin(uv.x*3.0+uv.x*sin(uv.x+i*0.37)*1.0+i*2.0+cos(uv.x*0.6+i*0.71)*0.75)*0.25+uv.y-0.5;
            float ys = sign(y);
			col += abs(vec3(max((1.0-pow(y,0.13+sin(uv.x+iTime*0.21)*0.1))*vec3(1.1,0.6,0.15),(1.0-pow(-y,0.13))*vec3(0.9,0.2,0.2))));
        }
    }
	//col /= 3.0;
    // Output to screen
    //fragColor = vec4(col.r / 2.9, col.r / 1.2, col.r/ 1.9,1.0);
    fragColor = vec4(col.r * 0.125, col.r * 0.027, col.r * 0.22 ,1.0);
}

void main() 
{
    mainImage( gl_FragColor, gl_FragCoord.xy );
}
`;

		async enter()
		{
			this.app.container.innerHTML = `
            <div id="if-cover" style="margin: 0; padding: 0; width: 100%; height: 100%; min-height: 100vh;position: relative">
                <canvas id="ds" style="margin: 0; padding: 0; width: 100%; height: 100%;position: absolute; top: 0; left: 0; z-index: 1"></canvas>;
            </div>        
        `;
			this.canvas = null;
			this.gl = null;
			this.vp_size = null;
			this.progDraw = null;
			this.bufObj = {};
			this.initScene();
		}

		async exit()
		{
			this.destroyScene();
			this.app.container.innerHTML = '';
		}

		destroyScene()
		{
			if ( this.RAF_ID )
			{
				cancelAnimationFrame( this.RAF_ID );
			}
			if ( !this.gl )
			{
				return;
			}

			if ( this.FRAG_ID )
			{
				this.gl.deleteShader( this.FRAG_ID );
			}

			if ( this.VERTEX_ID )
			{
				this.gl.deleteShader( this.VERTEX_ID );
			}

		}

		initScene()
		{
			this.canvas = document.getElementById( "ds" );
			this.gl = this.canvas.getContext( "experimental-webgl" );
			if ( !this.gl )
				return;

			this.progDraw = this.gl.createProgram();
			for ( let i = 0; i < 2; ++i )
			{
				let source = i == 0 ? DefaultBaseState.VERTEX_SHADER : DefaultBaseState.FRAGMENT_SHADER;
				let shaderObj = this.gl.createShader( i == 0 ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER );
				if ( i === 0 )
				{
					this.VERTEX_ID = shaderObj;
				}
				else
				{
					this.FRAG_ID = shaderObj;
				}
				this.gl.shaderSource( shaderObj, source );
				this.gl.compileShader( shaderObj );
				let status = this.gl.getShaderParameter( shaderObj, this.gl.COMPILE_STATUS );
				if ( !status ) { console.error( this.gl.getShaderInfoLog( shaderObj ) ); continue; }
				this.gl.attachShader( this.progDraw, shaderObj );
				this.gl.linkProgram( this.progDraw );
			}
			const status = this.gl.getProgramParameter( this.progDraw, this.gl.LINK_STATUS );
			//if ( !status ) alert( this.gl.getProgramInfoLog( this.progDraw ) );
			if ( !status ) { console.error( this.gl.getProgramInfoLog( this.progDraw ) ); return; }
			this.progDraw.inPos = this.gl.getAttribLocation( this.progDraw, "inPos" );
			this.progDraw.iTime = this.gl.getUniformLocation( this.progDraw, "iTime" );
			this.progDraw.iMouse = this.gl.getUniformLocation( this.progDraw, "iMouse" );
			this.progDraw.iResolution = this.gl.getUniformLocation( this.progDraw, "iResolution" );
			this.gl.useProgram( this.progDraw );

			let pos = [ -1, -1, 1, -1, 1, 1, -1, 1 ];
			let inx = [ 0, 1, 2, 0, 2, 3 ];
			this.bufObj.pos = this.gl.createBuffer();
			this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.bufObj.pos );
			this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( pos ), this.gl.STATIC_DRAW );
			this.bufObj.inx = this.gl.createBuffer();
			this.bufObj.inx.len = inx.length;
			this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.bufObj.inx );
			this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( inx ), this.gl.STATIC_DRAW );
			this.gl.enableVertexAttribArray( this.progDraw.inPos );
			this.gl.vertexAttribPointer( this.progDraw.inPos, 2, this.gl.FLOAT, false, 0, 0 );

			this.gl.enable( this.gl.DEPTH_TEST );
			this.gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

			window.onresize = this.resize.bind( this );
			this.resize();
			this.RAF_ID = requestAnimationFrame( this.render.bind( this ) );
		}

		resize() {
			//vp_size = [gl.drawingBufferWidth, gl.drawingBufferHeight];
			//this.vp_size = [window.innerWidth, window.innerHeight];
			this.vp_size = [512, 512];
			this.canvas.width = this.vp_size[0];
			this.canvas.height = this.vp_size[1];
		}

		render(deltaMS) {

			this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
			this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

			this.gl.uniform1f(this.progDraw.iTime, deltaMS/1000.0);
			this.gl.uniform2f(this.progDraw.iResolution, this.canvas.width, this.canvas.height);
			this.gl.drawElements( this.gl.TRIANGLES, this.bufObj.inx.len, this.gl.UNSIGNED_SHORT, 0 );

			this.RAF_ID = requestAnimationFrame(this.render.bind( this ));
		}

	}

	class DefaultIndexState extends DefaultBaseState
	{
		static ID = 'INFRONT_DEFAULT_INDEX_STATE';

		async enter()
		{
			await super.enter();
			this.app.container.querySelector( '#if-cover' ).insertAdjacentHTML(
				'beforeend',
				'<div style="position: absolute;top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 36%; min-width: 360px; display: inline-block"><?xml version="1.0" encoding="utf-8"?>\n                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 504.23 181.11" style="max-width: 100%; max-height: 100%"><path fill="#ffffff" d="M493.78,10.44V170.66H10.44V10.44H493.78m2-1.95H8.49V172.62H495.73V8.49Z"/><path fill="#ffffff" d="M242.48,97.68A12.92,12.92,0,1,0,229.57,84.8,12.94,12.94,0,0,0,242.48,97.68Z"/><path fill="#ffffff" d="M193.13,79.86a4.31,4.31,0,0,0,3.79-4c0-1.51-2-2.73-4.42-2.73h-3.68V79.9h3.71Z"/><path fill="#ffffff" d="M489.88,14.35H14.35V166.76H489.88V14.35ZM373.34,94.23a10.06,10.06,0,0,0,6.47,2.2h.27a11.26,11.26,0,0,0,11-11.19L391,57.49H374.55V43.05h33.38v1l.2,41.21a27.91,27.91,0,0,1-28,28.11h-.41A28.34,28.34,0,0,1,364,108.56l-2.82-2,8.77-15.29Zm-47.9-35.4h39.4V73.27h-12.5v38.88H337.93V73.27H325.44Zm-50.21-1.49h3.28L305,82.73V58h14.41v54.12h-3.24L289.61,86.71V111.4H275.23Zm-32.72.06a27.38,27.38,0,1,1-27.38,27.46A27.46,27.46,0,0,1,242.51,57.4ZM174.4,58.77h17.93c10.6,0,19.23,8.27,19.23,18.43a17.37,17.37,0,0,1-7.37,14.16l15.11,20.79H201.5l-12.45-17.9h-.23v17.9H174.41V58.77Zm-40.27,0h33V73.12H148.46l-.07,6.78h18.72V94.25H148.38l.16,17.9H134.13ZM82.77,57.34h3.28l26.49,25.39V58H127v54.12h-3.24L97.15,86.71V111.4H82.77ZM43.05,99h9.06V57.49H43.05V43.05H76.43V57.49H67.37V99h9.06v14.43H43.05Zm418.13,38.39H43.05V122.11H461.18Zm-5.87-29.58c-4.57,3.62-10.89,5.62-17.79,5.62-11,0-20.13-5.14-24.39-13.77l-1.41-2.85,13.49-9.65,2.06,3.6c2,3.55,5.8,5.58,10.36,5.58s8.25-1.87,8.25-4.18c0-3.1-7.6-6.38-12.63-8.54l-.19-.09c-6.91-3.07-17.3-7.69-17.3-19.83,0-11.76,10-20.63,23.3-20.63,10.14,0,18.05,5,21.15,13.29l1,2.73-13.15,9.09-1.86-4a7.58,7.58,0,0,0-7.08-4.23c-3.76,0-6.29,2.08-6.29,4,0,1.57,3.08,3,8.14,5.08l2.6,1.09c8.46,3.72,17.41,8.49,19.07,18.47v6.82A19.79,19.79,0,0,1,455.31,107.79Z"/></svg></div>'
			);
		}
	}

	/**
	 * States - The state manager.
	 * You can create multiple States instances in your application logic, e.g. for dealing with sub-states etc.
	 */
	class StateManager
	{
		static DEFAULT_INDEX_STATE_ID = 'INFRONT_DEFAULT_INDEX_STATE';
		static DEFAULT_NOT_FOUND_STATE_ID = 'INFRONT_DEFAULT_NOTFOUND_STATE';

		/**
		 * Constructor
		 * @param {App} appInstance - Instance of app
		 */
		constructor( appInstance )
		{
			this.app = appInstance;
			this._states =  {};
			this._currentState = null;
			this._stateNotFoundClass = this.app ? this.app.config.get( 'stateManager.notFoundState' ) : null;
		}

		set currentState( currentState )
		{
			this._currentState = currentState;
		}

		get currentState()
		{
			return this._currentState;
		}

		set stateNotFoundClass( stateNotFoundClass )
		{
			if ( false === Helper.isClass( notFoundClass ) )
			{
				throw new Error( 'States.setNotFoundClass expects a class/subclass of State.' );
			}

			this._stateNotFoundClass = stateNotFoundClass;
		}

		get stateNotFoundClass()
		{
			return this._stateNotFoundClass;
		}

		/**
		 * Add state class
		 *
		 * @param {...DefaultBaseState} stateClasses - State class to be added.
		 * @throws {Error}  - Throws an error when adding state is not possible
		 * @returns {boolean} - Returns wheter or not adding was successful
		 */
		add( ...stateClasses )
		{
			for( const stateClass of stateClasses )
			{
				if ( false === Helper.isClass( stateClass ) )
				{
					throw new Error( 'States.addState expects a class/subclass of State.' );
				}

				// Autogeneratre id in case it is not valid
				if ( false === Helper.isString( stateClass.ID ) )
				{
					console.warn( 'StateClass doesnt have a valid ID.' );
					stateClass.ID = Helper.createUid();
				}

				if ( true === this._states.hasOwnProperty( stateClass.ID ) )
				{
					console.warn( `StateClass not added. ID ${stateClass.ID} already exists.` );
					return false;
				}

				this._states[ stateClass.ID ] = stateClass;

				if ( Helper.isString( stateClass.ROUTE ) )
				{
					this.app.router.addRoute( stateClass.ROUTE, stateClass );
				}
				else if ( Helper.isArray( stateClass.ROUTE ) )
				{
					for ( let route of stateClass.ROUTE )
					{
						this.app.router.addRoute( route, stateClass );
					}
				}
			}
		}

		/**
		 * Create an instance of given state id
		 *
		 * @param {string} stateId - The state id to be instantiated
		 * @param {RouteParams} routeParams - Current RouteParams
		 * @returns {null}
		 */
		create( stateId, routeParams )
		{
			let stateInstance = null;

			if ( this._states.hasOwnProperty( stateId ) )
			{
				stateInstance = new this._states[ stateId ]( this.app, routeParams );
			}
			else if ( null !== this.stateNotFoundClass )
			{
				stateInstance = new this.stateNotFoundClass( this.app, routeParams );
			}
			else
			{
				console.error( `State ${stateId} does not exist.` );
			}

			return stateInstance;
		}

		/**
		 * Checks if given stateId already exists.
		 *
		 * @param {string} stateId
		 * @return {boolean}
		 */
		exists( stateId )
		{
			return this._states.hasOwnProperty( stateId );
		}

		/**
		 * Switch to given state
		 * @param {DefaultBaseState} newState - Instance of state to switch to
		 * @throws {Error} - Throws an error if given state cannot be entered or if enter() function throws an error.
		 * @returns {Promise<boolean>}
		 */
		async switchTo( newState )
		{
			let previousStateId = null;
			let currentStateId = this.currentState ? this.currentState.getId() : null;

			this.app.dispatchCustomEvent(
				CustomEvents.TYPE.BEFORE_STATE_CHANGE,
				{
					currentStateId: currentStateId,
					nextStateId : newState ? newState.getId() : null
				}
			);

			if ( false === newState.canEnter() )
			{
				const redirectUrl = newState.getRedirectUrl();
				if ( redirectUrl )
				{
					this.app.router.redirect( redirectUrl );
					return false;
				}

				throw Error( 'Forbidden to enter new state:' + newState.getId() );
			}

			if ( this.currentState )
			{
				previousStateId = this.currentState.getId();
				await this.currentState.exit();
				delete this.currentState;
			}

			this.currentState = newState;
			await newState.enter();
			currentStateId = this.currentState.getId();

			this.app.dispatchCustomEvent(
				CustomEvents.TYPE.AFTER_STATE_CHANGE,
				{
					previousStateId : previousStateId,
					currentStateId: currentStateId
				}
			);
		}

	}

	/**
	 * Events
	 * Super simple custom events
	 *
	 * @example
	 * class MyClass {
	 *   constructor() {
	 *       this.events = new CustomEvents( this  );
	 *   }
	 *   start() {
	 *       this.dispatchCustomEvent( "start", { detail: { ... } } );
	 *   }
	 * }
	 *
	 * const myInstance = new MyClass();
	 * myInstance.addEventListener( "start", e => { ... } );
	 *
	 */
	class CustomEvents
	{
		static get TYPE() {
			return {
				'READY' : 'ready',
				'POPSTATE' : 'popstate',
				'BEFORE_STATE_CHANGE' : 'beforeStateChange',
				'AFTER_STATE_CHANGE' : 'afterStateChange',
				'BEFORE_LANGUAGE_SWITCH' : 'beforeLanguageSwitch',
				'AFTER_LANGUAGE_SWITCH' : 'afterLanguageSwitch',
				'ON_STATE_NOT_FOUND' : 'onStateNotFound'
			}
		};

		constructor()
		{
			const host = this;
			this.proxy = document.createDocumentFragment();
			this.proxy.host = this;

			["addEventListener", "dispatchEvent", "removeEventListener"].forEach(
				this.delegate,
				this
			);

			host.addCustomEventListener = ( eventName, func ) =>
			{
				host.addEventListener( eventName, func );
				return host;
			};

			host.removeCustomEventListener = ( eventName, func ) =>
			{
				host.removeEventListener( eventName, func );
				return host;
			};

			host.dispatchCustomEvent = ( eventName, optionsDetail = null ) =>
			{
				host.dispatchEvent(
					new CustomEvent(
						eventName,
						{
							"detail": optionsDetail
						}
					)
				);
			};
		}

		delegate( method )
		{
			this.proxy.host[method] = this.proxy[method].bind(this.proxy);
		}
	}

	const UrlPattern = new UP();

	/**
	 * Router for handling routing events (ie. changes of the URL) and resolving and triggering corresponding states.
	 */
	class Router
	{
		/**
		 * Constructor
		 * @param {App} appInstance - Instance of app
		 */
		constructor( appInstance )
		{
			this.app = appInstance;

			this.mode = this.app.config.get( 'router.mode', 'url' );
			this.basePath = this.app.config.get( 'router.basePath', null );

			this._routeActions = [];
			this.isEnabled = false;
			this.previousRoute = null;
			this.currentRoute = null;

			// Remove any index.html, index.php etc from url
			// Note: the query string (ie. window.location.search) gets also elimated here.
			const lastPathPart = window.location.href.split( "/" ).pop();
			if ( lastPathPart && lastPathPart.split( "." ).length > 1 )
			{
				let cleanPath = window.location.href.replace( lastPathPart, '' );
				cleanPath = cleanPath.replace( window.location.origin, '' );
				cleanPath = Helper.trim( cleanPath, '/' );
				if ( cleanPath.length > 0 )
				{
					window.history.replaceState( null, null, `/${cleanPath}/` );
				}
			}

			if ( null === this.basePath )
			{
				// Try "best guess"
				this.basePath = "";
			}
			this.basePath = Helper.trim( this.basePath, '/' );
		}

		/**
		 * Adds route and action
		 *
		 * @param {string} route - Route pattern
		 * @param {State} stateClass - State class which belongs to route pattern
		 */
		addRoute( route, stateClass )
		{
			let sRoute = Helper.trim( route, '/' );
			sRoute = '/' + sRoute;

			if ( true === Helper.isClass( stateClass ) )
			{
				if ( false === this.app.stateManager.exists( stateClass.ID ) )
				{
					this.app.stateManager.add( stateClass );
				}

				this._routeActions.push(
					{
						"action" : stateClass.ID,
						"route" : new UrlPattern( sRoute )
					}
				);
			}
			// else: check if object and if object has an enter and exit method
			else
			{
				throw new Error( 'Invalid action.' );
			}
		}

		resolveActionDataByRoute( route )
		{
			let routeData = null,
				params = {},
				query = {},
				routeSplits = route.split( "?" );

			route = routeSplits[ 0 ];
			if ( routeSplits.length > 1 )
			{
				let sp = new URLSearchParams( routeSplits[ 1 ] );
				query = Object.fromEntries( sp.entries() );
			}

			for (let si = 0; si < this._routeActions.length; si++ )
			{
				params = this._routeActions[ si ].route.match( route );
				if ( params )
				{
					routeData = {
						"routeAction" : this._routeActions[ si ].action,
						"routeParams" : new RouteParams( params, query )
					};
					break;
				}
			}

			// If it is default route
			if ( null === routeData )
			{
				this.app.dispatchCustomEvent(
					CustomEvents.TYPE.ON_STATE_NOT_FOUND,
					{
						route: route
					}
				);

				if ( null !== this.app.stateManager.stateNotFoundClass )
				{
					routeData = {
						"routeAction" : this.app.stateManager.stateNotFoundClass.ID,
						"routeParams" : null
					};
				}
			}

			return routeData;
		}

		createUrl( str )
		{
			if ( this.mode === 'hash' )
			{
				return '#/' + Helper.trim( str, '/' );
			}
			else if ( 'url' === this.mode )
			{
				return window.location.origin + '/' + this.basePath + '/' + Helper.trim( str, '/' );
			}
		}

		startsWithHash(string)
		{
			const regEx = /^#/;
			const startsWithHash = regEx.test(string);
			return Boolean(startsWithHash);
		}

		/**
		 * Enables router logic
		 */
		enable()
		{
			if ( true === this.isEnabled )
			{
				return;
			}
			this.isEnabled = true;

			if ( this.mode === 'url' )
			{
				this.app.container.addEventListener( 'click', this.processUrl.bind( this ), false);
				// Fix to properly handle backbutton
				window.addEventListener( 'popstate', ( e ) =>
				{
					this.app.dispatchCustomEvent(
						CustomEvents.TYPE.POPSTATE,
						{
							originalEvent : e
						}
					);
					this.processUrl();
				});
			}
			else if ( this.mode === 'hash' )
			{
				window.addEventListener( 'hashchange', this.processHash.bind( this ) );
			}
			else
			{
				console.erorr( `Invalid mode: ${mode} detected` );
			}
		}

		/**
		 * Disables router logic
		 */
		disable()
		{
			this.isEnabled = false;
			if ( this.mode === 'url' )
			{
				document.removeEventListener( 'click', this.processUrl.bind( this ) );
			}
			else if ( this.mode === 'hash' )
			{
				window.removeEventListener( 'hashchange', this.processHash.bind( this ) );
			}
		}

		/**
		 * @private
		 */
		process()
		{
			if ( this.mode === 'url' )
			{
				this.processUrl();
			}
			else if ( this.mode === 'hash' )
			{
				this.processHash();
			}
		}

		processHash()
		{
			const hash = location.hash || '#';
			let route = hash.slice(1);

			// always start with a leading slash
			route = '/' + Helper.trim( route, '/' );

			this.previousRoute = this.currentRoute;
			this.currentRoute = route;
			this.execute(  this.resolveActionDataByRoute( route ) );
		}

		processUrl( event = null )
		{
			let url = window.location.href;

			if ( event )
			{
				const target = event.target.closest('a');

				// we are interested only in anchor tag clicks
				if ( !target || target.hostname !== location.hostname ) {
					return;
				}

				event.preventDefault();

				url = target.getAttribute('href');
			}

			// we don't care about example.com#hash or
			// example.com/#hash links
			if (this.startsWithHash(url)) {
				return;
			}

			let route = url.replace( window.location.origin + '/' + Helper.trim( this.basePath, '/' ), '' );
			route = '/' + Helper.trim( route, '/' );

			this.previousRoute = this.currentRoute;
			this.currentRoute = route;

			const actionData = this.resolveActionDataByRoute( route );
			if ( actionData )
			{
				window.history.pushState( null, null, url );
			}
			this.execute( actionData );
		}

		redirect( url, forceReload = false )
		{
			if ( 'hash' === this.mode )
			{
				location.hash = '/' + Helper.trim( url, '/' );
				if ( true === forceReload )
				{
					this.processHash();
				}
			}
			else if ( 'url' === this.mode )
			{
				if ( true === forceReload )
				{
					window.history.pushState( null, null, url );
				}
				else
				{
					window.history.replaceState( null, null, url );
					this.processUrl();
				}
			}
		}

		/**
		 * Update browser URL without triggering the processing
		 *
		 * @param {String} url - Sets the url part
		 */
		setUrl( url )
		{
			if ( 'hash' === this.mode )
			{
				location.hash = '/' + Helper.trim( url, '/' );

			}
			else if ( 'url' === this.mode )
			{
				window.history.replaceState( null, null, url );
			}
		}

		resolveRoute( route )
		{
			let r = Helper.trim( route, '/#' );
			r = Helper.trim( r, '#' );
			r = Helper.trim( r, '/' );

			return '/' + r;
		}

		async execute( actionData )
		{
			// Get view call
			try
			{
				if ( actionData && actionData.hasOwnProperty( 'routeAction' ) && actionData.hasOwnProperty( 'routeParams' ) )
				{
					let stateInstance = this.app.stateManager.create(
						actionData.routeAction,
						actionData.routeParams
					);
					await this.app.stateManager.switchTo( stateInstance );
				}
				else
				{
					console.error( 'No state found.' );
				}
			}
			catch( e )
			{
				console && console.error( e );
				// Uncatched error
			}
		}
	}


	// Generated by CoffeeScript 1.10.0

	function UP() {
		var slice = [].slice;
		var P, UrlPattern, astNodeContainsSegmentsForProvidedParams, astNodeToNames, astNodeToRegexString, baseAstNodeToRegexString, concatMap, defaultOptions, escapeForRegex, getParam, keysAndValuesToObject, newParser, regexGroupCount, stringConcatMap, stringify;
		escapeForRegex = function(string) {
			return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		};
		concatMap = function(array, f) {
			var i, length, results;
			results = [];
			i = -1;
			length = array.length;
			while (++i < length) {
				results = results.concat(f(array[i]));
			}
			return results;
		};
		stringConcatMap = function(array, f) {
			var i, length, result;
			result = '';
			i = -1;
			length = array.length;
			while (++i < length) {
				result += f(array[i]);
			}
			return result;
		};
		regexGroupCount = function(regex) {
			return (new RegExp(regex.toString() + '|')).exec('').length - 1;
		};
		keysAndValuesToObject = function(keys, values) {
			var i, key, length, object, value;
			object = {};
			i = -1;
			length = keys.length;
			while (++i < length) {
				key = keys[i];
				value = values[i];
				if (value == null) {
					continue;
				}
				if (object[key] != null) {
					if (!Array.isArray(object[key])) {
						object[key] = [object[key]];
					}
					object[key].push(value);
				} else {
					object[key] = value;
				}
			}
			return object;
		};
		P = {};
		P.Result = function(value, rest) {
			this.value = value;
			this.rest = rest;
		};
		P.Tagged = function(tag, value) {
			this.tag = tag;
			this.value = value;
		};
		P.tag = function(tag, parser) {
			return function(input) {
				var result, tagged;
				result = parser(input);
				if (result == null) {
					return;
				}
				tagged = new P.Tagged(tag, result.value);
				return new P.Result(tagged, result.rest);
			};
		};
		P.regex = function(regex) {
			return function(input) {
				var matches, result;
				matches = regex.exec(input);
				if (matches == null) {
					return;
				}
				result = matches[0];
				return new P.Result(result, input.slice(result.length));
			};
		};
		P.sequence = function() {
			var parsers;
			parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
			return function(input) {
				var i, length, parser, rest, result, values;
				i = -1;
				length = parsers.length;
				values = [];
				rest = input;
				while (++i < length) {
					parser = parsers[i];
					result = parser(rest);
					if (result == null) {
						return;
					}
					values.push(result.value);
					rest = result.rest;
				}
				return new P.Result(values, rest);
			};
		};
		P.pick = function() {
			var indexes, parsers;
			indexes = arguments[0], parsers = 2 <= arguments.length ? slice.call(arguments, 1) : [];
			return function(input) {
				var array, result;
				result = P.sequence.apply(P, parsers)(input);
				if (result == null) {
					return;
				}
				array = result.value;
				result.value = array[indexes];
				return result;
			};
		};
		P.string = function(string) {
			var length;
			length = string.length;
			return function(input) {
				if (input.slice(0, length) === string) {
					return new P.Result(string, input.slice(length));
				}
			};
		};
		P.lazy = function(fn) {
			var cached;
			cached = null;
			return function(input) {
				if (cached == null) {
					cached = fn();
				}
				return cached(input);
			};
		};
		P.baseMany = function(parser, end, stringResult, atLeastOneResultRequired, input) {
			var endResult, parserResult, rest, results;
			rest = input;
			results = stringResult ? '' : [];
			while (true) {
				if (end != null) {
					endResult = end(rest);
					if (endResult != null) {
						break;
					}
				}
				parserResult = parser(rest);
				if (parserResult == null) {
					break;
				}
				if (stringResult) {
					results += parserResult.value;
				} else {
					results.push(parserResult.value);
				}
				rest = parserResult.rest;
			}
			if (atLeastOneResultRequired && results.length === 0) {
				return;
			}
			return new P.Result(results, rest);
		};
		P.many1 = function(parser) {
			return function(input) {
				return P.baseMany(parser, null, false, true, input);
			};
		};
		P.concatMany1Till = function(parser, end) {
			return function(input) {
				return P.baseMany(parser, end, true, true, input);
			};
		};
		P.firstChoice = function() {
			var parsers;
			parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
			return function(input) {
				var i, length, parser, result;
				i = -1;
				length = parsers.length;
				while (++i < length) {
					parser = parsers[i];
					result = parser(input);
					if (result != null) {
						return result;
					}
				}
			};
		};
		newParser = function(options) {
			var U;
			U = {};
			U.wildcard = P.tag('wildcard', P.string(options.wildcardChar));
			U.optional = P.tag('optional', P.pick(1, P.string(options.optionalSegmentStartChar), P.lazy(function() {
				return U.pattern;
			}), P.string(options.optionalSegmentEndChar)));
			U.name = P.regex(new RegExp("^[" + options.segmentNameCharset + "]+"));
			U.named = P.tag('named', P.pick(1, P.string(options.segmentNameStartChar), P.lazy(function() {
				return U.name;
			})));
			U.escapedChar = P.pick(1, P.string(options.escapeChar), P.regex(/^./));
			U["static"] = P.tag('static', P.concatMany1Till(P.firstChoice(P.lazy(function() {
				return U.escapedChar;
			}), P.regex(/^./)), P.firstChoice(P.string(options.segmentNameStartChar), P.string(options.optionalSegmentStartChar), P.string(options.optionalSegmentEndChar), U.wildcard)));
			U.token = P.lazy(function() {
				return P.firstChoice(U.wildcard, U.optional, U.named, U["static"]);
			});
			U.pattern = P.many1(P.lazy(function() {
				return U.token;
			}));
			return U;
		};
		defaultOptions = {
			escapeChar: '\\',
			segmentNameStartChar: ':',
			segmentValueCharset: 'a-zA-Z0-9-_~ %',
			segmentNameCharset: 'a-zA-Z0-9',
			optionalSegmentStartChar: '(',
			optionalSegmentEndChar: ')',
			wildcardChar: '*'
		};
		baseAstNodeToRegexString = function(astNode, segmentValueCharset) {
			if (Array.isArray(astNode)) {
				return stringConcatMap(astNode, function(node) {
					return baseAstNodeToRegexString(node, segmentValueCharset);
				});
			}
			switch (astNode.tag) {
				case 'wildcard':
					return '(.*?)';
				case 'named':
					return "([" + segmentValueCharset + "]+)";
				case 'static':
					return escapeForRegex(astNode.value);
				case 'optional':
					return '(?:' + baseAstNodeToRegexString(astNode.value, segmentValueCharset) + ')?';
			}
		};
		astNodeToRegexString = function(astNode, segmentValueCharset) {
			if (segmentValueCharset == null) {
				segmentValueCharset = defaultOptions.segmentValueCharset;
			}
			return '^' + baseAstNodeToRegexString(astNode, segmentValueCharset) + '$';
		};
		astNodeToNames = function(astNode) {
			if (Array.isArray(astNode)) {
				return concatMap(astNode, astNodeToNames);
			}
			switch (astNode.tag) {
				case 'wildcard':
					return ['_'];
				case 'named':
					return [astNode.value];
				case 'static':
					return [];
				case 'optional':
					return astNodeToNames(astNode.value);
			}
		};
		getParam = function(params, key, nextIndexes, sideEffects) {
			var index, maxIndex, result, value;
			if (sideEffects == null) {
				sideEffects = false;
			}
			value = params[key];
			if (value == null) {
				if (sideEffects) {
					throw new Error("no values provided for key `" + key + "`");
				} else {
					return;
				}
			}
			index = nextIndexes[key] || 0;
			maxIndex = Array.isArray(value) ? value.length - 1 : 0;
			if (index > maxIndex) {
				if (sideEffects) {
					throw new Error("too few values provided for key `" + key + "`");
				} else {
					return;
				}
			}
			result = Array.isArray(value) ? value[index] : value;
			if (sideEffects) {
				nextIndexes[key] = index + 1;
			}
			return result;
		};
		astNodeContainsSegmentsForProvidedParams = function(astNode, params, nextIndexes) {
			var i, length;
			if (Array.isArray(astNode)) {
				i = -1;
				length = astNode.length;
				while (++i < length) {
					if (astNodeContainsSegmentsForProvidedParams(astNode[i], params, nextIndexes)) {
						return true;
					}
				}
				return false;
			}
			switch (astNode.tag) {
				case 'wildcard':
					return getParam(params, '_', nextIndexes, false) != null;
				case 'named':
					return getParam(params, astNode.value, nextIndexes, false) != null;
				case 'static':
					return false;
				case 'optional':
					return astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes);
			}
		};
		stringify = function(astNode, params, nextIndexes) {
			if (Array.isArray(astNode)) {
				return stringConcatMap(astNode, function(node) {
					return stringify(node, params, nextIndexes);
				});
			}
			switch (astNode.tag) {
				case 'wildcard':
					return getParam(params, '_', nextIndexes, true);
				case 'named':
					return getParam(params, astNode.value, nextIndexes, true);
				case 'static':
					return astNode.value;
				case 'optional':
					if (astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes)) {
						return stringify(astNode.value, params, nextIndexes);
					} else {
						return '';
					}
			}
		};
		UrlPattern = function(arg1, arg2) {
			var groupCount, options, parsed, parser, withoutWhitespace;
			if (arg1 instanceof UrlPattern) {
				this.isRegex = arg1.isRegex;
				this.regex = arg1.regex;
				this.ast = arg1.ast;
				this.names = arg1.names;
				return;
			}
			this.isRegex = arg1 instanceof RegExp;
			if (!(('string' === typeof arg1) || this.isRegex)) {
				throw new TypeError('argument must be a regex or a string');
			}
			if (this.isRegex) {
				this.regex = arg1;
				if (arg2 != null) {
					if (!Array.isArray(arg2)) {
						throw new Error('if first argument is a regex the second argument may be an array of group names but you provided something else');
					}
					groupCount = regexGroupCount(this.regex);
					if (arg2.length !== groupCount) {
						throw new Error("regex contains " + groupCount + " groups but array of group names contains " + arg2.length);
					}
					this.names = arg2;
				}
				return;
			}
			if (arg1 === '') {
				throw new Error('argument must not be the empty string');
			}
			withoutWhitespace = arg1.replace(/\s+/g, '');
			if (withoutWhitespace !== arg1) {
				throw new Error('argument must not contain whitespace');
			}
			options = {
				escapeChar: (arg2 != null ? arg2.escapeChar : void 0) || defaultOptions.escapeChar,
				segmentNameStartChar: (arg2 != null ? arg2.segmentNameStartChar : void 0) || defaultOptions.segmentNameStartChar,
				segmentNameCharset: (arg2 != null ? arg2.segmentNameCharset : void 0) || defaultOptions.segmentNameCharset,
				segmentValueCharset: (arg2 != null ? arg2.segmentValueCharset : void 0) || defaultOptions.segmentValueCharset,
				optionalSegmentStartChar: (arg2 != null ? arg2.optionalSegmentStartChar : void 0) || defaultOptions.optionalSegmentStartChar,
				optionalSegmentEndChar: (arg2 != null ? arg2.optionalSegmentEndChar : void 0) || defaultOptions.optionalSegmentEndChar,
				wildcardChar: (arg2 != null ? arg2.wildcardChar : void 0) || defaultOptions.wildcardChar
			};
			parser = newParser(options);
			parsed = parser.pattern(arg1);
			if (parsed == null) {
				throw new Error("couldn't parse pattern");
			}
			if (parsed.rest !== '') {
				throw new Error("could only partially parse pattern");
			}
			this.ast = parsed.value;
			this.regex = new RegExp(astNodeToRegexString(this.ast, options.segmentValueCharset));
			this.names = astNodeToNames(this.ast);
		};
		UrlPattern.prototype.match = function(url) {
			var groups, match;
			match = this.regex.exec(url);
			if (match == null) {
				return null;
			}
			groups = match.slice(1);
			if (this.names) {
				return keysAndValuesToObject(this.names, groups);
			} else {
				return groups;
			}
		};
		UrlPattern.prototype.stringify = function(params) {
			if (params == null) {
				params = {};
			}
			if (this.isRegex) {
				throw new Error("can't stringify patterns generated from a regex");
			}
			if (params !== Object(params)) {
				throw new Error("argument must be an object or undefined");
			}
			return stringify(this.ast, params, {});
		};
		UrlPattern.escapeForRegex = escapeForRegex;
		UrlPattern.concatMap = concatMap;
		UrlPattern.stringConcatMap = stringConcatMap;
		UrlPattern.regexGroupCount = regexGroupCount;
		UrlPattern.keysAndValuesToObject = keysAndValuesToObject;
		UrlPattern.P = P;
		UrlPattern.newParser = newParser;
		UrlPattern.defaultOptions = defaultOptions;
		UrlPattern.astNodeToRegexString = astNodeToRegexString;
		UrlPattern.astNodeToNames = astNodeToNames;
		UrlPattern.getParam = getParam;
		UrlPattern.astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams;
		UrlPattern.stringify = stringify;
		return UrlPattern;
	}

	/*
	 * EJS Embedded JavaScript templates
	 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *         http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	*/

	var regExpChars = /[|\\{}()[\]^$+*?.]/g;
	var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
	var hasOwn = function (obj, key) { return hasOwnProperty$1.apply(obj, [key]); };

	/**
	 * Escape characters reserved in regular expressions.
	 *
	 * If `string` is `undefined` or `null`, the empty string is returned.
	 *
	 * @param {String} string Input string
	 * @return {String} Escaped string
	 * @static
	 * @private
	 */
	const escapeRegExpChars = function (string) {
		// istanbul ignore if
		if (!string) {
			return '';
		}
		return String(string).replace(regExpChars, '\\$&');
	};

	var _ENCODE_HTML_RULES = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&#34;',
		"'": '&#39;'
	};
	var _MATCH_HTML = /[&<>'"]/g;

	function encode_char(c) {
		return _ENCODE_HTML_RULES[c] || c;
	}

	/**
	 * Stringified version of constants used by {@link module:utils.escapeXML}.
	 *
	 * It is used in the process of generating {@link ClientFunction}s.
	 *
	 * @readonly
	 * @type {String}
	 */

	var escapeFuncStr =
		'var _ENCODE_HTML_RULES = {\n'
		+ '      "&": "&amp;"\n'
		+ '    , "<": "&lt;"\n'
		+ '    , ">": "&gt;"\n'
		+ '    , \'"\': "&#34;"\n'
		+ '    , "\'": "&#39;"\n'
		+ '    }\n'
		+ '  , _MATCH_HTML = /[&<>\'"]/g;\n'
		+ 'function encode_char(c) {\n'
		+ '  return _ENCODE_HTML_RULES[c] || c;\n'
		+ '};\n';

	/**
	 * Escape characters reserved in XML.
	 *
	 * If `markup` is `undefined` or `null`, the empty string is returned.
	 *
	 * @implements {EscapeCallback}
	 * @param {String} markup Input string
	 * @return {String} Escaped string
	 * @static
	 * @private
	 */

	const escapeXML = function (markup) {
		return markup == undefined
			? ''
			: String(markup)
				.replace(_MATCH_HTML, encode_char);
	};
	escapeXML.toString = function () {
		return Function.prototype.toString.call(this) + ';\n' + escapeFuncStr;
	};

	/**
	 * Naive copy of properties from one object to another.
	 * Does not recurse into non-scalar properties
	 * Does not check to see if the property has a value before copying
	 *
	 * @param  {Object} to   Destination object
	 * @param  {Object} from Source object
	 * @return {Object}      Destination object
	 * @static
	 * @private
	 */
	const shallowCopy = function (to, from) {
		from = from || {};
		if ((to !== null) && (to !== undefined)) {
			for (var p in from) {
				if (!hasOwn(from, p)) {
					continue;
				}
				if (p === '__proto__' || p === 'constructor') {
					continue;
				}
				to[p] = from[p];
			}
		}
		return to;
	};

	/**
	 * Naive copy of a list of key names, from one object to another.
	 * Only copies property if it is actually defined
	 * Does not recurse into non-scalar properties
	 *
	 * @param  {Object} to   Destination object
	 * @param  {Object} from Source object
	 * @param  {Array} list List of properties to copy
	 * @return {Object}      Destination object
	 * @static
	 * @private
	 */
	const shallowCopyFromList = function (to, from, list) {
		list = list || [];
		from = from || {};
		if ((to !== null) && (to !== undefined)) {
			for (var i = 0; i < list.length; i++) {
				var p = list[i];
				if (typeof from[p] != 'undefined') {
					if (!hasOwn(from, p)) {
						continue;
					}
					if (p === '__proto__' || p === 'constructor') {
						continue;
					}
					to[p] = from[p];
				}
			}
		}
		return to;
	};

	/**
	 * Simple in-process cache implementation. Does not implement limits of any
	 * sort.
	 *
	 * @implements {Cache}
	 * @static
	 * @private
	 */
	const cache = {
		_data: {},
		set: function (key, val) {
			this._data[key] = val;
		},
		get: function (key) {
			return this._data[key];
		},
		remove: function (key) {
			delete this._data[key];
		},
		reset: function () {
			this._data = {};
		}
	};

	/**
	 * Returns a null-prototype object in runtimes that support it
	 *
	 * @return {Object} Object, prototype will be set to null where possible
	 * @static
	 * @private
	 */
	const createNullProtoObjWherePossible = (function () {
		if (typeof Object.create == 'function') {
			return function () {
				return Object.create(null);
			};
		}
		if (!({__proto__: null} instanceof Object)) {
			return function () {
				return {__proto__: null};
			};
		}
		// Not possible, just pass through
		return function () {
			return {};
		};
	})();

	/*
	 * EJS Embedded JavaScript templates
	 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *         http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 *
	*/

	const exports$1 = {};
	var fs = {};
	var path = {};
	//var utils = import

	var scopeOptionWarned = false;
	/** @type {string} */
	var _VERSION_STRING = 0;//require('../package.json').version;
	var _DEFAULT_OPEN_DELIMITER = '<';
	var _DEFAULT_CLOSE_DELIMITER = '>';
	var _DEFAULT_DELIMITER = '%';
	var _DEFAULT_LOCALS_NAME = 'locals';
	var _NAME = 'ejs';
	var _REGEX_STRING = '(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)';
	var _OPTS_PASSABLE_WITH_DATA = ['delimiter', 'scope', 'context', 'debug', 'compileDebug',
		'client', '_with', 'rmWhitespace', 'strict', 'filename', 'async'];
	// We don't allow 'cache' option to be passed in the data obj for
	// the normal `render` call, but this is where Express 2 & 3 put it
	// so we make an exception for `renderFile`
	var _OPTS_PASSABLE_WITH_DATA_EXPRESS = _OPTS_PASSABLE_WITH_DATA.concat('cache');
	var _BOM = /^\uFEFF/;
	var _JS_IDENTIFIER = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

	/**
	 * EJS template function cache. This can be a LRU object from lru-cache NPM
	 * module. By default, it is {@link module:utils.cache}, a simple in-process
	 * cache that grows continuously.
	 *
	 * @type {Cache}
	 */

	exports$1.cache = cache;

	/**
	 * Custom file loader. Useful for template preprocessing or restricting access
	 * to a certain part of the filesystem.
	 *
	 * @type {fileLoader}
	 */

	exports$1.fileLoader = fs.readFileSync;

	/**
	 * Name of the object containing the locals.
	 *
	 * This variable is overridden by {@link Options}`.localsName` if it is not
	 * `undefined`.
	 *
	 * @type {String}
	 * @public
	 */

	exports$1.localsName = _DEFAULT_LOCALS_NAME;

	/**
	 * Promise implementation -- defaults to the native implementation if available
	 * This is mostly just for testability
	 *
	 * @type {PromiseConstructorLike}
	 * @public
	 */

	exports$1.promiseImpl = (new Function('return this;'))().Promise;

	/**
	 * Get the path to the included file from the parent file path and the
	 * specified path.
	 *
	 * @param {String}  name     specified path
	 * @param {String}  filename parent file path
	 * @param {Boolean} [isDir=false] whether the parent file path is a directory
	 * @return {String}
	 */
	exports$1.resolveInclude = function(name, filename, isDir) {
		var dirname = path.dirname;
		var extname = path.extname;
		var resolve = path.resolve;
		var includePath = resolve(isDir ? filename : dirname(filename), name);
		var ext = extname(name);
		if (!ext) {
			includePath += '.ejs';
		}
		return includePath;
	};

	/**
	 * Try to resolve file path on multiple directories
	 *
	 * @param  {String}        name  specified path
	 * @param  {Array<String>} paths list of possible parent directory paths
	 * @return {String}
	 */
	function resolvePaths(name, paths) {
		var filePath;
		if (paths.some(function (v) {
			filePath = exports$1.resolveInclude(name, v, true);
			return fs.existsSync(filePath);
		})) {
			return filePath;
		}
	}

	/**
	 * Get the path to the included file by Options
	 *
	 * @param  {String}  path    specified path
	 * @param  {Options} options compilation options
	 * @return {String}
	 */
	function getIncludePath(path, options) {
		var includePath;
		var filePath;
		var views = options.views;
		var match = /^[A-Za-z]+:\\|^\//.exec(path);

		// Abs path
		if (match && match.length) {
			path = path.replace(/^\/*/, '');
			if (Array.isArray(options.root)) {
				includePath = resolvePaths(path, options.root);
			} else {
				includePath = exports$1.resolveInclude(path, options.root || '/', true);
			}
		}
		// Relative paths
		else {
			// Look relative to a passed filename first
			if (options.filename) {
				filePath = exports$1.resolveInclude(path, options.filename);
				if (fs.existsSync(filePath)) {
					includePath = filePath;
				}
			}
			// Then look in any views directories
			if (!includePath && Array.isArray(views)) {
				includePath = resolvePaths(path, views);
			}
			if (!includePath && typeof options.includer !== 'function') {
				throw new Error('Could not find the include file "' +
					options.escapeFunction(path) + '"');
			}
		}
		return includePath;
	}

	/**
	 * Get the template from a string or a file, either compiled on-the-fly or
	 * read from cache (if enabled), and cache the template if needed.
	 *
	 * If `template` is not set, the file specified in `options.filename` will be
	 * read.
	 *
	 * If `options.cache` is true, this function reads the file from
	 * `options.filename` so it must be set prior to calling this function.
	 *
	 * @memberof module:ejs-internal
	 * @param {Options} options   compilation options
	 * @param {String} [template] template source
	 * @return {(TemplateFunction|ClientFunction)}
	 * Depending on the value of `options.client`, either type might be returned.
	 * @static
	 */

	function handleCache(options, template) {
		var func;
		var filename = options.filename;
		var hasTemplate = arguments.length > 1;

		if (options.cache) {
			if (!filename) {
				throw new Error('cache option requires a filename');
			}
			func = exports$1.cache.get(filename);
			if (func) {
				return func;
			}
			if (!hasTemplate) {
				template = fileLoader(filename).toString().replace(_BOM, '');
			}
		}
		else if (!hasTemplate) {
			// istanbul ignore if: should not happen at all
			if (!filename) {
				throw new Error('Internal EJS error: no file name or template '
					+ 'provided');
			}
			template = fileLoader(filename).toString().replace(_BOM, '');
		}
		func = exports$1.compile(template, options);
		if (options.cache) {
			exports$1.cache.set(filename, func);
		}
		return func;
	}

	/**
	 * Try calling handleCache with the given options and data and call the
	 * callback with the result. If an error occurs, call the callback with
	 * the error. Used by renderFile().
	 *
	 * @memberof module:ejs-internal
	 * @param {Options} options    compilation options
	 * @param {Object} data        template data
	 * @param {RenderFileCallback} cb callback
	 * @static
	 */

	function tryHandleCache(options, data, cb) {
		var result;
		if (!cb) {
			if (typeof exports$1.promiseImpl == 'function') {
				return new exports$1.promiseImpl(function (resolve, reject) {
					try {
						result = handleCache(options)(data);
						resolve(result);
					}
					catch (err) {
						reject(err);
					}
				});
			}
			else {
				throw new Error('Please provide a callback function');
			}
		}
		else {
			try {
				result = handleCache(options)(data);
			}
			catch (err) {
				return cb(err);
			}

			cb(null, result);
		}
	}

	/**
	 * fileLoader is independent
	 *
	 * @param {String} filePath ejs file path.
	 * @return {String} The contents of the specified file.
	 * @static
	 */

	function fileLoader(filePath){
		return exports$1.fileLoader(filePath);
	}

	/**
	 * Get the template function.
	 *
	 * If `options.cache` is `true`, then the template is cached.
	 *
	 * @memberof module:ejs-internal
	 * @param {String}  path    path for the specified file
	 * @param {Options} options compilation options
	 * @return {(TemplateFunction|ClientFunction)}
	 * Depending on the value of `options.client`, either type might be returned
	 * @static
	 */

	function includeFile(path, options) {
		var opts = shallowCopy(createNullProtoObjWherePossible(), options);
		opts.filename = getIncludePath(path, opts);
		if (typeof options.includer === 'function') {
			var includerResult = options.includer(path, opts.filename);
			if (includerResult) {
				if (includerResult.filename) {
					opts.filename = includerResult.filename;
				}
				if (includerResult.template) {
					return handleCache(opts, includerResult.template);
				}
			}
		}
		return handleCache(opts);
	}

	/**
	 * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
	 * `lineno`.
	 *
	 * @implements {RethrowCallback}
	 * @memberof module:ejs-internal
	 * @param {Error}  err      Error object
	 * @param {String} str      EJS source
	 * @param {String} flnm     file name of the EJS file
	 * @param {Number} lineno   line number of the error
	 * @param {EscapeCallback} esc
	 * @static
	 */

	function rethrow(err, str, flnm, lineno, esc) {
		var lines = str.split('\n');
		var start = Math.max(lineno - 3, 0);
		var end = Math.min(lines.length, lineno + 3);
		var filename = esc(flnm);
		// Error context
		var context = lines.slice(start, end).map(function (line, i){
			var curr = i + start + 1;
			return (curr == lineno ? ' >> ' : '    ')
				+ curr
				+ '| '
				+ line;
		}).join('\n');

		// Alter exception message
		err.path = filename;
		err.message = (filename || 'ejs') + ':'
			+ lineno + '\n'
			+ context + '\n\n'
			+ err.message;

		throw err;
	}

	function stripSemi(str){
		return str.replace(/;(\s*$)/, '$1');
	}

	/**
	 * Compile the given `str` of ejs into a template function.
	 *
	 * @param {String}  template EJS template
	 *
	 * @param {Options} [opts] compilation options
	 *
	 * @return {(TemplateFunction|ClientFunction)}
	 * Depending on the value of `opts.client`, either type might be returned.
	 * Note that the return type of the function also depends on the value of `opts.async`.
	 * @public
	 */

	exports$1.compile = function compile(template, opts) {
		var templ;

		// v1 compat
		// 'scope' is 'context'
		// FIXME: Remove this in a future version
		if (opts && opts.scope) {
			if (!scopeOptionWarned){
				console.warn('`scope` option is deprecated and will be removed in EJS 3');
				scopeOptionWarned = true;
			}
			if (!opts.context) {
				opts.context = opts.scope;
			}
			delete opts.scope;
		}
		templ = new Template(template, opts);
		return templ.compile();
	};


	/**
	 * Render the given `template` of ejs.
	 *
	 * If you would like to include options but not data, you need to explicitly
	 * call this function with `data` being an empty object or `null`.
	 *
	 * @param {String}   template EJS template
	 * @param {Object}  [data={}] template data
	 * @param {Options} [opts={}] compilation and rendering options
	 * @return {(String|Promise<String>)}
	 * Return value type depends on `opts.async`.
	 * @public
	 */

	exports$1.render = function (template, d, o) {
		var data = d || createNullProtoObjWherePossible();
		var opts = o || createNullProtoObjWherePossible();

		// No options object -- if there are optiony names
		// in the data, copy them to options
		if (arguments.length == 2) {
			shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA);
		}

		return handleCache(opts, template)(data);
	};

	/**
	 * Render an EJS file at the given `path` and callback `cb(err, str)`.
	 *
	 * If you would like to include options but not data, you need to explicitly
	 * call this function with `data` being an empty object or `null`.
	 *
	 * @param {String}             path     path to the EJS file
	 * @param {Object}            [data={}] template data
	 * @param {Options}           [opts={}] compilation and rendering options
	 * @param {RenderFileCallback} cb callback
	 * @public
	 */

	exports$1.renderFile = function () {
		var args = Array.prototype.slice.call(arguments);
		var filename = args.shift();
		var cb;
		var opts = {filename: filename};
		var data;
		var viewOpts;

		// Do we have a callback?
		if (typeof arguments[arguments.length - 1] == 'function') {
			cb = args.pop();
		}
		// Do we have data/opts?
		if (args.length) {
			// Should always have data obj
			data = args.shift();
			// Normal passed opts (data obj + opts obj)
			if (args.length) {
				// Use shallowCopy so we don't pollute passed in opts obj with new vals
				shallowCopy(opts, args.pop());
			}
			// Special casing for Express (settings + opts-in-data)
			else {
				// Express 3 and 4
				if (data.settings) {
					// Pull a few things from known locations
					if (data.settings.views) {
						opts.views = data.settings.views;
					}
					if (data.settings['view cache']) {
						opts.cache = true;
					}
					// Undocumented after Express 2, but still usable, esp. for
					// items that are unsafe to be passed along with data, like `root`
					viewOpts = data.settings['view options'];
					if (viewOpts) {
						shallowCopy(opts, viewOpts);
					}
				}
				// Express 2 and lower, values set in app.locals, or people who just
				// want to pass options in their data. NOTE: These values will override
				// anything previously set in settings  or settings['view options']
				shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
			}
			opts.filename = filename;
		}
		else {
			data = createNullProtoObjWherePossible();
		}

		return tryHandleCache(opts, data, cb);
	};

	/**
	 * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
	 * @public
	 */

	/**
	 * EJS template class
	 * @public
	 */
	exports$1.Template = Template;

	exports$1.clearCache = function () {
		exports$1.cache.reset();
	};

	function Template(text, opts) {
		opts = opts || createNullProtoObjWherePossible();
		var options = createNullProtoObjWherePossible();
		this.templateText = text;
		/** @type {string | null} */
		this.mode = null;
		this.truncate = false;
		this.currentLine = 1;
		this.source = '';
		options.client = opts.client || false;
		options.escapeFunction = opts.escape || opts.escapeFunction || escapeXML;
		options.compileDebug = opts.compileDebug !== false;
		options.debug = !!opts.debug;
		options.filename = opts.filename;
		options.openDelimiter = opts.openDelimiter || exports$1.openDelimiter || _DEFAULT_OPEN_DELIMITER;
		options.closeDelimiter = opts.closeDelimiter || exports$1.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
		options.delimiter = opts.delimiter || exports$1.delimiter || _DEFAULT_DELIMITER;
		options.strict = opts.strict || false;
		options.context = opts.context;
		options.cache = opts.cache || false;
		options.rmWhitespace = opts.rmWhitespace;
		options.root = opts.root;
		options.includer = opts.includer;
		options.outputFunctionName = opts.outputFunctionName;
		options.localsName = opts.localsName || exports$1.localsName || _DEFAULT_LOCALS_NAME;
		options.views = opts.views;
		options.async = opts.async;
		options.destructuredLocals = opts.destructuredLocals;
		options.legacyInclude = typeof opts.legacyInclude != 'undefined' ? !!opts.legacyInclude : true;

		if (options.strict) {
			options._with = false;
		}
		else {
			options._with = typeof opts._with != 'undefined' ? opts._with : true;
		}

		this.opts = options;

		this.regex = this.createRegex();
	}

	Template.modes = {
		EVAL: 'eval',
		ESCAPED: 'escaped',
		RAW: 'raw',
		COMMENT: 'comment',
		LITERAL: 'literal'
	};

	Template.prototype = {
		createRegex: function () {
			var str = _REGEX_STRING;
			var delim = escapeRegExpChars(this.opts.delimiter);
			var open = escapeRegExpChars(this.opts.openDelimiter);
			var close = escapeRegExpChars(this.opts.closeDelimiter);
			str = str.replace(/%/g, delim)
				.replace(/</g, open)
				.replace(/>/g, close);
			return new RegExp(str);
		},

		compile: function () {
			/** @type {string} */
			var src;
			/** @type {ClientFunction} */
			var fn;
			var opts = this.opts;
			var prepended = '';
			var appended = '';
			/** @type {EscapeCallback} */
			var escapeFn = opts.escapeFunction;
			/** @type {FunctionConstructor} */
			var ctor;
			/** @type {string} */
			var sanitizedFilename = opts.filename ? JSON.stringify(opts.filename) : 'undefined';

			if (!this.source) {
				this.generateSource();
				prepended +=
					'  var __output = "";\n' +
					'  function __append(s) { if (s !== undefined && s !== null) __output += s }\n';
				if (opts.outputFunctionName) {
					if (!_JS_IDENTIFIER.test(opts.outputFunctionName)) {
						throw new Error('outputFunctionName is not a valid JS identifier.');
					}
					prepended += '  var ' + opts.outputFunctionName + ' = __append;' + '\n';
				}
				if (opts.localsName && !_JS_IDENTIFIER.test(opts.localsName)) {
					throw new Error('localsName is not a valid JS identifier.');
				}
				if (opts.destructuredLocals && opts.destructuredLocals.length) {
					var destructuring = '  var __locals = (' + opts.localsName + ' || {}),\n';
					for (var i = 0; i < opts.destructuredLocals.length; i++) {
						var name = opts.destructuredLocals[i];
						if (!_JS_IDENTIFIER.test(name)) {
							throw new Error('destructuredLocals[' + i + '] is not a valid JS identifier.');
						}
						if (i > 0) {
							destructuring += ',\n  ';
						}
						destructuring += name + ' = __locals.' + name;
					}
					prepended += destructuring + ';\n';
				}
				if (opts._with !== false) {
					prepended +=  '  with (' + opts.localsName + ' || {}) {' + '\n';
					appended += '  }' + '\n';
				}
				appended += '  return __output;' + '\n';
				this.source = prepended + this.source + appended;
			}

			if (opts.compileDebug) {
				src = 'var __line = 1' + '\n'
					+ '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
					+ '  , __filename = ' + sanitizedFilename + ';' + '\n'
					+ 'try {' + '\n'
					+ this.source
					+ '} catch (e) {' + '\n'
					+ '  rethrow(e, __lines, __filename, __line, escapeFn);' + '\n'
					+ '}' + '\n';
			}
			else {
				src = this.source;
			}

			if (opts.client) {
				src = 'escapeFn = escapeFn || ' + escapeFn.toString() + ';' + '\n' + src;
				if (opts.compileDebug) {
					src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
				}
			}

			if (opts.strict) {
				src = '"use strict";\n' + src;
			}
			if (opts.debug) {
				console.log(src);
			}
			if (opts.compileDebug && opts.filename) {
				src = src + '\n'
					+ '//# sourceURL=' + sanitizedFilename + '\n';
			}

			try {
				if (opts.async) {
					// Have to use generated function for this, since in envs without support,
					// it breaks in parsing
					try {
						ctor = (new Function('return (async function(){}).constructor;'))();
					}
					catch(e) {
						if (e instanceof SyntaxError) {
							throw new Error('This environment does not support async/await');
						}
						else {
							throw e;
						}
					}
				}
				else {
					ctor = Function;
				}
				fn = new ctor(opts.localsName + ', escapeFn, include, rethrow', src);
			}
			catch(e) {
				// istanbul ignore else
				if (e instanceof SyntaxError) {
					if (opts.filename) {
						e.message += ' in ' + opts.filename;
					}
					e.message += ' while compiling ejs\n\n';
					e.message += 'If the above error is not helpful, you may want to try EJS-Lint:\n';
					e.message += 'https://github.com/RyanZim/EJS-Lint';
					if (!opts.async) {
						e.message += '\n';
						e.message += 'Or, if you meant to create an async function, pass `async: true` as an option.';
					}
				}
				throw e;
			}

			// Return a callable function which will execute the function
			// created by the source-code, with the passed data as locals
			// Adds a local `include` function which allows full recursive include
			var returnedFn = opts.client ? fn : function anonymous(data) {
				var include = function (path, includeData) {
					var d = shallowCopy(createNullProtoObjWherePossible(), data);
					if (includeData) {
						d = shallowCopy(d, includeData);
					}
					return includeFile(path, opts)(d);
				};
				return fn.apply(opts.context,
					[data || createNullProtoObjWherePossible(), escapeFn, include, rethrow]);
			};
			if (opts.filename && typeof Object.defineProperty === 'function') {
				var filename = opts.filename;
				var basename = path.basename(filename, path.extname(filename));
				try {
					Object.defineProperty(returnedFn, 'name', {
						value: basename,
						writable: false,
						enumerable: false,
						configurable: true
					});
				} catch (e) {/* ignore */}
			}
			return returnedFn;
		},

		generateSource: function () {
			var opts = this.opts;

			if (opts.rmWhitespace) {
				// Have to use two separate replace here as `^` and `$` operators don't
				// work well with `\r` and empty lines don't work well with the `m` flag.
				this.templateText =
					this.templateText.replace(/[\r\n]+/g, '\n').replace(/^\s+|\s+$/gm, '');
			}

			// Slurp spaces and tabs before <%_ and after _%>
			this.templateText =
				this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');

			var self = this;
			var matches = this.parseTemplateText();
			var d = this.opts.delimiter;
			var o = this.opts.openDelimiter;
			var c = this.opts.closeDelimiter;

			if (matches && matches.length) {
				matches.forEach(function (line, index) {
					var closing;
					// If this is an opening tag, check for closing tags
					// FIXME: May end up with some false positives here
					// Better to store modes as k/v with openDelimiter + delimiter as key
					// Then this can simply check against the map
					if ( line.indexOf(o + d) === 0        // If it is a tag
						&& line.indexOf(o + d + d) !== 0) { // and is not escaped
						closing = matches[index + 2];
						if (!(closing == d + c || closing == '-' + d + c || closing == '_' + d + c)) {
							throw new Error('Could not find matching close tag for "' + line + '".');
						}
					}
					self.scanLine(line);
				});
			}

		},

		parseTemplateText: function () {
			var str = this.templateText;
			var pat = this.regex;
			var result = pat.exec(str);
			var arr = [];
			var firstPos;

			while (result) {
				firstPos = result.index;

				if (firstPos !== 0) {
					arr.push(str.substring(0, firstPos));
					str = str.slice(firstPos);
				}

				arr.push(result[0]);
				str = str.slice(result[0].length);
				result = pat.exec(str);
			}

			if (str) {
				arr.push(str);
			}

			return arr;
		},

		_addOutput: function (line) {
			if (this.truncate) {
				// Only replace single leading linebreak in the line after
				// -%> tag -- this is the single, trailing linebreak
				// after the tag that the truncation mode replaces
				// Handle Win / Unix / old Mac linebreaks -- do the \r\n
				// combo first in the regex-or
				line = line.replace(/^(?:\r\n|\r|\n)/, '');
				this.truncate = false;
			}
			if (!line) {
				return line;
			}

			// Preserve literal slashes
			line = line.replace(/\\/g, '\\\\');

			// Convert linebreaks
			line = line.replace(/\n/g, '\\n');
			line = line.replace(/\r/g, '\\r');

			// Escape double-quotes
			// - this will be the delimiter during execution
			line = line.replace(/"/g, '\\"');
			this.source += '    ; __append("' + line + '")' + '\n';
		},

		scanLine: function (line) {
			var self = this;
			var d = this.opts.delimiter;
			var o = this.opts.openDelimiter;
			var c = this.opts.closeDelimiter;
			var newLineCount = 0;

			newLineCount = (line.split('\n').length - 1);

			switch (line) {
				case o + d:
				case o + d + '_':
					this.mode = Template.modes.EVAL;
					break;
				case o + d + '=':
					this.mode = Template.modes.ESCAPED;
					break;
				case o + d + '-':
					this.mode = Template.modes.RAW;
					break;
				case o + d + '#':
					this.mode = Template.modes.COMMENT;
					break;
				case o + d + d:
					this.mode = Template.modes.LITERAL;
					this.source += '    ; __append("' + line.replace(o + d + d, o + d) + '")' + '\n';
					break;
				case d + d + c:
					this.mode = Template.modes.LITERAL;
					this.source += '    ; __append("' + line.replace(d + d + c, d + c) + '")' + '\n';
					break;
				case d + c:
				case '-' + d + c:
				case '_' + d + c:
					if (this.mode == Template.modes.LITERAL) {
						this._addOutput(line);
					}

					this.mode = null;
					this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
					break;
				default:
					// In script mode, depends on type of tag
					if (this.mode) {
						// If '//' is found without a line break, add a line break.
						switch (this.mode) {
							case Template.modes.EVAL:
							case Template.modes.ESCAPED:
							case Template.modes.RAW:
								if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
									line += '\n';
								}
						}
						switch (this.mode) {
							// Just executing code
							case Template.modes.EVAL:
								this.source += '    ; ' + line + '\n';
								break;
							// Exec, esc, and output
							case Template.modes.ESCAPED:
								this.source += '    ; __append(escapeFn(' + stripSemi(line) + '))' + '\n';
								break;
							// Exec and output
							case Template.modes.RAW:
								this.source += '    ; __append(' + stripSemi(line) + ')' + '\n';
								break;
							case Template.modes.COMMENT:
								// Do nothing
								break;
							// Literal <%% mode, append as raw output
							case Template.modes.LITERAL:
								this._addOutput(line);
								break;
						}
					}
					// In string mode, just add the output
					else {
						this._addOutput(line);
					}
			}

			if (self.opts.compileDebug && newLineCount) {
				this.currentLine += newLineCount;
				this.source += '    ; __line = ' + this.currentLine + '\n';
			}
		}
	};

	/**
	 * Escape characters reserved in XML.
	 *
	 * This is simply an export of {@link module:utils.escapeXML}.
	 *
	 * If `markup` is `undefined` or `null`, the empty string is returned.
	 *
	 * @param {String} markup Input string
	 * @return {String} Escaped string
	 * @public
	 * @func
	 * */
	exports$1.escapeXML = escapeXML;

	/**
	 * Express.js support.
	 *
	 * This is an alias for {@link module:ejs.renderFile}, in order to support
	 * Express.js out-of-the-box.
	 *
	 * @func
	 */

	exports$1.__express = exports$1.renderFile;

	/**
	 * Version of EJS.
	 *
	 * @readonly
	 * @type {String}
	 * @public
	 */

	exports$1.VERSION = _VERSION_STRING;

	/**
	 * Name for detection of EJS.
	 *
	 * @readonly
	 * @type {String}
	 * @public
	 */

	exports$1.name = _NAME;

	const compile = exports$1.compile;
	const render = exports$1.render;

	/**
	 * View
	 * Provides management and rendering of ejs templates including DOM diffing.
	 */
	class View
	{
		/**
		 * Constructor
		 * @param {App} appInstance - App reference
		 */
		constructor( appInstance )
		{
			this.app = appInstance;
			this.globalViewData = {};
		}

		/**
		 * Sets window title
		 * @param {string} title - Title to set
		 */
		setWindowTitle( title )
		{
			if ( window && window.document && window.document.title )
			{
				window.document.title = title;
			}
		}

		/**
		 * Compiles template with given options
		 * @param {string} template - EJS based template
		 * @param {object} opts - EJS template options. @see {@link https://ejs.co/#docs}
		 * @returns {*} - Compiled template function
		 */
		compile( template, opts )
		{
			return compile( template, opts );
		}

		/**
		 * Generate HTML from given template string and data
		 * @param tmpl
		 * @param data
		 * @param tmplOptions
		 * @returns {string} - Generated HTML
		 */
		getHtml( tmpl, data = {}, tmplOptions = null )
		{
			return render( tmpl, this.createData( data ), tmplOptions );
		}

		/**
		 * Renders template with given data to html container.
		 *
		 * @param {HTMLElement|null} container - Container in which template should be rendered.
		 * @param {string} tmpl - EJS template string
		 * @param {object=} [data={}] - Template data.
		 * @param {boolean} [forceRepaint=false] - If false, DOM diffing is enabled.
		 * @param {object=} [tmplOptions=null] - EJS template options. @see {@link https://ejs.co/#docs}
		 */
		render( container, tmpl, data = {}, forceRepaint = false, tmplOptions = null )
		{
			const html = this.getHtml( tmpl, data, tmplOptions );
			this.renderHtml( container, html );
		}

		/**
		 *
		 * @param {HTMLElement|null} container - Container in which template should be rendered.
		 * @param {string} html - HTML string to be rendered
		 */
		renderHtml( container, html )
		{
			if ( !container || false === ( container instanceof HTMLElement ) )
			{
				throw new Error( 'Invalid container. Given container must be an instance of an HTMLElement.' );
			}

			container.innerHTML = html;
		}

		createData( data = {} )
		{
			if ( data.hasOwnProperty( '_lcs' ) )
			{
				console.warn( '_lcs already exists in template data.' );
			}
			else
			{
				data[ '_lcs' ] = this.app.l18n.getLocale.bind( this.app.l18n );
			}

			if ( data.hasOwnProperty( '_lcn' ) )
			{
				console.warn( '_lcn already exists in template data.' );
			}
			else
			{
				data[ '_lcn' ] = this.app.l18n.getNumber.bind( this.app.l18n );        }

			if ( data.hasOwnProperty( '_lcd' ) )
			{
				console.warn( '_lcd already exists in template data.' );
			}
			else
			{
				data[ '_lcd' ] = this.app.l18n.getDateTime.bind( this.app.l18n );
			}

			const gvdKeys = Object.keys( this.globalViewData );
			for ( let gi = 0; gi < gvdKeys.length; gi++ )
			{
				if ( data.hasOwnProperty( gvdKeys[ gi ] ) )
				{
					console.warn( `The globalViewData entry ${gvdKeys[ gi ]} already exists in template data.` );
				}
				else
				{
					data[ gvdKeys[ gi ] ] = this.globalViewData[ gvdKeys[ gi ] ];
				}
			}

			return data;
		}
	}

	/**
	 * L18n
	 * Simple internationalization logic
	 */
	class L18n
	{
		static LANG_EN = 'en';

		// List of valid 2-chared-county-codes
		static COUNTRY_CODES = [
			"AD", "AE", "AF", "AG", "AI", "AL", "AM", "AN", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
			"BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
			"CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
			"DE", "DJ", "DK", "DM", "DO", "DZ",
			"EC", "EE", "EG", "EH", "EN", "ER", "ES", "ET",
			"FI", "FJ", "FK", "FM", "FO", "FR",
			"GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
			"HK", "HM", "HN", "HR", "HT", "HU",
			"ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
			"JE", "JM", "JO", "JP",
			"KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
			"LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
			"MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
			"NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
			"OM",
			"PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
			"QA",
			"RE", "RO", "RS", "RU", "RW",
			"SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
			"TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
			"UA", "UG", "UM", "US", "UY", "UZ",
			"VA", "VC", "VE", "VG", "VI", "VN", "VU",
			"WF", "WS", "YE", "YT",
			"ZA","ZM", "ZW" ];


		/**
		 * Constructor
		 * @param {App} appInstance - InfrontJS App reference
		 */
		constructor( appInstance )
		{
			this.app = appInstance;
			this.defaultLanguage = L18n.LANG_EN;
			let cl = this.resolveBrowserLanguage();
			if ( null === cl )
			{
				cl = this.defaultLanguage.toLowerCase();
			}

			this.dictionary = {};
			this.setCurrentLanguage( cl );
		}

		/**
		 * Resolve preferred browser language
		 * @returns {*|null|string}
		 */
		resolveBrowserLanguage()
		{
			// See: https://stackoverflow.com/questions/1043339/javascript-for-detecting-browser-language-preference/46514247#46514247
			var nav = typeof window !== "undefined" && window.navigator ? window.navigator : null,
				browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
				i,
				language,
				len,
				shortLanguage = null;

			if ( !nav )
			{
				return null;
			}

			// support for HTML 5.1 "navigator.languages"
			if (Array.isArray(nav.languages)) {
				for (i = 0; i < nav.languages.length; i++) {
					language = nav.languages[i];
					len = language.length;
					if (!shortLanguage && len) {
						shortLanguage = language;
					}
					if (language && len>2) {
						return language.slice( 0, 2).toLowerCase();
					}
				}
			}

			// support for other well known properties in browsers
			for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
				language = nav[browserLanguagePropertyKeys[i]];
				//skip this loop iteration if property is null/undefined.  IE11 fix.
				if (language == null) { continue; }
				len = language.length;
				if (!shortLanguage && len) {
					shortLanguage = language;
				}
				if (language && len > 2) {
					return language.slice( 0, 2).toLowerCase();
				}
			}

			return shortLanguage.toLowerCase();
		}

		/**
		 * Export localization functions to window scope.
		 */
		expose()
		{
			if ( typeof window !== "undefined" )
			{
				window[ '_lcs' ] = this.getLocale.bind( this );
				window[ '_lcn' ] = this.getNumber.bind( this );
				window[ '_lcd' ] = this.getDateTime.bind( this );
			}
		}

		/**
		 * Sets dictionary
		 * @param {object=}  [dict={ defaultLang : { "langCode" : "translation", ... }, ... } ] - Dictionary
		 */
		setDictionary( dict = {} )
		{
			this.dictionary = dict;
		}

		/**
		 *
		 * Add given translation object to dictionary
		 *
		 * @param {string} langCode - Langugae code (2 chars)
		 * @param {object} translationObject - The translation object, simple key-value object, e.g. { 'Hello' : 'Hallo' }
		 */
		addTranslation( langCode, translationObject )
		{
			if ( langCode && langCode.length > 2 )
			{
				langCode = langCode.slice( 0, 2);
			}

			if ( !langCode || false === this._isValidLangCode( langCode ) )
			{
				throw new Error( 'Invalid langCode: ' + langCode )
			}

			for ( const [ key, value ] of Object.entries( translationObject ) )
			{
				if ( false === this.dictionary.hasOwnProperty( key ) )
				{
					this.dictionary[ key ] = {};
				}
				this.dictionary[ key ][ langCode ] = value;
			}
		}

		/**
		 * Gets current translation by given key
		 * @param {string} key - Translation key
		 * @param {array=} [params=undefined] - Params array
		 * @returns {string}
		 */
		getLocale( key, params )
		{
			this.defaultLanguage;
			const language = this.currentLanguage,
				dictionary = this.dictionary;

			let langEntry = null;

			if ( dictionary.hasOwnProperty( key ) && dictionary[ key ].hasOwnProperty( language ) && typeof dictionary[ key ][ language ] === 'string' )
			{
				langEntry = dictionary[ key ][ language ];
			}
			else
			{
				langEntry = key;
			}

			return langEntry.replace(/{(\d+)}/g, function(match, number)
			{
				return typeof params[number] != 'undefined'
					? params[number]
					: match
					;
			});
		}

		/**
		 * Get formatted number
		 *
		 * @param {Date} num - Number to format
		 * @param {Object=} [opts=null] - NumberFormat options used if set. @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat|NumberFormat}
		 * @returns {string}
		 */
		getNumber( num = 0, opts = null )
		{
			if ( opts )
			{
				return Intl.NumberFormat( this.currentLanguage, opts ).format( num );
			}
			else
			{
				return this._nf.format( num );
			}
		}

		/**
		 * Get formatted date time
		 *
		 * @param {Date} dt - Date object to format
		 * @param {Object=} [opts=null] - DateTimeFormat options used if set. @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat|DateTimeFormat}
		 * @returns {string}
		 */
		getDateTime( dt, opts = null )
		{
			if ( opts )
			{
				return Intl.DateTimeFormat( this.currentLanguage, opts ).format( dt );
			}
			else
			{
				return this._dtf.format( dt );
			}
		}


		/**
		 * Set current language
		 * @param {string} langCode - 2 chared language code
		 * @throws {Error} - Invalid language code
		 */
		setCurrentLanguage( langCode )
		{
			if ( langCode && langCode.length > 2 )
			{
				langCode = langCode.slice( 0, 2);
			}

			if ( !langCode || false === this._isValidLangCode( langCode ) )
			{
				throw new Error( 'Invalid langCode: ' + langCode )
			}

			if ( this.app )
			{
				this.app.dispatchCustomEvent(
					CustomEvents.TYPE.BEFORE_LANGUAGE_SWITCH,
					{
						currentLanguage: this.currentLanguage,
						newLanguage: langCode.toLowerCase()
					}
				);
			}

			const oldLanguage = this.currentLanguage;
			this.currentLanguage = langCode.toLowerCase();
			this._nf = new Intl.NumberFormat(
				this.currentLanguage,
				{
					minimumFractionDigits : 2,
					maximumFractionDigits : 2
				}
			);
			this._dtf = new Intl.DateTimeFormat( this.currentLanguage );

			if ( this.app )
			{
				this.app.dispatchCustomEvent(
					CustomEvents.TYPE.AFTER_LANGUAGE_SWITCH,
					{
						oldLanguage: oldLanguage,
						currentLanguage: this.currentLanguage
					}
				);
			}
		}

		/**
		 * Get current selected language
		 * @returns {string} - Returns 2 chared language code
		 */
		getCurrentLanguage()
		{
			return this.currentLanguage;
		}

		_isValidLangCode( langCode )
		{
			return -1 < L18n.COUNTRY_CODES.indexOf( langCode.toUpperCase() );
		}
	}

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */

	/** Used as the `TypeError` message for "Functions" methods. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/** `Object#toString` result references. */
	var funcTag = '[object Function]',
		genTag = '[object GeneratorFunction]',
		symbolTag = '[object Symbol]';

	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
		reIsPlainProp = /^\w*$/,
		reLeadingDot = /^\./,
		rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
		return object == null ? undefined : object[key];
	}

	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */
	function isHostObject(value) {
		// Many host objects are `Object` objects that can coerce to strings
		// despite having improperly defined `toString` methods.
		var result = false;
		if (value != null && typeof value.toString != 'function') {
			try {
				result = !!(value + '');
			} catch (e) {}
		}
		return result;
	}

	/** Used for built-in method references. */
	var arrayProto = Array.prototype,
		funcProto = Function.prototype,
		objectProto = Object.prototype;

	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
		var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
		return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
		funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
			.replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/** Built-in value references. */
	var Symbol = root.Symbol,
		splice = arrayProto.splice;

	/* Built-in method references that are verified to be native. */
	var Map = getNative(root, 'Map'),
		nativeCreate = getNative(Object, 'create');

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
		symbolToString = symbolProto ? symbolProto.toString : undefined;

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
		var index = -1,
			length = entries ? entries.length : 0;

		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
		this.__data__ = nativeCreate ? nativeCreate(null) : {};
	}

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
		return this.has(key) && delete this.__data__[key];
	}

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
		var data = this.__data__;
		if (nativeCreate) {
			var result = data[key];
			return result === HASH_UNDEFINED ? undefined : result;
		}
		return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
		var data = this.__data__;
		return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
	}

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
		var data = this.__data__;
		data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
		return this;
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
		var index = -1,
			length = entries ? entries.length : 0;

		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
		this.__data__ = [];
	}

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
		var data = this.__data__,
			index = assocIndexOf(data, key);

		if (index < 0) {
			return false;
		}
		var lastIndex = data.length - 1;
		if (index == lastIndex) {
			data.pop();
		} else {
			splice.call(data, index, 1);
		}
		return true;
	}

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
		var data = this.__data__,
			index = assocIndexOf(data, key);

		return index < 0 ? undefined : data[index][1];
	}

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
		return assocIndexOf(this.__data__, key) > -1;
	}

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
		var data = this.__data__,
			index = assocIndexOf(data, key);

		if (index < 0) {
			data.push([key, value]);
		} else {
			data[index][1] = value;
		}
		return this;
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
		var index = -1,
			length = entries ? entries.length : 0;

		this.clear();
		while (++index < length) {
			var entry = entries[index];
			this.set(entry[0], entry[1]);
		}
	}

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
		this.__data__ = {
			'hash': new Hash,
			'map': new (Map || ListCache),
			'string': new Hash
		};
	}

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
		return getMapData(this, key)['delete'](key);
	}

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
		return getMapData(this, key).get(key);
	}

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
		return getMapData(this, key).has(key);
	}

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
		getMapData(this, key).set(key, value);
		return this;
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
		var length = array.length;
		while (length--) {
			if (eq(array[length][0], key)) {
				return length;
			}
		}
		return -1;
	}

	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
		path = isKey(path, object) ? [path] : castPath(path);

		var index = 0,
			length = path.length;

		while (object != null && index < length) {
			object = object[toKey(path[index++])];
		}
		return (index && index == length) ? object : undefined;
	}

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
		if (!isObject(value) || isMasked(value)) {
			return false;
		}
		var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
		return pattern.test(toSource(value));
	}

	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
		// Exit early for strings to avoid a performance hit in some environments.
		if (typeof value == 'string') {
			return value;
		}
		if (isSymbol(value)) {
			return symbolToString ? symbolToString.call(value) : '';
		}
		var result = (value + '');
		return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value) {
		return isArray(value) ? value : stringToPath(value);
	}

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
		var data = map.__data__;
		return isKeyable(key)
			? data[typeof key == 'string' ? 'string' : 'hash']
			: data.map;
	}

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
		var value = getValue(object, key);
		return baseIsNative(value) ? value : undefined;
	}

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
		if (isArray(value)) {
			return false;
		}
		var type = typeof value;
		if (type == 'number' || type == 'symbol' || type == 'boolean' ||
			value == null || isSymbol(value)) {
			return true;
		}
		return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
			(object != null && value in Object(object));
	}

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
		var type = typeof value;
		return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
			? (value !== '__proto__')
			: (value === null);
	}

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
		return !!maskSrcKey && (maskSrcKey in func);
	}

	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	var stringToPath = memoize(function(string) {
		string = toString(string);

		var result = [];
		if (reLeadingDot.test(string)) {
			result.push('');
		}
		string.replace(rePropName, function(match, number, quote, string) {
			result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
		});
		return result;
	});

	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
		if (typeof value == 'string' || isSymbol(value)) {
			return value;
		}
		var result = (value + '');
		return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to process.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
		if (func != null) {
			try {
				return funcToString.call(func);
			} catch (e) {}
			try {
				return (func + '');
			} catch (e) {}
		}
		return '';
	}

	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
		if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
			throw new TypeError(FUNC_ERROR_TEXT);
		}
		var memoized = function() {
			var args = arguments,
				key = resolver ? resolver.apply(this, args) : args[0],
				cache = memoized.cache;

			if (cache.has(key)) {
				return cache.get(key);
			}
			var result = func.apply(this, args);
			memoized.cache = cache.set(key, result);
			return result;
		};
		memoized.cache = new (memoize.Cache || MapCache);
		return memoized;
	}

	// Assign cache to `_.memoize`.
	memoize.Cache = MapCache;

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
		return value === other || (value !== value && other !== other);
	}

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
		// The use of `Object#toString` avoids issues with the `typeof` operator
		// in Safari 8-9 which returns 'object' for typed array and other constructors.
		var tag = isObject(value) ? objectToString.call(value) : '';
		return tag == funcTag || tag == genTag;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
		var type = typeof value;
		return !!value && (type == 'object' || type == 'function');
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
		return !!value && typeof value == 'object';
	}

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
		return typeof value == 'symbol' ||
			(isObjectLike(value) && objectToString.call(value) == symbolTag);
	}

	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
		return value == null ? '' : baseToString(value);
	}

	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
		var result = object == null ? undefined : baseGet(object, path);
		return result === undefined ? defaultValue : result;
	}


	// start: set

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue(object, key, value) {
		var objValue = object[key];
		if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
			(value === undefined && !(key in object))) {
			object[key] = value;
		}
	}

	/**
	 * The base implementation of `_.set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseSet(object, path, value, customizer) {
		if (!isObject(object)) {
			return object;
		}
		path = isKey(path, object) ? [path] : castPath(path);

		var index = -1,
			length = path.length,
			lastIndex = length - 1,
			nested = object;

		while (nested != null && ++index < length) {
			var key = toKey(path[index]),
				newValue = value;

			if (index != lastIndex) {
				var objValue = nested[key];
				newValue = customizer ? customizer(objValue, key, nested) : undefined;
				if (newValue === undefined) {
					newValue = isObject(objValue)
						? objValue
						: (isIndex(path[index + 1]) ? [] : {});
				}
			}
			assignValue(nested, key, newValue);
			nested = nested[key];
		}
		return object;
	}

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
		length = length == null ? MAX_SAFE_INTEGER : length;
		return !!length &&
			(typeof value == 'number' || reIsUint.test(value)) &&
			(value > -1 && value % 1 == 0 && value < length);
	}

	// Assign cache to `_.memoize`.
	memoize.Cache = MapCache;

	/**
	 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	 * it's created. Arrays are created for missing index properties while objects
	 * are created for all other missing properties. Use `_.setWith` to customize
	 * `path` creation.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.set(object, 'a[0].b.c', 4);
	 * console.log(object.a[0].b.c);
	 * // => 4
	 *
	 * _.set(object, ['x', '0', 'y', 'z'], 5);
	 * console.log(object.x[0].y.z);
	 * // => 5
	 */
	function set(object, path, value) {
		return object == null ? object : baseSet(object, path, value);
	}

	/**
	 * PathObject
	 * Convenient way to work with JSON datastructures.
	 *
	 * @example
	 * const po = new PathObject(
	 *  {
	 *     "a" : "Hello",
	 *     "b" : {
	 *         "c" : "World"
	 *     }
	 *  }
	 * );
	 *
	 * po.get( "b.c" );
	 * // Returns "World"
	 * po.set( "b.c", "InfrontJS" );
	 * po.get( "b.c" );
	 * // Return "InfrontJS"
	 * po.get( "b.d", "what?" );
	 * // Returns "what?"
	 */
	class PathObject
	{
		/**
		 * Constructor
		 * @param {object=} [properties={}] - Initial literal
		 */
		constructor( properties = {} )
		{
			this._props = properties;
		}

		/**
		 * Taken from lodash.
		 * Refer to:
		 * https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L13126
		 *
		 * Gets the value at `path` of `object`. If the resolved value is
		 * `undefined`, the `defaultValue` is returned in its place.
		 *
		 * @param {Array|string} path The path of the property to get.
		 * @param {*} [defaultValue] The value returned for `undefined` resolved values. Default is null
		 * @returns {*} Returns the resolved value.
		 * @example
		 *
		 * const pathObject = new PathObject( { 'a': [{ 'b': { 'c': 3 } }] } );
		 *
		 * pathObject.get('a[0].b.c');
		 * // => 3
		 *
		 * pathObject.get(['a', '0', 'b', 'c']);
		 * // => 3
		 *
		 * pathObject.get('a.b.c', 'default');
		 * // => 'default'
		 */
		get( path, defaultValue = null )
		{
			return get( this._props, path, defaultValue );
		}

		/**
		 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
		 * it's created. Arrays are created for missing index properties while objects
		 * are created for all other missing properties. Use `_.setWith` to customize
		 * `path` creation.
		 *
		 * **Note:** This method mutates `object`.
		 *
		 * @static
		 * @memberOf _
		 * @since 3.7.0
		 * @category Object
		 * @param {Object} object The object to modify.
		 * @param {Array|string} path The path of the property to set.
		 * @param {*} value The value to set.
		 * @returns {Object} Returns `object`.
		 * @example
		 *
		 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
		 *
		 * _.set(object, 'a[0].b.c', 4);
		 * console.log(object.a[0].b.c);
		 * // => 4
		 *
		 * _.set(object, ['x', '0', 'y', 'z'], 5);
		 * console.log(object.x[0].y.z);
		 * // => 5
		 */
		set( path, value )
		{
			return set( this._props, path, value );
		}
	}

	const VERSION = '1.0.0';

	const DEFAULT_CONFIG = {
		"app" : {
			"id" : null,
			"title" : null,
			"sayHello" : true
		},
		"l18n" : {
			"defaultLanguage" : "en"
		},
		"router" : {
			"isEnabled" : true,
			"mode" : "url",
			"basePath" : null
		},
		"stateManager" : {
			"notFoundState" : DefaultIndexState
		}
	};

	/**
	 * App
	 * The App class is the logical core unit of every InfrontJS application.
	 */
	class App extends CustomEvents
	{
		static POOL = {};

		/**
		 *
		 * @param {string|null} uid - Get instance by given uid. If no uid is given, the first app from pool is returned.
		 * @returns {(App|null)}
		 */
		static get( uid = null )
		{
			if ( uid && App.POOL.hasOwnProperty( uid ) )
			{
				return App.POOL[ uid ];
			}
			else if ( null === uid &&  Object.keys( App.POOL ).length > 0 )
			{
				return App.POOL[ Object.keys( App.POOL )[ 0 ] ];
			}
			else
			{
				return null;
			}
		}

		/**
		 * Create an app instance
		 * @param {HTMLElement} [container=document.body] - The root container of the application.
		 * @param {object=} config - Application configuration object.
		 * @param {object=} config.app - App configuration.
		 * @param {string|null} [settings.app.title=null] - App's title, if set it will be set to the title header value.
		 * @param {string|null} [settings.app.id=null] - Unique id of app instance. If not set, it will be auto generated.
		 */
		constructor( container = null, config = {} )
		{
			super();

			this.container = container;

			this.config = new PathObject( Helper.deepMerge( DEFAULT_CONFIG, config ) );
			if ( null === this.config.get( 'app.id', null ) )
			{
				this.config.set( 'app.id', Helper.createUid() );
			}

			if ( typeof window === 'undefined'  )
			{
				throw new Error( 'InfrontJS works only in browser mode.' );
			}

			// If container property is a string, check if it is a querySelector
			if ( this.container !== null && false === this.container instanceof HTMLElement )
			{
				throw new Error( 'Invalid app container.' );
			}
			else if ( this.container === null )
			{
				const body = document.querySelector( 'body' );
				const customContainer = document.createElement( 'section' );
				body.appendChild( customContainer );
				this.container = customContainer;
			}

			this.container.setAttribute( 'data-ifjs-app-id', this.config.get( 'app.id') );

			// Init core components
			this.initRouter();
			this.initL18n();
			this.initStates();
			this.initView();

			// Add app to global app pool
			App.POOL[ this.uid ] = this;

			if ( true === this.config.get( 'app.sayHello' ) && console )
			{
				console && console.log( "%c»InfrontJS« Version " + VERSION, "font-family: monospace sans-serif; background-color: black; color: white;" );
			}

			this.dispatchCustomEvent( CustomEvents.TYPE.READY );
		}

		initL18n()
		{
			this.l18n = new L18n( this );

		}
		initStates()
		{
			this.stateManager = new StateManager( this );
		}

		initRouter()
		{
			this.router = new Router( this );
		}

		initView()
		{
			this.view = new View( this );
		}

		/**
		 * Get InfrontJS version
		 *
		 * @returns {string} - Version string
		 */
		getVersion()
		{
			return VERSION;
		}

		/**
		 * Run application logic. This activates the InfrontJS application logic.
		 * Note:
		 * This is an asynchronous function providing the possibility to e.g. loading assets etc.
		 *
		 * @param {string|null} [route=null] - If route is set, this route is set initially.
		 * @returns {Promise<void>}
		 */
		async run( route = null )
		{
			if ( this.config.get( 'app.title' ) )
			{
				this.view.setWindowTitle( this.config.get( 'app.title' ) );
			}

			this.router.enable();
			if ( route )
			{
				// @todo Fix this for "url" router mode
				this.router.redirect( route, ( this.router.resolveRoute( route ) === this.router.resolveRoute( location.hash ) ) );
			}
			else
			{
				this.router.process();
			}
		}

		/**
		 * Destorys InfrontJS application instance
		 * @returns {Promise<void>}
		 */
		async destroy()
		{
			// @todo Implement logic, set innerHTML to zero ... etc
		}
	}

	/**
	 * RestApi
	 * Utility class for REST Api development wraps native fetch internally.
	 *
	 * @example <caption>Using callbacks</caption>
	 * const myRestApi = new RestApi( 'https://api.example.com' );
	 * myRestApi.get( '/books', function( err, result ) { } );
	 *
	 * @example <caption>Using await</caption>
	 * const myRestApi = new RestApi( 'https://api.example.com' );
	 * try
	 * {
	 *     const result = await myRestApi.get( '/books' );
	 * }
	 * catch( e )
	 * {
	 *     // Handle error
	 * }
	 *
	 */
	class RestApi
	{
		/**
		 * Construcotr
		 * @param {string} url - Base url
		 * @param {Headers=} headers - Header data.
		 */
		constructor( url = '', headers = {} )
		{
			this.url = Helper.trim( url, '/' );
			if ( this.url.length <= 1 )
			{
				throw new Error( 'No endpoint set.' );
			}

			this.headers = new Headers( headers );
		}

		/**
		 * GET call
		 * @param {string} endpoint - API endpoint
		 * @param {function=} [cb=null] - Callback function
		 * @returns {Promise<any|undefined>}
		 */
		async get( endpoint, cb = null )
		{
			let r = Helper.trim( endpoint, "/" ),
				req = new Request( this.url + '/' + r, this._createFetchOptions( "GET" ) );

			return await this._fetch( req, cb );
		}

		/**
		 * POST call
		 * @param {string} endpoint - API endpoint
		 * @param {object=} [data={}] - Post data
		 * @param {function=} [cb=null] - Callback function
		 * @returns {Promise<any|undefined>}
		 */
		async post( endpoint, data = {}, cb = null )
		{
			let r = Helper.trim( endpoint, "/" ),
				req = new Request( this.url + '/' + r, this._createFetchOptions( "POST", data ) );
			return await this._fetch( req, cb );
		}

		/**
		 * DELETE call
		 * @param {string} endpoint - API endpoint
		 * @param {function=} [cb=null] - Callback function
		 * @returns {Promise<any|undefined>}
		 */
		async delete( endpoint, cb = null )
		{
			let r = Helper.trim( endpoint, "/" ),
				req = new Request( this.url + '/' + r,  this._createFetchOptions( "DELETE" ) );
			return await this._fetch( req, cb );
		}

		/**
		 * PUT call
		 * @param {string} endpoint - API endpoint
		 * @param {object=} [data={}] - PUT data
		 * @param {function=} [cb=null] - Callback function
		 * @returns {Promise<any|undefined>}
		 */
		async put( endpoint, data = {}, cb = null )
		{
			let r = Helper.trim( endpoint, "/" ),
				req = new Request( this.url + '/' + r, this._createFetchOptions( "PUT", data )  );
			return await this._fetch( req, cb );
		}

		/**
		 * PATCH call
		 * @param {string} endpoint - API endpoint
		 * @param {object=} [data={}] - Patch data
		 * @param {function=} [cb=null] - Callback function
		 * @returns {Promise<any|undefined>}
		 */
		async patch( endpoint, data = {}, cb = null )
		{
			let r = Helper.trim( endpoint, "/" ),
				req = new Request( this.url + '/' + r, this._createFetchOptions( "PATCH", data ) );
			return await this._fetch( req, cb );
		}

		async _fetch( req, cb = null )
		{
			if ( cb )
			{
				fetch( req )
					.then( response => response.json() )
					.then( json => cb( null, json ) )
					.catch( error => cb( error, null ) );
			}
			else
			{
				try
				{
					const response = await fetch( req );
					let json = null;
					try {
						json = await response.json();
					}
					catch ( jsonErr )
					{
						json = null;
					}
					return {
						status : response.status,
						json
					};
				}
				catch( err )
				{
					console.error( err );
					return null;
				}
			}
		}

		_createFetchOptions( method, data = null )
		{
			const opts = {
				"method" : method.toUpperCase(),
				"headers" : this.headers
			};
			if ( Helper.isPlainObject( data ) )
			{
				opts.body = JSON.stringify( data );
			}
			return opts;
		}
	}

	exports.App = App;
	exports.CustomEvents = CustomEvents;
	exports.Helper = Helper;
	exports.L18n = L18n;
	exports.PathObject = PathObject;
	exports.RestApi = RestApi;
	exports.RouteParams = RouteParams;
	exports.Router = Router;
	exports.State = State;
	exports.StateManager = StateManager;
	exports.View = View;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
