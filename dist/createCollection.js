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

var _pluralize = require('pluralize');

var _pluralize2 = _interopRequireDefault(_pluralize);

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

  var pluralName = _lodash2.default.capitalize((0, _pluralize2.default)(name));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jcmVhdGVDb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztrQkFTd0I7O0FBVHhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFFTyxJQUFNLDRDQUFrQixJQUFsQjs7QUFFRSxTQUFTLGdCQUFULENBQTJCLElBQTNCLEVBQWlDLFNBQWpDLEVBQXlFOzs7TUFBN0Isd0VBQWtCLGlCQUFFLE9BQUYsZ0JBQVc7O0FBQ3RGLDJCQUFVLGlCQUFFLFFBQUYsQ0FBVyxJQUFYLENBQVYsRUFBNEIsaUJBQTVCLEVBRHNGOztBQUd0RixNQUFNLGFBQWEsaUJBQUUsVUFBRixDQUFhLHlCQUFVLElBQVYsQ0FBYixDQUFiLENBSGdGO0FBSXRGLE1BQU0sWUFBWSxnQkFBZ0IsSUFBaEIsRUFBc0IsVUFBdEIsQ0FBWixDQUpnRjs7QUFNdEYsTUFBTSxNQUFNLFVBQVUsSUFBVixFQUFnQixTQUFoQixDQUFOLENBTmdGO0FBT3RGLE1BQU0sYUFBYSxpQkFBaUIsSUFBakIsRUFBdUIsU0FBdkIsQ0FBYixDQVBnRjtBQVF0RixNQUFNLFNBQVMsYUFBYSxJQUFiLEVBQW1CLFNBQW5CLENBQVQsQ0FSZ0Y7QUFTdEYsTUFBTSxVQUFVLDJCQUEyQixJQUEzQixFQUFpQyxVQUFqQyxFQUE2QyxTQUE3QyxDQUFWLENBVGdGO0FBVXRGLE1BQU0sUUFBUSx5QkFBeUIsVUFBekIsRUFBcUMsU0FBckMsRUFBZ0QsZUFBaEQsRUFBaUUsU0FBakUsQ0FBUixDQVZnRjs7QUFZdEYsa0RBQ1MsTUFBUyxzQ0FDUCxZQUFlLHlDQUNkLE1BQVMsOENBQ1QsTUFBUywrQkFDbEIsV0FBVyxXQUFYLElBQTJCLGNBTDlCLENBWnNGO0NBQXpFOztBQXFCZixTQUFTLFNBQVQsQ0FBb0IsSUFBcEIsU0FBd0M7TUFBWiwwQkFBWTs7QUFDdEMsU0FBTyxTQUFTLEdBQVQsR0FBdUI7c0NBQU47O0tBQU07O0FBQzVCLFFBQU0sT0FBTyxpQkFBRSxJQUFGLENBQU8sSUFBUCxDQUFQLENBRHNCO0FBRTVCLFFBQU0sTUFBTSxVQUFVLGlCQUFFLE9BQUYsQ0FBVSxJQUFWLENBQVYsQ0FBTixDQUZzQjtBQUc1QixRQUFNLFNBQVMsb0JBQVUsTUFBVixDQUFpQixDQUFDLElBQUQsQ0FBakIsQ0FBVCxDQUhzQjs7QUFLNUIsV0FBTztBQUNMLFlBQU0sUUFBTjtBQUNBLGVBQVMsRUFBRSxRQUFGLEVBQU8sY0FBUCxFQUFUO0tBRkYsQ0FMNEI7R0FBdkIsQ0FEK0I7Q0FBeEM7O0FBYUEsU0FBUyxnQkFBVCxDQUEyQixJQUEzQixTQUE2QztNQUFWLHNCQUFVOztBQUMzQyxTQUFPLFNBQVMsVUFBVCxHQUE4Qjt1Q0FBTjs7S0FBTTs7QUFDbkMsUUFBTSxLQUFLLGlCQUFFLElBQUYsQ0FBTyxJQUFQLENBQUwsQ0FENkI7QUFFbkMsUUFBTSxNQUFNLFVBQVUsaUJBQUUsT0FBRixDQUFVLElBQVYsQ0FBVixDQUFOLENBRjZCOztBQUluQyxXQUFPO0FBQ0wsWUFBTSxNQUFOO0FBQ0EsZUFBUyxFQUFFLFFBQUYsRUFBTyxNQUFQLEVBQVQ7S0FGRixDQUptQztHQUE5QixDQURvQztDQUE3Qzs7QUFZQSxTQUFTLFlBQVQsQ0FBdUIsSUFBdkIsU0FBeUM7TUFBVixzQkFBVTs7QUFDdkMsU0FBTyxTQUFTLE1BQVQsR0FBMEI7dUNBQU47O0tBQU07O0FBQy9CLFFBQU0sT0FBTyxvQkFBVSxNQUFWLENBQWlCLGlCQUFFLElBQUYsQ0FBTyxJQUFQLENBQWpCLENBQVAsQ0FEeUI7QUFFL0IsUUFBTSxLQUFLLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBTCxDQUZ5QjtBQUcvQixRQUFNLE1BQU0sVUFBVSxpQkFBRSxPQUFGLENBQVUsSUFBVixDQUFWLENBQU4sQ0FIeUI7O0FBSy9CLFdBQU87QUFDTCxZQUFNLE1BQU47QUFDQSxlQUFTLEVBQUUsUUFBRixFQUFPLE1BQVAsRUFBVyxVQUFYLEVBQVQ7S0FGRixDQUwrQjtHQUExQixDQURnQztDQUF6Qzs7QUFhQSxTQUFTLHdCQUFULENBQW1DLElBQW5DLEVBQXlDLFNBQXpDLEVBQW9ELGVBQXBELEVBQXFFLFNBQXJFLEVBQWdGO01BQ3RFLFNBQWtDLFVBQWxDLE9BRHNFO01BQzlELFdBQTBCLFVBQTFCLFNBRDhEO01BQ3BELGNBQWdCLFVBQWhCLFlBRG9EOzs7QUFHOUUsU0FBTyxTQUFTLEtBQVQsR0FBeUI7dUNBQU47O0tBQU07O0FBQzlCLFdBQU8sVUFBVSxRQUFWLEVBQW9CLFFBQXBCLEVBQThCO0FBQ25DLFVBQU0sUUFBUSxXQUFXLEtBQUssV0FBTCxFQUFYLENBQVIsQ0FENkI7QUFFbkMsVUFBTSxhQUFhLE1BQU0sVUFBTixjQUFvQixJQUFwQixDQUFiLENBRjZCO0FBR25DLFVBQU0sYUFBYSxNQUFNLFVBQU4sY0FBb0IsSUFBcEIsQ0FBYixDQUg2QjtBQUluQyxVQUFNLG1CQUFtQixNQUFNLGdCQUFOLGNBQTBCLElBQTFCLENBQW5CLENBSjZCOztBQU1uQyxVQUFJLGNBQWMsVUFBZCxJQUE0QixnQkFBNUIsRUFBOEM7QUFDaEQsZUFEZ0Q7T0FBbEQ7O0FBSUEsVUFBTSxNQUFNLDJCQUFhLElBQWIsQ0FBTixDQVY2QjtBQVduQyxVQUFNLE1BQU0sVUFBVSxJQUFWLENBQU4sQ0FYNkI7QUFZbkMsVUFBTSxpQkFBaUI7QUFDckIsaUJBQVMsZUFBVDtPQURJLENBWjZCOztBQWdCbkMsZUFBUztBQUNQLGlCQUFTLEVBQUUsUUFBRixFQUFUO0FBQ0EsY0FBTSxXQUFOO09BRkYsRUFoQm1DOztBQXFCbkMsYUFBTyxnQkFDSixHQURJLENBQ0EsR0FEQSxFQUNLLGNBREwsRUFFSixJQUZJLENBRUMsVUFGRCxFQUdKLEtBSEksQ0FHRSxhQUhGLENBQVAsQ0FyQm1DOztBQTBCbkMsZUFBUyxVQUFULFFBQStCO1lBQVIsa0JBQVE7O0FBQzdCLFlBQUksZ0JBQWdCLElBQWhCLENBQUosRUFBMkI7QUFDekIsY0FBTSxTQUFTLG9CQUFVLE1BQVYsQ0FBaUIsSUFBakIsQ0FBVCxDQURtQjs7QUFHekIsbUJBQVM7QUFDUCxrQkFBTSxRQUFOO0FBQ0EscUJBQVMsRUFBRSxRQUFGLEVBQU8sY0FBUCxFQUFUO1dBRkYsRUFIeUI7U0FBM0IsTUFPTztBQUNMLHdCQUFjO0FBQ1osb0JBQVEsR0FBUjtBQUNBLHFCQUFTLHVCQUFUO1dBRkYsRUFESztTQVBQO09BREY7O0FBZ0JBLGVBQVMsYUFBVCxDQUF3QixLQUF4QixFQUErQjtBQUM3QixZQUFJLGlCQUFpQixLQUFqQixFQUF3QjtBQUMxQixrQkFBUSxLQUFSLHVCQUFrQyx3RUFBbEMsRUFBMkcsS0FBM0csRUFEMEI7U0FBNUI7O0FBSUEsaUJBQVM7QUFDUCxnQkFBTSxNQUFOO0FBQ0EsaUJBQU8sSUFBUDtBQUNBLG1CQUFTO0FBQ1AsaUJBQUssR0FBTDtBQUNBLG9CQUFRLE1BQU0sTUFBTjtBQUNSLHFCQUFTLE1BQU0sT0FBTjtXQUhYO1NBSEYsRUFMNkI7T0FBL0I7S0ExQ0ssQ0FEdUI7R0FBekIsQ0FIdUU7Q0FBaEY7O0FBaUVBLFNBQVMsMEJBQVQsQ0FBcUMsSUFBckMsRUFBMkMsVUFBM0MsRUFBdUQsU0FBdkQsRUFBa0U7OztNQUU5RCxTQVFFLFVBUkYsT0FGOEQ7TUFHOUQsU0FPRSxVQVBGLE9BSDhEO01BSTlELFNBTUUsVUFORixPQUo4RDtNQUs5RCxXQUtFLFVBTEYsU0FMOEQ7TUFNOUQsY0FJRSxVQUpGLFlBTjhEO01BTzlELGVBR0UsVUFIRixhQVA4RDtNQVE5RCxpQkFFRSxVQUZGLGVBUjhEO01BUzlELG9CQUNFLFVBREYsa0JBVDhEOzs7QUFZaEUsTUFBTSxjQUFjLG9CQUFVLE1BQVYsQ0FBaUI7QUFDbkMsYUFBUyxvQkFBVSxHQUFWLEVBQVQ7R0FEa0IsQ0FBZCxDQVowRDs7TUFnQjFEOzs7Ozs7Ozs7OztvQ0FDa0I7MkNBQU47O1NBQU07O0FBQ3BCLFlBQU0sUUFBUSxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQVIsQ0FEYzs7QUFHcEIsWUFBSSxNQUFNLEdBQU4sQ0FBVSxRQUFWLE1BQXdCLGNBQXhCLEVBQXdDO0FBQzFDLGlCQUFPLE1BQU0sR0FBTixDQUFVLFFBQVYsQ0FBUCxDQUQwQztTQUE1Qzs7OztvQ0FLb0I7MkNBQU47O1NBQU07O0FBQ3BCLFlBQU0sS0FBSyxpQkFBRSxJQUFGLENBQU8sSUFBUCxDQUFMLENBRGM7QUFFcEIsWUFBTSxRQUFRLEtBQUssV0FBTCxDQUFpQixLQUFqQixDQUF1QixJQUF2QixFQUE2QixpQkFBRSxPQUFGLENBQVUsSUFBVixDQUE3QixDQUFSLENBRmM7O0FBSXBCLFlBQUksS0FBSixFQUFXO0FBQ1QsaUJBQU8sTUFBTSxJQUFOLENBQVcsVUFBQyxJQUFELEVBQVU7QUFDMUIsbUJBQU8sS0FBSyxHQUFMLENBQVMsSUFBVCxNQUFtQixFQUFuQixDQURtQjtXQUFWLENBQWxCLENBRFM7U0FBWDs7OzttQ0FNbUI7MkNBQU47O1NBQU07O0FBQ25CLGVBQU8sS0FBSyxTQUFMLENBQWUsSUFBZixNQUF5QixjQUF6QixDQURZOzs7O21DQUdBOzJDQUFOOztTQUFNOztBQUNuQixlQUFPLEtBQUssU0FBTCxDQUFlLElBQWYsTUFBeUIsaUJBQXpCLENBRFk7Ozs7eUNBR007MkNBQU47O1NBQU07O0FBQ3pCLGVBQU8sS0FBSyxTQUFMLENBQWUsSUFBZixNQUF5QixZQUF6QixDQURrQjs7OztnQ0FHaEIsTUFBTTtBQUNmLGVBQU8sS0FBSyxRQUFMLENBQWMsSUFBZCxFQUFvQixHQUFwQixDQUF3QixRQUF4QixDQUFQLENBRGU7Ozs7K0JBR1AsTUFBTTtBQUNkLFlBQU0sTUFBTSxVQUFVLElBQVYsQ0FBTixDQURROztBQUdkLGVBQU8sS0FBSyxPQUFMLENBQWEsR0FBYixDQUFpQixHQUFqQixLQUF5QixJQUFJLG9CQUFVLEdBQVYsRUFBN0IsQ0FITzs7OztXQS9CWjtJQUFtQixhQWhCdUM7O0FBc0RoRSxtQkFBaUIsYUFBakIsVUFBc0MsYUFBdEMsRUF0RGdFO0FBdURoRSxtQkFBaUIsYUFBakIsYUFBeUMsVUFBekMsRUF2RGdFO0FBd0RoRSxtQkFBaUIsWUFBakIsaUJBQTRDLFVBQTVDLEVBeERnRTtBQXlEaEUsbUJBQWlCLFlBQWpCLGlCQUE0QyxVQUE1QyxFQXpEZ0U7QUEwRGhFLG1CQUFpQixrQkFBakIsdUJBQXdELFVBQXhELEVBMURnRTs7QUE0RGhFLFNBQU8sNkJBQWMsSUFBSSxVQUFKLEVBQWQsd0RBQ0osUUFBUyw2Q0FDVCxRQUFTLHlDQUNULFFBQVMsVUFBVSxZQUFWLG9DQUNULGFBQWMsVUFBVSxpQkFBVixvQ0FDZCxVQUFXLENBQUMsVUFBVSxjQUFWLENBQUQsRUFBNEIsU0FBNUIsbUJBTFAsQ0FBUCxDQTVEZ0U7O0FBb0VoRSxXQUFTLGdCQUFULENBQTJCLElBQTNCLEVBQWlDLEtBQWpDLEVBQXdDO0FBQ3RDLGVBQVcsU0FBWCxDQUFxQixLQUFyQixJQUE4QixZQUFZO0FBQ3hDLGFBQU8sS0FBSyxJQUFMLEVBQVcsS0FBWCxDQUFpQixJQUFqQixFQUF1QixTQUF2QixDQUFQLENBRHdDO0tBQVosQ0FEUTtHQUF4Qzs7QUFNQSxXQUFTLFVBQVQsQ0FBcUIsS0FBckIsU0FBeUM7UUFBWCxnQkFBVztRQUFOLGNBQU07O0FBQ3ZDLFdBQU8sTUFBTSxNQUFOLENBQWEsU0FBYixFQUF3QixVQUFDLE9BQUQsRUFBYTtBQUMxQyxVQUFNLFNBQVMsUUFDWixLQURZLENBQ04sQ0FBQyxHQUFELEVBQU0sUUFBTixDQURNLEVBRVosTUFGWSxDQUVMLGdCQUZLLENBQVQsQ0FEb0M7O0FBSzFDLGFBQU8sUUFBUSxLQUFSLENBQWMsQ0FBQyxHQUFELEVBQU0sUUFBTixDQUFkLEVBQStCLE1BQS9CLENBQVAsQ0FMMEM7S0FBYixDQUEvQixDQUR1Qzs7QUFTdkMsYUFBUyxnQkFBVCxDQUEyQixJQUEzQixFQUFpQztBQUMvQixhQUFPLEtBQUssR0FBTCxDQUFTLElBQVQsTUFBbUIsRUFBbkIsQ0FEd0I7S0FBakM7R0FURjs7QUFjQSxXQUFTLE1BQVQsQ0FBaUIsS0FBakIsU0FBMkM7UUFBakIsZ0JBQWlCO1FBQVosY0FBWTtRQUFSLGtCQUFROztBQUN6QyxXQUFPLE1BQU0sTUFBTixDQUFhLFNBQWIsRUFBd0IsVUFBQyxPQUFELEVBQWE7QUFDMUMsVUFBTSxRQUFRLFFBQ1gsS0FEVyxDQUNMLENBQUMsR0FBRCxFQUFNLFFBQU4sQ0FESyxFQUVYLFNBRlcsQ0FFRCxVQUZDLENBQVIsQ0FEb0M7O0FBSzFDLGFBQU8sUUFBUSxLQUFSLENBQWMsQ0FBQyxHQUFELEVBQU0sUUFBTixFQUFnQixLQUFoQixDQUFkLEVBQXNDLElBQXRDLENBQVAsQ0FMMEM7S0FBYixDQUEvQixDQUR5Qzs7QUFTekMsYUFBUyxVQUFULENBQXFCLElBQXJCLEVBQTJCO0FBQ3pCLGFBQU8sS0FBSyxHQUFMLENBQVMsSUFBVCxNQUFtQixFQUFuQixDQURrQjtLQUEzQjtHQVRGOztBQWNBLFdBQVMsU0FBVCxDQUFvQixLQUFwQixTQUE0QztRQUFmLGdCQUFlO1FBQVYsc0JBQVU7O0FBQzFDLFdBQU8sTUFBTSxNQUFOLENBQWEsU0FBYixFQUF3QixVQUFDLE9BQUQsRUFBYTtBQUMxQyxVQUFNLGlCQUFpQixRQUFRLEtBQVIsQ0FBYyxDQUFDLEdBQUQsRUFBTSxRQUFOLENBQWQsQ0FBakIsQ0FEb0M7O0FBRzFDLFVBQUksY0FBSixFQUFvQjtBQUNsQixpQkFBUyxPQUFPLE1BQVAsQ0FBYyxjQUFkLENBQVQsQ0FEa0I7T0FBcEI7O0FBSUEsYUFBTyxRQUFRLEtBQVIsQ0FBYyxDQUFDLEdBQUQsRUFBTSxRQUFOLENBQWQsRUFBK0IsTUFBL0IsQ0FBUCxDQVAwQztLQUFiLENBQS9CLENBRDBDO0dBQTVDOztBQVlBLFdBQVMsU0FBVCxDQUFvQixNQUFwQixFQUE0QjtBQUMxQixXQUFPLFVBQUMsS0FBRCxTQUFvQjtVQUFWLGdCQUFVOztBQUN6QixhQUFPLE1BQU0sTUFBTixDQUFhLFNBQWIsRUFBd0IsVUFBQyxPQUFELEVBQWE7QUFDMUMsZUFBTyxRQUFRLEtBQVIsQ0FBYyxDQUFDLEdBQUQsRUFBTSxRQUFOLENBQWQsRUFBK0IsTUFBL0IsQ0FBUCxDQUQwQztPQUFiLENBQS9CLENBRHlCO0tBQXBCLENBRG1CO0dBQTVCO0NBbEhGOztBQTJIQSxTQUFTLFNBQVQsQ0FBb0IsSUFBcEIsRUFBMEI7QUFDeEIsMkJBQVUsaUJBQUUsT0FBRixDQUFVLElBQVYsQ0FBVixFQUEyQix5QkFBM0IsRUFEd0I7O0FBR3hCLFNBQU8sS0FBSyxJQUFMLENBQVUsR0FBVixDQUFQLENBSHdCO0NBQTFCOztBQU1BLFNBQVMsZUFBVCxDQUEwQixJQUExQixFQUFnQyxVQUFoQyxFQUE0QztBQUMxQyxNQUFNLGdDQUE4QixXQUFXLFdBQVgsRUFBOUIsQ0FEb0M7O0FBRzFDLE1BQU0sZUFBZSxjQUFmLENBSG9DO0FBSTFDLE1BQU0saUJBQWlCLGdCQUFqQixDQUpvQztBQUsxQyxNQUFNLG9CQUFvQixtQkFBcEIsQ0FMb0M7QUFNMUMsTUFBTSxjQUFpQixtQ0FBakIsQ0FOb0M7QUFPMUMsTUFBTSxXQUFjLGdDQUFkLENBUG9DO0FBUTFDLE1BQU0sU0FBWSw4QkFBWixDQVJvQztBQVMxQyxNQUFNLHFCQUFtQixLQUFLLFdBQUwsRUFBbkIsQ0FUb0M7QUFVMUMsTUFBTSxxQkFBbUIsS0FBSyxXQUFMLEVBQW5CLENBVm9DOztBQVkxQyxTQUFPO0FBQ0wsa0JBREs7QUFFTCxrQkFGSztBQUdMLGtCQUhLO0FBSUwsc0JBSks7QUFLTCw0QkFMSztBQU1MLDhCQU5LO0FBT0wsa0NBUEs7QUFRTCx3Q0FSSztHQUFQLENBWjBDO0NBQTVDIiwiZmlsZSI6ImNyZWF0ZUNvbGxlY3Rpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnXG5pbXBvcnQgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSdcbmltcG9ydCBpbnZhcmlhbnQgZnJvbSAnaW52YXJpYW50J1xuaW1wb3J0IHBsdXJhbGl6ZSBmcm9tICdwbHVyYWxpemUnXG5pbXBvcnQgY3JlYXRlUmVkdWNlciBmcm9tICcuL2NyZWF0ZVJlZHVjZXInXG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX1RJTUVPVVQgPSAzMDAwXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUNvbGxlY3Rpb24gKG5hbWUsIGNyZWF0ZVVybCwgaXNSZXNwb25zZVZhbGlkID0gXy5pc0FycmF5KSB7XG4gIGludmFyaWFudChfLmlzU3RyaW5nKG5hbWUpLCAnYG5hbWVgIHJlcXVpcmVkJylcblxuICBjb25zdCBwbHVyYWxOYW1lID0gXy5jYXBpdGFsaXplKHBsdXJhbGl6ZShuYW1lKSlcbiAgY29uc3QgY29uc3RhbnRzID0gY3JlYXRlQ29uc3RhbnRzKG5hbWUsIHBsdXJhbE5hbWUpXG5cbiAgY29uc3QgYWRkID0gY3JlYXRlQWRkKG5hbWUsIGNvbnN0YW50cylcbiAgY29uc3QgZGVsZXRlSXRlbSA9IGNyZWF0ZURlbGV0ZUl0ZW0obmFtZSwgY29uc3RhbnRzKVxuICBjb25zdCB1cGRhdGUgPSBjcmVhdGVVcGRhdGUobmFtZSwgY29uc3RhbnRzKVxuICBjb25zdCByZWR1Y2VyID0gY3JlYXRlUmVkdWNlckZvckNvbGxlY3Rpb24obmFtZSwgcGx1cmFsTmFtZSwgY29uc3RhbnRzKVxuICBjb25zdCBmZXRjaCA9IGNyZWF0ZUZldGNoRm9yQ29sbGVjdGlvbihwbHVyYWxOYW1lLCBjcmVhdGVVcmwsIGlzUmVzcG9uc2VWYWxpZCwgY29uc3RhbnRzKVxuXG4gIHJldHVybiB7XG4gICAgW2BhZGQke25hbWV9YF06IGFkZCxcbiAgICBbYGZldGNoJHtwbHVyYWxOYW1lfWBdOiBmZXRjaCxcbiAgICBbYGRlbGV0ZSR7bmFtZX1gXTogZGVsZXRlSXRlbSxcbiAgICBbYHVwZGF0ZSR7bmFtZX1gXTogdXBkYXRlLFxuICAgIFtwbHVyYWxOYW1lLnRvTG93ZXJDYXNlKCldOiByZWR1Y2VyXG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQWRkIChuYW1lLCB7IEZJTklTSEVEIH0pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFkZCAoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZW0gPSBfLmxhc3QoYXJncylcbiAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoXy5pbml0aWFsKGFyZ3MpKVxuICAgIGNvbnN0IHJlc3VsdCA9IEltbXV0YWJsZS5mcm9tSlMoW2l0ZW1dKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEZJTklTSEVELFxuICAgICAgcGF5bG9hZDogeyBrZXksIHJlc3VsdCB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZURlbGV0ZUl0ZW0gKG5hbWUsIHsgREVMRVRFIH0pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlbGV0ZUl0ZW0gKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpZCA9IF8ubGFzdChhcmdzKVxuICAgIGNvbnN0IGtleSA9IGNyZWF0ZUtleShfLmluaXRpYWwoYXJncykpXG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogREVMRVRFLFxuICAgICAgcGF5bG9hZDogeyBrZXksIGlkIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVXBkYXRlIChuYW1lLCB7IFVQREFURSB9KSB7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVtID0gSW1tdXRhYmxlLmZyb21KUyhfLmxhc3QoYXJncykpXG4gICAgY29uc3QgaWQgPSBpdGVtLmdldCgnaWQnKVxuICAgIGNvbnN0IGtleSA9IGNyZWF0ZUtleShfLmluaXRpYWwoYXJncykpXG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogVVBEQVRFLFxuICAgICAgcGF5bG9hZDogeyBrZXksIGlkLCBpdGVtIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRmV0Y2hGb3JDb2xsZWN0aW9uIChuYW1lLCBjcmVhdGVVcmwsIGlzUmVzcG9uc2VWYWxpZCwgY29uc3RhbnRzKSB7XG4gIGNvbnN0IHsgRkFJTEVELCBGSU5JU0hFRCwgSU5fUFJPR1JFU1MgfSA9IGNvbnN0YW50c1xuXG4gIHJldHVybiBmdW5jdGlvbiBmZXRjaCAoLi4uYXJncykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoZGlzcGF0Y2gsIGdldFN0YXRlKSB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGdldFN0YXRlKClbbmFtZS50b0xvd2VyQ2FzZSgpXVxuICAgICAgY29uc3QgaXNGZXRjaGluZyA9IHN0YXRlLmlzRmV0Y2hpbmcoLi4uYXJncylcbiAgICAgIGNvbnN0IGhhc0ZldGNoZWQgPSBzdGF0ZS5oYXNGZXRjaGVkKC4uLmFyZ3MpXG4gICAgICBjb25zdCBoYXNGYWlsZWRUb0ZldGNoID0gc3RhdGUuaGFzRmFpbGVkVG9GZXRjaCguLi5hcmdzKVxuXG4gICAgICBpZiAoaXNGZXRjaGluZyB8fCBoYXNGZXRjaGVkIHx8IGhhc0ZhaWxlZFRvRmV0Y2gpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVybCA9IGNyZWF0ZVVybCguLi5hcmdzKVxuICAgICAgY29uc3Qga2V5ID0gY3JlYXRlS2V5KGFyZ3MpXG4gICAgICBjb25zdCByZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgICAgdGltZW91dDogUkVRVUVTVF9USU1FT1VUXG4gICAgICB9XG5cbiAgICAgIGRpc3BhdGNoKHtcbiAgICAgICAgcGF5bG9hZDogeyBrZXkgfSxcbiAgICAgICAgdHlwZTogSU5fUFJPR1JFU1NcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBheGlvc1xuICAgICAgICAuZ2V0KHVybCwgcmVxdWVzdE9wdGlvbnMpXG4gICAgICAgIC50aGVuKG9uUmVzcG9uc2UpXG4gICAgICAgIC5jYXRjaChkaXNwYXRjaEVycm9yKVxuXG4gICAgICBmdW5jdGlvbiBvblJlc3BvbnNlICh7IGRhdGEgfSkge1xuICAgICAgICBpZiAoaXNSZXNwb25zZVZhbGlkKGRhdGEpKSB7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0gSW1tdXRhYmxlLmZyb21KUyhkYXRhKVxuXG4gICAgICAgICAgZGlzcGF0Y2goe1xuICAgICAgICAgICAgdHlwZTogRklOSVNIRUQsXG4gICAgICAgICAgICBwYXlsb2FkOiB7IGtleSwgcmVzdWx0IH1cbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpc3BhdGNoRXJyb3Ioe1xuICAgICAgICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICAgICAgICBtZXNzYWdlOiAnVW5hY2NlcHRhYmxlIHJlc3BvbnNlJ1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZGlzcGF0Y2hFcnJvciAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVkdWNlICR7RklOSVNIRUR9LiBUaGlzIGlzIHByb2JhYmx5IGFuIGVycm9yIGluIHlvdXIgcmVkdWNlciBvciBhIFxcYGNvbm5lY3RcXGAuYCwgZXJyb3IpXG4gICAgICAgIH1cblxuICAgICAgICBkaXNwYXRjaCh7XG4gICAgICAgICAgdHlwZTogRkFJTEVELFxuICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgIHBheWxvYWQ6IHtcbiAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgc3RhdHVzOiBlcnJvci5zdGF0dXMsXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVSZWR1Y2VyRm9yQ29sbGVjdGlvbiAobmFtZSwgcGx1cmFsTmFtZSwgY29uc3RhbnRzKSB7XG4gIGNvbnN0IHtcbiAgICBGQUlMRUQsXG4gICAgREVMRVRFLFxuICAgIFVQREFURSxcbiAgICBGSU5JU0hFRCxcbiAgICBJTl9QUk9HUkVTUyxcbiAgICBGRVRDSF9GQUlMRUQsXG4gICAgRkVUQ0hfRklOSVNIRUQsXG4gICAgRkVUQ0hfSU5fUFJPR1JFU1NcbiAgfSA9IGNvbnN0YW50c1xuXG4gIGNvbnN0IEZldGNoUmVjb3JkID0gSW1tdXRhYmxlLlJlY29yZCh7XG4gICAgZmV0Y2hlczogSW1tdXRhYmxlLk1hcCgpXG4gIH0pXG5cbiAgY2xhc3MgRmV0Y2hTdGF0ZSBleHRlbmRzIEZldGNoUmVjb3JkIHtcbiAgICBnZXRBbGxJdGVtcyAoLi4uYXJncykge1xuICAgICAgY29uc3QgZmV0Y2ggPSB0aGlzLmdldEZldGNoKGFyZ3MpXG5cbiAgICAgIGlmIChmZXRjaC5nZXQoJ3N0YXR1cycpID09PSBGRVRDSF9GSU5JU0hFRCkge1xuICAgICAgICByZXR1cm4gZmV0Y2guZ2V0KCdyZXN1bHQnKVxuICAgICAgfVxuICAgIH1cblxuICAgIGdldEl0ZW1CeUlkICguLi5hcmdzKSB7XG4gICAgICBjb25zdCBpZCA9IF8ubGFzdChhcmdzKVxuICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmdldEFsbEl0ZW1zLmFwcGx5KHRoaXMsIF8uaW5pdGlhbChhcmdzKSlcblxuICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgIHJldHVybiBpdGVtcy5maW5kKChpdGVtKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0uZ2V0KCdpZCcpID09PSBpZFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICBoYXNGZXRjaGVkICguLi5hcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRTdGF0dXMoYXJncykgPT09IEZFVENIX0ZJTklTSEVEXG4gICAgfVxuICAgIGlzRmV0Y2hpbmcgKC4uLmFyZ3MpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFN0YXR1cyhhcmdzKSA9PT0gRkVUQ0hfSU5fUFJPR1JFU1NcbiAgICB9XG4gICAgaGFzRmFpbGVkVG9GZXRjaCAoLi4uYXJncykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U3RhdHVzKGFyZ3MpID09PSBGRVRDSF9GQUlMRURcbiAgICB9XG4gICAgZ2V0U3RhdHVzIChhcmdzKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRGZXRjaChhcmdzKS5nZXQoJ3N0YXR1cycpXG4gICAgfVxuICAgIGdldEZldGNoIChhcmdzKSB7XG4gICAgICBjb25zdCBrZXkgPSBjcmVhdGVLZXkoYXJncylcblxuICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hlcy5nZXQoa2V5KSB8fCBuZXcgSW1tdXRhYmxlLk1hcCgpXG4gICAgfVxuICB9XG5cbiAgYWRkRnVuY3Rpb25BbGlhcygnZ2V0SXRlbUJ5SWQnLCBgZ2V0JHtuYW1lfUJ5SWRgKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdnZXRBbGxJdGVtcycsIGBnZXRBbGwke3BsdXJhbE5hbWV9YClcbiAgYWRkRnVuY3Rpb25BbGlhcygnaXNGZXRjaGluZycsIGBpc0ZldGNoaW5nJHtwbHVyYWxOYW1lfWApXG4gIGFkZEZ1bmN0aW9uQWxpYXMoJ2hhc0ZldGNoZWQnLCBgaGFzRmV0Y2hlZCR7cGx1cmFsTmFtZX1gKVxuICBhZGRGdW5jdGlvbkFsaWFzKCdoYXNGYWlsZWRUb0ZldGNoJywgYGhhc0ZhaWxlZFRvRmV0Y2gke3BsdXJhbE5hbWV9YClcblxuICByZXR1cm4gY3JlYXRlUmVkdWNlcihuZXcgRmV0Y2hTdGF0ZSgpLCB7XG4gICAgW0RFTEVURV06IGRlbGV0ZUl0ZW0sXG4gICAgW1VQREFURV06IHVwZGF0ZSxcbiAgICBbRkFJTEVEXTogc2V0U3RhdHVzKEZFVENIX0ZBSUxFRCksXG4gICAgW0lOX1BST0dSRVNTXTogc2V0U3RhdHVzKEZFVENIX0lOX1BST0dSRVNTKSxcbiAgICBbRklOSVNIRURdOiBbc2V0U3RhdHVzKEZFVENIX0ZJTklTSEVEKSwgc2V0UmVzdWx0XVxuICB9KVxuXG4gIGZ1bmN0aW9uIGFkZEZ1bmN0aW9uQWxpYXMgKGZ1bmMsIGFsaWFzKSB7XG4gICAgRmV0Y2hTdGF0ZS5wcm90b3R5cGVbYWxpYXNdID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXNbZnVuY10uYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGV0ZUl0ZW0gKHN0YXRlLCB7IGtleSwgaWQgfSkge1xuICAgIHJldHVybiBzdGF0ZS51cGRhdGUoJ2ZldGNoZXMnLCAoZmV0Y2hlcykgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZmV0Y2hlc1xuICAgICAgICAuZ2V0SW4oW2tleSwgJ3Jlc3VsdCddKVxuICAgICAgICAuZmlsdGVyKGl0ZW1zV2l0aFdyb25nSWQpXG5cbiAgICAgIHJldHVybiBmZXRjaGVzLnNldEluKFtrZXksICdyZXN1bHQnXSwgcmVzdWx0KVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBpdGVtc1dpdGhXcm9uZ0lkIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS5nZXQoJ2lkJykgIT09IGlkXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlIChzdGF0ZSwgeyBrZXksIGlkLCBpdGVtIH0pIHtcbiAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZmV0Y2hlc1xuICAgICAgICAuZ2V0SW4oW2tleSwgJ3Jlc3VsdCddKVxuICAgICAgICAuZmluZEluZGV4KGl0ZW1XaXRoSWQpXG5cbiAgICAgIHJldHVybiBmZXRjaGVzLnNldEluKFtrZXksICdyZXN1bHQnLCBpbmRleF0sIGl0ZW0pXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIGl0ZW1XaXRoSWQgKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLmdldCgnaWQnKSA9PT0gaWRcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRSZXN1bHQgKHN0YXRlLCB7IGtleSwgcmVzdWx0IH0pIHtcbiAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nUmVzdWx0ID0gZmV0Y2hlcy5nZXRJbihba2V5LCAncmVzdWx0J10pXG5cbiAgICAgIGlmIChleGlzdGluZ1Jlc3VsdCkge1xuICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGV4aXN0aW5nUmVzdWx0KVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmV0Y2hlcy5zZXRJbihba2V5LCAncmVzdWx0J10sIHJlc3VsdClcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0U3RhdHVzIChzdGF0dXMpIHtcbiAgICByZXR1cm4gKHN0YXRlLCB7IGtleSB9KSA9PiB7XG4gICAgICByZXR1cm4gc3RhdGUudXBkYXRlKCdmZXRjaGVzJywgKGZldGNoZXMpID0+IHtcbiAgICAgICAgcmV0dXJuIGZldGNoZXMuc2V0SW4oW2tleSwgJ3N0YXR1cyddLCBzdGF0dXMpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVLZXkgKGFyZ3MpIHtcbiAgaW52YXJpYW50KF8uaXNBcnJheShhcmdzKSwgJ2BhcmdzYCBtdXN0IGJlIGFuIGFycmF5JylcblxuICByZXR1cm4gYXJncy5qb2luKCctJylcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ29uc3RhbnRzIChuYW1lLCBwbHVyYWxOYW1lKSB7XG4gIGNvbnN0IGNvbnN0YW50UGx1cmFsTmFtZSA9IGBGRVRDSF8ke3BsdXJhbE5hbWUudG9VcHBlckNhc2UoKX1gXG5cbiAgY29uc3QgRkVUQ0hfRkFJTEVEID0gJ0ZFVENIX0ZBSUxFRCdcbiAgY29uc3QgRkVUQ0hfRklOSVNIRUQgPSAnRkVUQ0hfRklOSVNIRUQnXG4gIGNvbnN0IEZFVENIX0lOX1BST0dSRVNTID0gJ0ZFVENIX0lOX1BST0dSRVNTJ1xuICBjb25zdCBJTl9QUk9HUkVTUyA9IGAke2NvbnN0YW50UGx1cmFsTmFtZX1fSU5fUFJPR1JFU1NgXG4gIGNvbnN0IEZJTklTSEVEID0gYCR7Y29uc3RhbnRQbHVyYWxOYW1lfV9GSU5JU0hFRGBcbiAgY29uc3QgRkFJTEVEID0gYCR7Y29uc3RhbnRQbHVyYWxOYW1lfV9GQUlMRURgXG4gIGNvbnN0IERFTEVURSA9IGBERUxFVEVfJHtuYW1lLnRvVXBwZXJDYXNlKCl9YFxuICBjb25zdCBVUERBVEUgPSBgVVBEQVRFXyR7bmFtZS50b1VwcGVyQ2FzZSgpfWBcblxuICByZXR1cm4ge1xuICAgIEZBSUxFRCxcbiAgICBERUxFVEUsXG4gICAgVVBEQVRFLFxuICAgIEZJTklTSEVELFxuICAgIElOX1BST0dSRVNTLFxuICAgIEZFVENIX0ZBSUxFRCxcbiAgICBGRVRDSF9GSU5JU0hFRCxcbiAgICBGRVRDSF9JTl9QUk9HUkVTU1xuICB9XG59XG4iXX0=