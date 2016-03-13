import _ from 'lodash'

export default function createReducer (initialState, handlers) {
  return function reducer (state = initialState, action) {
    if (action && handlers.hasOwnProperty(action.type)) {
      let handler = handlers[action.type]

      if (!_.isArray(handler)) {
        handler = [handler]
      }

      return _.reduce(handler, (state, handler) => {
        return handler(state, action.payload, action)
      }, state)
    } else {
      return state
    }
  }
}
