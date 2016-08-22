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
    var path = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9fX3Rlc3RzX18vY3JlYXRlQ29sbGVjdGlvbi10ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUVBOzs7O0FBRUEsU0FBUyxrQkFBVCxFQUE2QixZQUFNO0FBQ2pDLE1BQUksWUFBSjtBQUNBLE1BQUksWUFBSjtBQUNBLE1BQUksYUFBSjtBQUNBLE1BQUksY0FBSjtBQUNBLE1BQUksZUFBSjtBQUNBLE1BQUksZ0JBQUo7QUFDQSxNQUFJLGNBQUo7QUFDQSxNQUFJLG1CQUFKO0FBQ0EsTUFBSSxjQUFKO0FBQ0EsTUFBSSxvQkFBSjtBQUNBLE1BQUksc0JBQUo7O0FBRUEsYUFBVyxZQUFNO0FBQ2YsWUFBUSxHQUFSO0FBQ0EsWUFBUSxNQUFSO0FBQ0EsVUFBTSxnQkFBTSxHQUFOLENBQVU7QUFBQSxhQUFNLEdBQU47QUFBQSxLQUFWLENBQU47QUFDQSxjQUFVLGdCQUFNLE9BQU4sQ0FBYyxNQUFkLEVBQVY7QUFDQSxZQUFRLElBQVIsa0JBQW9CLEtBQXBCLEVBQTJCLEdBQTNCO0FBQ0Esb0JBQWdCLEVBQUUsMENBQUYsRUFBaEI7QUFDQSxrQkFBYyxVQUFVLEtBQVYsRUFBaUIsS0FBakIsQ0FBZDtBQUNBLGlCQUFhLGdDQUFpQixPQUFqQixFQUEwQixTQUExQixDQUFiO0FBQ0EsWUFBUSx5QkFBeUIsVUFBekIsQ0FBUjtBQUNELEdBVkQ7O0FBWUEsWUFBVSxZQUFNO0FBQ2QsWUFBUSxPQUFSO0FBQ0QsR0FGRDs7QUFJQSxXQUFTLDJDQUFULEVBQXNELFlBQU07QUFDMUQsT0FBRyw4QkFBSCxFQUFtQyxZQUFNO0FBQ3ZDLHdCQUFPLGdDQUFpQixVQUFqQixFQUE2QixVQUFwQyxFQUFnRCxFQUFoRCxDQUFtRCxLQUFuRDtBQUNELEtBRkQ7QUFHRCxHQUpEOztBQU1BLFdBQVMsOEJBQVQsRUFBeUMsWUFB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cEMsRUFBbUQ7QUFBQSxRQUFYLElBQVcseURBQUosRUFBSTs7QUFDakQsVUFBTSxRQUFOLENBQWUsV0FBVyxXQUFYLENBQXVCLEtBQXZCLEVBQThCLEtBQTlCLENBQWY7O0FBRUEsV0FBTyxxQkFBTSxDQUFOLEVBQVMsSUFBVCxDQUFjLFNBQWQsQ0FBUDs7QUFFQSxhQUFTLFNBQVQsR0FBc0I7QUFDcEIsVUFBTSxTQUFTLGlCQUFFLEdBQUYsQ0FBTSxNQUFNLFFBQU4sRUFBTixFQUF3QixHQUFHLE1BQUgsQ0FBVSxJQUFWLEVBQWdCLE1BQWhCLENBQXVCLFFBQXZCLENBQXhCLENBQWY7O0FBRUEsZUFBUztBQUNQLG9CQUFZLE9BQU8sVUFBUCxDQUFrQixLQUFsQixFQUF5QixLQUF6QixDQURMO0FBRVAsb0JBQVksT0FBTyxVQUFQLENBQWtCLEtBQWxCLEVBQXlCLEtBQXpCLENBRkw7QUFHUCxlQUFPLE9BQU8sWUFBUCxDQUFvQixLQUFwQixFQUEyQixLQUEzQixDQUhBO0FBSVAsY0FBTSxPQUFPLFlBQVAsQ0FBb0IsS0FBcEIsRUFBMkIsS0FBM0IsRUFBa0MsRUFBbEMsQ0FKQztBQUtQLDBCQUFrQixPQUFPLGdCQUFQLENBQXdCLEtBQXhCLEVBQStCLEtBQS9CO0FBTFgsT0FBVDtBQU9EO0FBQ0Y7O0FBRUQsV0FBUyxTQUFULENBQW9CLEtBQXBCLEVBQTJCLEtBQTNCLEVBQWtDO0FBQ2hDLHVCQUFpQixLQUFqQixTQUEwQixLQUExQjtBQUNEO0FBQ0YsQ0ExUkQiLCJmaWxlIjoiY3JlYXRlQ29sbGVjdGlvbi10ZXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IHdoZW4gZnJvbSAnd2hlbidcbmltcG9ydCBzaW5vbiBmcm9tICdzaW5vbidcbmltcG9ydCBheGlvcyBmcm9tICdheGlvcydcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gJ2NoYWknXG5pbXBvcnQgZGVsYXkgZnJvbSAnd2hlbi9kZWxheSdcbmltcG9ydCBJbW11dGFibGUgZnJvbSAnaW1tdXRhYmxlJ1xuaW1wb3J0IHRodW5rTWlkZGxld2FyZSBmcm9tICdyZWR1eC10aHVuaydcbmltcG9ydCBjcmVhdGVDb2xsZWN0aW9uIGZyb20gJy4uL2NyZWF0ZUNvbGxlY3Rpb24nXG5pbXBvcnQgeyBSRVFVRVNUX1RJTUVPVVQgfSBmcm9tICcuLi9jcmVhdGVDb2xsZWN0aW9uJ1xuaW1wb3J0IHsgY3JlYXRlU3RvcmUsIGNvbWJpbmVSZWR1Y2VycywgYXBwbHlNaWRkbGV3YXJlIH0gZnJvbSAncmVkdXgnXG5cbmRlc2NyaWJlKCdjcmVhdGVDb2xsZWN0aW9uJywgKCkgPT4ge1xuICBsZXQgZ2V0XG4gIGxldCByZXNcbiAgbGV0IGRhdGFcbiAgbGV0IHN0b3JlXG4gIGxldCByZXN1bHRcbiAgbGV0IHNhbmRib3hcbiAgbGV0IGJhcklkXG4gIGxldCBjb2xsZWN0aW9uXG4gIGxldCBmb29JZFxuICBsZXQgZXhwZWN0ZWRVcmxcbiAgbGV0IHJlcXVlc3RDb25maWdcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBmb29JZCA9IDEyM1xuICAgIGJhcklkID0gJ0ItMTInXG4gICAgZ2V0ID0gc2lub24uc3B5KCgpID0+IHJlcylcbiAgICBzYW5kYm94ID0gc2lub24uc2FuZGJveC5jcmVhdGUoKVxuICAgIHNhbmRib3guc3R1YihheGlvcywgJ2dldCcsIGdldClcbiAgICByZXF1ZXN0Q29uZmlnID0geyB0aW1lb3V0OiBSRVFVRVNUX1RJTUVPVVQgfVxuICAgIGV4cGVjdGVkVXJsID0gY3JlYXRlVXJsKGZvb0lkLCBiYXJJZClcbiAgICBjb2xsZWN0aW9uID0gY3JlYXRlQ29sbGVjdGlvbignVGhpbmcnLCBjcmVhdGVVcmwpXG4gICAgc3RvcmUgPSBjcmVhdGVTdG9yZUZvckNvbGxlY3Rpb24oY29sbGVjdGlvbilcbiAgfSlcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIHNhbmRib3gucmVzdG9yZSgpXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gdGhlIGVudGl0eVxcJ3MgbmFtZSBpcyBhIHdlaXJkIHBsdXJhbCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHByb3Blcmx5IHBsdXJhbGl6ZSBpdCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChjcmVhdGVDb2xsZWN0aW9uKCdQcm9wZXJ0eScpLnByb3BlcnRpZXMpLnRvLmV4aXN0XG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnd2hlbiBhIGZldGNoIGhhcyBub3Qgc3RhcnRlZCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9XVxuICAgICAgcmVzID0gd2hlbih7IHN0YXR1czogMjAwLCBkYXRhIH0pXG5cbiAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQsIDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRoZSBpdGVtJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtKS50by5lcWwoSW1tdXRhYmxlLmZyb21KUyhkYXRhWzFdKSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjYWxsIG1ha2UgYSB2YWxpZCBodHRwIHJlcXVlc3QnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZ2V0KS50by5iZS5jYWxsZWRXaXRoKGV4cGVjdGVkVXJsLCByZXF1ZXN0Q29uZmlnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiB0aGUgaXRlbXMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zKS50by5lcWwoSW1tdXRhYmxlLmZyb21KUyhkYXRhKSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzYXkgd2UgaGF2ZSBmZXRjaGVkJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5oYXNGZXRjaGVkKS50by5lcWwodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHRoZXJlIHdhcyBhbiBlcnJvcicsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmFpbGVkVG9GZXRjaCkudG8uZXFsKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCBzYXkgd2VyZSBsb2FkaW5nIHRoZSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNGZXRjaGluZykudG8uZXFsKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYSBwYXRoIGlzIHNwZWNpZmllZCBhbmQgYSBmZXRjaCBoYXMgY29tcGxldGVkJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgY29sbGVjdGlvbiA9IGNyZWF0ZUNvbGxlY3Rpb24oe1xuICAgICAgICBuYW1lOiAnVGhpbmcnLFxuICAgICAgICBjcmVhdGVVcmwsXG4gICAgICAgIHBhdGg6ICduZXN0ZWQnXG4gICAgICB9KVxuICAgICAgY29uc3QgdGhpbmdzID0gY29sbGVjdGlvbi50aGluZ3NcbiAgICAgIHN0b3JlID0gYXBwbHlNaWRkbGV3YXJlKHRodW5rTWlkZGxld2FyZSkoY3JlYXRlU3RvcmUpKGNvbWJpbmVSZWR1Y2Vycyh7IG5lc3RlZDogY29tYmluZVJlZHVjZXJzKHsgdGhpbmdzIH0pIH0pKVxuICAgICAgZGF0YSA9IFt7XG4gICAgICAgIGlkOiAxLCBuYW1lOiAnZm9vJ1xuICAgICAgfSwge1xuICAgICAgICBpZDogMiwgbmFtZTogJ2JhcidcbiAgICAgIH1dXG4gICAgICByZXMgPSB3aGVuKHsgc3RhdHVzOiAyMDAsIGRhdGEgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMiwgJ25lc3RlZCcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRoZSBpdGVtJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtKS50by5lcWwoSW1tdXRhYmxlLmZyb21KUyhkYXRhWzFdKSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIEkgYWRkIGFuIGl0ZW0nLCAoKSA9PiB7XG4gICAgbGV0IGV4cGVjdGVkVGhpbmdcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgZGF0YSA9IFt7XG4gICAgICAgIGlkOiAxLCBuYW1lOiAnZm9vJ1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGV4cGVjdGVkVGhpbmcgPSB7XG4gICAgICAgIGlkOiAyLCBuYW1lOiAnYmFyJ1xuICAgICAgfVxuICAgICAgYWRkVGhpbmcoZm9vSWQsIGJhcklkLCBleHBlY3RlZFRoaW5nKVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGFkZCB0aGUgaXRlbScsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbSkudG8uZXFsKEltbXV0YWJsZS5mcm9tSlMoZXhwZWN0ZWRUaGluZykpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgyKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gSSBkZWxldGUgYW4gaXRlbScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAzLCBuYW1lOiAnYmF6J1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRlbGV0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgMilcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMilcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBkZWxldGUgdGhlIGl0ZW0nLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW0pLnRvLmVxbCh1bmRlZmluZWQpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgyKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gSSB1cGRhdGUgYW4gaXRlbScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH0sIHtcbiAgICAgICAgaWQ6IDIsIG5hbWU6ICdiYXInXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAzLCBuYW1lOiAnYmF6J1xuICAgICAgfV1cbiAgICAgIHJlcyA9IHdoZW4oeyBzdGF0dXM6IDIwMCwgZGF0YSB9KVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkLCAyKVxuICAgIH0pXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHVwZGF0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgeyBpZDogMiwgbmFtZTogJ3F1dXgnIH0pXG5cbiAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQsIDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIHRoZSBpdGVtJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtKS50by5lcWwoSW1tdXRhYmxlLmZyb21KUyh7IGlkOiAyLCBuYW1lOiAncXV1eCcgfSkpXG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zLnNpemUpLnRvLmVxbCgzKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3doZW4gYSBmZXRjaCBpcyBpbiBwcm9ncmVzcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGxldCBkZWZlcnJlZCA9IHdoZW4uZGVmZXIoKVxuICAgICAgcmVzID0gZGVmZXJyZWQucHJvbWlzZVxuXG4gICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKS50aGVuKCgpID0+IHtcbiAgICAgICAgZ2V0LnJlc2V0KClcblxuICAgICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1QgbWFrZSBhbnkgaHR0cCByZXF1ZXN0cycsICgpID0+IHtcbiAgICAgIGV4cGVjdChnZXQpLnRvLm5vdC5iZS5jYWxsZWRcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1QgcmV0dXJuIGFueSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbXMpLnRvLmVxbCh1bmRlZmluZWQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB3ZSBoYXZlIGZldGNoZWQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZldGNoZWQpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHRoZXJlIHdhcyBhbiBlcnJvcicsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmFpbGVkVG9GZXRjaCkudG8uZXFsKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNheSB3ZXJlIGxvYWRpbmcgdGhlIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pc0ZldGNoaW5nKS50by5lcWwodHJ1ZSlcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIGEgZmV0Y2ggaGFzIGZhaWxlZCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHJlcyA9IHdoZW4ucmVqZWN0KHsgc3RhdHVzOiA1MDAgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZClcbiAgICB9KVxuXG4gICAgZGVzY3JpYmUoJ3doZW4geW91IHRyeSB0byBmZXRjaCBhZ2FpbicsICgpID0+IHtcbiAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgICBnZXQucmVzZXQoKVxuXG4gICAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQpXG4gICAgICB9KVxuXG4gICAgICBpdCgnc2hvdWxkIE5PVCBtYWtlIGFueSBodHRwIHJlcXVlc3RzJywgKCkgPT4ge1xuICAgICAgICBleHBlY3QoZ2V0KS50by5ub3QuYmUuY2FsbGVkXG4gICAgICB9KVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCByZXR1cm4gYW55IGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcykudG8uZXFsKHVuZGVmaW5lZClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHdlIGhhdmUgZmV0Y2hlZCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzRmV0Y2hlZCkudG8uZXFsKGZhbHNlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNheSB0aGVyZSB3YXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZhaWxlZFRvRmV0Y2gpLnRvLmVxbCh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCBzYXkgd2VyZSBsb2FkaW5nIHRoZSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNGZXRjaGluZykudG8uZXFsKGZhbHNlKVxuICAgIH0pXG4gIH0pXG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RvcmVGb3JDb2xsZWN0aW9uICh7IGZldGNoVGhpbmdzLCB0aGluZ3MgfSkge1xuICAgIGNvbnN0IGNyZWF0ZVN0b3JlV2l0aE1pZGRsZXdhcmUgPSBhcHBseU1pZGRsZXdhcmUodGh1bmtNaWRkbGV3YXJlKShjcmVhdGVTdG9yZSlcbiAgICByZXR1cm4gY3JlYXRlU3RvcmVXaXRoTWlkZGxld2FyZShjb21iaW5lUmVkdWNlcnMoeyB0aGluZ3MgfSkpXG4gIH1cblxuICBmdW5jdGlvbiBhZGRUaGluZyAoZm9vSWQsIGJhcklkLCBleHBlcmllbmNlKSB7XG4gICAgc3RvcmUuZGlzcGF0Y2goY29sbGVjdGlvbi5hZGRUaGluZyhmb29JZCwgYmFySWQsIGV4cGVyaWVuY2UpKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVsZXRlVGhpbmcgKGZvb0lkLCBiYXJJZCwgaWQpIHtcbiAgICBzdG9yZS5kaXNwYXRjaChjb2xsZWN0aW9uLmRlbGV0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgaWQpKVxuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlVGhpbmcgKGZvb0lkLCBiYXJJZCwgdGhpbmcpIHtcbiAgICBzdG9yZS5kaXNwYXRjaChjb2xsZWN0aW9uLnVwZGF0ZVRoaW5nKGZvb0lkLCBiYXJJZCwgdGhpbmcpKVxuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hUaGluZ3MgKGZvb0lkLCBiYXJJZCwgaWQsIHBhdGggPSBbXSkge1xuICAgIHN0b3JlLmRpc3BhdGNoKGNvbGxlY3Rpb24uZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKSlcblxuICAgIHJldHVybiBkZWxheSgxKS50aGVuKGdldFJlc3VsdClcblxuICAgIGZ1bmN0aW9uIGdldFJlc3VsdCAoKSB7XG4gICAgICBjb25zdCB0aGluZ3MgPSBfLmdldChzdG9yZS5nZXRTdGF0ZSgpLCBbXS5jb25jYXQocGF0aCkuY29uY2F0KCd0aGluZ3MnKSlcblxuICAgICAgcmVzdWx0ID0ge1xuICAgICAgICBpc0ZldGNoaW5nOiB0aGluZ3MuaXNGZXRjaGluZyhmb29JZCwgYmFySWQpLFxuICAgICAgICBoYXNGZXRjaGVkOiB0aGluZ3MuaGFzRmV0Y2hlZChmb29JZCwgYmFySWQpLFxuICAgICAgICBpdGVtczogdGhpbmdzLmdldEFsbFRoaW5ncyhmb29JZCwgYmFySWQpLFxuICAgICAgICBpdGVtOiB0aGluZ3MuZ2V0VGhpbmdCeUlkKGZvb0lkLCBiYXJJZCwgaWQpLFxuICAgICAgICBoYXNGYWlsZWRUb0ZldGNoOiB0aGluZ3MuaGFzRmFpbGVkVG9GZXRjaChmb29JZCwgYmFySWQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlVXJsIChmb29JZCwgYmFySWQpIHtcbiAgICByZXR1cm4gYGh0dHA6Ly8ke2Zvb0lkfS8ke2JhcklkfWBcbiAgfVxufSlcbiJdfQ==