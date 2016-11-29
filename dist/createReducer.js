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
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVSZWR1Y2VyLmpzIl0sIm5hbWVzIjpbImNyZWF0ZVJlZHVjZXIiLCJpbml0aWFsU3RhdGUiLCJoYW5kbGVycyIsInJlZHVjZXIiLCJzdGF0ZSIsImFjdGlvbiIsImhhc093blByb3BlcnR5IiwidHlwZSIsImhhbmRsZXIiLCJpc0FycmF5IiwicmVkdWNlIiwicGF5bG9hZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBRXdCQSxhOztBQUZ4Qjs7Ozs7O0FBRWUsU0FBU0EsYUFBVCxDQUF3QkMsWUFBeEIsRUFBc0NDLFFBQXRDLEVBQWdEO0FBQzdELFNBQU8sU0FBU0MsT0FBVCxHQUFnRDtBQUFBLFFBQTlCQyxLQUE4Qix1RUFBdEJILFlBQXNCO0FBQUEsUUFBUkksTUFBUTs7QUFDckQsUUFBSUEsVUFBVUgsU0FBU0ksY0FBVCxDQUF3QkQsT0FBT0UsSUFBL0IsQ0FBZCxFQUFvRDtBQUNsRCxVQUFJQyxVQUFVTixTQUFTRyxPQUFPRSxJQUFoQixDQUFkOztBQUVBLFVBQUksQ0FBQyxpQkFBRUUsT0FBRixDQUFVRCxPQUFWLENBQUwsRUFBeUI7QUFDdkJBLGtCQUFVLENBQUNBLE9BQUQsQ0FBVjtBQUNEOztBQUVELGFBQU8saUJBQUVFLE1BQUYsQ0FBU0YsT0FBVCxFQUFrQixVQUFDSixLQUFELEVBQVFJLE9BQVIsRUFBb0I7QUFDM0MsZUFBT0EsUUFBUUosS0FBUixFQUFlQyxPQUFPTSxPQUF0QixFQUErQk4sTUFBL0IsQ0FBUDtBQUNELE9BRk0sRUFFSkQsS0FGSSxDQUFQO0FBR0QsS0FWRCxNQVVPO0FBQ0wsYUFBT0EsS0FBUDtBQUNEO0FBQ0YsR0FkRDtBQWVEIiwiZmlsZSI6ImNyZWF0ZVJlZHVjZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVJlZHVjZXIgKGluaXRpYWxTdGF0ZSwgaGFuZGxlcnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHJlZHVjZXIgKHN0YXRlID0gaW5pdGlhbFN0YXRlLCBhY3Rpb24pIHtcbiAgICBpZiAoYWN0aW9uICYmIGhhbmRsZXJzLmhhc093blByb3BlcnR5KGFjdGlvbi50eXBlKSkge1xuICAgICAgbGV0IGhhbmRsZXIgPSBoYW5kbGVyc1thY3Rpb24udHlwZV1cblxuICAgICAgaWYgKCFfLmlzQXJyYXkoaGFuZGxlcikpIHtcbiAgICAgICAgaGFuZGxlciA9IFtoYW5kbGVyXVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gXy5yZWR1Y2UoaGFuZGxlciwgKHN0YXRlLCBoYW5kbGVyKSA9PiB7XG4gICAgICAgIHJldHVybiBoYW5kbGVyKHN0YXRlLCBhY3Rpb24ucGF5bG9hZCwgYWN0aW9uKVxuICAgICAgfSwgc3RhdGUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdGF0ZVxuICAgIH1cbiAgfVxufVxuIl19