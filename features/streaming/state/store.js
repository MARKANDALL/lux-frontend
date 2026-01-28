// features/streaming/state/store.js
// Tiny reducer-style store: subscribe / getState / dispatch

export function createStore({ initialState, reducer }) {
  let state = initialState;
  const subs = new Set();

  function getState() {
    return state;
  }

  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }

  function dispatch(action) {
    state = reducer(state, action);
    subs.forEach((fn) => {
      try {
        fn(state, action);
      } catch (e) {
        console.error(e);
      }
    });
    return action;
  }

  return { getState, subscribe, dispatch };
}
