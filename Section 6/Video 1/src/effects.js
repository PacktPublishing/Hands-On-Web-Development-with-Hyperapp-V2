/*
 * Utilities for different effects
 */

const valueOr = (value, fallback) => typeof value === 'undefined' ? fallback : value;
const getStorage = storage => valueOr(storage, window.localStorage);

/*
 * Store state into local storage
 */

const storeState = (dispatch, { state, storage }) =>
  getStorage(storage).setItem('state', JSON.stringify({ ...state, transition: null }));

export const storeStateFx = (state, config = {}) => [
  storeState,
  {
    state,
    storage: config.storage,
  }
];

/*
 * Retrieve state from local storage
 */

const retrieveState = (dispatch, { success, error, storage }) => {
  try {
    const oldState = getStorage(storage).getItem('state');
    if (oldState) {
      const state = JSON.parse(oldState);
      return dispatch(success, { state });
    }

  } catch (err) {
    console.log('unable to load from storage', err);
  }
  dispatch(error, {});
}

export const retrieveStateFx = (success, error, config = {}) => [
  retrieveState,
  {
    success,
    error,
    storage: config.storage,
  }
];

/*
 * Clear state data from localstorage
 */

const clearState = (_, { storage }) => {
  getStorage(storage).removeItem('state');
};

export const clearStateFx = (config = {}) => [
  clearState,
  { storage: config.storage },
]

/*
 * Scroll window to top
 */

const scrollToTop = (_, { scrollFn }) => {
  scrollFn({ top: 0, left: 0, behavior: 'smooth' });
};

export const scrollToTopFx = (scrollFn) => [
  scrollToTop,
  {
    scrollFn: scrollFn || window.scrollTo,
  },
];


/*
 * Runs an action after render
 */

const runAfterRender = (dispatch, { action }) => {
  setTimeout(() => {
    dispatch(action);
  }, 1);
};

export const runAfterRenderFx = ({ action }) => [runAfterRender, { action }];
