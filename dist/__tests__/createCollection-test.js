'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

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

  describe('when the entity\'s name is a weird plural', function () {
    it('should properly pluralize it', function () {
      (0, _chai.expect)((0, _createCollection2.default)('Property').properties).to.exist;
    });
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

  describe('when a path is specified and a fetch has completed', function () {
    beforeEach(function () {
      collection = (0, _createCollection2.default)({
        name: 'Thing',
        createUrl: createUrl,
        path: 'nested'
      });
      var things = collection.things;
      store = (0, _redux.applyMiddleware)(_reduxThunk2.default)(_redux.createStore)((0, _redux.combineReducers)({ nested: (0, _redux.combineReducers)({ things: things }) }));
      data = [{
        id: 1, name: 'foo'
      }, {
        id: 2, name: 'bar'
      }];
      res = (0, _when2.default)({ status: 200, data: data });

      return fetchThings(fooId, barId, 2, 'nested');
    });

    it('should return the item', function () {
      (0, _chai.expect)(result.item).to.eql(_immutable2.default.fromJS(data[1]));
    });
  });

  describe('when a previous fetch has completed and I refresh the items', function () {
    var subscriber = void 0;

    beforeEach(function () {
      collection = (0, _createCollection2.default)({
        name: 'Thing',
        createUrl: createUrl,
        path: 'nested'
      });
      var things = collection.things;
      store = (0, _redux.applyMiddleware)(_reduxThunk2.default)(_redux.createStore)((0, _redux.combineReducers)({ nested: (0, _redux.combineReducers)({ things: things }) }));
      data = [{
        id: 1, name: 'foo'
      }, {
        id: 2, name: 'bar'
      }];
      res = (0, _when2.default)({ status: 200, data: data });

      return fetchThings(fooId, barId, 2, 'nested');
    });

    beforeEach(function () {
      subscriber = _sinon2.default.spy();
      store.subscribe(subscriber);

      store.dispatch(collection.refreshThings(fooId, barId));
    });

    it('should have called get again', function () {
      (0, _chai.expect)(get).calledTwice;
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

  describe('when I update an item', function () {
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
      updateThing(fooId, barId, { id: 2, name: 'quux' });

      return fetchThings(fooId, barId, 2);
    });

    it('should update the item', function () {
      (0, _chai.expect)(result.item).to.eql(_immutable2.default.fromJS({ id: 2, name: 'quux' }));
      (0, _chai.expect)(result.items.size).to.eql(3);
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
    var fetchThings = _ref.fetchThings,
        things = _ref.things;

    var createStoreWithMiddleware = (0, _redux.applyMiddleware)(_reduxThunk2.default)(_redux.createStore);
    return createStoreWithMiddleware((0, _redux.combineReducers)({ things: things }));
  }

  function addThing(fooId, barId, experience) {
    store.dispatch(collection.addThing(fooId, barId, experience));
  }

  function deleteThing(fooId, barId, id) {
    store.dispatch(collection.deleteThing(fooId, barId, id));
  }

  function updateThing(fooId, barId, thing) {
    store.dispatch(collection.updateThing(fooId, barId, thing));
  }

  function fetchThings(fooId, barId, id) {
    var path = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

    store.dispatch(collection.fetchThings(fooId, barId));

    return (0, _delay2.default)(1).then(getResult);

    function getResult() {
      var things = _lodash2.default.get(store.getState(), [].concat(path).concat('things'));

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9fX3Rlc3RzX18vY3JlYXRlQ29sbGVjdGlvbi10ZXN0LmpzIl0sIm5hbWVzIjpbImRlc2NyaWJlIiwiZ2V0IiwicmVzIiwiZGF0YSIsInN0b3JlIiwicmVzdWx0Iiwic2FuZGJveCIsImJhcklkIiwiY29sbGVjdGlvbiIsImZvb0lkIiwiZXhwZWN0ZWRVcmwiLCJyZXF1ZXN0Q29uZmlnIiwiYmVmb3JlRWFjaCIsInNweSIsImNyZWF0ZSIsInN0dWIiLCJ0aW1lb3V0IiwiY3JlYXRlVXJsIiwiY3JlYXRlU3RvcmVGb3JDb2xsZWN0aW9uIiwiYWZ0ZXJFYWNoIiwicmVzdG9yZSIsIml0IiwicHJvcGVydGllcyIsInRvIiwiZXhpc3QiLCJpZCIsIm5hbWUiLCJzdGF0dXMiLCJmZXRjaFRoaW5ncyIsIml0ZW0iLCJlcWwiLCJmcm9tSlMiLCJiZSIsImNhbGxlZFdpdGgiLCJpdGVtcyIsImhhc0ZldGNoZWQiLCJoYXNGYWlsZWRUb0ZldGNoIiwiaXNGZXRjaGluZyIsInBhdGgiLCJ0aGluZ3MiLCJuZXN0ZWQiLCJzdWJzY3JpYmVyIiwic3Vic2NyaWJlIiwiZGlzcGF0Y2giLCJyZWZyZXNoVGhpbmdzIiwiY2FsbGVkVHdpY2UiLCJleHBlY3RlZFRoaW5nIiwiYWRkVGhpbmciLCJzaXplIiwiZGVsZXRlVGhpbmciLCJ1bmRlZmluZWQiLCJ1cGRhdGVUaGluZyIsImRlZmVycmVkIiwiZGVmZXIiLCJwcm9taXNlIiwidGhlbiIsInJlc2V0Iiwibm90IiwiY2FsbGVkIiwicmVqZWN0IiwiY3JlYXRlU3RvcmVXaXRoTWlkZGxld2FyZSIsImV4cGVyaWVuY2UiLCJ0aGluZyIsImdldFJlc3VsdCIsImdldFN0YXRlIiwiY29uY2F0IiwiZ2V0QWxsVGhpbmdzIiwiZ2V0VGhpbmdCeUlkIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7OztB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QUEwQkYsS0FBMUI7QUFDRDtBQUNGLENBM1REIiwiZmlsZSI6ImNyZWF0ZUNvbGxlY3Rpb24tdGVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCB3aGVuIGZyb20gJ3doZW4nXG5pbXBvcnQgc2lub24gZnJvbSAnc2lub24nXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnXG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJ1xuaW1wb3J0IGRlbGF5IGZyb20gJ3doZW4vZGVsYXknXG5pbXBvcnQgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSdcbmltcG9ydCB0aHVua01pZGRsZXdhcmUgZnJvbSAncmVkdXgtdGh1bmsnXG5pbXBvcnQgY3JlYXRlQ29sbGVjdGlvbiBmcm9tICcuLi9jcmVhdGVDb2xsZWN0aW9uJ1xuaW1wb3J0IHsgUkVRVUVTVF9USU1FT1VUIH0gZnJvbSAnLi4vY3JlYXRlQ29sbGVjdGlvbidcbmltcG9ydCB7IGNyZWF0ZVN0b3JlLCBjb21iaW5lUmVkdWNlcnMsIGFwcGx5TWlkZGxld2FyZSB9IGZyb20gJ3JlZHV4J1xuXG5kZXNjcmliZSgnY3JlYXRlQ29sbGVjdGlvbicsICgpID0+IHtcbiAgbGV0IGdldFxuICBsZXQgcmVzXG4gIGxldCBkYXRhXG4gIGxldCBzdG9yZVxuICBsZXQgcmVzdWx0XG4gIGxldCBzYW5kYm94XG4gIGxldCBiYXJJZFxuICBsZXQgY29sbGVjdGlvblxuICBsZXQgZm9vSWRcbiAgbGV0IGV4cGVjdGVkVXJsXG4gIGxldCByZXF1ZXN0Q29uZmlnXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgZm9vSWQgPSAxMjNcbiAgICBiYXJJZCA9ICdCLTEyJ1xuICAgIGdldCA9IHNpbm9uLnNweSgoKSA9PiByZXMpXG4gICAgc2FuZGJveCA9IHNpbm9uLnNhbmRib3guY3JlYXRlKClcbiAgICBzYW5kYm94LnN0dWIoYXhpb3MsICdnZXQnLCBnZXQpXG4gICAgcmVxdWVzdENvbmZpZyA9IHsgdGltZW91dDogUkVRVUVTVF9USU1FT1VUIH1cbiAgICBleHBlY3RlZFVybCA9IGNyZWF0ZVVybChmb29JZCwgYmFySWQpXG4gICAgY29sbGVjdGlvbiA9IGNyZWF0ZUNvbGxlY3Rpb24oJ1RoaW5nJywgY3JlYXRlVXJsKVxuICAgIHN0b3JlID0gY3JlYXRlU3RvcmVGb3JDb2xsZWN0aW9uKGNvbGxlY3Rpb24pXG4gIH0pXG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBzYW5kYm94LnJlc3RvcmUoKVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIHRoZSBlbnRpdHlcXCdzIG5hbWUgaXMgYSB3ZWlyZCBwbHVyYWwnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBwbHVyYWxpemUgaXQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoY3JlYXRlQ29sbGVjdGlvbignUHJvcGVydHknKS5wcm9wZXJ0aWVzKS50by5leGlzdFxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYSBmZXRjaCBoYXMgbm90IHN0YXJ0ZWQnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBkYXRhID0gW3tcbiAgICAgICAgaWQ6IDEsIG5hbWU6ICdmb28nXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAyLCBuYW1lOiAnYmFyJ1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiB0aGUgaXRlbScsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbSkudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZGF0YVsxXSkpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBtYWtlIGEgdmFsaWQgaHR0cCByZXF1ZXN0JywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGdldCkudG8uYmUuY2FsbGVkV2l0aChleHBlY3RlZFVybCwgcmVxdWVzdENvbmZpZylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdGhlIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcykudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZGF0YSkpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc2F5IHdlIGhhdmUgZmV0Y2hlZCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmV0Y2hlZCkudG8uZXFsKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB0aGVyZSB3YXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZhaWxlZFRvRmV0Y2gpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHdlcmUgbG9hZGluZyB0aGUgaXRlbXMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0LmlzRmV0Y2hpbmcpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIGEgcGF0aCBpcyBzcGVjaWZpZWQgYW5kIGEgZmV0Y2ggaGFzIGNvbXBsZXRlZCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGNvbGxlY3Rpb24gPSBjcmVhdGVDb2xsZWN0aW9uKHtcbiAgICAgICAgbmFtZTogJ1RoaW5nJyxcbiAgICAgICAgY3JlYXRlVXJsLFxuICAgICAgICBwYXRoOiAnbmVzdGVkJ1xuICAgICAgfSlcbiAgICAgIGNvbnN0IHRoaW5ncyA9IGNvbGxlY3Rpb24udGhpbmdzXG4gICAgICBzdG9yZSA9IGFwcGx5TWlkZGxld2FyZSh0aHVua01pZGRsZXdhcmUpKGNyZWF0ZVN0b3JlKShjb21iaW5lUmVkdWNlcnMoeyBuZXN0ZWQ6IGNvbWJpbmVSZWR1Y2Vycyh7IHRoaW5ncyB9KSB9KSlcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9XVxuICAgICAgcmVzID0gd2hlbih7IHN0YXR1czogMjAwLCBkYXRhIH0pXG5cbiAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQsIDIsICduZXN0ZWQnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiB0aGUgaXRlbScsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbSkudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZGF0YVsxXSkpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnd2hlbiBhIHByZXZpb3VzIGZldGNoIGhhcyBjb21wbGV0ZWQgYW5kIEkgcmVmcmVzaCB0aGUgaXRlbXMnLCAoKSA9PiB7XG4gICAgbGV0IHN1YnNjcmliZXJcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgY29sbGVjdGlvbiA9IGNyZWF0ZUNvbGxlY3Rpb24oe1xuICAgICAgICBuYW1lOiAnVGhpbmcnLFxuICAgICAgICBjcmVhdGVVcmwsXG4gICAgICAgIHBhdGg6ICduZXN0ZWQnXG4gICAgICB9KVxuICAgICAgY29uc3QgdGhpbmdzID0gY29sbGVjdGlvbi50aGluZ3NcbiAgICAgIHN0b3JlID0gYXBwbHlNaWRkbGV3YXJlKHRodW5rTWlkZGxld2FyZSkoY3JlYXRlU3RvcmUpKGNvbWJpbmVSZWR1Y2Vycyh7IG5lc3RlZDogY29tYmluZVJlZHVjZXJzKHsgdGhpbmdzIH0pIH0pKVxuICAgICAgZGF0YSA9IFt7XG4gICAgICAgIGlkOiAxLCBuYW1lOiAnZm9vJ1xuICAgICAgfSwge1xuICAgICAgICBpZDogMiwgbmFtZTogJ2JhcidcbiAgICAgIH1dXG4gICAgICByZXMgPSB3aGVuKHsgc3RhdHVzOiAyMDAsIGRhdGEgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMiwgJ25lc3RlZCcpXG4gICAgfSlcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgc3Vic2NyaWJlciA9IHNpbm9uLnNweSgpXG4gICAgICBzdG9yZS5zdWJzY3JpYmUoc3Vic2NyaWJlcilcblxuICAgICAgc3RvcmUuZGlzcGF0Y2goY29sbGVjdGlvbi5yZWZyZXNoVGhpbmdzKGZvb0lkLCBiYXJJZCkpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgaGF2ZSBjYWxsZWQgZ2V0IGFnYWluJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGdldCkuY2FsbGVkVHdpY2VcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIEkgYWRkIGFuIGl0ZW0nLCAoKSA9PiB7XG4gICAgbGV0IGV4cGVjdGVkVGhpbmdcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgZGF0YSA9IFt7XG4gICAgICAgIGlkOiAxLCBuYW1lOiAnZm9vJ1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGV4cGVjdGVkVGhpbmcgPSB7XG4gICAgICAgIGlkOiAyLCBuYW1lOiAnYmFyJ1xuICAgICAgfVxuICAgICAgYWRkVGhpbmcoZm9vSWQsIGJhcklkLCBleHBlY3RlZFRoaW5nKVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGFkZCB0aGUgaXRlbScsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbSkudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZXhwZWN0ZWRUaGluZykpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgyKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gSSBkZWxldGUgYW4gaXRlbScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAzLCBuYW1lOiAnYmF6J1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRlbGV0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgMilcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMilcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkZWxldGUgdGhlIGl0ZW0nLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW0pLnRvLmVxbCh1bmRlZmluZWQpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgyKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gSSB1cGRhdGUgYW4gaXRlbScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAzLCBuYW1lOiAnYmF6J1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHVwZGF0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgeyBpZDogMiwgbmFtZTogJ3F1dXgnIH0pXG5cbiAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQsIDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIHRoZSBpdGVtJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtKS50by5lcWwoSW1tdXRhYmxlLmZyb21KUyh7IGlkOiAyLCBuYW1lOiAncXV1eCcgfSkpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgzKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYSBmZXRjaCBpcyBpbiBwcm9ncmVzcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGxldCBkZWZlcnJlZCA9IHdoZW4uZGVmZXIoKVxuICAgICAgcmVzID0gZGVmZXJyZWQucHJvbWlzZVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKS50aGVuKCgpID0+IHtcbiAgICAgICAgZ2V0LnJlc2V0KClcblxuICAgICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1QgbWFrZSBhbnkgaHR0cCByZXF1ZXN0cycsICgpID0+IHtcbiAgICAgIGV4cGVjdChnZXQpLnRvLm5vdC5iZS5jYWxsZWRcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1QgcmV0dXJuIGFueSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbXMpLnRvLmVxbCh1bmRlZmluZWQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB3ZSBoYXZlIGZldGNoZWQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZldGNoZWQpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHRoZXJlIHdhcyBhbiBlcnJvcicsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmFpbGVkVG9GZXRjaCkudG8uZXFsKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNheSB3ZXJlIGxvYWRpbmcgdGhlIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pc0ZldGNoaW5nKS50by5lcWwodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIGEgZmV0Y2ggaGFzIGZhaWxlZCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHJlcyA9IHdoZW4ucmVqZWN0KHsgc3RhdHVzOiA1MDAgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZClcbiAgICB9KVxuXG4gICAgZGVzY3JpYmUoJ3doZW4geW91IHRyeSB0byBmZXRjaCBhZ2FpbicsICgpID0+IHtcbiAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgICBnZXQucmVzZXQoKVxuXG4gICAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQpXG4gICAgICB9KVxuXG4gICAgICBpdCgnc2hvdWxkIE5PVCBtYWtlIGFueSBodHRwIHJlcXVlc3RzJywgKCkgPT4ge1xuICAgICAgICBleHBlY3QoZ2V0KS50by5ub3QuYmUuY2FsbGVkXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCByZXR1cm4gYW55IGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcykudG8uZXFsKHVuZGVmaW5lZClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHdlIGhhdmUgZmV0Y2hlZCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmV0Y2hlZCkudG8uZXFsKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNheSB0aGVyZSB3YXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZhaWxlZFRvRmV0Y2gpLnRvLmVxbCh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCBzYXkgd2VyZSBsb2FkaW5nIHRoZSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNGZXRjaGluZykudG8uZXFsKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RvcmVGb3JDb2xsZWN0aW9uICh7IGZldGNoVGhpbmdzLCB0aGluZ3MgfSkge1xuICAgIGNvbnN0IGNyZWF0ZVN0b3JlV2l0aE1pZGRsZXdhcmUgPSBhcHBseU1pZGRsZXdhcmUodGh1bmtNaWRkbGV3YXJlKShjcmVhdGVTdG9yZSlcbiAgICByZXR1cm4gY3JlYXRlU3RvcmVXaXRoTWlkZGxld2FyZShjb21iaW5lUmVkdWNlcnMoeyB0aGluZ3MgfSkpXG4gIH1cblxuICBmdW5jdGlvbiBhZGRUaGluZyAoZm9vSWQsIGJhcklkLCBleHBlcmllbmNlKSB7XG4gICAgc3RvcmUuZGlzcGF0Y2goY29sbGVjdGlvbi5hZGRUaGluZyhmb29JZCwgYmFySWQsIGV4cGVyaWVuY2UpKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVsZXRlVGhpbmcgKGZvb0lkLCBiYXJJZCwgaWQpIHtcbiAgICBzdG9yZS5kaXNwYXRjaChjb2xsZWN0aW9uLmRlbGV0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgaWQpKVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlVGhpbmcgKGZvb0lkLCBiYXJJZCwgdGhpbmcpIHtcbiAgICBzdG9yZS5kaXNwYXRjaChjb2xsZWN0aW9uLnVwZGF0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgdGhpbmcpKVxuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hUaGluZ3MgKGZvb0lkLCBiYXJJZCwgaWQsIHBhdGggPSBbXSkge1xuICAgIHN0b3JlLmRpc3BhdGNoKGNvbGxlY3Rpb24uZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKSlcblxuICAgIHJldHVybiBkZWxheSgxKS50aGVuKGdldFJlc3VsdClcblxuICAgIGZ1bmN0aW9uIGdldFJlc3VsdCAoKSB7XG4gICAgICBjb25zdCB0aGluZ3MgPSBfLmdldChzdG9yZS5nZXRTdGF0ZSgpLCBbXS5jb25jYXQocGF0aCkuY29uY2F0KCd0aGluZ3MnKSlcblxuICAgICAgcmVzdWx0ID0ge1xuICAgICAgICBpc0ZldGNoaW5nOiB0aGluZ3MuaXNGZXRjaGluZyhmb29JZCwgYmFySWQpLFxuICAgICAgICBoYXNGZXRjaGVkOiB0aGluZ3MuaGFzRmV0Y2hlZChmb29JZCwgYmFySWQpLFxuICAgICAgICBpdGVtczogdGhpbmdzLmdldEFsbFRoaW5ncyhmb29JZCwgYmFySWQpLFxuICAgICAgICBpdGVtOiB0aGluZ3MuZ2V0VGhpbmdCeUlkKGZvb0lkLCBiYXJJZCwgaWQpLFxuICAgICAgICBoYXNGYWlsZWRUb0ZldGNoOiB0aGluZ3MuaGFzRmFpbGVkVG9GZXRjaChmb29JZCwgYmFySWQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlVXJsIChmb29JZCwgYmFySWQpIHtcbiAgICByZXR1cm4gYGh0dHA6Ly8ke2Zvb0lkfS8ke2JhcklkfWBcbiAgfVxufSlcbiJdfQ==