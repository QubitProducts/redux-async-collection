'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REQUEST_TIMEOUT = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = createCollection;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _createReducer2 = require('./createReducer');

var _createReducer3 = _interopRequireDefault(_createReducer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var REQUEST_TIMEOUT = exports.REQUEST_TIMEOUT = 3000;

function createCollection(name, createUrl) {
  var _ref;

  var isResponseValid = arguments.length <= 2 || arguments[2] === undefined ? _lodash2.default.isArray : arguments[2];

  (0, _invariant2.default)(_lodash2.default.isString(name), '`name` required');

  var pluralName = _lodash2.default.capitalize(name + 's');
  var constants = createConstants(name, pluralName);

  var add = createAdd(name, constants);
  var deleteItem = createDeleteItem(name, constants);
  var update = createUpdate(name, constants);
  var reducer = createReducerForCollection(name, pluralName, constants);
  var fetch = createFetchForCollection(pluralName, createUrl, isResponseValid, constants);

  return _ref = {}, _defineProperty(_ref, 'add' + name, add), _defineProperty(_ref, 'fetch' + pluralName, fetch), _defineProperty(_ref, 'delete' + name, deleteItem), _defineProperty(_ref, 'update' + name, update), _defineProperty(_ref, pluralName.toLowerCase(), reducer), _ref;
}

function createAdd(name, _ref2) {
  var FINISHED = _ref2.FINISHED;

  return function add() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var item = _lodash2.default.last(args);
    var key = createKey(_lodash2.default.initial(args));
    var result = _immutable2.default.fromJS([item]);

    return {
      type: FINISHED,
      payload: { key: key, result: result }
    };
  };
}

function createDeleteItem(name, _ref3) {
  var DELETE = _ref3.DELETE;

  return function deleteItem() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var id = _lodash2.default.last(args);
    var key = createKey(_lodash2.default.initial(args));

    return {
      type: DELETE,
      payload: { key: key, id: id }
    };
  };
}

function createUpdate(name, _ref4) {
  var UPDATE = _ref4.UPDATE;

  return function update() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    var item = _immutable2.default.fromJS(_lodash2.default.last(args));
    var id = item.get('id');
    var key = createKey(_lodash2.default.initial(args));

    return {
      type: UPDATE,
      payload: { key: key, id: id, item: item }
    };
  };
}

function createFetchForCollection(name, createUrl, isResponseValid, constants) {
  var FAILED = constants.FAILED;
  var FINISHED = constants.FINISHED;
  var IN_PROGRESS = constants.IN_PROGRESS;


  return function fetch() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return function (dispatch, getState) {
      var state = getState()[name.toLowerCase()];
      var isFetching = state.isFetching.apply(state, args);
      var hasFetched = state.hasFetched.apply(state, args);
      var hasFailedToFetch = state.hasFailedToFetch.apply(state, args);

      if (isFetching || hasFetched || hasFailedToFetch) {
        return;
      }

      var url = createUrl.apply(undefined, args);
      var key = createKey(args);
      var requestOptions = {
        timeout: REQUEST_TIMEOUT
      };

      dispatch({
        payload: { key: key },
        type: IN_PROGRESS
      });

      return _axios2.default.get(url, requestOptions).then(onResponse).catch(dispatchError);

      function onResponse(_ref5) {
        var data = _ref5.data;

        if (isResponseValid(data)) {
          var result = _immutable2.default.fromJS(data);

          dispatch({
            type: FINISHED,
            payload: { key: key, result: result }
          });
        } else {
          dispatchError({
            status: 400,
            message: 'Unacceptable response'
          });
        }
      }

      function dispatchError(error) {
        if (error instanceof Error) {
          console.error('Failed to reduce ' + FINISHED + '. This is probably an error in your reducer or a `connect`.', error);
        }

        dispatch({
          type: FAILED,
          error: true,
          payload: {
            key: key,
            status: error.status,
            message: error.message
          }
        });
      }
    };
  };
}

function createReducerForCollection(name, pluralName, constants) {
  var _createReducer;

  var FAILED = constants.FAILED;
  var DELETE = constants.DELETE;
  var UPDATE = constants.UPDATE;
  var FINISHED = constants.FINISHED;
  var IN_PROGRESS = constants.IN_PROGRESS;
  var FETCH_FAILED = constants.FETCH_FAILED;
  var FETCH_FINISHED = constants.FETCH_FINISHED;
  var FETCH_IN_PROGRESS = constants.FETCH_IN_PROGRESS;


  var FetchRecord = _immutable2.default.Record({
    fetches: _immutable2.default.Map()
  });

  var FetchState = function (_FetchRecord) {
    _inherits(FetchState, _FetchRecord);

    function FetchState() {
      _classCallCheck(this, FetchState);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(FetchState).apply(this, arguments));
    }

    _createClass(FetchState, [{
      key: 'getAllItems',
      value: function getAllItems() {
        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          args[_key5] = arguments[_key5];
        }

        var fetch = this.getFetch(args);

        if (fetch.get('status') === FETCH_FINISHED) {
          return fetch.get('result');
        }
      }
    }, {
      key: 'getItemById',
      value: function getItemById() {
        for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
          args[_key6] = arguments[_key6];
        }

        var id = _lodash2.default.last(args);
        var items = this.getAllItems.apply(this, _lodash2.default.initial(args));

        if (items) {
          return items.find(function (item) {
            return item.get('id') === id;
          });
        }
      }
    }, {
      key: 'hasFetched',
      value: function hasFetched() {
        for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
          args[_key7] = arguments[_key7];
        }

        return this.getStatus(args) === FETCH_FINISHED;
      }
    }, {
      key: 'isFetching',
      value: function isFetching() {
        for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
          args[_key8] = arguments[_key8];
        }

        return this.getStatus(args) === FETCH_IN_PROGRESS;
      }
    }, {
      key: 'hasFailedToFetch',
      value: function hasFailedToFetch() {
        for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
          args[_key9] = arguments[_key9];
        }

        return this.getStatus(args) === FETCH_FAILED;
      }
    }, {
      key: 'getStatus',
      value: function getStatus(args) {
        return this.getFetch(args).get('status');
      }
    }, {
      key: 'getFetch',
      value: function getFetch(args) {
        var key = createKey(args);

        return this.fetches.get(key) || new _immutable2.default.Map();
      }
    }]);

    return FetchState;
  }(FetchRecord);

  addFunctionAlias('getItemById', 'get' + name + 'ById');
  addFunctionAlias('getAllItems', 'getAll' + pluralName);
  addFunctionAlias('isFetching', 'isFetching' + pluralName);
  addFunctionAlias('hasFetched', 'hasFetched' + pluralName);
  addFunctionAlias('hasFailedToFetch', 'hasFailedToFetch' + pluralName);

  return (0, _createReducer3.default)(new FetchState(), (_createReducer = {}, _defineProperty(_createReducer, DELETE, deleteItem), _defineProperty(_createReducer, UPDATE, update), _defineProperty(_createReducer, FAILED, setStatus(FETCH_FAILED)), _defineProperty(_createReducer, IN_PROGRESS, setStatus(FETCH_IN_PROGRESS)), _defineProperty(_createReducer, FINISHED, [setStatus(FETCH_FINISHED), setResult]), _createReducer));

  function addFunctionAlias(func, alias) {
    FetchState.prototype[alias] = function () {
      return this[func].apply(this, arguments);
    };
  }

  function deleteItem(state, _ref6) {
    var key = _ref6.key;
    var id = _ref6.id;

    return state.update('fetches', function (fetches) {
      var result = fetches.getIn([key, 'result']).filter(itemsWithWrongId);

      return fetches.setIn([key, 'result'], result);
    });

    function itemsWithWrongId(item) {
      return item.get('id') !== id;
    }
  }

  function update(state, _ref7) {
    var key = _ref7.key;
    var id = _ref7.id;
    var item = _ref7.item;

    return state.update('fetches', function (fetches) {
      var index = fetches.getIn([key, 'result']).findIndex(itemWithId);

      return fetches.setIn([key, 'result', index], item);
    });

    function itemWithId(item) {
      return item.get('id') === id;
    }
  }

  function setResult(state, _ref8) {
    var key = _ref8.key;
    var result = _ref8.result;

    return state.update('fetches', function (fetches) {
      var existingResult = fetches.getIn([key, 'result']);

      if (existingResult) {
        result = result.concat(existingResult);
      }

      return fetches.setIn([key, 'result'], result);
    });
  }

  function setStatus(status) {
    return function (state, _ref9) {
      var key = _ref9.key;

      return state.update('fetches', function (fetches) {
        return fetches.setIn([key, 'status'], status);
      });
    };
  }
}

function createKey(args) {
  (0, _invariant2.default)(_lodash2.default.isArray(args), '`args` must be an array');

  return args.join('-');
}

function createConstants(name, pluralName) {
  var constantPluralName = 'FETCH_' + pluralName.toUpperCase();

  var FETCH_FAILED = 'FETCH_FAILED';
  var FETCH_FINISHED = 'FETCH_FINISHED';
  var FETCH_IN_PROGRESS = 'FETCH_IN_PROGRESS';
  var IN_PROGRESS = constantPluralName + '_IN_PROGRESS';
  var FINISHED = constantPluralName + '_FINISHED';
  var FAILED = constantPluralName + '_FAILED';
  var DELETE = 'DELETE_' + name.toUpperCase();
  var UPDATE = 'UPDATE_' + name.toUpperCase();

  return {
    FAILED: FAILED,
    DELETE: DELETE,
    UPDATE: UPDATE,
    FINISHED: FINISHED,
    IN_PROGRESS: IN_PROGRESS,
    FETCH_FAILED: FETCH_FAILED,
    FETCH_FINISHED: FETCH_FINISHED,
    FETCH_IN_PROGRESS: FETCH_IN_PROGRESS
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVDb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztrQkFRd0I7O0FBUnhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRU8sSUFBTSw0Q0FBa0IsSUFBbEI7O0FBRUUsU0FBUyxnQkFBVCxDQUEyQixJQUEzQixFQUFpQyxTQUFqQyxFQUF5RTs7O01BQTdCLHdFQUFrQixpQkFBRSxPQUFGLGdCQUFXOztBQUN0RiwyQkFBVSxpQkFBRSxRQUFGLENBQVcsSUFBWCxDQUFWLEVBQTRCLGlCQUE1QixFQURzRjs7QUFHdEYsTUFBTSxhQUFhLGlCQUFFLFVBQUYsQ0FBYSxPQUFPLEdBQVAsQ0FBMUIsQ0FIZ0Y7QUFJdEYsTUFBTSxZQUFZLGdCQUFnQixJQUFoQixFQUFzQixVQUF0QixDQUFaLENBSmdGOztBQU10RixNQUFNLE1BQU0sVUFBVSxJQUFWLEVBQWdCLFNBQWhCLENBQU4sQ0FOZ0Y7QUFPdEYsTUFBTSxhQUFhLGlCQUFpQixJQUFqQixFQUF1QixTQUF2QixDQUFiLENBUGdGO0FBUXRGLE1BQU0sU0FBUyxhQUFhLElBQWIsRUFBbUIsU0FBbkIsQ0FBVCxDQVJnRjtBQVN0RixNQUFNLFVBQVUsMkJBQTJCLElBQTNCLEVBQWlDLFVBQWpDLEVBQTZDLFNBQTdDLENBQVYsQ0FUZ0Y7QUFVdEYsTUFBTSxRQUFRLHlCQUF5QixVQUF6QixFQUFxQyxTQUFyQyxFQUFnRCxlQUFoRCxFQUFpRSxTQUFqRSxDQUFSLENBVmdGOztBQVl0RixrREFDUyxNQUFTLHNDQUNQLFlBQWUseUNBQ2QsTUFBUyw4Q0FDVCxNQUFTLCtCQUNsQixXQUFXLFdBQVgsSUFBMkIsY0FMOUIsQ0Fac0Y7Q0FBekU7O0FBcUJmLFNBQVMsU0FBVCxDQUFvQixJQUFwQixTQUF3QztNQUFaLDBCQUFZOztBQUN0QyxTQUFPLFNBQVMsR0FBVCxHQUF1QjtzQ0FBTjs7S0FBTTs7QUFDNUIsUUFBTSxPQUFPLGlC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VSxpQkFBRSxPQUFGLENBQVUsSUFBVixDQUFWLEVBQTJCLHlCQUEzQixFQUR3Qjs7QUFHeEIsU0FBTyxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQVAsQ0FId0I7Q0FBMUI7O0FBTUEsU0FBUyxlQUFULENBQTBCLElBQTFCLEVBQWdDLFVBQWhDLEVBQTRDO0FBQzFDLE1BQU0sZ0NBQThCLFdBQVcsV0FBWCxFQUE5QixDQURvQzs7QUFHMUMsTUFBTSxlQUFlLGNBQWYsQ0FIb0M7QUFJMUMsTUFBTSxpQkFBaUIsZ0JBQWpCLENBSm9DO0FBSzFDLE1BQU0sb0JBQW9CLG1CQUFwQixDQUxvQztBQU0xQyxNQUFNLGNBQWlCLG1DQUFqQixDQU5vQztBQU8xQyxNQUFNLFdBQWMsZ0NBQWQsQ0FQb0M7QUFRMUMsTUFBTSxTQUFZLDhCQUFaLENBUm9DO0FBUzFDLE1BQU0scUJBQW1CLEtBQUssV0FBTCxFQUFuQixDQVRvQztBQVUxQyxNQUFNLHFCQUFtQixLQUFLLFdBQUwsRUFBbkIsQ0FWb0M7O0FBWTFDLFNBQU87QUFDTCxrQkFESztBQUVMLGtCQUZLO0FBR0wsa0JBSEs7QUFJTCxzQkFKSztBQUtMLDRCQUxLO0FBTUwsOEJBTks7QUFPTCxrQ0FQSztBQVFMLHdDQVJLO0dBQVAsQ0FaMEM7Q0FBNUMiLCJmaWxlIjoiY3JlYXRlQ29sbGVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcydcbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJ1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdpbnZhcmlhbnQnXG5pbXBvcnQgY3JlYXRlUmVkdWNlciBmcm9tICcuL2NyZWF0ZVJlZHVjZXInXG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX1RJTUVPVVQgPSAzMDAwXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUNvbGxlY3Rpb24gKG5hbWUsIGNyZWF0ZVVybCwgaXNSZXNwb25zZVZhbGlkID0gXy5pc0FycmF5KSB7XG4gIGludmFyaWFudChfLmlzU3RyaW5nKG5hbWUpLCAnYG5hbWVgIHJlcXVpcmVkJylcblxuICBjb25zdCBwbHVyYWxOYW1lID0gXy5jYXBpdGFsaXplKG5hbWUgKyAncycpXG4gIGNvbnN0IGNvbnN0YW50cyA9IGNyZWF0ZUNvbnN0YW50cyhuYW1lLCBwbHVyYWxOYW1lKVxuXG4gIGNvbnN0IGFkZCA9IGNyZWF0ZUFkZChuYW1lLCBjb25zdGFudHMpXG4gIGNvbnN0IGRlbGV0ZUl0ZW0gPSBjcmVhdGVEZWxldGVJdGVtKG5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgdXBkYXRlID0gY3JlYXRlVXBkYXRlKG5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgcmVkdWNlciA9IGNyZWF0ZVJlZHVjZXJGb3JDb2xsZWN0aW9uKG5hbWUsIHBsdXJhbE5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgZmV0Y2ggPSBjcmVhdGVGZXRjaEZvckNvbGxlY3Rpb24ocGx1cmFsTmFtZSwgY3JlYXRlVXJsLCBpc1Jlc3BvbnNlVmFsaWQsIGNvbnN0YW50cylcblxuICByZXR1cm4ge1xuICAgIFtgYWRkJHtuYW1lfWBdOiBhZGQsXG4gICAgW2BmZXRjaCR7cGx1cmFsTmFtZX1gXTogZmV0Y2gsXG4gICAgW2BkZWxldGUke25hbWV9YF06IGRlbGV0ZUl0ZW0sXG4gICAgW2B1cGRhdGUke25hbWV9YF06IHVwZGF0ZSxcbiAgICBbcGx1cmFsTmFtZS50b0xvd2VyQ2FzZSgpXTogcmVkdWNlclxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkZCAobmFtZSwgeyBGSU5JU0hFRCB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiBhZGQgKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVtID0gXy5sYXN0KGFyZ3MpXG4gICAgY29uc3Qga2V5ID0gY3JlYXRlS2V5KF8uaW5pdGlhbChhcmdzKSlcbiAgICBjb25zdCByZXN1bHQgPSBJbW11dGFibGUuZnJvbUpTKFtpdGVtXSlcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBGSU5JU0hFRCxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCByZXN1bHQgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWxldGVJdGVtIChuYW1lLCB7IERFTEVURSB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiBkZWxldGVJdGVtICguLi5hcmdzKSB7XG4gICAgY29uc3QgaWQgPSBfLmxhc3QoYXJncylcbiAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoXy5pbml0aWFsKGFyZ3MpKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IERFTEVURSxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCBpZCB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZSAobmFtZSwgeyBVUERBVEUgfSkge1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlbSA9IEltbXV0YWJsZS5mcm9tSlMoXy5sYXN0KGFyZ3MpKVxuICAgIGNvbnN0IGlkID0gaXRlbS5nZXQoJ2lkJylcbiAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoXy5pbml0aWFsKGFyZ3MpKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFVQREFURSxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCBpZCwgaXRlbSB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZldGNoRm9yQ29sbGVjdGlvbiAobmFtZSwgY3JlYXRlVXJsLCBpc1Jlc3BvbnNlVmFsaWQsIGNvbnN0YW50cykge1xuICBjb25zdCB7IEZBSUxFRCwgRklOSVNIRUQsIElOX1BST0dSRVNTIH0gPSBjb25zdGFudHNcblxuICByZXR1cm4gZnVuY3Rpb24gZmV0Y2ggKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRpc3BhdGNoLCBnZXRTdGF0ZSkge1xuICAgICAgY29uc3Qgc3RhdGUgPSBnZXRTdGF0ZSgpW25hbWUudG9Mb3dlckNhc2UoKV1cbiAgICAgIGNvbnN0IGlzRmV0Y2hpbmcgPSBzdGF0ZS5pc0ZldGNoaW5nKC4uLmFyZ3MpXG4gICAgICBjb25zdCBoYXNGZXRjaGVkID0gc3RhdGUuaGFzRmV0Y2hlZCguLi5hcmdzKVxuICAgICAgY29uc3QgaGFzRmFpbGVkVG9GZXRjaCA9IHN0YXRlLmhhc0ZhaWxlZFRvRmV0Y2goLi4uYXJncylcblxuICAgICAgaWYgKGlzRmV0Y2hpbmcgfHwgaGFzRmV0Y2hlZCB8fCBoYXNGYWlsZWRUb0ZldGNoKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCB1cmwgPSBjcmVhdGVVcmwoLi4uYXJncylcbiAgICAgIGNvbnN0IGtleSA9IGNyZWF0ZUtleShhcmdzKVxuICAgICAgY29uc3QgcmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICAgIHRpbWVvdXQ6IFJFUVVFU1RfVElNRU9VVFxuICAgICAgfVxuXG4gICAgICBkaXNwYXRjaCh7XG4gICAgICAgIHBheWxvYWQ6IHsga2V5IH0sXG4gICAgICAgIHR5cGU6IElOX1BST0dSRVNTXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gYXhpb3NcbiAgICAgICAgLmdldCh1cmwsIHJlcXVlc3RPcHRpb25zKVxuICAgICAgICAudGhlbihvblJlc3BvbnNlKVxuICAgICAgICAuY2F0Y2goZGlzcGF0Y2hFcnJvcilcblxuICAgICAgZnVuY3Rpb24gb25SZXNwb25zZSAoeyBkYXRhIH0pIHtcbiAgICAgICAgaWYgKGlzUmVzcG9uc2VWYWxpZChkYXRhKSkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEltbXV0YWJsZS5mcm9tSlMoZGF0YSlcblxuICAgICAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgICAgIHR5cGU6IEZJTklTSEVELFxuICAgICAgICAgICAgcGF5bG9hZDogeyBrZXksIHJlc3VsdCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaXNwYXRjaEVycm9yKHtcbiAgICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1VuYWNjZXB0YWJsZSByZXNwb25zZSdcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGRpc3BhdGNoRXJyb3IgKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlZHVjZSAke0ZJTklTSEVEfS4gVGhpcyBpcyBwcm9iYWJseSBhbiBlcnJvciBpbiB5b3VyIHJlZHVjZXIgb3IgYSBcXGBjb25uZWN0XFxgLmAsIGVycm9yKVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgIHR5cGU6IEZBSUxFRCxcbiAgICAgICAgICBlcnJvcjogdHJ1ZSxcbiAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIHN0YXR1czogZXJyb3Iuc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVkdWNlckZvckNvbGxlY3Rpb24gKG5hbWUsIHBsdXJhbE5hbWUsIGNvbnN0YW50cykge1xuICBjb25zdCB7XG4gICAgRkFJTEVELFxuICAgIERFTEVURSxcbiAgICBVUERBVEUsXG4gICAgRklOSVNIRUQsXG4gICAgSU5fUFJPR1JFU1MsXG4gICAgRkVUQ0hfRkFJTEVELFxuICAgIEZFVENIX0ZJTklTSEVELFxuICAgIEZFVENIX0lOX1BST0dSRVNTXG4gIH0gPSBjb25zdGFudHNcblxuICBjb25zdCBGZXRjaFJlY29yZCA9IEltbXV0YWJsZS5SZWNvcmQoe1xuICAgIGZldGNoZXM6IEltbXV0YWJsZS5NYXAoKVxuICB9KVxuXG4gIGNsYXNzIEZldGNoU3RhdGUgZXh0ZW5kcyBGZXRjaFJlY29yZCB7XG4gICAgZ2V0QWxsSXRlbXMgKC4uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IGZldGNoID0gdGhpcy5nZXRGZXRjaChhcmdzKVxuXG4gICAgICBpZiAoZmV0Y2guZ2V0KCdzdGF0dXMnKSA9PT0gRkVUQ0hfRklOSVNIRUQpIHtcbiAgICAgICAgcmV0dXJuIGZldGNoLmdldCgncmVzdWx0JylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRJdGVtQnlJZCAoLi4uYXJncykge1xuICAgICAgY29uc3QgaWQgPSBfLmxhc3QoYXJncylcbiAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5nZXRBbGxJdGVtcy5hcHBseSh0aGlzLCBfLmluaXRpYWwoYXJncykpXG5cbiAgICAgIGlmIChpdGVtcykge1xuICAgICAgICByZXR1cm4gaXRlbXMuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICAgIHJldHVybiBpdGVtLmdldCgnaWQnKSA9PT0gaWRcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgaGFzRmV0Y2hlZCAoLi4uYXJncykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdHVzKGFyZ3MpID09PSBGRVRDSF9GSU5JU0hFRFxuICAgIH1cbiAgICBpc0ZldGNoaW5nICguLi5hcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRTdGF0dXMoYXJncykgPT09IEZFVENIX0lOX1BST0dSRVNTXG4gICAgfVxuICAgIGhhc0ZhaWxlZFRvRmV0Y2ggKC4uLmFyZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFN0YXR1cyhhcmdzKSA9PT0gRkVUQ0hfRkFJTEVEXG4gICAgfVxuICAgIGdldFN0YXR1cyAoYXJncykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0RmV0Y2goYXJncykuZ2V0KCdzdGF0dXMnKVxuICAgIH1cbiAgICBnZXRGZXRjaCAoYXJncykge1xuICAgICAgY29uc3Qga2V5ID0gY3JlYXRlS2V5KGFyZ3MpXG5cbiAgICAgIHJldHVybiB0aGlzLmZldGNoZXMuZ2V0KGtleSkgfHwgbmV3IEltbXV0YWJsZS5NYXAoKVxuICAgIH1cbiAgfVxuXG4gIGFkZEZ1bmN0aW9uQWxpYXMoJ2dldEl0ZW1CeUlkJywgYGdldCR7bmFtZX1CeUlkYClcbiAgYWRkRnVuY3Rpb25BbGlhcygnZ2V0QWxsSXRlbXMnLCBgZ2V0QWxsJHtwbHVyYWxOYW1lfWApXG4gIGFkZEZ1bmN0aW9uQWxpYXMoJ2lzRmV0Y2hpbmcnLCBgaXNGZXRjaGluZyR7cGx1cmFsTmFtZX1gKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdoYXNGZXRjaGVkJywgYGhhc0ZldGNoZWQke3BsdXJhbE5hbWV9YClcbiAgYWRkRnVuY3Rpb25BbGlhcygnaGFzRmFpbGVkVG9GZXRjaCcsIGBoYXNGYWlsZWRUb0ZldGNoJHtwbHVyYWxOYW1lfWApXG5cbiAgcmV0dXJuIGNyZWF0ZVJlZHVjZXIobmV3IEZldGNoU3RhdGUoKSwge1xuICAgIFtERUxFVEVdOiBkZWxldGVJdGVtLFxuICAgIFtVUERBVEVdOiB1cGRhdGUsXG4gICAgW0ZBSUxFRF06IHNldFN0YXR1cyhGRVRDSF9GQUlMRUQpLFxuICAgIFtJTl9QUk9HUkVTU106IHNldFN0YXR1cyhGRVRDSF9JTl9QUk9HUkVTUyksXG4gICAgW0ZJTklTSEVEXTogW3NldFN0YXR1cyhGRVRDSF9GSU5JU0hFRCksIHNldFJlc3VsdF1cbiAgfSlcblxuICBmdW5jdGlvbiBhZGRGdW5jdGlvbkFsaWFzIChmdW5jLCBhbGlhcykge1xuICAgIEZldGNoU3RhdGUucHJvdG90eXBlW2FsaWFzXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzW2Z1bmNdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWxldGVJdGVtIChzdGF0ZSwgeyBrZXksIGlkIH0pIHtcbiAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZldGNoZXNcbiAgICAgICAgLmdldEluKFtrZXksICdyZXN1bHQnXSlcbiAgICAgICAgLmZpbHRlcihpdGVtc1dpdGhXcm9uZ0lkKVxuXG4gICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAncmVzdWx0J10sIHJlc3VsdClcbiAgICB9KVxuXG4gICAgZnVuY3Rpb24gaXRlbXNXaXRoV3JvbmdJZCAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0KCdpZCcpICE9PSBpZFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSAoc3RhdGUsIHsga2V5LCBpZCwgaXRlbSB9KSB7XG4gICAgcmV0dXJuIHN0YXRlLnVwZGF0ZSgnZmV0Y2hlcycsIChmZXRjaGVzKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IGZldGNoZXNcbiAgICAgICAgLmdldEluKFtrZXksICdyZXN1bHQnXSlcbiAgICAgICAgLmZpbmRJbmRleChpdGVtV2l0aElkKVxuXG4gICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAncmVzdWx0JywgaW5kZXhdLCBpdGVtKVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBpdGVtV2l0aElkIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXQoJ2lkJykgPT09IGlkXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0UmVzdWx0IChzdGF0ZSwgeyBrZXksIHJlc3VsdCB9KSB7XG4gICAgcmV0dXJuIHN0YXRlLnVwZGF0ZSgnZmV0Y2hlcycsIChmZXRjaGVzKSA9PiB7XG4gICAgICBjb25zdCBleGlzdGluZ1Jlc3VsdCA9IGZldGNoZXMuZ2V0SW4oW2tleSwgJ3Jlc3VsdCddKVxuXG4gICAgICBpZiAoZXhpc3RpbmdSZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChleGlzdGluZ1Jlc3VsdClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZldGNoZXMuc2V0SW4oW2tleSwgJ3Jlc3VsdCddLCByZXN1bHQpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFN0YXR1cyAoc3RhdHVzKSB7XG4gICAgcmV0dXJuIChzdGF0ZSwgeyBrZXkgfSkgPT4ge1xuICAgICAgcmV0dXJuIHN0YXRlLnVwZGF0ZSgnZmV0Y2hlcycsIChmZXRjaGVzKSA9PiB7XG4gICAgICAgIHJldHVybiBmZXRjaGVzLnNldEluKFtrZXksICdzdGF0dXMnXSwgc3RhdHVzKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlS2V5IChhcmdzKSB7XG4gIGludmFyaWFudChfLmlzQXJyYXkoYXJncyksICdgYXJnc2AgbXVzdCBiZSBhbiBhcnJheScpXG5cbiAgcmV0dXJuIGFyZ3Muam9pbignLScpXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnN0YW50cyAobmFtZSwgcGx1cmFsTmFtZSkge1xuICBjb25zdCBjb25zdGFudFBsdXJhbE5hbWUgPSBgRkVUQ0hfJHtwbHVyYWxOYW1lLnRvVXBwZXJDYXNlKCl9YFxuXG4gIGNvbnN0IEZFVENIX0ZBSUxFRCA9ICdGRVRDSF9GQUlMRUQnXG4gIGNvbnN0IEZFVENIX0ZJTklTSEVEID0gJ0ZFVENIX0ZJTklTSEVEJ1xuICBjb25zdCBGRVRDSF9JTl9QUk9HUkVTUyA9ICdGRVRDSF9JTl9QUk9HUkVTUydcbiAgY29uc3QgSU5fUFJPR1JFU1MgPSBgJHtjb25zdGFudFBsdXJhbE5hbWV9X0lOX1BST0dSRVNTYFxuICBjb25zdCBGSU5JU0hFRCA9IGAke2NvbnN0YW50UGx1cmFsTmFtZX1fRklOSVNIRURgXG4gIGNvbnN0IEZBSUxFRCA9IGAke2NvbnN0YW50UGx1cmFsTmFtZX1fRkFJTEVEYFxuICBjb25zdCBERUxFVEUgPSBgREVMRVRFXyR7bmFtZS50b1VwcGVyQ2FzZSgpfWBcbiAgY29uc3QgVVBEQVRFID0gYFVQREFURV8ke25hbWUudG9VcHBlckNhc2UoKX1gXG5cbiAgcmV0dXJuIHtcbiAgICBGQUlMRUQsXG4gICAgREVMRVRFLFxuICAgIFVQREFURSxcbiAgICBGSU5JU0hFRCxcbiAgICBJTl9QUk9HUkVTUyxcbiAgICBGRVRDSF9GQUlMRUQsXG4gICAgRkVUQ0hfRklOSVNIRUQsXG4gICAgRkVUQ0hfSU5fUFJPR1JFU1NcbiAgfVxufVxuIl19