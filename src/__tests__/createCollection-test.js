import when from 'when'
import sinon from 'sinon'
import axios from 'axios'
import { expect } from 'chai'
import delay from 'when/delay'
import Immutable from 'immutable'
import thunkMiddleware from 'redux-thunk'
import createCollection from '../createCollection'
import { REQUEST_TIMEOUT } from '../createCollection'
import { createStore, combineReducers, applyMiddleware } from 'redux'

describe('createCollection', () => {
  let get
  let res
  let data
  let store
  let result
  let sandbox
  let barId
  let collection
  let fooId
  let expectedUrl
  let requestConfig

  beforeEach(() => {
    fooId = 123
    barId = 'B-12'
    get = sinon.spy(() => res)
    sandbox = sinon.sandbox.create()
    sandbox.stub(axios, 'get', get)
    requestConfig = { timeout: REQUEST_TIMEOUT }
    expectedUrl = createUrl(fooId, barId)
    collection = createCollection('Thing', createUrl)
    store = createStoreForCollection(collection)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('when a fetch has not started', () => {
    beforeEach(() => {
      data = [{
        id: 1, name: 'foo'
      }, {
        id: 2, name: 'bar'
      }]
      res = when({ status: 200, data })

      return fetchThings(fooId, barId, 2)
    })

    it('should return the item', () => {
      expect(result.item).to.eql(Immutable.fromJS(data[1]))
    })

    it('should call make a valid http request', () => {
      expect(get).to.be.calledWith(expectedUrl, requestConfig)
    })

    it('should return the items', () => {
      expect(result.items).to.eql(Immutable.fromJS(data))
    })

    it('should say we have fetched', () => {
      expect(result.hasFetched).to.eql(true)
    })

    it('should NOT say there was an error', () => {
      expect(result.hasFailedToFetch).to.eql(false)
    })

    it('should NOT say were loading the items', () => {
      expect(result.isFetching).to.eql(false)
    })
  })

  describe('when I add an item', () => {
    let expectedThing

    beforeEach(() => {
      data = [{
        id: 1, name: 'foo'
      }]
      res = when({ status: 200, data })

      return fetchThings(fooId, barId, 2)
    })

    beforeEach(() => {
      expectedThing = {
        id: 2, name: 'bar'
      }
      addThing(fooId, barId, expectedThing)

      return fetchThings(fooId, barId, 2)
    })

    it('should add the item', () => {
      expect(result.item).to.eql(Immutable.fromJS(expectedThing))
      expect(result.items.size).to.eql(2)
    })
  })

  describe('when I delete an item', () => {
    beforeEach(() => {
      data = [{
        id: 1, name: 'foo'
      }, {
        id: 2, name: 'bar'
      }, {
        id: 3, name: 'baz'
      }]
      res = when({ status: 200, data })

      return fetchThings(fooId, barId, 2)
    })

    beforeEach(() => {
      deleteThing(fooId, barId, 2)

      return fetchThings(fooId, barId, 2)
    })

    it('should delete the item', () => {
      expect(result.item).to.eql(undefined)
      expect(result.items.size).to.eql(2)
    })
  })

  describe('when a fetch is in progress', () => {
    beforeEach(() => {
      let deferred = when.defer()
      res = deferred.promise

      return fetchThings(fooId, barId).then(() => {
        get.reset()

        return fetchThings(fooId, barId)
      })
    })

    it('should NOT make any http requests', () => {
      expect(get).to.not.be.called
    })

    it('should NOT return any items', () => {
      expect(result.items).to.eql(undefined)
    })

    it('should NOT say we have fetched', () => {
      expect(result.hasFetched).to.eql(false)
    })

    it('should NOT say there was an error', () => {
      expect(result.hasFailedToFetch).to.eql(false)
    })

    it('should say were loading the items', () => {
      expect(result.isFetching).to.eql(true)
    })
  })

  describe('when a fetch has failed', () => {
    beforeEach(() => {
      res = when.reject({ status: 500 })

      return fetchThings(fooId, barId)
    })

    describe('when you try to fetch again', () => {
      beforeEach(() => {
        get.reset()

        return fetchThings(fooId, barId)
      })

      it('should NOT make any http requests', () => {
        expect(get).to.not.be.called
      })
    })

    it('should NOT return any items', () => {
      expect(result.items).to.eql(undefined)
    })

    it('should NOT say we have fetched', () => {
      expect(result.hasFetched).to.eql(false)
    })

    it('should say there was an error', () => {
      expect(result.hasFailedToFetch).to.eql(true)
    })

    it('should NOT say were loading the items', () => {
      expect(result.isFetching).to.eql(false)
    })
  })

  function createStoreForCollection ({ fetchThings, things }) {
    const createStoreWithMiddleware = applyMiddleware(thunkMiddleware)(createStore)
    return createStoreWithMiddleware(combineReducers({ things }))
  }

  function addThing (fooId, barId, experience) {
    store.dispatch(collection.addThing(fooId, barId, experience))
  }

  function deleteThing (fooId, barId, id) {
    store.dispatch(collection.deleteThing(fooId, barId, id))
  }

  function fetchThings (fooId, barId, id) {
    store.dispatch(collection.fetchThings(fooId, barId))

    return delay(1).then(getResult)

    function getResult () {
      const { things } = store.getState()

      result = {
        isFetching: things.isFetching(fooId, barId),
        hasFetched: things.hasFetched(fooId, barId),
        items: things.getAllThings(fooId, barId),
        item: things.getThingById(fooId, barId, id),
        hasFailedToFetch: things.hasFailedToFetch(fooId, barId)
      }
    }
  }

  function createUrl (fooId, barId) {
    return `http://${fooId}/${barId}`
  }
})
