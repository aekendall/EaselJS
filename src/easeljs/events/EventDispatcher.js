/*
* EventDispatcher
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

// namespace:
this.createjs = this.createjs||{};

(function() {

/**
 * The EventDispatcher provides methods for managing prioritized queues of event listeners and dispatching events. All
 * {{#crossLink "DisplayObject"}}{{/crossLink}} classes dispatch events, as well as some of the utilities like {{#crossLink "Ticker"}}{{/crossLink}}.
 *
 * You can either extend this class or mix its methods into an existing prototype or instance by using the
 * EventDispatcher {{#crossLink "EventDispatcher/initialize"}}{{/crossLink}} method.
 *
 * <h4>Example</h4>
 * Add EventDispatcher capabilities to the "MyClass" class.
 *
 *      EventDispatcher.initialize(MyClass.prototype);
 *
 * Add an event (see {{#crossLink "EventDispatcher/addEventListener"}}{{/crossLink}}).
 *
 *      instance.addEventListener("eventName", handlerMethod);
 *      function handlerMethod(event) {
 *          console.log(event.target + " Was Clicked");
 *      }
 *
 * <b>Maintaining proper scope</b><br />
 * When using EventDispatcher in a class, you may need to use <code>Function.bind</code> or another approach to
 * maintain you method scope. Note that Function.bind is not supported in some older browsers.
 *
 *      instance.addEventListener("click", handleClick.bind(this));
 *      function handleClick(event) {
 *          console.log("Method called in scope: " + this);
 *      }
 *
 * Please note that currently, EventDispatcher does not support event priority or bubbling. Future versions may add
 * support for one or both of these features.
 *
 * @class EventDispatcher
 * @constructor
 **/
var EventDispatcher = function() {
  this.initialize();
};
var p = EventDispatcher.prototype;


	/**
	 * Static initializer to mix in EventDispatcher methods.
	 * @method initialize
	 * @static
	 * @param {Object} target The target object to inject EventDispatcher methods into. This can be an instance or a
	 * prototype.
	 **/
	EventDispatcher.initialize = function(target) {
		target.addEventListener = p.addEventListener;
		target.removeEventListener = p.removeEventListener;
		target.removeAllEventListeners = p.removeAllEventListeners;
		target.hasEventListener = p.hasEventListener;
		target.dispatchEvent = p.dispatchEvent;
	};

// private properties:
	/**
	 * @protected
	 * @property _listeners
	 * @type Object
	 **/
	p._listeners = null;

// constructor:
	/**
	 * Initialization method.
	 * @method initialize
	 * @protected
	 **/
	p.initialize = function() {};

// public methods:
	/**
	 * Adds the specified event listener for one or more events. Note that adding multiple listeners to the same
	 * function will result in multiple callbacks getting fired.
	 *
	 * <h4>Example</h4>
	 *
	 *      displayObject.addEventListener("click", handleClick);
	 *      function handleClick(event) {
	 *         // Click happened.
	 *      }
	 *
	 *      displayObject.addEventListener("click mouseup", handleClickOrMouseUp);
	 *      function handleClickOrMouseUp(event) {
	 *          // Click or mouseup happened.
	 *      }
	 *
	 * @method addEventListener
	 * @param {String} types One or more space-separated event types.
	 * @param {Function | Object} listener An object with a handleEvent method, or a function that will be called when
	 * the event(s) are dispatched.
	 * @return {Function | Object} Returns the listener for chaining or assignment.
	 **/
	p.addEventListener = function(types, listener) {
		var typesArr = types.split(" "), listeners = this._listeners;
		if (!listeners) { listeners = this._listeners = {}; }
		else { this.removeEventListener(types, listener); }
		for (var i=0,l=typesArr.length; i<l; i++) {
			var type = typesArr[i], arr = listeners[type];
			if (!arr) { arr = listeners[type] = []; }
			arr.push(listener);
		}
		return listener;
	};

	/**
	 * Removes the specified event listener for one or more events.
	 *
	 * <b>Important Note:</b> that you must pass the exact function reference used when the event was added. If a proxy
	 * function, or function closure is used as the callback, the proxy/closure reference must be used - a new proxy or
	 * closure will not work.
	 *
	 * <h4>Example</h4>
	 *
	 *      displayObject.removeEventListener("click", handleClick);
	 *      displayObject.removeEventListener("click mouseup", handleClickOrMouseUp);
	 *
	 * @method removeEventListener
	 * @param {String} types One or more space-separated event types.
	 * @param {Function | Object} listener The listener function or object.
	 **/
	p.removeEventListener = function(types, listener) {
		types = types.split(" ");
		var listeners = this._listeners;
		if (!listeners) { return; }
		for (var i=0,l=types.length; i<l; i++) {
			var type = types[i];
			var arr = listeners[type];
			if (!arr) { continue; }
			for (var j=0,len=arr.length; j<len; j++) {
				if (arr[j] == listener) {
					if (len==1) { delete(listeners[type]); } // allows for faster checks.
					else { arr.splice(j,1); }
					break;
				}
			}
		}
	};

	/**
	 * Removes all listeners for the specified type or types, or all listeners of all types.
	 *
	 * <h4>Example</h4>
	 *
	 *      // Remove all listeners
	 *      displayObject.removeAllEvenListeners();
	 *
	 *      // Remove all click listeners
	 *      displayObject.removeAllEventListeners("click");
	 *
	 *      // Remove all click and mouseup listeners
	 *      displayObject.removeAllEventListeners("click mouseup");
	 *
	 * @method removeAllEventListeners
	 * @param {String} [types] One or more space-separated event types. If omitted, all listeners for all types will be
	 * removed.
	 **/
	p.removeAllEventListeners = function(types) {
		var type, i = 0;
		if (!types) { this._listeners = null; }
		else if (this._listeners) {
			types = types.split(" ");
			for (var i=0,l=types.length; i<l; i++) { delete(this._listeners[types[i]]); }
		}
	};

	/**
	 * Dispatches the specified event to all listeners.
	 *
	 * <h4>Example</h4>
	 *
	 *      // Use a string event
	 *      this.dispatchEvent("complete");
	 *
	 *      // Use an object
	 *      var event = {
	 *          type: "complete",
	 *          foo: "bar"
	 *      };
	 *      this.dispatchEvent(event);
	 *
	 * @method dispatchEvent
	 * @param {Object | String} eventObj An object with a "type" property, or a string type. If a string is used,
	 * dispatchEvent will construct a generic event object with the specified type.
	 * @param {Object} [target] The object to use as the target property of the event object. This will default to the
	 * dispatching object.
	 * @return {Boolean} Returns true if any listener returned true.
	 **/
	p.dispatchEvent = function(eventObj, target) {
		var ret=false, listeners = this._listeners;
		if (eventObj && listeners) {
			if (typeof eventObj == "string") { eventObj = {type:eventObj}; }
			var arr = listeners[eventObj.type];
			if (!arr) { return ret; }
			eventObj.target = target||this;
			arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
			for (var i=0,l=arr.length; i<l; i++) {
				var o = arr[i];
				if (o.handleEvent) { ret = ret||o.handleEvent(eventObj); }
				else { ret = ret||o(eventObj); }
			}
		}
		return !!ret;
	};

	/**
	 * Indicates whether there is at least one listener for the specified event type.
	 * @method hasEventListener
	 * @param {String} type The string type of the event.
	 * @return {Boolean} Returns true if there is at least one listener for the specified event.
	 **/
	p.hasEventListener = function(type) {
		var listeners = this._listeners;
		return !!(listeners && listeners[type]);
	};

	/**
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
	p.toString = function() {
		return "[EventDispatcher]";
	};


createjs.EventDispatcher = EventDispatcher;
}());