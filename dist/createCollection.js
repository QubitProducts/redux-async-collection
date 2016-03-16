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
  var reducer = createReducerForCollection(name, pluralName, constants);
  var fetch = createFetchForCollection(pluralName, createUrl, isResponseValid, constants);

  return _ref = {}, _defineProperty(_ref, 'add' + name, add), _defineProperty(_ref, 'fetch' + pluralName, fetch), _defineProperty(_ref, 'delete' + name, deleteItem), _defineProperty(_ref, pluralName.toLowerCase(), reducer), _ref;
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

function createFetchForCollection(name, createUrl, isResponseValid, constants) {
  var FAILED = constants.FAILED;
  var FINISHED = constants.FINISHED;
  var IN_PROGRESS = constants.IN_PROGRESS;


  return function fetch() {
    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
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

      function onResponse(_ref4) {
        var data = _ref4.data;

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
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var fetch = this.getFetch(args);

        if (fetch.get('status') === FETCH_FINISHED) {
          return fetch.get('result');
        }
      }
    }, {
      key: 'getItemById',
      value: function getItemById() {
        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          args[_key5] = arguments[_key5];
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
        for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
          args[_key6] = arguments[_key6];
        }

        return this.getStatus(args) === FETCH_FINISHED;
      }
    }, {
      key: 'isFetching',
      value: function isFetching() {
        for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
          args[_key7] = arguments[_key7];
        }

        return this.getStatus(args) === FETCH_IN_PROGRESS;
      }
    }, {
      key: 'hasFailedToFetch',
      value: function hasFailedToFetch() {
        for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
          args[_key8] = arguments[_key8];
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

  return (0, _createReducer3.default)(new FetchState(), (_createReducer = {}, _defineProperty(_createReducer, DELETE, deleteItem), _defineProperty(_createReducer, FAILED, setStatus(FETCH_FAILED)), _defineProperty(_createReducer, IN_PROGRESS, setStatus(FETCH_IN_PROGRESS)), _defineProperty(_createReducer, FINISHED, [setStatus(FETCH_FINISHED), setResult]), _createReducer));

  function addFunctionAlias(func, alias) {
    FetchState.prototype[alias] = function () {
      return this[func].apply(this, arguments);
    };
  }

  function deleteItem(state, _ref5) {
    var key = _ref5.key;
    var id = _ref5.id;

    return state.update('fetches', function (fetches) {
      var result = fetches.getIn([key, 'result']).filter(itemsWithWrongId);

      return fetches.setIn([key, 'result'], result);
    });

    function itemsWithWrongId(item) {
      return item.get('id') !== id;
    }
  }

  function setResult(state, _ref6) {
    var key = _ref6.key;
    var result = _ref6.result;

    return state.update('fetches', function (fetches) {
      var existingResult = fetches.getIn([key, 'result']);

      if (existingResult) {
        result = result.concat(existingResult);
      }

      return fetches.setIn([key, 'result'], result);
    });
  }

  function setStatus(status) {
    return function (state, _ref7) {
      var key = _ref7.key;

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

  return {
    FAILED: FAILED,
    DELETE: DELETE,
    FINISHED: FINISHED,
    IN_PROGRESS: IN_PROGRESS,
    FETCH_FAILED: FETCH_FAILED,
    FETCH_FINISHED: FETCH_FINISHED,
    FETCH_IN_PROGRESS: FETCH_IN_PROGRESS
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVDb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztrQkFRd0I7O0FBUnhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FBRU8sSUFBTSw0Q0FBa0IsSUFBbEI7O0FBRUUsU0FBUyxnQkFBVCxDQUEyQixJQUEzQixFQUFpQyxTQUFqQyxFQUF5RTs7O01BQTdCLHdFQUFrQixpQkFBRSxPQUFGLGdCQUFXOztBQUN0RiwyQkFBVSxpQkFBRSxRQUFGLENBQVcsSUFBWCxDQUFWLEVBQTRCLGlCQUE1QixFQURzRjs7QUFHdEYsTUFBTSxhQUFhLGlCQUFFLFVBQUYsQ0FBYSxPQUFPLEdBQVAsQ0FBMUIsQ0FIZ0Y7QUFJdEYsTUFBTSxZQUFZLGdCQUFnQixJQUFoQixFQUFzQixVQUF0QixDQUFaLENBSmdGOztBQU10RixNQUFNLE1BQU0sVUFBVSxJQUFWLEVBQWdCLFNBQWhCLENBQU4sQ0FOZ0Y7QUFPdEYsTUFBTSxhQUFhLGlCQUFpQixJQUFqQixFQUF1QixTQUF2QixDQUFiLENBUGdGO0FBUXRGLE1BQU0sVUFBVSwyQkFBMkIsSUFBM0IsRUFBaUMsVUFBakMsRUFBNkMsU0FBN0MsQ0FBVixDQVJnRjtBQVN0RixNQUFNLFFBQVEseUJBQXlCLFVBQXpCLEVBQXFDLFNBQXJDLEVBQWdELGVBQWhELEVBQWlFLFNBQWpFLENBQVIsQ0FUZ0Y7O0FBV3RGLGtEQUNTLE1BQVMsc0NBQ1AsWUFBZSx5Q0FDZCxNQUFTLG1DQUNsQixXQUFXLFdBQVgsSUFBMkIsY0FKOUIsQ0FYc0Y7Q0FBekU7O0FBbUJmLFNBQVMsU0FBVCxDQUFvQixJQUFwQixTQUF3QztNQUFaLDBCQUFZOztBQUN0QyxTQUFPLFNBQVMsR0FBVCxHQUF1QjtzQ0FBTjs7S0FBTTs7QUFDNUIsUUFBTSxPQUFPLGlCQUFFLElBQUYsQ0FBTyxJQUFQLENBQVAsQ0FEc0I7QUFFNUIsUUFBTSxNQUFNLFVBQVUsaUJBQUUsT0FB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UyxTQUFULENBQW9CLElBQXBCLEVBQTBCO0FBQ3hCLDJCQUFVLGlCQUFFLE9BQUYsQ0FBVSxJQUFWLENBQVYsRUFBMkIseUJBQTNCLEVBRHdCOztBQUd4QixTQUFPLEtBQUssSUFBTCxDQUFVLEdBQVYsQ0FBUCxDQUh3QjtDQUExQjs7QUFNQSxTQUFTLGVBQVQsQ0FBMEIsSUFBMUIsRUFBZ0MsVUFBaEMsRUFBNEM7QUFDMUMsTUFBTSxnQ0FBOEIsV0FBVyxXQUFYLEVBQTlCLENBRG9DOztBQUcxQyxNQUFNLGVBQWUsY0FBZixDQUhvQztBQUkxQyxNQUFNLGlCQUFpQixnQkFBakIsQ0FKb0M7QUFLMUMsTUFBTSxvQkFBb0IsbUJBQXBCLENBTG9DO0FBTTFDLE1BQU0sY0FBaUIsbUNBQWpCLENBTm9DO0FBTzFDLE1BQU0sV0FBYyxnQ0FBZCxDQVBvQztBQVExQyxNQUFNLFNBQVksOEJBQVosQ0FSb0M7QUFTMUMsTUFBTSxxQkFBbUIsS0FBSyxXQUFMLEVBQW5CLENBVG9DOztBQVcxQyxTQUFPO0FBQ0wsa0JBREs7QUFFTCxrQkFGSztBQUdMLHNCQUhLO0FBSUwsNEJBSks7QUFLTCw4QkFMSztBQU1MLGtDQU5LO0FBT0wsd0NBUEs7R0FBUCxDQVgwQztDQUE1QyIsImZpbGUiOiJjcmVhdGVDb2xsZWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJ1xuaW1wb3J0IEltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnXG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2ludmFyaWFudCdcbmltcG9ydCBjcmVhdGVSZWR1Y2VyIGZyb20gJy4vY3JlYXRlUmVkdWNlcidcblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfVElNRU9VVCA9IDMwMDBcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlQ29sbGVjdGlvbiAobmFtZSwgY3JlYXRlVXJsLCBpc1Jlc3BvbnNlVmFsaWQgPSBfLmlzQXJyYXkpIHtcbiAgaW52YXJpYW50KF8uaXNTdHJpbmcobmFtZSksICdgbmFtZWAgcmVxdWlyZWQnKVxuXG4gIGNvbnN0IHBsdXJhbE5hbWUgPSBfLmNhcGl0YWxpemUobmFtZSArICdzJylcbiAgY29uc3QgY29uc3RhbnRzID0gY3JlYXRlQ29uc3RhbnRzKG5hbWUsIHBsdXJhbE5hbWUpXG5cbiAgY29uc3QgYWRkID0gY3JlYXRlQWRkKG5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgZGVsZXRlSXRlbSA9IGNyZWF0ZURlbGV0ZUl0ZW0obmFtZSwgY29uc3RhbnRzKVxuICBjb25zdCByZWR1Y2VyID0gY3JlYXRlUmVkdWNlckZvckNvbGxlY3Rpb24obmFtZSwgcGx1cmFsTmFtZSwgY29uc3RhbnRzKVxuICBjb25zdCBmZXRjaCA9IGNyZWF0ZUZldGNoRm9yQ29sbGVjdGlvbihwbHVyYWxOYW1lLCBjcmVhdGVVcmwsIGlzUmVzcG9uc2VWYWxpZCwgY29uc3RhbnRzKVxuXG4gIHJldHVybiB7XG4gICAgW2BhZGQke25hbWV9YF06IGFkZCxcbiAgICBbYGZldGNoJHtwbHVyYWxOYW1lfWBdOiBmZXRjaCxcbiAgICBbYGRlbGV0ZSR7bmFtZX1gXTogZGVsZXRlSXRlbSxcbiAgICBbcGx1cmFsTmFtZS50b0xvd2VyQ2FzZSgpXTogcmVkdWNlclxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkZCAobmFtZSwgeyBGSU5JU0hFRCB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiBhZGQgKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVtID0gXy5sYXN0KGFyZ3MpXG4gICAgY29uc3Qga2V5ID0gY3JlYXRlS2V5KF8uaW5pdGlhbChhcmdzKSlcbiAgICBjb25zdCByZXN1bHQgPSBJbW11dGFibGUuZnJvbUpTKFtpdGVtXSlcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBGSU5JU0hFRCxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCByZXN1bHQgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWxldGVJdGVtIChuYW1lLCB7IERFTEVURSB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiBkZWxldGVJdGVtICguLi5hcmdzKSB7XG4gICAgY29uc3QgaWQgPSBfLmxhc3QoYXJncylcbiAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoXy5pbml0aWFsKGFyZ3MpKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IERFTEVURSxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCBpZCB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZldGNoRm9yQ29sbGVjdGlvbiAobmFtZSwgY3JlYXRlVXJsLCBpc1Jlc3BvbnNlVmFsaWQsIGNvbnN0YW50cykge1xuICBjb25zdCB7IEZBSUxFRCwgRklOSVNIRUQsIElOX1BST0dSRVNTIH0gPSBjb25zdGFudHNcblxuICByZXR1cm4gZnVuY3Rpb24gZmV0Y2ggKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRpc3BhdGNoLCBnZXRTdGF0ZSkge1xuICAgICAgY29uc3Qgc3RhdGUgPSBnZXRTdGF0ZSgpW25hbWUudG9Mb3dlckNhc2UoKV1cbiAgICAgIGNvbnN0IGlzRmV0Y2hpbmcgPSBzdGF0ZS5pc0ZldGNoaW5nKC4uLmFyZ3MpXG4gICAgICBjb25zdCBoYXNGZXRjaGVkID0gc3RhdGUuaGFzRmV0Y2hlZCguLi5hcmdzKVxuICAgICAgY29uc3QgaGFzRmFpbGVkVG9GZXRjaCA9IHN0YXRlLmhhc0ZhaWxlZFRvRmV0Y2goLi4uYXJncylcblxuICAgICAgaWYgKGlzRmV0Y2hpbmcgfHwgaGFzRmV0Y2hlZCB8fCBoYXNGYWlsZWRUb0ZldGNoKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCB1cmwgPSBjcmVhdGVVcmwoLi4uYXJncylcbiAgICAgIGNvbnN0IGtleSA9IGNyZWF0ZUtleShhcmdzKVxuICAgICAgY29uc3QgcmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICAgIHRpbWVvdXQ6IFJFUVVFU1RfVElNRU9VVFxuICAgICAgfVxuXG4gICAgICBkaXNwYXRjaCh7XG4gICAgICAgIHBheWxvYWQ6IHsga2V5IH0sXG4gICAgICAgIHR5cGU6IElOX1BST0dSRVNTXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gYXhpb3NcbiAgICAgICAgLmdldCh1cmwsIHJlcXVlc3RPcHRpb25zKVxuICAgICAgICAudGhlbihvblJlc3BvbnNlKVxuICAgICAgICAuY2F0Y2goZGlzcGF0Y2hFcnJvcilcblxuICAgICAgZnVuY3Rpb24gb25SZXNwb25zZSAoeyBkYXRhIH0pIHtcbiAgICAgICAgaWYgKGlzUmVzcG9uc2VWYWxpZChkYXRhKSkge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IEltbXV0YWJsZS5mcm9tSlMoZGF0YSlcblxuICAgICAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgICAgIHR5cGU6IEZJTklTSEVELFxuICAgICAgICAgICAgcGF5bG9hZDogeyBrZXksIHJlc3VsdCB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaXNwYXRjaEVycm9yKHtcbiAgICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1VuYWNjZXB0YWJsZSByZXNwb25zZSdcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGRpc3BhdGNoRXJyb3IgKGVycm9yKSB7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlZHVjZSAke0ZJTklTSEVEfS4gVGhpcyBpcyBwcm9iYWJseSBhbiBlcnJvciBpbiB5b3VyIHJlZHVjZXIgb3IgYSBcXGBjb25uZWN0XFxgLmAsIGVycm9yKVxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgIHR5cGU6IEZBSUxFRCxcbiAgICAgICAgICBlcnJvcjogdHJ1ZSxcbiAgICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIHN0YXR1czogZXJyb3Iuc3RhdHVzLFxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVkdWNlckZvckNvbGxlY3Rpb24gKG5hbWUsIHBsdXJhbE5hbWUsIGNvbnN0YW50cykge1xuICBjb25zdCB7XG4gICAgRkFJTEVELFxuICAgIERFTEVURSxcbiAgICBGSU5JU0hFRCxcbiAgICBJTl9QUk9HUkVTUyxcbiAgICBGRVRDSF9GQUlMRUQsXG4gICAgRkVUQ0hfRklOSVNIRUQsXG4gICAgRkVUQ0hfSU5fUFJPR1JFU1NcbiAgfSA9IGNvbnN0YW50c1xuXG4gIGNvbnN0IEZldGNoUmVjb3JkID0gSW1tdXRhYmxlLlJlY29yZCh7XG4gICAgZmV0Y2hlczogSW1tdXRhYmxlLk1hcCgpXG4gIH0pXG5cbiAgY2xhc3MgRmV0Y2hTdGF0ZSBleHRlbmRzIEZldGNoUmVjb3JkIHtcbiAgICBnZXRBbGxJdGVtcyAoLi4uYXJncykge1xuICAgICAgY29uc3QgZmV0Y2ggPSB0aGlzLmdldEZldGNoKGFyZ3MpXG5cbiAgICAgIGlmIChmZXRjaC5nZXQoJ3N0YXR1cycpID09PSBGRVRDSF9GSU5JU0hFRCkge1xuICAgICAgICByZXR1cm4gZmV0Y2guZ2V0KCdyZXN1bHQnKVxuICAgICAgfVxuICAgIH1cblxuICAgIGdldEl0ZW1CeUlkICguLi5hcmdzKSB7XG4gICAgICBjb25zdCBpZCA9IF8ubGFzdChhcmdzKVxuICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmdldEFsbEl0ZW1zLmFwcGx5KHRoaXMsIF8uaW5pdGlhbChhcmdzKSlcblxuICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgIHJldHVybiBpdGVtcy5maW5kKChpdGVtKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0uZ2V0KCdpZCcpID09PSBpZFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICBoYXNGZXRjaGVkICguLi5hcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRTdGF0dXMoYXJncykgPT09IEZFVENIX0ZJTklTSEVEXG4gICAgfVxuICAgIGlzRmV0Y2hpbmcgKC4uLmFyZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFN0YXR1cyhhcmdzKSA9PT0gRkVUQ0hfSU5fUFJPR1JFU1NcbiAgICB9XG4gICAgaGFzRmFpbGVkVG9GZXRjaCAoLi4uYXJncykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdHVzKGFyZ3MpID09PSBGRVRDSF9GQUlMRURcbiAgICB9XG4gICAgZ2V0U3RhdHVzIChhcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRGZXRjaChhcmdzKS5nZXQoJ3N0YXR1cycpXG4gICAgfVxuICAgIGdldEZldGNoIChhcmdzKSB7XG4gICAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoYXJncylcblxuICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hlcy5nZXQoa2V5KSB8fCBuZXcgSW1tdXRhYmxlLk1hcCgpXG4gICAgfVxuICB9XG5cbiAgYWRkRnVuY3Rpb25BbGlhcygnZ2V0SXRlbUJ5SWQnLCBgZ2V0JHtuYW1lfUJ5SWRgKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdnZXRBbGxJdGVtcycsIGBnZXRBbGwke3BsdXJhbE5hbWV9YClcbiAgYWRkRnVuY3Rpb25BbGlhcygnaXNGZXRjaGluZycsIGBpc0ZldGNoaW5nJHtwbHVyYWxOYW1lfWApXG4gIGFkZEZ1bmN0aW9uQWxpYXMoJ2hhc0ZldGNoZWQnLCBgaGFzRmV0Y2hlZCR7cGx1cmFsTmFtZX1gKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdoYXNGYWlsZWRUb0ZldGNoJywgYGhhc0ZhaWxlZFRvRmV0Y2gke3BsdXJhbE5hbWV9YClcblxuICByZXR1cm4gY3JlYXRlUmVkdWNlcihuZXcgRmV0Y2hTdGF0ZSgpLCB7XG4gICAgW0RFTEVURV06IGRlbGV0ZUl0ZW0sXG4gICAgW0ZBSUxFRF06IHNldFN0YXR1cyhGRVRDSF9GQUlMRUQpLFxuICAgIFtJTl9QUk9HUkVTU106IHNldFN0YXR1cyhGRVRDSF9JTl9QUk9HUkVTUyksXG4gICAgW0ZJTklTSEVEXTogW3NldFN0YXR1cyhGRVRDSF9GSU5JU0hFRCksIHNldFJlc3VsdF1cbiAgfSlcblxuICBmdW5jdGlvbiBhZGRGdW5jdGlvbkFsaWFzIChmdW5jLCBhbGlhcykge1xuICAgIEZldGNoU3RhdGUucHJvdG90eXBlW2FsaWFzXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB0aGlzW2Z1bmNdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWxldGVJdGVtIChzdGF0ZSwgeyBrZXksIGlkIH0pIHtcbiAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGZldGNoZXNcbiAgICAgICAgLmdldEluKFtrZXksICdyZXN1bHQnXSlcbiAgICAgICAgLmZpbHRlcihpdGVtc1dpdGhXcm9uZ0lkKVxuXG4gICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAncmVzdWx0J10sIHJlc3VsdClcbiAgICB9KVxuXG4gICAgZnVuY3Rpb24gaXRlbXNXaXRoV3JvbmdJZCAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0uZ2V0KCdpZCcpICE9PSBpZFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFJlc3VsdCAoc3RhdGUsIHsga2V5LCByZXN1bHQgfSkge1xuICAgIHJldHVybiBzdGF0ZS51cGRhdGUoJ2ZldGNoZXMnLCAoZmV0Y2hlcykgPT4ge1xuICAgICAgY29uc3QgZXhpc3RpbmdSZXN1bHQgPSBmZXRjaGVzLmdldEluKFtrZXksICdyZXN1bHQnXSlcblxuICAgICAgaWYgKGV4aXN0aW5nUmVzdWx0KSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoZXhpc3RpbmdSZXN1bHQpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmZXRjaGVzLnNldEluKFtrZXksICdyZXN1bHQnXSwgcmVzdWx0KVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBzZXRTdGF0dXMgKHN0YXR1cykge1xuICAgIHJldHVybiAoc3RhdGUsIHsga2V5IH0pID0+IHtcbiAgICAgIHJldHVybiBzdGF0ZS51cGRhdGUoJ2ZldGNoZXMnLCAoZmV0Y2hlcykgPT4ge1xuICAgICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAnc3RhdHVzJ10sIHN0YXR1cylcbiAgICAgIH0pXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUtleSAoYXJncykge1xuICBpbnZhcmlhbnQoXy5pc0FycmF5KGFyZ3MpLCAnYGFyZ3NgIG11c3QgYmUgYW4gYXJyYXknKVxuXG4gIHJldHVybiBhcmdzLmpvaW4oJy0nKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDb25zdGFudHMgKG5hbWUsIHBsdXJhbE5hbWUpIHtcbiAgY29uc3QgY29uc3RhbnRQbHVyYWxOYW1lID0gYEZFVENIXyR7cGx1cmFsTmFtZS50b1VwcGVyQ2FzZSgpfWBcblxuICBjb25zdCBGRVRDSF9GQUlMRUQgPSAnRkVUQ0hfRkFJTEVEJ1xuICBjb25zdCBGRVRDSF9GSU5JU0hFRCA9ICdGRVRDSF9GSU5JU0hFRCdcbiAgY29uc3QgRkVUQ0hfSU5fUFJPR1JFU1MgPSAnRkVUQ0hfSU5fUFJPR1JFU1MnXG4gIGNvbnN0IElOX1BST0dSRVNTID0gYCR7Y29uc3RhbnRQbHVyYWxOYW1lfV9JTl9QUk9HUkVTU2BcbiAgY29uc3QgRklOSVNIRUQgPSBgJHtjb25zdGFudFBsdXJhbE5hbWV9X0ZJTklTSEVEYFxuICBjb25zdCBGQUlMRUQgPSBgJHtjb25zdGFudFBsdXJhbE5hbWV9X0ZBSUxFRGBcbiAgY29uc3QgREVMRVRFID0gYERFTEVURV8ke25hbWUudG9VcHBlckNhc2UoKX1gXG5cbiAgcmV0dXJuIHtcbiAgICBGQUlMRUQsXG4gICAgREVMRVRFLFxuICAgIEZJTklTSEVELFxuICAgIElOX1BST0dSRVNTLFxuICAgIEZFVENIX0ZBSUxFRCxcbiAgICBGRVRDSF9GSU5JU0hFRCxcbiAgICBGRVRDSF9JTl9QUk9HUkVTU1xuICB9XG59XG4iXX0=