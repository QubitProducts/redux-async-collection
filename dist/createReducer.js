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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVSZWR1Y2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O2tCQUV3QixhOztBQUZ4Qjs7Ozs7O0FBRWUsU0FBUyxhQUFULENBQXdCLFlBQXhCLEVBQXNDLFFBQXRDLEVBQWdEO0FBQzdELFNBQU8sU0FBUyxPQUFULEdBQWdEO0FBQUEsUUFBOUIsS0FBOEIseURBQXRCLFlBQXNCO0FBQUEsUUFBUixNQUFROztBQUNyRCxRQUFJLFVBQVUsU0FBUyxjQUFULENBQXdCLE9BQU8sSUFBL0IsQ0FBZCxFQUFvRDtBQUNsRCxVQUFJLFVBQVUsU0FBUyxPQUFPLElBQWhCLENBQWQ7O0FBRUEsVUFBSSxDQUFDLGlCQUFFLE9BQUYsQ0FBVSxPQUFWLENBQUwsRUFBeUI7QUFDdkIsa0JBQVUsQ0FBQyxPQUFELENBQVY7QUFDRDs7QUFFRCxhQUFPLGlCQUFFLE1BQUYsQ0FBUyxPQUFULEVBQWtCLFVBQUMsS0FBRCxFQUFRLE9BQVIsRUFBb0I7QUFDM0MsZUFBTyxRQUFRLEtBQVIsRUFBZSxPQUFPLE9BQXRCLEVBQStCLE1BQS9CLENBQVA7QUFDRCxPQUZNLEVBRUosS0FGSSxDQUFQO0FBR0QsS0FWRCxNQVVPO0FBQ0wsYUFBTyxLQUFQO0FBQ0Q7QUFDRixHQWREO0FBZUQiLCJmaWxlIjoiY3JlYXRlUmVkdWNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCdcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlUmVkdWNlciAoaW5pdGlhbFN0YXRlLCBoYW5kbGVycykge1xuICByZXR1cm4gZnVuY3Rpb24gcmVkdWNlciAoc3RhdGUgPSBpbml0aWFsU3RhdGUsIGFjdGlvbikge1xuICAgIGlmIChhY3Rpb24gJiYgaGFuZGxlcnMuaGFzT3duUHJvcGVydHkoYWN0aW9uLnR5cGUpKSB7XG4gICAgICBsZXQgaGFuZGxlciA9IGhhbmRsZXJzW2FjdGlvbi50eXBlXVxuXG4gICAgICBpZiAoIV8uaXNBcnJheShoYW5kbGVyKSkge1xuICAgICAgICBoYW5kbGVyID0gW2hhbmRsZXJdXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBfLnJlZHVjZShoYW5kbGVyLCAoc3RhdGUsIGhhbmRsZXIpID0+IHtcbiAgICAgICAgcmV0dXJuIGhhbmRsZXIoc3RhdGUsIGFjdGlvbi5wYXlsb2FkLCBhY3Rpb24pXG4gICAgICB9LCBzdGF0ZSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0YXRlXG4gICAgfVxuICB9XG59XG4iXX0=