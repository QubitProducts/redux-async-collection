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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9fX3Rlc3RzX18vY3JlYXRlQ29sbGVjdGlvbi10ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUVBLFNBQVMsa0JBQVQsRUFBNkIsWUFBTTtBQUNqQyxNQUFJLFlBQUosQ0FEaUM7QUFFakMsTUFBSSxZQUFKLENBRmlDO0FBR2pDLE1BQUksYUFBSixDQUhpQztBQUlqQyxNQUFJLGNBQUosQ0FKaUM7QUFLakMsTUFBSSxlQUFKLENBTGlDO0FBTWpDLE1BQUksZ0JBQUosQ0FOaUM7QUFPakMsTUFBSSxjQUFKLENBUGlDO0FBUWpDLE1BQUksbUJBQUosQ0FSaUM7QUFTakMsTUFBSSxjQUFKLENBVGlDO0FBVWpDLE1BQUksb0JBQUosQ0FWaUM7QUFXakMsTUFBSSxzQkFBSixDQVhpQzs7QUFhakMsYUFBVyxZQUFNO0FBQ2YsWUFBUSxHQUFSLENBRGU7QUFFZixZQUFRLE1BQVIsQ0FGZTtBQUdmLFVBQU0sZ0JBQU0sR0FBTixDQUFVO2FBQU07S0FBTixDQUFoQixDQUhlO0FBSWYsY0FBVSxnQkFBTSxPQUFOLENBQWMsTUFBZCxFQUFWLENBSmU7QUFLZixZQUFRLElBQVIsa0JBQW9CLEtBQXBCLEVBQTJCLEdBQTNCLEVBTGU7QUFNZixvQkFBZ0IsRUFBRSwwQ0FBRixFQUFoQixDQU5lO0FBT2Ysa0JBQWMsVUFBVSxLQUFWLEVBQWlCLEtBQWpCLENBQWQsQ0FQZTtBQVFmLGlCQUFhLGdDQUFpQixPQUFqQixFQUEwQixTQUExQixDQUFiLENBUmU7QUFTZixZQUFRLHlCQUF5QixVQUF6QixDQUFSLENBVGU7R0FBTixDQUFYLENBYmlDOztBQXlCakMsWUFBVSxZQUFNO0FBQ2QsWUFBUSxPQUFSLEdBRGM7R0FBTixDQUFWLENBekJpQzs7QUE2QmpDLFdBQVMsOEJBQVQsRUFBeUMsWUFBTTtBQUM3QyxlQUFXLFlB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QXZCLEVBQThCLEtBQTlCLEVBQXFDLEVBQXJDLENBQWYsRUFEc0M7R0FBeEM7O0FBSUEsV0FBUyxXQUFULENBQXNCLEtBQXRCLEVBQTZCLEtBQTdCLEVBQW9DLEVBQXBDLEVBQXdDO0FBQ3RDLFVBQU0sUUFBTixDQUFlLFdBQVcsV0FBWCxDQUF1QixLQUF2QixFQUE4QixLQUE5QixDQUFmLEVBRHNDOztBQUd0QyxXQUFPLHFCQUFNLENBQU4sRUFBUyxJQUFULENBQWMsU0FBZCxDQUFQLENBSHNDOztBQUt0QyxhQUFTLFNBQVQsR0FBc0I7NEJBQ0QsTUFBTSxRQUFOLEdBREM7O1VBQ1osZ0NBRFk7OztBQUdwQixlQUFTO0FBQ1Asb0JBQVksT0FBTyxVQUFQLENBQWtCLEtBQWxCLEVBQXlCLEtBQXpCLENBQVo7QUFDQSxvQkFBWSxPQUFPLFVBQVAsQ0FBa0IsS0FBbEIsRUFBeUIsS0FBekIsQ0FBWjtBQUNBLGVBQU8sT0FBTyxZQUFQLENBQW9CLEtBQXBCLEVBQTJCLEtBQTNCLENBQVA7QUFDQSxjQUFNLE9BQU8sWUFBUCxDQUFvQixLQUFwQixFQUEyQixLQUEzQixFQUFrQyxFQUFsQyxDQUFOO0FBQ0EsMEJBQWtCLE9BQU8sZ0JBQVAsQ0FBd0IsS0FBeEIsRUFBK0IsS0FBL0IsQ0FBbEI7T0FMRixDQUhvQjtLQUF0QjtHQUxGOztBQWtCQSxXQUFTLFNBQVQsQ0FBb0IsS0FBcEIsRUFBMkIsS0FBM0IsRUFBa0M7QUFDaEMsdUJBQWlCLGNBQVMsS0FBMUIsQ0FEZ0M7R0FBbEM7Q0EzTjJCLENBQTdCIiwiZmlsZSI6ImNyZWF0ZUNvbGxlY3Rpb24tdGVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB3aGVuIGZyb20gJ3doZW4nXG5pbXBvcnQgc2lub24gZnJvbSAnc2lub24nXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnXG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJ1xuaW1wb3J0IGRlbGF5IGZyb20gJ3doZW4vZGVsYXknXG5pbXBvcnQgSW1tdXRhYmxlIGZyb20gJ2ltbXV0YWJsZSdcbmltcG9ydCB0aHVua01pZGRsZXdhcmUgZnJvbSAncmVkdXgtdGh1bmsnXG5pbXBvcnQgY3JlYXRlQ29sbGVjdGlvbiBmcm9tICcuLi9jcmVhdGVDb2xsZWN0aW9uJ1xuaW1wb3J0IHsgUkVRVUVTVF9USU1FT1VUIH0gZnJvbSAnLi4vY3JlYXRlQ29sbGVjdGlvbidcbmltcG9ydCB7IGNyZWF0ZVN0b3JlLCBjb21iaW5lUmVkdWNlcnMsIGFwcGx5TWlkZGxld2FyZSB9IGZyb20gJ3JlZHV4J1xuXG5kZXNjcmliZSgnY3JlYXRlQ29sbGVjdGlvbicsICgpID0+IHtcbiAgbGV0IGdldFxuICBsZXQgcmVzXG4gIGxldCBkYXRhXG4gIGxldCBzdG9yZVxuICBsZXQgcmVzdWx0XG4gIGxldCBzYW5kYm94XG4gIGxldCBiYXJJZFxuICBsZXQgY29sbGVjdGlvblxuICBsZXQgZm9vSWRcbiAgbGV0IGV4cGVjdGVkVXJsXG4gIGxldCByZXF1ZXN0Q29uZmlnXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgZm9vSWQgPSAxMjNcbiAgICBiYXJJZCA9ICdCLTEyJ1xuICAgIGdldCA9IHNpbm9uLnNweSgoKSA9PiByZXMpXG4gICAgc2FuZGJveCA9IHNpbm9uLnNhbmRib3guY3JlYXRlKClcbiAgICBzYW5kYm94LnN0dWIoYXhpb3MsICdnZXQnLCBnZXQpXG4gICAgcmVxdWVzdENvbmZpZyA9IHsgdGltZW91dDogUkVRVUVTVF9USU1FT1VUIH1cbiAgICBleHBlY3RlZFVybCA9IGNyZWF0ZVVybChmb29JZCwgYmFySWQpXG4gICAgY29sbGVjdGlvbiA9IGNyZWF0ZUNvbGxlY3Rpb24oJ1RoaW5nJywgY3JlYXRlVXJsKVxuICAgIHN0b3JlID0gY3JlYXRlU3RvcmVGb3JDb2xsZWN0aW9uKGNvbGxlY3Rpb24pXG4gIH0pXG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBzYW5kYm94LnJlc3RvcmUoKVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIGEgZmV0Y2ggaGFzIG5vdCBzdGFydGVkJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgZGF0YSA9IFt7XG4gICAgICAgIGlkOiAxLCBuYW1lOiAnZm9vJ1xuICAgICAgfSwge1xuICAgICAgICBpZDogMiwgbmFtZTogJ2JhcidcbiAgICAgIH1dXG4gICAgICByZXMgPSB3aGVuKHsgc3RhdHVzOiAyMDAsIGRhdGEgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMilcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdGhlIGl0ZW0nLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW0pLnRvLmVxbChJbW11dGFibGUuZnJvbUpTKGRhdGFbMV0pKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIGNhbGwgbWFrZSBhIHZhbGlkIGh0dHAgcmVxdWVzdCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChnZXQpLnRvLmJlLmNhbGxlZFdpdGgoZXhwZWN0ZWRVcmwsIHJlcXVlc3RDb25maWcpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHRoZSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbXMpLnRvLmVxbChJbW11dGFibGUuZnJvbUpTKGRhdGEpKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHNheSB3ZSBoYXZlIGZldGNoZWQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZldGNoZWQpLnRvLmVxbCh0cnVlKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCBzYXkgdGhlcmUgd2FzIGFuIGVycm9yJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5oYXNGYWlsZWRUb0ZldGNoKS50by5lcWwoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB3ZXJlIGxvYWRpbmcgdGhlIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pc0ZldGNoaW5nKS50by5lcWwoZmFsc2UpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnd2hlbiBJIGFkZCBhbiBpdGVtJywgKCkgPT4ge1xuICAgIGxldCBleHBlY3RlZFRoaW5nXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIGRhdGEgPSBbe1xuICAgICAgICBpZDogMSwgbmFtZTogJ2ZvbydcbiAgICAgIH1dXG4gICAgICByZXMgPSB3aGVuKHsgc3RhdHVzOiAyMDAsIGRhdGEgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMilcbiAgICB9KVxuXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBleHBlY3RlZFRoaW5nID0ge1xuICAgICAgICBpZDogMiwgbmFtZTogJ2JhcidcbiAgICAgIH1cbiAgICAgIGFkZFRoaW5nKGZvb0lkLCBiYXJJZCwgZXhwZWN0ZWRUaGluZylcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMilcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBhZGQgdGhlIGl0ZW0nLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW0pLnRvLmVxbChJbW11dGFibGUuZnJvbUpTKGV4cGVjdGVkVGhpbmcpKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcy5zaXplKS50by5lcWwoMilcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIEkgZGVsZXRlIGFuIGl0ZW0nLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBkYXRhID0gW3tcbiAgICAgICAgaWQ6IDEsIG5hbWU6ICdmb28nXG4gICAgICB9LCB7XG4gICAgICAgIGlkOiAyLCBuYW1lOiAnYmFyJ1xuICAgICAgfSwge1xuICAgICAgICBpZDogMywgbmFtZTogJ2JheidcbiAgICAgIH1dXG4gICAgICByZXMgPSB3aGVuKHsgc3RhdHVzOiAyMDAsIGRhdGEgfSlcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCwgMilcbiAgICB9KVxuXG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBkZWxldGVUaGluZyhmb29JZCwgYmFySWQsIDIpXG5cbiAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQsIDIpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZGVsZXRlIHRoZSBpdGVtJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtKS50by5lcWwodW5kZWZpbmVkKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pdGVtcy5zaXplKS50by5lcWwoMilcbiAgICB9KVxuICB9KVxuXG4gIGRlc2NyaWJlKCd3aGVuIGEgZmV0Y2ggaXMgaW4gcHJvZ3Jlc3MnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICBsZXQgZGVmZXJyZWQgPSB3aGVuLmRlZmVyKClcbiAgICAgIHJlcyA9IGRlZmVycmVkLnByb21pc2VcblxuICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZCkudGhlbigoKSA9PiB7XG4gICAgICAgIGdldC5yZXNldCgpXG5cbiAgICAgICAgcmV0dXJuIGZldGNoVGhpbmdzKGZvb0lkLCBiYXJJZClcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIG1ha2UgYW55IGh0dHAgcmVxdWVzdHMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QoZ2V0KS50by5ub3QuYmUuY2FsbGVkXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHJldHVybiBhbnkgaXRlbXMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lml0ZW1zKS50by5lcWwodW5kZWZpbmVkKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIE5PVCBzYXkgd2UgaGF2ZSBmZXRjaGVkJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5oYXNGZXRjaGVkKS50by5lcWwoZmFsc2UpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB0aGVyZSB3YXMgYW4gZXJyb3InLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZhaWxlZFRvRmV0Y2gpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzYXkgd2VyZSBsb2FkaW5nIHRoZSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXNGZXRjaGluZykudG8uZXFsKHRydWUpXG4gICAgfSlcbiAgfSlcblxuICBkZXNjcmliZSgnd2hlbiBhIGZldGNoIGhhcyBmYWlsZWQnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgICByZXMgPSB3aGVuLnJlamVjdCh7IHN0YXR1czogNTAwIH0pXG5cbiAgICAgIHJldHVybiBmZXRjaFRoaW5ncyhmb29JZCwgYmFySWQpXG4gICAgfSlcblxuICAgIGRlc2NyaWJlKCd3aGVuIHlvdSB0cnkgdG8gZmV0Y2ggYWdhaW4nLCAoKSA9PiB7XG4gICAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgZ2V0LnJlc2V0KClcblxuICAgICAgICByZXR1cm4gZmV0Y2hUaGluZ3MoZm9vSWQsIGJhcklkKVxuICAgICAgfSlcblxuICAgICAgaXQoJ3Nob3VsZCBOT1QgbWFrZSBhbnkgaHR0cCByZXF1ZXN0cycsICgpID0+IHtcbiAgICAgICAgZXhwZWN0KGdldCkudG8ubm90LmJlLmNhbGxlZFxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1QgcmV0dXJuIGFueSBpdGVtcycsICgpID0+IHtcbiAgICAgIGV4cGVjdChyZXN1bHQuaXRlbXMpLnRvLmVxbCh1bmRlZmluZWQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgTk9UIHNheSB3ZSBoYXZlIGZldGNoZWQnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0Lmhhc0ZldGNoZWQpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzYXkgdGhlcmUgd2FzIGFuIGVycm9yJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KHJlc3VsdC5oYXNGYWlsZWRUb0ZldGNoKS50by5lcWwodHJ1ZSlcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBOT1Qgc2F5IHdlcmUgbG9hZGluZyB0aGUgaXRlbXMnLCAoKSA9PiB7XG4gICAgICBleHBlY3QocmVzdWx0LmlzRmV0Y2hpbmcpLnRvLmVxbChmYWxzZSlcbiAgICB9KVxuICB9KVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVN0b3JlRm9yQ29sbGVjdGlvbiAoeyBmZXRjaFRoaW5ncywgdGhpbmdzIH0pIHtcbiAgICBjb25zdCBjcmVhdGVTdG9yZVdpdGhNaWRkbGV3YXJlID0gYXBwbHlNaWRkbGV3YXJlKHRodW5rTWlkZGxld2FyZSkoY3JlYXRlU3RvcmUpXG4gICAgcmV0dXJuIGNyZWF0ZVN0b3JlV2l0aE1pZGRsZXdhcmUoY29tYmluZVJlZHVjZXJzKHsgdGhpbmdzIH0pKVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkVGhpbmcgKGZvb0lkLCBiYXJJZCwgZXhwZXJpZW5jZSkge1xuICAgIHN0b3JlLmRpc3BhdGNoKGNvbGxlY3Rpb24uYWRkVGhpbmcoZm9vSWQsIGJhcklkLCBleHBlcmllbmNlKSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlbGV0ZVRoaW5nIChmb29JZCwgYmFySWQsIGlkKSB7XG4gICAgc3RvcmUuZGlzcGF0Y2goY29sbGVjdGlvbi5kZWxldGVUaGluZyhmb29JZCwgYmFySWQsIGlkKSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZldGNoVGhpbmdzIChmb29JZCwgYmFySWQsIGlkKSB7XG4gICAgc3RvcmUuZGlzcGF0Y2goY29sbGVjdGlvbi5mZXRjaFRoaW5ncyhmb29JZCwgYmFySWQpKVxuXG4gICAgcmV0dXJuIGRlbGF5KDEpLnRoZW4oZ2V0UmVzdWx0KVxuXG4gICAgZnVuY3Rpb24gZ2V0UmVzdWx0ICgpIHtcbiAgICAgIGNvbnN0IHsgdGhpbmdzIH0gPSBzdG9yZS5nZXRTdGF0ZSgpXG5cbiAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgaXNGZXRjaGluZzogdGhpbmdzLmlzRmV0Y2hpbmcoZm9vSWQsIGJhcklkKSxcbiAgICAgICAgaGFzRmV0Y2hlZDogdGhpbmdzLmhhc0ZldGNoZWQoZm9vSWQsIGJhcklkKSxcbiAgICAgICAgaXRlbXM6IHRoaW5ncy5nZXRBbGxUaGluZ3MoZm9vSWQsIGJhcklkKSxcbiAgICAgICAgaXRlbTogdGhpbmdzLmdldFRoaW5nQnlJZChmb29JZCwgYmFySWQsIGlkKSxcbiAgICAgICAgaGFzRmFpbGVkVG9GZXRjaDogdGhpbmdzLmhhc0ZhaWxlZFRvRmV0Y2goZm9vSWQsIGJhcklkKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVVybCAoZm9vSWQsIGJhcklkKSB7XG4gICAgcmV0dXJuIGBodHRwOi8vJHtmb29JZH0vJHtiYXJJZH1gXG4gIH1cbn0pXG4iXX0=