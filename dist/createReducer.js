'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createReducer;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createReducer(initialState, handlers) {
  return function reducer() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
    var action = arguments[1];

    if (action && handlers.hasOwnProperty(action.type)) {
      var handler = handlers[action.type];

      if (!_lodash2.default.isArray(handler)) {
        handler = [handler];
      }

      return _lodash2.default.reduce(handler, function (state, handler) {
        return handler(state, action.payload, action);
      }, state);
    } else {
      return state;
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVSZWR1Y2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O2tCQUV3Qjs7QUFGeEI7Ozs7OztBQUVlLFNBQVMsYUFBVCxDQUF3QixZQUF4QixFQUFzQyxRQUF0QyxFQUFnRDtBQUM3RCxTQUFPLFNBQVMsT0FBVCxHQUFnRDtRQUE5Qiw4REFBUSw0QkFBc0I7UUFBUixzQkFBUTs7QUFDckQsUUFBSSxVQUFVLFNBQVMsY0FBVCxDQUF3QixPQUFPLElBQVAsQ0FBbEMsRUFBZ0Q7QUFDbEQsVUFBSSxVQUFVLFNBQVMsT0FBTyxJQUFQLENBQW5CLENBRDhDOztBQUdsRCxVQUFJLENBQUMsaUJBQUUsT0FBRixDQUFVLE9BQVYsQ0FBRCxFQUFxQjtBQUN2QixrQkFBVSxDQUFDLE9BQUQsQ0FBVixDQUR1QjtPQUF6Qjs7QUFJQSxhQUFPLGlCQUFFLE1BQUYsQ0FBUyxPQUFULEVBQWtCLFVBQUMsS0FBRCxFQUFRLE9BQVIsRUFBb0I7QUFDM0MsZUFBTyxRQUFRLEtBQVIsRUFBZSxPQUFPLE9BQVAsRUFBZ0IsTUFBL0IsQ0FBUCxDQUQyQztPQUFwQixFQUV0QixLQUZJLENBQVAsQ0FQa0Q7S0FBcEQsTUFVTztBQUNMLGFBQU8sS0FBUCxDQURLO0tBVlA7R0FESyxDQURzRDtDQUFoRCIsImZpbGUiOiJjcmVhdGVSZWR1Y2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVSZWR1Y2VyIChpbml0aWFsU3RhdGUsIGhhbmRsZXJzKSB7XG4gIHJldHVybiBmdW5jdGlvbiByZWR1Y2VyIChzdGF0ZSA9IGluaXRpYWxTdGF0ZSwgYWN0aW9uKSB7XG4gICAgaWYgKGFjdGlvbiAmJiBoYW5kbGVycy5oYXNPd25Qcm9wZXJ0eShhY3Rpb24udHlwZSkpIHtcbiAgICAgIGxldCBoYW5kbGVyID0gaGFuZGxlcnNbYWN0aW9uLnR5cGVdXG5cbiAgICAgIGlmICghXy5pc0FycmF5KGhhbmRsZXIpKSB7XG4gICAgICAgIGhhbmRsZXIgPSBbaGFuZGxlcl1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIF8ucmVkdWNlKGhhbmRsZXIsIChzdGF0ZSwgaGFuZGxlcikgPT4ge1xuICAgICAgICByZXR1cm4gaGFuZGxlcihzdGF0ZSwgYWN0aW9uLnBheWxvYWQsIGFjdGlvbilcbiAgICAgIH0sIHN0YXRlKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RhdGVcbiAgICB9XG4gIH1cbn1cbiJdfQ==