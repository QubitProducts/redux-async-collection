'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REQUEST_TIMEOUT = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = createCollection;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

var _createReducer2 = require('./createReducer');

var _createReducer3 = _interopRequireDefault(_createReducer2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var REQUEST_TIMEOUT = exports.REQUEST_TIMEOUT = 10000; // 10s

function createCollection(name, createUrl) {
  var _ref;

  var isResponseValid = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _lodash2.default.isArray;

  var params = {};
  if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
    params = name;
    name = params.name;
    createUrl = params.createUrl;
    isResponseValid = params.isResponseValid || _lodash2.default.isArray;
  }

  (0, _invariant2.default)(_lodash2.default.isString(name), '`name` required');

  var path = [].concat(params.path || []);

  var pluralName = _lodash2.default.capitalize((0, _pluralize2.default)(name));
  var constants = createConstants(name, pluralName);

  var add = createAdd(name, constants);
  var deleteItem = createDeleteItem(name, constants);
  var update = createUpdate(name, constants);
  var reducer = createReducerForCollection(name, pluralName, constants);

  var _createFetchesForColl = createFetchesForCollection(pluralName, createUrl, isResponseValid, constants, path),
      fetch = _createFetchesForColl.fetch,
      refresh = _createFetchesForColl.refresh;

  return _ref = {}, _defineProperty(_ref, 'add' + name, add), _defineProperty(_ref, 'fetch' + pluralName, fetch), _defineProperty(_ref, 'refresh' + pluralName, refresh), _defineProperty(_ref, 'delete' + name, deleteItem), _defineProperty(_ref, 'update' + name, update), _defineProperty(_ref, pluralName.toLowerCase(), reducer), _ref;
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

function lowerFirst() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  return str[0].toLowerCase() + str.substring(1);
}

function createFetchesForCollection(name, createUrl, isResponseValid, constants, path) {
  var FAILED = constants.FAILED,
      FINISHED = constants.FINISHED,
      IN_PROGRESS = constants.IN_PROGRESS,
      REFRESHING = constants.REFRESHING;


  return {
    fetch: function fetch() {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return _fetch.apply(undefined, [false].concat(args));
    },
    refresh: function refresh() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return _fetch.apply(undefined, [true].concat(args));
    }
  };

  function _fetch(force) {
    for (var _len6 = arguments.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
      args[_key6 - 1] = arguments[_key6];
    }

    return function (dispatch, getState) {
      var state = _lodash2.default.get(getState(), path.concat(lowerFirst(name)));
      var isFetching = state.isFetching.apply(state, args);
      var hasFetched = state.hasFetched.apply(state, args);
      var hasFailedToFetch = state.hasFailedToFetch.apply(state, args);

      if (isFetching || !force && hasFetched || !force && hasFailedToFetch) {
        return;
      }

      var url = createUrl.apply(undefined, args);
      var key = createKey(args);
      var requestOptions = {
        timeout: REQUEST_TIMEOUT
      };

      dispatch({
        payload: { key: key },
        type: hasFetched ? REFRESHING : IN_PROGRESS
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
  }
}

function createReducerForCollection(name, pluralName, constants) {
  var _createReducer;

  var FAILED = constants.FAILED,
      DELETE = constants.DELETE,
      UPDATE = constants.UPDATE,
      FINISHED = constants.FINISHED,
      IN_PROGRESS = constants.IN_PROGRESS,
      FETCH_FAILED = constants.FETCH_FAILED,
      FETCH_FINISHED = constants.FETCH_FINISHED,
      FETCH_IN_PROGRESS = constants.FETCH_IN_PROGRESS;


  var FetchRecord = _immutable2.default.Record({
    fetches: _immutable2.default.Map()
  });

  var FetchState = function (_FetchRecord) {
    _inherits(FetchState, _FetchRecord);

    function FetchState() {
      _classCallCheck(this, FetchState);

      return _possibleConstructorReturn(this, (FetchState.__proto__ || Object.getPrototypeOf(FetchState)).apply(this, arguments));
    }

    _createClass(FetchState, [{
      key: 'getAllItems',
      value: function getAllItems() {
        for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
          args[_key7] = arguments[_key7];
        }

        var fetch = this.getFetch(args);

        if (fetch.get('status') === FETCH_FINISHED) {
          return fetch.get('result');
        }
      }
    }, {
      key: 'getItemById',
      value: function getItemById() {
        for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
          args[_key8] = arguments[_key8];
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
        for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
          args[_key9] = arguments[_key9];
        }

        return this.getStatus(args) === FETCH_FINISHED;
      }
    }, {
      key: 'isFetching',
      value: function isFetching() {
        for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
          args[_key10] = arguments[_key10];
        }

        return this.getStatus(args) === FETCH_IN_PROGRESS;
      }
    }, {
      key: 'hasFailedToFetch',
      value: function hasFailedToFetch() {
        for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
          args[_key11] = arguments[_key11];
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
    var key = _ref6.key,
        id = _ref6.id;

    return state.update('fetches', function (fetches) {
      var result = fetches.getIn([key, 'result']).filter(itemsWithWrongId);

      return fetches.setIn([key, 'result'], result);
    });

    function itemsWithWrongId(item) {
      return item.get('id') !== id;
    }
  }

  function update(state, _ref7) {
    var key = _ref7.key,
        id = _ref7.id,
        item = _ref7.item;

    return state.update('fetches', function (fetches) {
      var index = fetches.getIn([key, 'result']).findIndex(itemWithId);

      return fetches.setIn([key, 'result', index], item);
    });

    function itemWithId(item) {
      return item.get('id') === id;
    }
  }

  function setResult(state, _ref8) {
    var key = _ref8.key,
        result = _ref8.result;

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
  var REFRESHING = constantPluralName + '_REFRESHING';
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
    REFRESHING: REFRESHING,
    FETCH_FAILED: FETCH_FAILED,
    FETCH_FINISHED: FETCH_FINISHED,
    FETCH_IN_PROGRESS: FETCH_IN_PROGRESS
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVDb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbImNyZWF0ZUNvbGxlY3Rpb24iLCJSRVFVRVNUX1RJTUVPVVQiLCJuYW1lIiwiY3JlYXRlVXJsIiwiaXNSZXNwb25zZVZhbGlkIiwiaXNBcnJheSIsInBhcmFtcyIsImlzU3RyaW5nIiwicGF0aCIsImNvbmNhdCIsInBsdXJhbE5hbWUiLCJjYXBpdGFsaXplIiwiY29uc3RhbnRzIiwiY3JlYXRlQ29uc3RhbnRzIiwiYWRkIiwiY3JlYXRlQWRkIiwiZGVsZXRlSXRlbSIsImNyZWF0ZURlbGV0ZUl0ZW0iLCJ1cGRhdGUiLCJjcmVhdGVVcGRhdGUiLCJyZWR1Y2VyIiwiY3JlYXRlUmVkdWNlckZvckNvbGxlY3Rpb24iLCJjcmVhdGVGZXRjaGVzRm9yQ29sbGVjdGlvbiIsImZldGNoIiwicmVmcmVzaCIsInRvTG93ZXJDYXNlIiwiRklOSVNIRUQiLCJhcmdzIiwiaXRlbSIsImxhc3QiLCJrZXkiLCJjcmVhdGVLZXkiLCJpbml0aWFsIiwicmVzdWx0IiwiZnJvbUpTIiwidHlwZSIsInBheWxvYWQiLCJERUxFVEUiLCJpZCIsIlVQREFURSIsImdldCIsImxvd2VyRmlyc3QiLCJzdHIiLCJzdWJzdHJpbmciLCJGQUlMRUQiLCJJTl9QUk9HUkVTUyIsIlJFRlJFU0hJTkciLCJmb3JjZSIsImRpc3BhdGNoIiwiZ2V0U3RhdGUiLCJzdGF0ZSIsImlzRmV0Y2hpbmciLCJoYXNGZXRjaGVkIiwiaGFzRmFpbGVkVG9GZXRjaCIsInVybCIsInJlcXVlc3RPcHRpb25zIiwidGltZW91dCIsInRoZW4iLCJvblJlc3BvbnNlIiwiY2F0Y2giLCJkaXNwYXRjaEVycm9yIiwiZGF0YSIsInN0YXR1cyIsIm1lc3NhZ2UiLCJlcnJvciIsIkVycm9yIiwiY29uc29sZSIsIkZFVENIX0ZBSUxFRCIsIkZFVENIX0ZJTklTSEVEIiwiRkVUQ0hfSU5fUFJPR1JFU1MiLCJGZXRjaFJlY29yZCIsIlJlY29yZCIsImZldGNoZXMiLCJNYXAiLCJGZXRjaFN0YXRlIiwiZ2V0RmV0Y2giLCJpdGVtcyIsImdldEFsbEl0ZW1zIiwiYXBwbHkiLCJmaW5kIiwiZ2V0U3RhdHVzIiwiYWRkRnVuY3Rpb25BbGlhcyIsInNldFN0YXR1cyIsInNldFJlc3VsdCIsImZ1bmMiLCJhbGlhcyIsInByb3RvdHlwZSIsImFyZ3VtZW50cyIsImdldEluIiwiZmlsdGVyIiwiaXRlbXNXaXRoV3JvbmdJZCIsInNldEluIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtV2l0aElkIiwiZXhpc3RpbmdSZXN1bHQiLCJqb2luIiwiY29uc3RhbnRQbHVyYWxOYW1lIiwidG9VcHBlckNhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O2tCQVN3QkEsZ0I7O0FBVHhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFFTyxJQUFNQyw0Q0FBa0IsS0FBeEIsQyxDQUE4Qjs7QUFFdEIsU0FBU0QsZ0JBQVQsQ0FBMkJFLElBQTNCLEVBQWlDQyxTQUFqQyxFQUF5RTtBQUFBOztBQUFBLE1BQTdCQyxlQUE2Qix1RUFBWCxpQkFBRUMsT0FBUzs7QUFDdEYsTUFBSUMsU0FBUyxFQUFiO0FBQ0EsTUFBSSxRQUFPSixJQUFQLHlDQUFPQSxJQUFQLE9BQWdCLFFBQXBCLEVBQThCO0FBQzVCSSxhQUFTSixJQUFUO0FBQ0FBLFdBQU9JLE9BQU9KLElBQWQ7QUFDQUMsZ0JBQVlHLE9BQU9ILFNBQW5CO0FBQ0FDLHNCQUFrQkUsT0FBT0YsZUFBUCxJQUEwQixpQkFBRUMsT0FBOUM7QUFDRDs7QUFFRCwyQkFBVSxpQkFBRUUsUUFBRixDQUFXTCxJQUFYLENBQVYsRUFBNEIsaUJBQTVCOztBQUVBLE1BQU1NLE9BQU8sR0FBR0MsTUFBSCxDQUFVSCxPQUFPRSxJQUFQLElBQWUsRUFBekIsQ0FBYjs7QUFFQSxNQUFNRSxhQUFhLGlCQUFFQyxVQUFGLENBQWEseUJBQVVULElBQVYsQ0FBYixDQUFuQjtBQUNBLE1BQU1VLFlBQVlDLGdCQUFn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LCJmaWxlIjoiY3JlYXRlQ29sbGVjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcydcbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJ1xuaW1wb3J0IGludmFyaWFudCBmcm9tICdpbnZhcmlhbnQnXG5pbXBvcnQgcGx1cmFsaXplIGZyb20gJ3BsdXJhbGl6ZSdcbmltcG9ydCBjcmVhdGVSZWR1Y2VyIGZyb20gJy4vY3JlYXRlUmVkdWNlcidcblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVCA9IDEwMDAwIC8vIDEwc1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVDb2xsZWN0aW9uIChuYW1lLCBjcmVhdGVVcmwsIGlzUmVzcG9uc2VWYWxpZCA9IF8uaXNBcnJheSkge1xuICBsZXQgcGFyYW1zID0ge31cbiAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgIHBhcmFtcyA9IG5hbWVcbiAgICBuYW1lID0gcGFyYW1zLm5hbWVcbiAgICBjcmVhdGVVcmwgPSBwYXJhbXMuY3JlYXRlVXJsXG4gICAgaXNSZXNwb25zZVZhbGlkID0gcGFyYW1zLmlzUmVzcG9uc2VWYWxpZCB8fCBfLmlzQXJyYXlcbiAgfVxuXG4gIGludmFyaWFudChfLmlzU3RyaW5nKG5hbWUpLCAnYG5hbWVgIHJlcXVpcmVkJylcblxuICBjb25zdCBwYXRoID0gW10uY29uY2F0KHBhcmFtcy5wYXRoIHx8IFtdKVxuXG4gIGNvbnN0IHBsdXJhbE5hbWUgPSBfLmNhcGl0YWxpemUocGx1cmFsaXplKG5hbWUpKVxuICBjb25zdCBjb25zdGFudHMgPSBjcmVhdGVDb25zdGFudHMobmFtZSwgcGx1cmFsTmFtZSlcblxuICBjb25zdCBhZGQgPSBjcmVhdGVBZGQobmFtZSwgY29uc3RhbnRzKVxuICBjb25zdCBkZWxldGVJdGVtID0gY3JlYXRlRGVsZXRlSXRlbShuYW1lLCBjb25zdGFudHMpXG4gIGNvbnN0IHVwZGF0ZSA9IGNyZWF0ZVVwZGF0ZShuYW1lLCBjb25zdGFudHMpXG4gIGNvbnN0IHJlZHVjZXIgPSBjcmVhdGVSZWR1Y2VyRm9yQ29sbGVjdGlvbihuYW1lLCBwbHVyYWxOYW1lLCBjb25zdGFudHMpXG4gIGNvbnN0IHsgZmV0Y2gsIHJlZnJlc2ggfSA9IGNyZWF0ZUZldGNoZXNGb3JDb2xsZWN0aW9uKHBsdXJhbE5hbWUsIGNyZWF0ZVVybCwgaXNSZXNwb25zZVZhbGlkLCBjb25zdGFudHMsIHBhdGgpXG5cbiAgcmV0dXJuIHtcbiAgICBbYGFkZCR7bmFtZX1gXTogYWRkLFxuICAgIFtgZmV0Y2gke3BsdXJhbE5hbWV9YF06IGZldGNoLFxuICAgIFtgcmVmcmVzaCR7cGx1cmFsTmFtZX1gXTogcmVmcmVzaCxcbiAgICBbYGRlbGV0ZSR7bmFtZX1gXTogZGVsZXRlSXRlbSxcbiAgICBbYHVwZGF0ZSR7bmFtZX1gXTogdXBkYXRlLFxuICAgIFtwbHVyYWxOYW1lLnRvTG93ZXJDYXNlKCldOiByZWR1Y2VyXG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQWRkIChuYW1lLCB7IEZJTklTSEVEIH0pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFkZCAoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZW0gPSBfLmxhc3QoYXJncylcbiAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoXy5pbml0aWFsKGFyZ3MpKVxuICAgIGNvbnN0IHJlc3VsdCA9IEltbXV0YWJsZS5mcm9tSlMoW2l0ZW1dKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEZJTklTSEVELFxuICAgICAgcGF5bG9hZDogeyBrZXksIHJlc3VsdCB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlbGV0ZUl0ZW0gKG5hbWUsIHsgREVMRVRFIH0pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlbGV0ZUl0ZW0gKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpZCA9IF8ubGFzdChhcmdzKVxuICAgIGNvbnN0IGtleSA9IGNyZWF0ZUtleShfLmluaXRpYWwoYXJncykpXG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogREVMRVRFLFxuICAgICAgcGF5bG9hZDogeyBrZXksIGlkIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVXBkYXRlIChuYW1lLCB7IFVQREFURSB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVtID0gSW1tdXRhYmxlLmZyb21KUyhfLmxhc3QoYXJncykpXG4gICAgY29uc3QgaWQgPSBpdGVtLmdldCgnaWQnKVxuICAgIGNvbnN0IGtleSA9IGNyZWF0ZUtleShfLmluaXRpYWwoYXJncykpXG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogVVBEQVRFLFxuICAgICAgcGF5bG9hZDogeyBrZXksIGlkLCBpdGVtIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbG93ZXJGaXJzdCAoc3RyID0gJycpIHtcbiAgcmV0dXJuIHN0clswXS50b0xvd2VyQ2FzZSgpICsgc3RyLnN1YnN0cmluZygxKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVGZXRjaGVzRm9yQ29sbGVjdGlvbiAobmFtZSwgY3JlYXRlVXJsLCBpc1Jlc3BvbnNlVmFsaWQsIGNvbnN0YW50cywgcGF0aCkge1xuICBjb25zdCB7IEZBSUxFRCwgRklOSVNIRUQsIElOX1BST0dSRVNTLCBSRUZSRVNISU5HIH0gPSBjb25zdGFudHNcblxuICByZXR1cm4ge1xuICAgIGZldGNoOiAoLi4uYXJncykgPT4gZmV0Y2goZmFsc2UsIC4uLmFyZ3MpLFxuICAgIHJlZnJlc2g6ICguLi5hcmdzKSA9PiBmZXRjaCh0cnVlLCAuLi5hcmdzKVxuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2ggKGZvcmNlLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkaXNwYXRjaCwgZ2V0U3RhdGUpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gXy5nZXQoZ2V0U3RhdGUoKSwgcGF0aC5jb25jYXQobG93ZXJGaXJzdChuYW1lKSkpXG4gICAgICBjb25zdCBpc0ZldGNoaW5nID0gc3RhdGUuaXNGZXRjaGluZyguLi5hcmdzKVxuICAgICAgY29uc3QgaGFzRmV0Y2hlZCA9IHN0YXRlLmhhc0ZldGNoZWQoLi4uYXJncylcbiAgICAgIGNvbnN0IGhhc0ZhaWxlZFRvRmV0Y2ggPSBzdGF0ZS5oYXNGYWlsZWRUb0ZldGNoKC4uLmFyZ3MpXG5cbiAgICAgIGlmIChpc0ZldGNoaW5nIHx8ICghZm9yY2UgJiYgaGFzRmV0Y2hlZCkgfHwgKCFmb3JjZSAmJiBoYXNGYWlsZWRUb0ZldGNoKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgdXJsID0gY3JlYXRlVXJsKC4uLmFyZ3MpXG4gICAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoYXJncylcbiAgICAgIGNvbnN0IHJlcXVlc3RPcHRpb25zID0ge1xuICAgICAgICB0aW1lb3V0OiBSRVFVRVNUX1RJTUVPVVRcbiAgICAgIH1cblxuICAgICAgZGlzcGF0Y2goe1xuICAgICAgICBwYXlsb2FkOiB7IGtleSB9LFxuICAgICAgICB0eXBlOiBoYXNGZXRjaGVkID8gUkVGUkVTSElORyA6IElOX1BST0dSRVNTXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gYXhpb3NcbiAgICAgICAgLmdldCh1cmwsIHJlcXVlc3RPcHRpb25zKVxuICAgICAgICAudGhlbihvblJlc3BvbnNlKVxuICAgICAgICAuY2F0Y2goZGlzcGF0Y2hFcnJvcilcblxuICAgICAgZnVuY3Rpb24gb25SZXNwb25zZSAoeyBkYXRhIH0pIHtcbiAgICAgICAgaWYgKGlzUmVzcG9uc2VWYWxpZChkYXRhKSkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEltbXV0YWJsZS5mcm9tSlMoZGF0YSlcblxuICAgICAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgICAgIHR5cGU6IEZJTklTSEVELFxuICAgICAgICAgICAgcGF5bG9hZDogeyBrZXksIHJlc3VsdCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaXNwYXRjaEVycm9yKHtcbiAgICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1VuYWNjZXB0YWJsZSByZXNwb25zZSdcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGRpc3BhdGNoRXJyb3IgKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlZHVjZSAke0ZJTklTSEVEfS4gVGhpcyBpcyBwcm9iYWJseSBhbiBlcnJvciBpbiB5b3VyIHJlZHVjZXIgb3IgYSBcXGBjb25uZWN0XFxgLmAsIGVycm9yKVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgIHR5cGU6IEZBSUxFRCxcbiAgICAgICAgICBlcnJvcjogdHJ1ZSxcbiAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIHN0YXR1czogZXJyb3Iuc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVkdWNlckZvckNvbGxlY3Rpb24gKG5hbWUsIHBsdXJhbE5hbWUsIGNvbnN0YW50cykge1xuICBjb25zdCB7XG4gICAgRkFJTEVELFxuICAgIERFTEVURSxcbiAgICBVUERBVEUsXG4gICAgRklOSVNIRUQsXG4gICAgSU5fUFJPR1JFU1MsXG4gICAgRkVUQ0hfRkFJTEVELFxuICAgIEZFVENIX0ZJTklTSEVELFxuICAgIEZFVENIX0lOX1BST0dSRVNTXG4gIH0gPSBjb25zdGFudHNcblxuICBjb25zdCBGZXRjaFJlY29yZCA9IEltbXV0YWJsZS5SZWNvcmQoe1xuICAgIGZldGNoZXM6IEltbXV0YWJsZS5NYXAoKVxuICB9KVxuXG4gIGNsYXNzIEZldGNoU3RhdGUgZXh0ZW5kcyBGZXRjaFJlY29yZCB7XG4gICAgZ2V0QWxsSXRlbXMgKC4uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IGZldGNoID0gdGhpcy5nZXRGZXRjaChhcmdzKVxuXG4gICAgICBpZiAoZmV0Y2guZ2V0KCdzdGF0dXMnKSA9PT0gRkVUQ0hfRklOSVNIRUQpIHtcbiAgICAgICAgcmV0dXJuIGZldGNoLmdldCgncmVzdWx0JylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRJdGVtQnlJZCAoLi4uYXJncykge1xuICAgICAgY29uc3QgaWQgPSBfLmxhc3QoYXJncylcbiAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5nZXRBbGxJdGVtcy5hcHBseSh0aGlzLCBfLmluaXRpYWwoYXJncykpXG5cbiAgICAgIGlmIChpdGVtcykge1xuICAgICAgICByZXR1cm4gaXRlbXMuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICAgIHJldHVybiBpdGVtLmdldCgnaWQnKSA9PT0gaWRcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgaGFzRmV0Y2hlZCAoLi4uYXJncykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdHVzKGFyZ3MpID09PSBGRVRDSF9GSU5JU0hFRFxuICAgIH1cbiAgICBpc0ZldGNoaW5nICguLi5hcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRTdGF0dXMoYXJncykgPT09IEZFVENIX0lOX1BST0dSRVNTXG4gICAgfVxuICAgIGhhc0ZhaWxlZFRvRmV0Y2ggKC4uLmFyZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFN0YXR1cyhhcmdzKSA9PT0gRkVUQ0hfRkFJTEVEXG4gICAgfVxuICAgIGdldFN0YXR1cyAoYXJncykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0RmV0Y2goYXJncykuZ2V0KCdzdGF0dXMnKVxuICAgIH1cbiAgICBnZXRGZXRjaCAoYXJncykge1xuICAgICAgY29uc3Qga2V5ID0gY3JlYXRlS2V5KGFyZ3MpXG5cbiAgICAgIHJldHVybiB0aGlzLmZldGNoZXMuZ2V0KGtleSkgfHwgbmV3IEltbXV0YWJsZS5NYXAoKVxuICAgIH1cbiAgfVxuXG4gIGFkZEZ1bmN0aW9uQWxpYXMoJ2dldEl0ZW1CeUlkJywgYGdldCR7bmFtZX1CeUlkYClcbiAgYWRkRnVuY3Rpb25BbGlhcygnZ2V0QWxsSXRlbXMnLCBgZ2V0QWxsJHtwbHVyYWxOYW1lfWApXG4gIGFkZEZ1bmN0aW9uQWxpYXMoJ2lzRmV0Y2hpbmcnLCBgaXNGZXRjaGluZyR7cGx1cmFsTmFtZX1gKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdoYXNGZXRjaGVkJywgYGhhc0ZldGNoZWQke3BsdXJhbE5hbWV9YClcbiAgYWRkRnVuY3Rpb25BbGlhcygnaGFzRmFpbGVkVG9GZXRjaCcsIGBoYXNGYWlsZWRUb0ZldGNoJHtwbHVyYWxOYW1lfWApXG5cbiAgcmV0dXJuIGNyZWF0ZVJlZHVjZXIobmV3IEZldGNoU3RhdGUoKSwge1xuICAgIFtERUxFVEVdOiBkZWxldGVJdGVtLFxuICAgIFtVUERBVEVdOiB1cGRhdGUsXG4gICAgW0ZBSUxFRF06IHNldFN0YXR1cyhGRVRDSF9GQUlMRUQpLFxuICAgIFtJTl9QUk9HUkVTU106IHNldFN0YXR1cyhGRVRDSF9JTl9QUk9HUkVTUyksXG4gICAgW0ZJTklTSEVEXTogW3NldFN0YXR1cyhGRVRDSF9GSU5JU0hFRCksIHNldFJlc3VsdF1cbiAgfSlcblxuICBmdW5jdGlvbiBhZGRGdW5jdGlvbkFsaWFzIChmdW5jLCBhbGlhcykge1xuICAgIEZldGNoU3RhdGUucHJvdG90eXBlW2FsaWFzXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzW2Z1bmNdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWxldGVJdGVtIChzdGF0ZSwgeyBrZXksIGlkIH0pIHtcbiAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZldGNoZXNcbiAgICAgICAgLmdldEluKFtrZXksICdyZXN1bHQnXSlcbiAgICAgICAgLmZpbHRlcihpdGVtc1dpdGhXcm9uZ0lkKVxuXG4gICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAncmVzdWx0J10sIHJlc3VsdClcbiAgICB9KVxuXG4gICAgZnVuY3Rpb24gaXRlbXNXaXRoV3JvbmdJZCAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0KCdpZCcpICE9PSBpZFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSAoc3RhdGUsIHsga2V5LCBpZCwgaXRlbSB9KSB7XG4gICAgcmV0dXJuIHN0YXRlLnVwZGF0ZSgnZmV0Y2hlcycsIChmZXRjaGVzKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IGZldGNoZXNcbiAgICAgICAgLmdldEluKFtrZXksICdyZXN1bHQnXSlcbiAgICAgICAgLmZpbmRJbmRleChpdGVtV2l0aElkKVxuXG4gICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAncmVzdWx0JywgaW5kZXhdLCBpdGVtKVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBpdGVtV2l0aElkIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXQoJ2lkJykgPT09IGlkXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0UmVzdWx0IChzdGF0ZSwgeyBrZXksIHJlc3VsdCB9KSB7XG4gICAgcmV0dXJuIHN0YXRlLnVwZGF0ZSgnZmV0Y2hlcycsIChmZXRjaGVzKSA9PiB7XG4gICAgICBjb25zdCBleGlzdGluZ1Jlc3VsdCA9IGZldGNoZXMuZ2V0SW4oW2tleSwgJ3Jlc3VsdCddKVxuXG4gICAgICBpZiAoZXhpc3RpbmdSZXN1bHQpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChleGlzdGluZ1Jlc3VsdClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZldGNoZXMuc2V0SW4oW2tleSwgJ3Jlc3VsdCddLCByZXN1bHQpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFN0YXR1cyAoc3RhdHVzKSB7XG4gICAgcmV0dXJuIChzdGF0ZSwgeyBrZXkgfSkgPT4ge1xuICAgICAgcmV0dXJuIHN0YXRlLnVwZGF0ZSgnZmV0Y2hlcycsIChmZXRjaGVzKSA9PiB7XG4gICAgICAgIHJldHVybiBmZXRjaGVzLnNldEluKFtrZXksICdzdGF0dXMnXSwgc3RhdHVzKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlS2V5IChhcmdzKSB7XG4gIGludmFyaWFudChfLmlzQXJyYXkoYXJncyksICdgYXJnc2AgbXVzdCBiZSBhbiBhcnJheScpXG5cbiAgcmV0dXJuIGFyZ3Muam9pbignLScpXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnN0YW50cyAobmFtZSwgcGx1cmFsTmFtZSkge1xuICBjb25zdCBjb25zdGFudFBsdXJhbE5hbWUgPSBgRkVUQ0hfJHtwbHVyYWxOYW1lLnRvVXBwZXJDYXNlKCl9YFxuXG4gIGNvbnN0IEZFVENIX0ZBSUxFRCA9ICdGRVRDSF9GQUlMRUQnXG4gIGNvbnN0IEZFVENIX0ZJTklTSEVEID0gJ0ZFVENIX0ZJTklTSEVEJ1xuICBjb25zdCBGRVRDSF9JTl9QUk9HUkVTUyA9ICdGRVRDSF9JTl9QUk9HUkVTUydcbiAgY29uc3QgSU5fUFJPR1JFU1MgPSBgJHtjb25zdGFudFBsdXJhbE5hbWV9X0lOX1BST0dSRVNTYFxuICBjb25zdCBSRUZSRVNISU5HID0gYCR7Y29uc3RhbnRQbHVyYWxOYW1lfV9SRUZSRVNISU5HYFxuICBjb25zdCBGSU5JU0hFRCA9IGAke2NvbnN0YW50UGx1cmFsTmFtZX1fRklOSVNIRURgXG4gIGNvbnN0IEZBSUxFRCA9IGAke2NvbnN0YW50UGx1cmFsTmFtZX1fRkFJTEVEYFxuICBjb25zdCBERUxFVEUgPSBgREVMRVRFXyR7bmFtZS50b1VwcGVyQ2FzZSgpfWBcbiAgY29uc3QgVVBEQVRFID0gYFVQREFURV8ke25hbWUudG9VcHBlckNhc2UoKX1gXG5cbiAgcmV0dXJuIHtcbiAgICBGQUlMRUQsXG4gICAgREVMRVRFLFxuICAgIFVQREFURSxcbiAgICBGSU5JU0hFRCxcbiAgICBJTl9QUk9HUkVTUyxcbiAgICBSRUZSRVNISU5HLFxuICAgIEZFVENIX0ZBSUxFRCxcbiAgICBGRVRDSF9GSU5JU0hFRCxcbiAgICBGRVRDSF9JTl9QUk9HUkVTU1xuICB9XG59XG4iXX0=