'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REQUEST_TIMEOUT = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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

  var isResponseValid = arguments.length <= 2 || arguments[2] === undefined ? _lodash2.default.isArray : arguments[2];

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
  var fetch = createFetchForCollection(pluralName, createUrl, isResponseValid, constants, path);

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

function lowerFirst() {
  var str = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  return str[0].toLowerCase() + str.substring(1);
}

function createFetchForCollection(name, createUrl, isResponseValid, constants, path) {
  var FAILED = constants.FAILED;
  var FINISHED = constants.FINISHED;
  var IN_PROGRESS = constants.IN_PROGRESS;


  return function fetch() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return function (dispatch, getState) {
      var state = _lodash2.default.get(getState(), path.concat(lowerFirst(name)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVDb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O2tCQVN3QixnQjs7QUFUeEI7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztBQUVPLElBQU0sNENBQWtCLEtBQXhCLEMsQ0FBOEI7O0FBRXRCLFNBQVMsZ0JBQVQsQ0FBMkIsSUFBM0IsRUFBaUMsU0FBakMsRUFBeUU7QUFBQTs7QUFBQSxNQUE3QixlQUE2Qix5REFBWCxpQkFBRSxPQUFTOztBQUN0RixNQUFJLFNBQVMsRUFBYjtBQUNBLE1BQUksUUFBTyxJQUFQLHlDQUFPLElBQVAsT0FBZ0IsUUFBcEIsRUFBOEI7QUFDNUIsYUFBUyxJQUFUO0FBQ0EsV0FBTyxPQUFPLElBQWQ7QUFDQSxnQkFBWSxPQUFPLFNBQW5CO0FBQ0Esc0JBQWtCLE9BQU8sZUFBUCxJQUEwQixpQkFBRSxPQUE5QztBQUNEOztBQUVELDJCQUFVLGlCQUFFLFFBQUYsQ0FBVyxJQUFYLENBQVYsRUFBNEIsaUJBQTVCOztBQUVBLE1BQU0sT0FBTyxHQUFHLE1BQUgsQ0FBVSxPQUFPLElBQVAsSUFBZSxFQUF6QixDQUFiOztBQUVBLE1BQU0sYUFBYSxpQkFBRSxVQUFGLENBQWEseUJBQVUsSUFBVixDQUFiLENBQW5CO0FBQ0EsTUFBTSxZQUFZLGdCQUFnQixJQUFoQixFQUFzQixVQUF0QixDQUFsQjs7QUFFQSxNQUFNLE1BQU0sVUFBVSxJQUFWLEVBQWdCLFNBQWhCLENBQVo7QUFDQSxNQUFNLGFBQWEsaUJBQWlCLElBQWpCLEVBQXVCLFNBQXZCLENBQW5CO0FBQ0EsTUFBTSxTQUFTLGFBQWEsSUFBYixFQUFtQixTQUFuQixDQUFmO0FBQ0EsTUFBTSxVQUFVLDJCQUEyQixJQUEzQixFQUFpQyxVQUFqQyxFQUE2QyxTQUE3QyxDQUFoQjtBQUNBLE1BQU0sUUFBUSx5QkFBeUIsVUFBekIsRUFBcUMsU0FBckMsRUFBZ0QsZUFBaEQsRUFBaUUsU0FBakUsRUFBNEUsSUFBNUUsQ0FBZDs7QUFFQSxrREFDUyxJQURULEVBQ2tCLEdBRGxCLG1DQUVXLFVBRlgsRUFFMEIsS0FGMUIsb0NBR1ksSUFIWixFQUdxQixVQUhyQixvQ0FJWSxJQUpaLEVBSXFCLE1BSnJCLHlCQUtHLFdBQVcsV0FBWCxFQUxILEVBSzhCLE9BTDlCO0FBT0Q7O0FBRUQsU0FBUyxTQUFULENBQW9CLElBQXBCLFNBQXdDO0FBQUEsTUFBWixRQUFZLFNBQVosUUFBWTs7QUFDdEMsU0FBTyxTQUFTLEdBQVQsR0FBdUI7QUFBQSxzQ0FBTixJQUFNO0FBQU4sVUFBTTtBQUFBOztBQUM1QixRQUFNLE9BQU8saUJBQUUsSUFBRixDQUFPLElBQVAsQ0FBYjtBQUNBLFFBQU0sTUFBTSxVQUFVLGlCQUFFLE9BQUYsQ0FBVSxJQUFWLENBQVYsQ0FBWjtBQUNBLFFBQU0sU0FBUyxvQkFBVSxNQUFWLENBQWlCLENBQUMsSUFBRCxDQUFqQixDQUFmOztBQUVBLFdBQU87QUFDTCxZQUFNLFFBREQ7QUFFTCxlQUFTLEVBQUUsUUFBRixFQUFPLGNBQVA7QUFGSixLQUFQO0FBSUQsR0FURDtBQVVEOztBQUVELFNBQVMsZ0JBQVQsQ0FBMkIsSUFBM0IsU0FBNkM7QUFBQSxNQUFWLE1BQVUsU0FBVixNQUFVOztBQUMzQyxTQUFPLFNBQVMsVUFBVCxHQUE4QjtBQUFBLHVDQUFOLElBQU07QUFBTixVQUFNO0FBQUE7O0FBQ25DLFFBQU0sS0FBSyxpQkFBRSxJQUFGLENBQU8sSUFBUCxDQUFYO0FBQ0EsUUFBTSxNQUFNLFVBQVUsaUJBQUUsT0FBRixDQUFVLElBQVYsQ0FBVixDQUFaOztBQUVBLFdBQU87QUFDTCxZQUFNLE1BREQ7QUFFTCxlQUFTLEVBQUUsUUFBRixFQUFPLE1BQVA7QUFGSixLQUFQO0FBSUQsR0FSRDtBQVNEOztBQUVELFNBQVMsWUFBVCxDQUF1QixJQUF2QixTQUF5QztBQUFBLE1BQVYsTUFBVSxTQUFWLE1BQVU7O0FBQ3ZDLFNBQU8sU0FBUyxNQUFULEdBQTBCO0FBQUEsdUNBQU4sSUFBTTtBQUFOLFVBQU07QUFBQTs7QUFDL0IsUUFBTSxPQUFPLG9CQUFVLE1BQVYsQ0FBaUIsaUJBQUUsSUFBRixDQUFPLElBQVAsQ0FBakIsQ0FBYjtBQUNBLFFBQU0sS0FBSyxLQUFLLEdBQUwsQ0FBUyxJQUFULENBQVg7QUFDQSxRQUFNLE1BQU0sVUFBVSxpQkFBRSxPQUFGLENBQVUsSUFBVixDQUFWLENBQVo7O0FBRUEsV0FBTztBQUNMLFlBQU0sTUFERDtBQUVMLGVBQVMsRUFBRSxRQUFGLEVBQU8sTUFBUCxFQUFXLFVBQVg7QUFGSixLQUFQO0FBSUQsR0FURDtBQVVEOztBQUVELFNBQVMsVUFBVCxHQUErQjtBQUFBLE1BQVYsR0FBVSx5REFBSixFQUFJOztBQUM3QixTQUFPLElBQUksQ0FBSixFQUFPLFdBQVAsS0FBdUIsSUFBSSxTQUFKLENBQWMsQ0FBZCxDQUE5QjtBQUNEOztBQUVELFNBQVMsd0JBQVQsQ0FBbUMsSUFBbkMsRUFBeUMsU0FBekMsRUFBb0QsZUFBcEQsRUFBcUUsU0FBckUsRUFBZ0YsSUFBaEYsRUFBc0Y7QUFBQSxNQUM1RSxNQUQ0RSxHQUMxQyxTQUQwQyxDQUM1RSxNQUQ0RTtBQUFBLE1BQ3BFLFFBRG9FLEdBQzFDLFNBRDBDLENBQ3BFLFFBRG9FO0FBQUEsTUFDMUQsV0FEMEQsR0FDMUMsU0FEMEMsQ0FDMUQsV0FEMEQ7OztBQUdwRixTQUFPLFNBQVMsS0FBVCxHQUF5QjtBQUFBLHVDQUFOLElBQU07QUFBTixVQUFNO0FBQUE7O0FBQzlCLFdBQU8sVUFBVSxRQUFWLEVBQW9CLFFBQXBCLEVBQThCO0FBQ25DLFVBQU0sUUFBUSxpQkFBRSxHQUFGLENBQU0sVUFBTixFQUFrQixLQUFLLE1BQUwsQ0FBWSxXQUFXLElBQVgsQ0FBWixDQUFsQixDQUFkO0FBQ0EsVUFBTSxhQUFhLE1BQU0sVUFBTixjQUFvQixJQUFwQixDQUFuQjtBQUNBLFVBQU0sYUFBYSxNQUFNLFVBQU4sY0FBb0IsSUFBcEIsQ0FBbkI7QUFDQSxVQUFNLG1CQUFtQixNQUFNLGdCQUFOLGNBQTBCLElBQTFCLENBQXpCOztBQUVBLFVBQUksY0FBYyxVQUFkLElBQTRCLGdCQUFoQyxFQUFrRDtBQUNoRDtBQUNEOztBQUVELFVBQU0sTUFBTSwyQkFBYSxJQUFiLENBQVo7QUFDQSxVQUFNLE1BQU0sVUFBVSxJQUFWLENBQVo7QUFDQSxVQUFNLGlCQUFpQjtBQUNyQixpQkFBUztBQURZLE9BQXZCOztBQUlBLGVBQVM7QUFDUCxpQkFBUyxFQUFFLFFBQUYsRUFERjtBQUVQLGNBQU07QUFGQyxPQUFUOztBQUtBLGFBQU8sZ0JBQ0osR0FESSxDQUNBLEdBREEsRUFDSyxjQURMLEVBRUosSUFGSSxDQUVDLFVBRkQsRUFHSixLQUhJLENBR0UsYUFIRixDQUFQOztBQUtBLGVBQVMsVUFBVCxRQUErQjtBQUFBLFlBQVIsSUFBUSxTQUFSLElBQVE7O0FBQzdCLFlBQUksZ0JBQWdCLElBQWhCLENBQUosRUFBMkI7QUFDekIsY0FBTSxTQUFTLG9CQUFVLE1BQVYsQ0FBaUIsSUFBakIsQ0FBZjs7QUFFQSxtQkFBUztBQUNQLGtCQUFNLFFBREM7QUFFUCxxQkFBUyxFQUFFLFFBQUYsRUFBTyxjQUFQO0FBRkYsV0FBVDtBQUlELFNBUEQsTUFPTztBQUNMLHdCQUFjO0FBQ1osb0JBQVEsR0FESTtBQUVaLHFCQUFTO0FBRkcsV0FBZDtBQUlEO0FBQ0Y7O0FBRUQsZUFBUyxhQUFULENBQXdCLEtBQXhCLEVBQStCO0FBQzdCLFlBQUksaUJBQWlCLEtBQXJCLEVBQTRCO0FBQzFCLGtCQUFRLEtBQVIsdUJBQWtDLFFBQWxDLGtFQUEyRyxLQUEzRztBQUNEOztBQUVELGlCQUFTO0FBQ1AsZ0JBQU0sTUFEQztBQUVQLGlCQUFPLElBRkE7QUFHUCxtQkFBUztBQUNQLGlCQUFLLEdBREU7QUFFUCxvQkFBUSxNQUFNLE1BRlA7QUFHUCxxQkFBUyxNQUFNO0FBSFI7QUFIRixTQUFUO0FBU0Q7QUFDRixLQXpERDtBQTBERCxHQTNERDtBQTRERDs7QUFFRCxTQUFTLDBCQUFULENBQXFDLElBQXJDLEVBQTJDLFVBQTNDLEVBQXVELFNBQXZELEVBQWtFO0FBQUE7O0FBQUEsTUFFOUQsTUFGOEQsR0FVNUQsU0FWNEQsQ0FFOUQsTUFGOEQ7QUFBQSxNQUc5RCxNQUg4RCxHQVU1RCxTQVY0RCxDQUc5RCxNQUg4RDtBQUFBLE1BSTlELE1BSjhELEdBVTVELFNBVjRELENBSTlELE1BSjhEO0FBQUEsTUFLOUQsUUFMOEQsR0FVNUQsU0FWNEQsQ0FLOUQsUUFMOEQ7QUFBQSxNQU05RCxXQU44RCxHQVU1RCxTQVY0RCxDQU05RCxXQU44RDtBQUFBLE1BTzlELFlBUDhELEdBVTVELFNBVjRELENBTzlELFlBUDhEO0FBQUEsTUFROUQsY0FSOEQsR0FVNUQsU0FWNEQsQ0FROUQsY0FSOEQ7QUFBQSxNQVM5RCxpQkFUOEQsR0FVNUQsU0FWNEQsQ0FTOUQsaUJBVDhEOzs7QUFZaEUsTUFBTSxjQUFjLG9CQUFVLE1BQVYsQ0FBaUI7QUFDbkMsYUFBUyxvQkFBVSxHQUFWO0FBRDBCLEdBQWpCLENBQXBCOztBQVpnRSxNQWdCMUQsVUFoQjBEO0FBQUE7O0FBQUE7QUFBQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQSxvQ0FpQnhDO0FBQUEsMkNBQU4sSUFBTTtBQUFOLGNBQU07QUFBQTs7QUFDcEIsWUFBTSxRQUFRLEtBQUssUUFBTCxDQUFjLElBQWQsQ0FBZDs7QUFFQSxZQUFJLE1BQU0sR0FBTixDQUFVLFFBQVYsTUFBd0IsY0FBNUIsRUFBNEM7QUFDMUMsaUJBQU8sTUFBTSxHQUFOLENBQVUsUUFBVixDQUFQO0FBQ0Q7QUFDRjtBQXZCNkQ7QUFBQTtBQUFBLG9DQXlCeEM7QUFBQSwyQ0FBTixJQUFNO0FBQU4sY0FBTTtBQUFBOztBQUNwQixZQUFNLEtBQUssaUJBQUUsSUFBRixDQUFPLElBQVAsQ0FBWDtBQUNBLFlBQU0sUUFBUSxLQUFLLFdBQUwsQ0FBaUIsS0FBakIsQ0FBdUIsSUFBdkIsRUFBNkIsaUJBQUUsT0FBRixDQUFVLElBQVYsQ0FBN0IsQ0FBZDs7QUFFQSxZQUFJLEtBQUosRUFBVztBQUNULGlCQUFPLE1BQU0sSUFBTixDQUFXLFVBQUMsSUFBRCxFQUFVO0FBQzFCLG1CQUFPLEtBQUssR0FBTCxDQUFTLElBQVQsTUFBbUIsRUFBMUI7QUFDRCxXQUZNLENBQVA7QUFHRDtBQUNGO0FBbEM2RDtBQUFBO0FBQUEsbUNBbUN6QztBQUFBLDJDQUFOLElBQU07QUFBTixjQUFNO0FBQUE7O0FBQ25CLGVBQU8sS0FBSyxTQUFMLENBQWUsSUFBZixNQUF5QixjQUFoQztBQUNEO0FBckM2RDtBQUFBO0FBQUEsbUNBc0N6QztBQUFBLDJDQUFOLElBQU07QUFBTixjQUFNO0FBQUE7O0FBQ25CLGVBQU8sS0FBSyxTQUFMLENBQWUsSUFBZixNQUF5QixpQkFBaEM7QUFDRDtBQXhDNkQ7QUFBQTtBQUFBLHlDQXlDbkM7QUFBQSwyQ0FBTixJQUFNO0FBQU4sY0FBTTtBQUFBOztBQUN6QixlQUFPLEtBQUssU0FBTCxDQUFlLElBQWYsTUFBeUIsWUFBaEM7QUFDRDtBQTNDNkQ7QUFBQTtBQUFBLGdDQTRDbkQsSUE1Q21ELEVBNEM3QztBQUNmLGVBQU8sS0FBSyxRQUFMLENBQWMsSUFBZCxFQUFvQixHQUFwQixDQUF3QixRQUF4QixDQUFQO0FBQ0Q7QUE5QzZEO0FBQUE7QUFBQSwrQkErQ3BELElBL0NvRCxFQStDOUM7QUFDZCxZQUFNLE1BQU0sVUFBVSxJQUFWLENBQVo7O0FBRUEsZUFBTyxLQUFLLE9BQUwsQ0FBYSxHQUFiLENBQWlCLEdBQWpCLEtBQXlCLElBQUksb0JBQVUsR0FBZCxFQUFoQztBQUNEO0FBbkQ2RDs7QUFBQTtBQUFBLElBZ0J2QyxXQWhCdUM7O0FBc0RoRSxtQkFBaUIsYUFBakIsVUFBc0MsSUFBdEM7QUFDQSxtQkFBaUIsYUFBakIsYUFBeUMsVUFBekM7QUFDQSxtQkFBaUIsWUFBakIsaUJBQTRDLFVBQTVDO0FBQ0EsbUJBQWlCLFlBQWpCLGlCQUE0QyxVQUE1QztBQUNBLG1CQUFpQixrQkFBakIsdUJBQXdELFVBQXhEOztBQUVBLFNBQU8sNkJBQWMsSUFBSSxVQUFKLEVBQWQsd0RBQ0osTUFESSxFQUNLLFVBREwsbUNBRUosTUFGSSxFQUVLLE1BRkwsbUNBR0osTUFISSxFQUdLLFVBQVUsWUFBVixDQUhMLG1DQUlKLFdBSkksRUFJVSxVQUFVLGlCQUFWLENBSlYsbUNBS0osUUFMSSxFQUtPLENBQUMsVUFBVSxjQUFWLENBQUQsRUFBNEIsU0FBNUIsQ0FMUCxtQkFBUDs7QUFRQSxXQUFTLGdCQUFULENBQTJCLElBQTNCLEVBQWlDLEtBQWpDLEVBQXdDO0FBQ3RDLGVBQVcsU0FBWCxDQUFxQixLQUFyQixJQUE4QixZQUFZO0FBQ3hDLGFBQU8sS0FBSyxJQUFMLEVBQVcsS0FBWCxDQUFpQixJQUFqQixFQUF1QixTQUF2QixDQUFQO0FBQ0QsS0FGRDtBQUdEOztBQUVELFdBQVMsVUFBVCxDQUFxQixLQUFyQixTQUF5QztBQUFBLFFBQVgsR0FBVyxTQUFYLEdBQVc7QUFBQSxRQUFOLEVBQU0sU0FBTixFQUFNOztBQUN2QyxXQUFPLE1BQU0sTUFBTixDQUFhLFNBQWIsRUFBd0IsVUFBQyxPQUFELEVBQWE7QUFDMUMsVUFBTSxTQUFTLFFBQ1osS0FEWSxDQUNOLENBQUMsR0FBRCxFQUFNLFFBQU4sQ0FETSxFQUVaLE1BRlksQ0FFTCxnQkFGSyxDQUFmOztBQUlBLGFBQU8sUUFBUSxLQUFSLENBQWMsQ0FBQyxHQUFELEVBQU0sUUFBTixDQUFkLEVBQStCLE1BQS9CLENBQVA7QUFDRCxLQU5NLENBQVA7O0FBUUEsYUFBUyxnQkFBVCxDQUEyQixJQUEzQixFQUFpQztBQUMvQixhQUFPLEtBQUssR0FBTCxDQUFTLElBQVQsTUFBbUIsRUFBMUI7QUFDRDtBQUNGOztBQUVELFdBQVMsTUFBVCxDQUFpQixLQUFqQixTQUEyQztBQUFBLFFBQWpCLEdBQWlCLFNBQWpCLEdBQWlCO0FBQUEsUUFBWixFQUFZLFNBQVosRUFBWTtBQUFBLFFBQVIsSUFBUSxTQUFSLElBQVE7O0FBQ3pDLFdBQU8sTUFBTSxNQUFOLENBQWEsU0FBYixFQUF3QixVQUFDLE9BQUQsRUFBYTtBQUMxQyxVQUFNLFFBQVEsUUFDWCxLQURXLENBQ0wsQ0FBQyxHQUFELEVBQU0sUUFBTixDQURLLEVBRVgsU0FGVyxDQUVELFVBRkMsQ0FBZDs7QUFJQSxhQUFPLFFBQVEsS0FBUixDQUFjLENBQUMsR0FBRCxFQUFNLFFBQU4sRUFBZ0IsS0FBaEIsQ0FBZCxFQUFzQyxJQUF0QyxDQUFQO0FBQ0QsS0FOTSxDQUFQOztBQVFBLGFBQVMsVUFBVCxDQUFxQixJQUFyQixFQUEyQjtBQUN6QixhQUFPLEtBQUssR0FBTCxDQUFTLElBQVQsTUFBbUIsRUFBMUI7QUFDRDtBQUNGOztBQUVELFdBQVMsU0FBVCxDQUFvQixLQUFwQixTQUE0QztBQUFBLFFBQWYsR0FBZSxTQUFmLEdBQWU7QUFBQSxRQUFWLE1BQVUsU0FBVixNQUFVOztBQUMxQyxXQUFPLE1BQU0sTUFBTixDQUFhLFNBQWIsRUFBd0IsVUFBQyxPQUFELEVBQWE7QUFDMUMsVUFBTSxpQkFBaUIsUUFBUSxLQUFSLENBQWMsQ0FBQyxHQUFELEVBQU0sUUFBTixDQUFkLENBQXZCOztBQUVBLFVBQUksY0FBSixFQUFvQjtBQUNsQixpQkFBUyxPQUFPLE1BQVAsQ0FBYyxjQUFkLENBQVQ7QUFDRDs7QUFFRCxhQUFPLFFBQVEsS0FBUixDQUFjLENBQUMsR0FBRCxFQUFNLFFBQU4sQ0FBZCxFQUErQixNQUEvQixDQUFQO0FBQ0QsS0FSTSxDQUFQO0FBU0Q7O0FBRUQsV0FBUyxTQUFULENBQW9CLE1BQXBCLEVBQTRCO0FBQzFCLFdBQU8sVUFBQyxLQUFELFNBQW9CO0FBQUEsVUFBVixHQUFVLFNBQVYsR0FBVTs7QUFDekIsYUFBTyxNQUFNLE1BQU4sQ0FBYSxTQUFiLEVBQXdCLFVBQUMsT0FBRCxFQUFhO0FBQzFDLGVBQU8sUUFBUSxLQUFSLENBQWMsQ0FBQyxHQUFELEVBQU0sUUFBTixDQUFkLEVBQStCLE1BQS9CLENBQVA7QUFDRCxPQUZNLENBQVA7QUFHRCxLQUpEO0FBS0Q7QUFDRjs7QUFFRCxTQUFTLFNBQVQsQ0FBb0IsSUFBcEIsRUFBMEI7QUFDeEIsMkJBQVUsaUJBQUUsT0FBRixDQUFVLElBQVYsQ0FBVixFQUEyQix5QkFBM0I7O0FBRUEsU0FBTyxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQVA7QUFDRDs7QUFFRCxTQUFTLGVBQVQsQ0FBMEIsSUFBMUIsRUFBZ0MsVUFBaEMsRUFBNEM7QUFDMUMsTUFBTSxnQ0FBOEIsV0FBVyxXQUFYLEVBQXBDOztBQUVBLE1BQU0sZUFBZSxjQUFyQjtBQUNBLE1BQU0saUJBQWlCLGdCQUF2QjtBQUNBLE1BQU0sb0JBQW9CLG1CQUExQjtBQUNBLE1BQU0sY0FBaUIsa0JBQWpCLGlCQUFOO0FBQ0EsTUFBTSxXQUFjLGtCQUFkLGNBQU47QUFDQSxNQUFNLFNBQVksa0JBQVosWUFBTjtBQUNBLE1BQU0scUJBQW1CLEtBQUssV0FBTCxFQUF6QjtBQUNBLE1BQU0scUJBQW1CLEtBQUssV0FBTCxFQUF6Qjs7QUFFQSxTQUFPO0FBQ0wsa0JBREs7QUFFTCxrQkFGSztBQUdMLGtCQUhLO0FBSUwsc0JBSks7QUFLTCw0QkFMSztBQU1MLDhCQU5LO0FBT0wsa0NBUEs7QUFRTDtBQVJLLEdBQVA7QUFVRCIsImZpbGUiOiJjcmVhdGVDb2xsZWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJ1xuaW1wb3J0IEltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnXG5pbXBvcnQgaW52YXJpYW50IGZyb20gJ2ludmFyaWFudCdcbmltcG9ydCBwbHVyYWxpemUgZnJvbSAncGx1cmFsaXplJ1xuaW1wb3J0IGNyZWF0ZVJlZHVjZXIgZnJvbSAnLi9jcmVhdGVSZWR1Y2VyJ1xuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9USU1FT1VUID0gMTAwMDAgLy8gMTBzXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUNvbGxlY3Rpb24gKG5hbWUsIGNyZWF0ZVVybCwgaXNSZXNwb25zZVZhbGlkID0gXy5pc0FycmF5KSB7XG4gIGxldCBwYXJhbXMgPSB7fVxuICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgcGFyYW1zID0gbmFtZVxuICAgIG5hbWUgPSBwYXJhbXMubmFtZVxuICAgIGNyZWF0ZVVybCA9IHBhcmFtcy5jcmVhdGVVcmxcbiAgICBpc1Jlc3BvbnNlVmFsaWQgPSBwYXJhbXMuaXNSZXNwb25zZVZhbGlkIHx8IF8uaXNBcnJheVxuICB9XG5cbiAgaW52YXJpYW50KF8uaXNTdHJpbmcobmFtZSksICdgbmFtZWAgcmVxdWlyZWQnKVxuXG4gIGNvbnN0IHBhdGggPSBbXS5jb25jYXQocGFyYW1zLnBhdGggfHwgW10pXG5cbiAgY29uc3QgcGx1cmFsTmFtZSA9IF8uY2FwaXRhbGl6ZShwbHVyYWxpemUobmFtZSkpXG4gIGNvbnN0IGNvbnN0YW50cyA9IGNyZWF0ZUNvbnN0YW50cyhuYW1lLCBwbHVyYWxOYW1lKVxuXG4gIGNvbnN0IGFkZCA9IGNyZWF0ZUFkZChuYW1lLCBjb25zdGFudHMpXG4gIGNvbnN0IGRlbGV0ZUl0ZW0gPSBjcmVhdGVEZWxldGVJdGVtKG5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgdXBkYXRlID0gY3JlYXRlVXBkYXRlKG5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgcmVkdWNlciA9IGNyZWF0ZVJlZHVjZXJGb3JDb2xsZWN0aW9uKG5hbWUsIHBsdXJhbE5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgZmV0Y2ggPSBjcmVhdGVGZXRjaEZvckNvbGxlY3Rpb24ocGx1cmFsTmFtZSwgY3JlYXRlVXJsLCBpc1Jlc3BvbnNlVmFsaWQsIGNvbnN0YW50cywgcGF0aClcblxuICByZXR1cm4ge1xuICAgIFtgYWRkJHtuYW1lfWBdOiBhZGQsXG4gICAgW2BmZXRjaCR7cGx1cmFsTmFtZX1gXTogZmV0Y2gsXG4gICAgW2BkZWxldGUke25hbWV9YF06IGRlbGV0ZUl0ZW0sXG4gICAgW2B1cGRhdGUke25hbWV9YF06IHVwZGF0ZSxcbiAgICBbcGx1cmFsTmFtZS50b0xvd2VyQ2FzZSgpXTogcmVkdWNlclxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFkZCAobmFtZSwgeyBGSU5JU0hFRCB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiBhZGQgKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVtID0gXy5sYXN0KGFyZ3MpXG4gICAgY29uc3Qga2V5ID0gY3JlYXRlS2V5KF8uaW5pdGlhbChhcmdzKSlcbiAgICBjb25zdCByZXN1bHQgPSBJbW11dGFibGUuZnJvbUpTKFtpdGVtXSlcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBGSU5JU0hFRCxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCByZXN1bHQgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVEZWxldGVJdGVtIChuYW1lLCB7IERFTEVURSB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiBkZWxldGVJdGVtICguLi5hcmdzKSB7XG4gICAgY29uc3QgaWQgPSBfLmxhc3QoYXJncylcbiAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoXy5pbml0aWFsKGFyZ3MpKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IERFTEVURSxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCBpZCB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZSAobmFtZSwgeyBVUERBVEUgfSkge1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlbSA9IEltbXV0YWJsZS5mcm9tSlMoXy5sYXN0KGFyZ3MpKVxuICAgIGNvbnN0IGlkID0gaXRlbS5nZXQoJ2lkJylcbiAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoXy5pbml0aWFsKGFyZ3MpKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFVQREFURSxcbiAgICAgIHBheWxvYWQ6IHsga2V5LCBpZCwgaXRlbSB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGxvd2VyRmlyc3QgKHN0ciA9ICcnKSB7XG4gIHJldHVybiBzdHJbMF0udG9Mb3dlckNhc2UoKSArIHN0ci5zdWJzdHJpbmcoMSlcbn1cblxuZnVuY3Rpb24gY3JlYXRlRmV0Y2hGb3JDb2xsZWN0aW9uIChuYW1lLCBjcmVhdGVVcmwsIGlzUmVzcG9uc2VWYWxpZCwgY29uc3RhbnRzLCBwYXRoKSB7XG4gIGNvbnN0IHsgRkFJTEVELCBGSU5JU0hFRCwgSU5fUFJPR1JFU1MgfSA9IGNvbnN0YW50c1xuXG4gIHJldHVybiBmdW5jdGlvbiBmZXRjaCAoLi4uYXJncykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZGlzcGF0Y2gsIGdldFN0YXRlKSB7XG4gICAgICBjb25zdCBzdGF0ZSA9IF8uZ2V0KGdldFN0YXRlKCksIHBhdGguY29uY2F0KGxvd2VyRmlyc3QobmFtZSkpKVxuICAgICAgY29uc3QgaXNGZXRjaGluZyA9IHN0YXRlLmlzRmV0Y2hpbmcoLi4uYXJncylcbiAgICAgIGNvbnN0IGhhc0ZldGNoZWQgPSBzdGF0ZS5oYXNGZXRjaGVkKC4uLmFyZ3MpXG4gICAgICBjb25zdCBoYXNGYWlsZWRUb0ZldGNoID0gc3RhdGUuaGFzRmFpbGVkVG9GZXRjaCguLi5hcmdzKVxuXG4gICAgICBpZiAoaXNGZXRjaGluZyB8fCBoYXNGZXRjaGVkIHx8IGhhc0ZhaWxlZFRvRmV0Y2gpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVybCA9IGNyZWF0ZVVybCguLi5hcmdzKVxuICAgICAgY29uc3Qga2V5ID0gY3JlYXRlS2V5KGFyZ3MpXG4gICAgICBjb25zdCByZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgICAgdGltZW91dDogUkVRVUVTVF9USU1FT1VUXG4gICAgICB9XG5cbiAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgcGF5bG9hZDogeyBrZXkgfSxcbiAgICAgICAgdHlwZTogSU5fUFJPR1JFU1NcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBheGlvc1xuICAgICAgICAuZ2V0KHVybCwgcmVxdWVzdE9wdGlvbnMpXG4gICAgICAgIC50aGVuKG9uUmVzcG9uc2UpXG4gICAgICAgIC5jYXRjaChkaXNwYXRjaEVycm9yKVxuXG4gICAgICBmdW5jdGlvbiBvblJlc3BvbnNlICh7IGRhdGEgfSkge1xuICAgICAgICBpZiAoaXNSZXNwb25zZVZhbGlkKGRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gSW1tdXRhYmxlLmZyb21KUyhkYXRhKVxuXG4gICAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZTogRklOSVNIRUQsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IGtleSwgcmVzdWx0IH1cbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpc3BhdGNoRXJyb3Ioe1xuICAgICAgICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICAgICAgICBtZXNzYWdlOiAnVW5hY2NlcHRhYmxlIHJlc3BvbnNlJ1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZGlzcGF0Y2hFcnJvciAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVkdWNlICR7RklOSVNIRUR9LiBUaGlzIGlzIHByb2JhYmx5IGFuIGVycm9yIGluIHlvdXIgcmVkdWNlciBvciBhIFxcYGNvbm5lY3RcXGAuYCwgZXJyb3IpXG4gICAgICAgIH1cblxuICAgICAgICBkaXNwYXRjaCh7XG4gICAgICAgICAgdHlwZTogRkFJTEVELFxuICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgc3RhdHVzOiBlcnJvci5zdGF0dXMsXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZWR1Y2VyRm9yQ29sbGVjdGlvbiAobmFtZSwgcGx1cmFsTmFtZSwgY29uc3RhbnRzKSB7XG4gIGNvbnN0IHtcbiAgICBGQUlMRUQsXG4gICAgREVMRVRFLFxuICAgIFVQREFURSxcbiAgICBGSU5JU0hFRCxcbiAgICBJTl9QUk9HUkVTUyxcbiAgICBGRVRDSF9GQUlMRUQsXG4gICAgRkVUQ0hfRklOSVNIRUQsXG4gICAgRkVUQ0hfSU5fUFJPR1JFU1NcbiAgfSA9IGNvbnN0YW50c1xuXG4gIGNvbnN0IEZldGNoUmVjb3JkID0gSW1tdXRhYmxlLlJlY29yZCh7XG4gICAgZmV0Y2hlczogSW1tdXRhYmxlLk1hcCgpXG4gIH0pXG5cbiAgY2xhc3MgRmV0Y2hTdGF0ZSBleHRlbmRzIEZldGNoUmVjb3JkIHtcbiAgICBnZXRBbGxJdGVtcyAoLi4uYXJncykge1xuICAgICAgY29uc3QgZmV0Y2ggPSB0aGlzLmdldEZldGNoKGFyZ3MpXG5cbiAgICAgIGlmIChmZXRjaC5nZXQoJ3N0YXR1cycpID09PSBGRVRDSF9GSU5JU0hFRCkge1xuICAgICAgICByZXR1cm4gZmV0Y2guZ2V0KCdyZXN1bHQnKVxuICAgICAgfVxuICAgIH1cblxuICAgIGdldEl0ZW1CeUlkICguLi5hcmdzKSB7XG4gICAgICBjb25zdCBpZCA9IF8ubGFzdChhcmdzKVxuICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmdldEFsbEl0ZW1zLmFwcGx5KHRoaXMsIF8uaW5pdGlhbChhcmdzKSlcblxuICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgIHJldHVybiBpdGVtcy5maW5kKChpdGVtKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0uZ2V0KCdpZCcpID09PSBpZFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICBoYXNGZXRjaGVkICguLi5hcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRTdGF0dXMoYXJncykgPT09IEZFVENIX0ZJTklTSEVEXG4gICAgfVxuICAgIGlzRmV0Y2hpbmcgKC4uLmFyZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFN0YXR1cyhhcmdzKSA9PT0gRkVUQ0hfSU5fUFJPR1JFU1NcbiAgICB9XG4gICAgaGFzRmFpbGVkVG9GZXRjaCAoLi4uYXJncykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdHVzKGFyZ3MpID09PSBGRVRDSF9GQUlMRURcbiAgICB9XG4gICAgZ2V0U3RhdHVzIChhcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRGZXRjaChhcmdzKS5nZXQoJ3N0YXR1cycpXG4gICAgfVxuICAgIGdldEZldGNoIChhcmdzKSB7XG4gICAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoYXJncylcblxuICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hlcy5nZXQoa2V5KSB8fCBuZXcgSW1tdXRhYmxlLk1hcCgpXG4gICAgfVxuICB9XG5cbiAgYWRkRnVuY3Rpb25BbGlhcygnZ2V0SXRlbUJ5SWQnLCBgZ2V0JHtuYW1lfUJ5SWRgKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdnZXRBbGxJdGVtcycsIGBnZXRBbGwke3BsdXJhbE5hbWV9YClcbiAgYWRkRnVuY3Rpb25BbGlhcygnaXNGZXRjaGluZycsIGBpc0ZldGNoaW5nJHtwbHVyYWxOYW1lfWApXG4gIGFkZEZ1bmN0aW9uQWxpYXMoJ2hhc0ZldGNoZWQnLCBgaGFzRmV0Y2hlZCR7cGx1cmFsTmFtZX1gKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdoYXNGYWlsZWRUb0ZldGNoJywgYGhhc0ZhaWxlZFRvRmV0Y2gke3BsdXJhbE5hbWV9YClcblxuICByZXR1cm4gY3JlYXRlUmVkdWNlcihuZXcgRmV0Y2hTdGF0ZSgpLCB7XG4gICAgW0RFTEVURV06IGRlbGV0ZUl0ZW0sXG4gICAgW1VQREFURV06IHVwZGF0ZSxcbiAgICBbRkFJTEVEXTogc2V0U3RhdHVzKEZFVENIX0ZBSUxFRCksXG4gICAgW0lOX1BST0dSRVNTXTogc2V0U3RhdHVzKEZFVENIX0lOX1BST0dSRVNTKSxcbiAgICBbRklOSVNIRURdOiBbc2V0U3RhdHVzKEZFVENIX0ZJTklTSEVEKSwgc2V0UmVzdWx0XVxuICB9KVxuXG4gIGZ1bmN0aW9uIGFkZEZ1bmN0aW9uQWxpYXMgKGZ1bmMsIGFsaWFzKSB7XG4gICAgRmV0Y2hTdGF0ZS5wcm90b3R5cGVbYWxpYXNdID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXNbZnVuY10uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGV0ZUl0ZW0gKHN0YXRlLCB7IGtleSwgaWQgfSkge1xuICAgIHJldHVybiBzdGF0ZS51cGRhdGUoJ2ZldGNoZXMnLCAoZmV0Y2hlcykgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZmV0Y2hlc1xuICAgICAgICAuZ2V0SW4oW2tleSwgJ3Jlc3VsdCddKVxuICAgICAgICAuZmlsdGVyKGl0ZW1zV2l0aFdyb25nSWQpXG5cbiAgICAgIHJldHVybiBmZXRjaGVzLnNldEluKFtrZXksICdyZXN1bHQnXSwgcmVzdWx0KVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBpdGVtc1dpdGhXcm9uZ0lkIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXQoJ2lkJykgIT09IGlkXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlIChzdGF0ZSwgeyBrZXksIGlkLCBpdGVtIH0pIHtcbiAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZmV0Y2hlc1xuICAgICAgICAuZ2V0SW4oW2tleSwgJ3Jlc3VsdCddKVxuICAgICAgICAuZmluZEluZGV4KGl0ZW1XaXRoSWQpXG5cbiAgICAgIHJldHVybiBmZXRjaGVzLnNldEluKFtrZXksICdyZXN1bHQnLCBpbmRleF0sIGl0ZW0pXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIGl0ZW1XaXRoSWQgKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmdldCgnaWQnKSA9PT0gaWRcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRSZXN1bHQgKHN0YXRlLCB7IGtleSwgcmVzdWx0IH0pIHtcbiAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nUmVzdWx0ID0gZmV0Y2hlcy5nZXRJbihba2V5LCAncmVzdWx0J10pXG5cbiAgICAgIGlmIChleGlzdGluZ1Jlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGV4aXN0aW5nUmVzdWx0KVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAncmVzdWx0J10sIHJlc3VsdClcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0U3RhdHVzIChzdGF0dXMpIHtcbiAgICByZXR1cm4gKHN0YXRlLCB7IGtleSB9KSA9PiB7XG4gICAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgICAgcmV0dXJuIGZldGNoZXMuc2V0SW4oW2tleSwgJ3N0YXR1cyddLCBzdGF0dXMpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVLZXkgKGFyZ3MpIHtcbiAgaW52YXJpYW50KF8uaXNBcnJheShhcmdzKSwgJ2BhcmdzYCBtdXN0IGJlIGFuIGFycmF5JylcblxuICByZXR1cm4gYXJncy5qb2luKCctJylcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ29uc3RhbnRzIChuYW1lLCBwbHVyYWxOYW1lKSB7XG4gIGNvbnN0IGNvbnN0YW50UGx1cmFsTmFtZSA9IGBGRVRDSF8ke3BsdXJhbE5hbWUudG9VcHBlckNhc2UoKX1gXG5cbiAgY29uc3QgRkVUQ0hfRkFJTEVEID0gJ0ZFVENIX0ZBSUxFRCdcbiAgY29uc3QgRkVUQ0hfRklOSVNIRUQgPSAnRkVUQ0hfRklOSVNIRUQnXG4gIGNvbnN0IEZFVENIX0lOX1BST0dSRVNTID0gJ0ZFVENIX0lOX1BST0dSRVNTJ1xuICBjb25zdCBJTl9QUk9HUkVTUyA9IGAke2NvbnN0YW50UGx1cmFsTmFtZX1fSU5fUFJPR1JFU1NgXG4gIGNvbnN0IEZJTklTSEVEID0gYCR7Y29uc3RhbnRQbHVyYWxOYW1lfV9GSU5JU0hFRGBcbiAgY29uc3QgRkFJTEVEID0gYCR7Y29uc3RhbnRQbHVyYWxOYW1lfV9GQUlMRURgXG4gIGNvbnN0IERFTEVURSA9IGBERUxFVEVfJHtuYW1lLnRvVXBwZXJDYXNlKCl9YFxuICBjb25zdCBVUERBVEUgPSBgVVBEQVRFXyR7bmFtZS50b1VwcGVyQ2FzZSgpfWBcblxuICByZXR1cm4ge1xuICAgIEZBSUxFRCxcbiAgICBERUxFVEUsXG4gICAgVVBEQVRFLFxuICAgIEZJTklTSEVELFxuICAgIElOX1BST0dSRVNTLFxuICAgIEZFVENIX0ZBSUxFRCxcbiAgICBGRVRDSF9GSU5JU0hFRCxcbiAgICBGRVRDSF9JTl9QUk9HUkVTU1xuICB9XG59XG4iXX0=