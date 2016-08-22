import _ from 'lodash'
import axios from 'axios'
import Immutable from 'immutable'
import invariant from 'invariant'
import pluralize from 'pluralize'
import createReducer from './createReducer'

export const REQUEST_TIMEOUT = 10000 // 10s

export default function createCollection (name, createUrl, isResponseValid = _.isArray) {
  let params = {}
  if (typeof name === 'object') {
    params = name
    name = params.name
    createUrl = params.createUrl
    isResponseValid = params.isResponseValid || _.isArray
  }

  invariant(_.isString(name), '`name` required')

  const path = [].concat(params.path || [])

  const pluralName = _.capitalize(pluralize(name))
  const constants = createConstants(name, pluralName)

  const add = createAdd(name, constants)
  const deleteItem = createDeleteItem(name, constants)
  const update = createUpdate(name, constants)
  const reducer = createReducerForCollection(name, pluralName, constants)
  const fetch = createFetchForCollection(pluralName, createUrl, isResponseValid, constants, path)

  return {
    [`add${name}`]: add,
    [`fetch${pluralName}`]: fetch,
    [`delete${name}`]: deleteItem,
    [`update${name}`]: update,
    [pluralName.toLowerCase()]: reducer
  }
}

function createAdd (name, { FINISHED }) {
  return function add (...args) {
    const item = _.last(args)
    const key = createKey(_.initial(args))
    const result = Immutable.fromJS([item])

    return {
      type: FINISHED,
      payload: { key, result }
    }
  }
}

function createDeleteItem (name, { DELETE }) {
  return function deleteItem (...args) {
    const id = _.last(args)
    const key = createKey(_.initial(args))

    return {
      type: DELETE,
      payload: { key, id }
    }
  }
}

function createUpdate (name, { UPDATE }) {
  return function update (...args) {
    const item = Immutable.fromJS(_.last(args))
    const id = item.get('id')
    const key = createKey(_.initial(args))

    return {
      type: UPDATE,
      payload: { key, id, item }
    }
  }
}

function lowerFirst (str = '') {
  return str[0].toLowerCase() + str.substring(1)
}

function createFetchForCollection (name, createUrl, isResponseValid, constants, path) {
  const { FAILED, FINISHED, IN_PROGRESS } = constants

  return function fetch (...args) {
    return function (dispatch, getState) {
      const state = _.get(getState(), path.concat(lowerFirst(name)))
      const isFetching = state.isFetching(...args)
      const hasFetched = state.hasFetched(...args)
      const hasFailedToFetch = state.hasFailedToFetch(...args)

      if (isFetching || hasFetched || hasFailedToFetch) {
        return
      }

      const url = createUrl(...args)
      const key = createKey(args)
      const requestOptions = {
        timeout: REQUEST_TIMEOUT
      }

      dispatch({
        payload: { key },
        type: IN_PROGRESS
      })

      return axios
        .get(url, requestOptions)
        .then(onResponse)
        .catch(dispatchError)

      function onResponse ({ data }) {
        if (isResponseValid(data)) {
          const result = Immutable.fromJS(data)

          dispatch({
            type: FINISHED,
            payload: { key, result }
          })
        } else {
          dispatchError({
            status: 400,
            message: 'Unacceptable response'
          })
        }
      }

      function dispatchError (error) {
        if (error instanceof Error) {
          console.error(`Failed to reduce ${FINISHED}. This is probably an error in your reducer or a \`connect\`.`, error)
        }

        dispatch({
          type: FAILED,
          error: true,
          payload: {
            key: key,
            status: error.status,
            message: error.message
          }
        })
      }
    }
  }
}

function createReducerForCollection (name, pluralName, constants) {
  const {
    FAILED,
    DELETE,
    UPDATE,
    FINISHED,
    IN_PROGRESS,
    FETCH_FAILED,
    FETCH_FINISHED,
    FETCH_IN_PROGRESS
  } = constants

  const FetchRecord = Immutable.Record({
    fetches: Immutable.Map()
  })

  class FetchState extends FetchRecord {
    getAllItems (...args) {
      const fetch = this.getFetch(args)

      if (fetch.get('status') === FETCH_FINISHED) {
        return fetch.get('result')
      }
    }

    getItemById (...args) {
      const id = _.last(args)
      const items = this.getAllItems.apply(this, _.initial(args))

      if (items) {
        return items.find((item) => {
          return item.get('id') === id
        })
      }
    }
    hasFetched (...args) {
      return this.getStatus(args) === FETCH_FINISHED
    }
    isFetching (...args) {
      return this.getStatus(args) === FETCH_IN_PROGRESS
    }
    hasFailedToFetch (...args) {
      return this.getStatus(args) === FETCH_FAILED
    }
    getStatus (args) {
      return this.getFetch(args).get('status')
    }
    getFetch (args) {
      const key = createKey(args)

      return this.fetches.get(key) || new Immutable.Map()
    }
  }

  addFunctionAlias('getItemById', `get${name}ById`)
  addFunctionAlias('getAllItems', `getAll${pluralName}`)
  addFunctionAlias('isFetching', `isFetching${pluralName}`)
  addFunctionAlias('hasFetched', `hasFetched${pluralName}`)
  addFunctionAlias('hasFailedToFetch', `hasFailedToFetch${pluralName}`)

  return createReducer(new FetchState(), {
    [DELETE]: deleteItem,
    [UPDATE]: update,
    [FAILED]: setStatus(FETCH_FAILED),
    [IN_PROGRESS]: setStatus(FETCH_IN_PROGRESS),
    [FINISHED]: [setStatus(FETCH_FINISHED), setResult]
  })

  function addFunctionAlias (func, alias) {
    FetchState.prototype[alias] = function () {
      return this[func].apply(this, arguments)
    }
  }

  function deleteItem (state, { key, id }) {
    return state.update('fetches', (fetches) => {
      const result = fetches
        .getIn([key, 'result'])
        .filter(itemsWithWrongId)

      return fetches.setIn([key, 'result'], result)
    })

    function itemsWithWrongId (item) {
      return item.get('id') !== id
    }
  }

  function update (state, { key, id, item }) {
    return state.update('fetches', (fetches) => {
      const index = fetches
        .getIn([key, 'result'])
        .findIndex(itemWithId)

      return fetches.setIn([key, 'result', index], item)
    })

    function itemWithId (item) {
      return item.get('id') === id
    }
  }

  function setResult (state, { key, result }) {
    return state.update('fetches', (fetches) => {
      const existingResult = fetches.getIn([key, 'result'])

      if (existingResult) {
        result = result.concat(existingResult)
      }

      return fetches.setIn([key, 'result'], result)
    })
  }

  function setStatus (status) {
    return (state, { key }) => {
      return state.update('fetches', (fetches) => {
        return fetches.setIn([key, 'status'], status)
      })
    }
  }
}

function createKey (args) {
  invariant(_.isArray(args), '`args` must be an array')

  return args.join('-')
}

function createConstants (name, pluralName) {
  const constantPluralName = `FETCH_${pluralName.toUpperCase()}`

  const FETCH_FAILED = 'FETCH_FAILED'
  const FETCH_FINISHED = 'FETCH_FINISHED'
  const FETCH_IN_PROGRESS = 'FETCH_IN_PROGRESS'
  const IN_PROGRESS = `${constantPluralName}_IN_PROGRESS`
  const FINISHED = `${constantPluralName}_FINISHED`
  const FAILED = `${constantPluralName}_FAILED`
  const DELETE = `DELETE_${name.toUpperCase()}`
  const UPDATE = `UPDATE_${name.toUpperCase()}`

  return {
    FAILED,
    DELETE,
    UPDATE,
    FINISHED,
    IN_PROGRESS,
    FETCH_FAILED,
    FETCH_FINISHED,
    FETCH_IN_PROGRESS
  }
}
