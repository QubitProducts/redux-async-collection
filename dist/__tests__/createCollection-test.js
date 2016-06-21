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

  function updateThing(fooId, barId, thing) {
    store.dispatch(collection.updateThing(fooId, barId, thing));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9fX3Rlc3RzX18vY3JlYXRlQ29sbGVjdGlvbi10ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUVBLFNBQVMsa0JBQVQsRUFBNkIsWUFBTTtBQUNqQyxNQUFJLFlBQUo7QUFDQSxNQUFJLFlBQUo7QUFDQSxNQUFJLGFBQUo7QUFDQSxNQUFJLGNBQUo7QUFDQSxNQUFJLGVBQUo7QUFDQSxNQUFJLGdCQUFKO0FBQ0EsTUFBSSxjQUFKO0FBQ0EsTUFBSSxtQkFBSjtBQUNBLE1BQUksY0FBSjtBQUNBLE1BQUksb0JBQUo7QUFDQSxNQUFJLHNCQUFKOztBQUVBLGFBQVcsWUFBTTtBQUNmLFlBQVEsR0FBUjtBQUNBLFlBQVEsTUFBUjtBQUNBLFVBQU0sZ0JBQU0sR0FBTixDQUFVO0FBQUEsYUFBTSxHQUFOO0FBQUEsS0FBVixDQUFOO0FBQ0EsY0FBVSxnQkFBTSxPQUFOLENBQWMsTUFBZCxFQUFWO0FBQ0EsWUFBUSxJQUFSLGtCQUFvQixLQUFwQixFQUEyQixHQUEzQjtBQUNBLG9CQUFnQixFQUFFLDBDQUFGLEVBQWhCO0FBQ0Esa0JBQWMsVUFBVSxLQUFWLEVBQWlCLEtBQWpCLENBQWQ7QUFDQSxpQkFBYSxnQ0FBaUIsT0FBakIsRUFBMEIsU0FBMUIsQ0FBYjtBQUNBLFlBQVEseUJBQXlCLFVBQXpCLENBQVI7QUFDRCxHQVZEOztBQVlBLFlBQVUsWUFBTTtBQUNkLFlBQVEsT0FBUjtBQUNELEdBRkQ7O0FBSUEsV0FBUywyQ0FBVCxFQUFzRCxZQUFNO0FBQzFELE9BQUcsOEJBQUgsRUFBbUMsWUFBTTtBQUN2Qyx3QkFBTyxnQ0FBaUIsVUFBakIsRUFBNkIsVUFBcEMsRUFBZ0QsRUFBaEQsQ0FBbUQsS0FBbkQ7QUFDRCxLQUZEO0FBR0QsR0FKRDs7QUFNQSxXQUFTLDhCQUFULEVBQXlDLFlBQU07QUFDN0Ms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Y3Rpb24tdGVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB3aGVuIGZyb20gJ3doZW4nXG5pbXBvcnQgc2lub24gZnJvbSAnc2lub24nXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnXG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJ1xuaW1wb3J0IGRlbGF5IGZyb20gJ3doZW4vZGVsYXknXG5pbXBvcnQgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSdcbmltcG9ydCB0aHVua01pZGRsZXdhcmUgZnJvbSAncmVkdXgtdGh1bmsnXG5pbXBvcnQgY3JlYXRlQ29sbGVjdGlvbiBmcm9tICcuLi9jcmVhdGVDb2xsZWN0aW9uJ1xuaW1wb3J0IHsgUkVRVUVTVF9USU1FT1VUIH0gZnJvbSAnLi4vY3JlYXRlQ29sbGVjdGlvbidcbmltcG9ydCB7IGNyZWF0ZVN0b3JlLCBjb21iaW5lUmVkdWNlcnMsIGFwcGx5TWlkZGxld2FyZSB9IGZyb20gJ3JlZHV4J1xuXG5kZXNjcmliZSgnY3JlYXRlQ29sbGVjdGlvbicsICgpID0+IHtcbiAgbGV0IGdldFxuICBsZXQgcmVzXG4gIGxldCBkYXRhXG4gIGxldCBzdG9yZVxuICBsZXQgcmVzdWx0XG4gIGxldCBzYW5kYm94XG4gIGxldCBiYXJJZFxuICBsZXQgY29sbGVjdGlvblxuICBsZXQgZm9vSWRcbiAgbGV0IGV4cGVjdGVkVXJsXG4gIGxldCByZXF1ZXN0Q29uZmlnXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgZm9vSWQgPSAxMjNcbiAgICBiYXJJZCA9ICdCLTEyJ1xuICAgIGdldCA9IHNpbm9uLnNweSgoKSA9PiByZXMpXG4gICAgc2FuZGJveCA9IHNpbm9uLnNhbmRib3guY3JlYXRlKClcbiAgICBzYW5kYm94LnN0dWIoYXhpb3MsICdnZXQnLCBnZXQpXG4gICAgcmVxdWVzdENvbmZpZyA9IHsgdGltZW91dDogUkVRVUVTVF9USU1FT1VUIH1cbiAgICBleHBlY3RlZFVybCA9IGNyZWF0ZVVybChmb29JZCwgYmFySWQpXG4gICAgY29sbGVjdGlvbiA9IGNyZWF0ZUNvbGxlY3Rpb24oJ1RoaW5nJywgY3JlYXRlVXJsKVxuICAgIHN0b3JlID0gY3JlYXRlU3RvcmVGb3JDb2xsZWN0aW9uKGNvbGxlY3Rpb24pXG4gIH0pXG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBzYW5kYm94LnJlc3RvcmUoKVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIHRoZSBlbnRpdHlcXCdzIG5hbWUgaXMgYSB3ZWlyZCBwbHVyYWwnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9wZXJseSBwbHVyYWxpemUgaXQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoY3JlYXRlQ29sbGVjdGlvbignUHJvcGVydHknKS5wcm9wZXJ0aWVzKS50by5leGlzdFxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYSBmZXRjaCBoYXMgbm90IHN0YXJ0ZWQnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBkYXRhID0gW3tcbiAgICAgICAgaWQ6IDEsIG5hbWU6ICdmb28nXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAyLCBuYW1lOiAnYmFyJ1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiB0aGUgaXRlbScsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbSkudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZGF0YVsxXSkpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgY2FsbCBtYWtlIGEgdmFsaWQgaHR0cCByZXF1ZXN0JywgKCkgPT4ge1xuICAgICAgZXhwZWN0KGdldCkudG8uYmUuY2FsbGVkV2l0aChleHBlY3RlZFVybCwgcmVxdWVzdENvbmZpZylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdGhlIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcykudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZGF0YSkpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc2F5IHdlIGhhdmUgZmV0Y2hlZCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmV0Y2hlZCkudG8uZXFsKHRydWUpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB0aGVyZSB3YXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZhaWxlZFRvRmV0Y2gpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHdlcmUgbG9hZGluZyB0aGUgaXRlbXMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0LmlzRmV0Y2hpbmcpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIEkgYWRkIGFuIGl0ZW0nLCAoKSA9PiB7XG4gICAgbGV0IGV4cGVjdGVkVGhpbmdcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgZGF0YSA9IFt7XG4gICAgICAgIGlkOiAxLCBuYW1lOiAnZm9vJ1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGV4cGVjdGVkVGhpbmcgPSB7XG4gICAgICAgIGlkOiAyLCBuYW1lOiAnYmFyJ1xuICAgICAgfVxuICAgICAgYWRkVGhpbmcoZm9vSWQsIGJhcklkLCBleHBlY3RlZFRoaW5nKVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGFkZCB0aGUgaXRlbScsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbSkudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZXhwZWN0ZWRUaGluZykpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgyKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gSSBkZWxldGUgYW4gaXRlbScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAzLCBuYW1lOiAnYmF6J1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRlbGV0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgMilcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMilcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkZWxldGUgdGhlIGl0ZW0nLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW0pLnRvLmVxbCh1bmRlZmluZWQpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgyKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gSSB1cGRhdGUgYW4gaXRlbScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAzLCBuYW1lOiAnYmF6J1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHVwZGF0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgeyBpZDogMiwgbmFtZTogJ3F1dXgnIH0pXG5cbiAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQsIDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIHRoZSBpdGVtJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtKS50by5lcWwoSW1tdXRhYmxlLmZyb21KUyh7IGlkOiAyLCBuYW1lOiAncXV1eCcgfSkpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgzKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYSBmZXRjaCBpcyBpbiBwcm9ncmVzcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGxldCBkZWZlcnJlZCA9IHdoZW4uZGVmZXIoKVxuICAgICAgcmVzID0gZGVmZXJyZWQucHJvbWlzZVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKS50aGVuKCgpID0+IHtcbiAgICAgICAgZ2V0LnJlc2V0KClcblxuICAgICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1QgbWFrZSBhbnkgaHR0cCByZXF1ZXN0cycsICgpID0+IHtcbiAgICAgIGV4cGVjdChnZXQpLnRvLm5vdC5iZS5jYWxsZWRcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1QgcmV0dXJuIGFueSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbXMpLnRvLmVxbCh1bmRlZmluZWQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB3ZSBoYXZlIGZldGNoZWQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZldGNoZWQpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHRoZXJlIHdhcyBhbiBlcnJvcicsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmFpbGVkVG9GZXRjaCkudG8uZXFsKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNheSB3ZXJlIGxvYWRpbmcgdGhlIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pc0ZldGNoaW5nKS50by5lcWwodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIGEgZmV0Y2ggaGFzIGZhaWxlZCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHJlcyA9IHdoZW4ucmVqZWN0KHsgc3RhdHVzOiA1MDAgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZClcbiAgICB9KVxuXG4gICAgZGVzY3JpYmUoJ3doZW4geW91IHRyeSB0byBmZXRjaCBhZ2FpbicsICgpID0+IHtcbiAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgICBnZXQucmVzZXQoKVxuXG4gICAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQpXG4gICAgICB9KVxuXG4gICAgICBpdCgnc2hvdWxkIE5PVCBtYWtlIGFueSBodHRwIHJlcXVlc3RzJywgKCkgPT4ge1xuICAgICAgICBleHBlY3QoZ2V0KS50by5ub3QuYmUuY2FsbGVkXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCByZXR1cm4gYW55IGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcykudG8uZXFsKHVuZGVmaW5lZClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHdlIGhhdmUgZmV0Y2hlZCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmV0Y2hlZCkudG8uZXFsKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNheSB0aGVyZSB3YXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZhaWxlZFRvRmV0Y2gpLnRvLmVxbCh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCBzYXkgd2VyZSBsb2FkaW5nIHRoZSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNGZXRjaGluZykudG8uZXFsKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RvcmVGb3JDb2xsZWN0aW9uICh7IGZldGNoVGhpbmdzLCB0aGluZ3MgfSkge1xuICAgIGNvbnN0IGNyZWF0ZVN0b3JlV2l0aE1pZGRsZXdhcmUgPSBhcHBseU1pZGRsZXdhcmUodGh1bmtNaWRkbGV3YXJlKShjcmVhdGVTdG9yZSlcbiAgICByZXR1cm4gY3JlYXRlU3RvcmVXaXRoTWlkZGxld2FyZShjb21iaW5lUmVkdWNlcnMoeyB0aGluZ3MgfSkpXG4gIH1cblxuICBmdW5jdGlvbiBhZGRUaGluZyAoZm9vSWQsIGJhcklkLCBleHBlcmllbmNlKSB7XG4gICAgc3RvcmUuZGlzcGF0Y2goY29sbGVjdGlvbi5hZGRUaGluZyhmb29JZCwgYmFySWQsIGV4cGVyaWVuY2UpKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVsZXRlVGhpbmcgKGZvb0lkLCBiYXJJZCwgaWQpIHtcbiAgICBzdG9yZS5kaXNwYXRjaChjb2xsZWN0aW9uLmRlbGV0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgaWQpKVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlVGhpbmcgKGZvb0lkLCBiYXJJZCwgdGhpbmcpIHtcbiAgICBzdG9yZS5kaXNwYXRjaChjb2xsZWN0aW9uLnVwZGF0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgdGhpbmcpKVxuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hUaGluZ3MgKGZvb0lkLCBiYXJJZCwgaWQpIHtcbiAgICBzdG9yZS5kaXNwYXRjaChjb2xsZWN0aW9uLmZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCkpXG5cbiAgICByZXR1cm4gZGVsYXkoMSkudGhlbihnZXRSZXN1bHQpXG5cbiAgICBmdW5jdGlvbiBnZXRSZXN1bHQgKCkge1xuICAgICAgY29uc3QgeyB0aGluZ3MgfSA9IHN0b3JlLmdldFN0YXRlKClcblxuICAgICAgcmVzdWx0ID0ge1xuICAgICAgICBpc0ZldGNoaW5nOiB0aGluZ3MuaXNGZXRjaGluZyhmb29JZCwgYmFySWQpLFxuICAgICAgICBoYXNGZXRjaGVkOiB0aGluZ3MuaGFzRmV0Y2hlZChmb29JZCwgYmFySWQpLFxuICAgICAgICBpdGVtczogdGhpbmdzLmdldEFsbFRoaW5ncyhmb29JZCwgYmFySWQpLFxuICAgICAgICBpdGVtOiB0aGluZ3MuZ2V0VGhpbmdCeUlkKGZvb0lkLCBiYXJJZCwgaWQpLFxuICAgICAgICBoYXNGYWlsZWRUb0ZldGNoOiB0aGluZ3MuaGFzRmFpbGVkVG9GZXRjaChmb29JZCwgYmFySWQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlVXJsIChmb29JZCwgYmFySWQpIHtcbiAgICByZXR1cm4gYGh0dHA6Ly8ke2Zvb0lkfS8ke2JhcklkfWBcbiAgfVxufSlcbiJdfQ==