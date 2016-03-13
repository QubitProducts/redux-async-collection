'use strict';

var _when = require('when');

var _when2 = _interopRequireDefault(_when);

var _sinon = require('sinon');

var _sinon2 = _interopRequireDefault(_sinon);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _chai = require('chai');

var _delay = require('when/delay');

var _delay2 = _interopRequireDefault(_delay);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _createCollection = require('../createCollection');

var _createCollection2 = _interopRequireDefault(_createCollection);

var _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('createCollection', function () {
  var get = void 0;
  var res = void 0;
  var data = void 0;
  var store = void 0;
  var result = void 0;
  var sandbox = void 0;
  var barId = void 0;
  var collection = void 0;
  var fooId = void 0;
  var expectedUrl = void 0;
  var requestConfig = void 0;

  beforeEach(function () {
    fooId = 123;
    barId = 'B-12';
    get = _sinon2.default.spy(function () {
      return res;
    });
    sandbox = _sinon2.default.sandbox.create();
    sandbox.stub(_axios2.default, 'get', get);
    requestConfig = { timeout: _createCollection.REQUEST_TIMEOUT };
    expectedUrl = createUrl(fooId, barId);
    collection = (0, _createCollection2.default)('Thing', createUrl);
    store = createStoreForCollection(collection);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('when a fetch has not started', function () {
    beforeEach(function () {
      data = [{
        id: 1, name: 'foo'
      }, {
        id: 2, name: 'bar'
      }];
      res = (0, _when2.default)({ status: 200, data: data });

      return fetchThings(fooId, barId, 2);
    });

    it('should return the item', function () {
      (0, _chai.expect)(result.item).to.eql(_immutable2.default.fromJS(data[1]));
    });

    it('should call make a valid http request', function () {
      (0, _chai.expect)(get).to.be.calledWith(expectedUrl, requestConfig);
    });

    it('should return the items', function () {
      (0, _chai.expect)(result.items).to.eql(_immutable2.default.fromJS(data));
    });

    it('should say we have fetched', function () {
      (0, _chai.expect)(result.hasFetched).to.eql(true);
    });

    it('should NOT say there was an error', function () {
      (0, _chai.expect)(result.hasFailedToFetch).to.eql(false);
    });

    it('should NOT say were loading the items', function () {
      (0, _chai.expect)(result.isFetching).to.eql(false);
    });
  });

  describe('when I add an item', function () {
    var expectedThing = void 0;

    beforeEach(function () {
      data = [{
        id: 1, name: 'foo'
      }];
      res = (0, _when2.default)({ status: 200, data: data });

      return fetchThings(fooId, barId, 2);
    });

    beforeEach(function () {
      expectedThing = {
        id: 2, name: 'bar'
      };
      addThing(fooId, barId, expectedThing);

      return fetchThings(fooId, barId, 2);
    });

    it('should add the item', function () {
      (0, _chai.expect)(result.item).to.eql(_immutable2.default.fromJS(expectedThing));
      (0, _chai.expect)(result.items.size).to.eql(2);
    });
  });

  describe('when I delete an item', function () {
    beforeEach(function () {
      data = [{
        id: 1, name: 'foo'
      }, {
        id: 2, name: 'bar'
      }, {
        id: 3, name: 'baz'
      }];
      res = (0, _when2.default)({ status: 200, data: data });

      return fetchThings(fooId, barId, 2);
    });

    beforeEach(function () {
      deleteThing(fooId, barId, 2);

      return fetchThings(fooId, barId, 2);
    });

    it('should delete the item', function () {
      (0, _chai.expect)(result.item).to.eql(undefined);
      (0, _chai.expect)(result.items.size).to.eql(2);
    });
  });

  describe('when a fetch is in progress', function () {
    beforeEach(function () {
      var deferred = _when2.default.defer();
      res = deferred.promise;

      return fetchThings(fooId, barId).then(function () {
        get.reset();

        return fetchThings(fooId, barId);
      });
    });

    it('should NOT make any http requests', function () {
      (0, _chai.expect)(get).to.not.be.called;
    });

    it('should NOT return any items', function () {
      (0, _chai.expect)(result.items).to.eql(undefined);
    });

    it('should NOT say we have fetched', function () {
      (0, _chai.expect)(result.hasFetched).to.eql(false);
    });

    it('should NOT say there was an error', function () {
      (0, _chai.expect)(result.hasFailedToFetch).to.eql(false);
    });

    it('should say were loading the items', function () {
      (0, _chai.expect)(result.isFetching).to.eql(true);
    });
  });

  describe('when a fetch has failed', function () {
    beforeEach(function () {
      res = _when2.default.reject({ status: 500 });

      return fetchThings(fooId, barId);
    });

    describe('when you try to fetch again', function () {
      beforeEach(function () {
        get.reset();

        return fetchThings(fooId, barId);
      });

      it('should NOT make any http requests', function () {
        (0, _chai.expect)(get).to.not.be.called;
      });
    });

    it('should NOT return any items', function () {
      (0, _chai.expect)(result.items).to.eql(undefined);
    });

    it('should NOT say we have fetched', function () {
      (0, _chai.expect)(result.hasFetched).to.eql(false);
    });

    it('should say there was an error', function () {
      (0, _chai.expect)(result.hasFailedToFetch).to.eql(true);
    });

    it('should NOT say were loading the items', function () {
      (0, _chai.expect)(result.isFetching).to.eql(false);
    });
  });

  function createStoreForCollection(_ref) {
    var fetchThings = _ref.fetchThings;
    var things = _ref.things;

    var createStoreWithMiddleware = (0, _redux.applyMiddleware)(_reduxThunk2.default)(_redux.createStore);
    return createStoreWithMiddleware((0, _redux.combineReducers)({ things: things }));
  }

  function addThing(fooId, barId, experience) {
    store.dispatch(collection.addThing(fooId, barId, experience));
  }

  function deleteThing(fooId, barId, id) {
    store.dispatch(collection.deleteThing(fooId, barId, id));
  }

  function fetchThings(fooId, barId, id) {
    store.dispatch(collection.fetchThings(fooId, barId));

    return (0, _delay2.default)(1).then(getResult);

    function getResult() {
      var _store$getState = store.getState();

      var things = _store$getState.things;


      result = {
        isFetching: things.isFetching(fooId, barId),
        hasFetched: things.hasFetched(fooId, barId),
        items: things.getAllThings(fooId, barId),
        item: things.getThingById(fooId, barId, id),
        hasFailedToFetch: things.hasFailedToFetch(fooId, barId)
      };
    }
  }

  function createUrl(fooId, barId) {
    return 'http://' + fooId + '/' + barId;
  }
});