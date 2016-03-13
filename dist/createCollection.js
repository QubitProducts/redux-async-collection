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
