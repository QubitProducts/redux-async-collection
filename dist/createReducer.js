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