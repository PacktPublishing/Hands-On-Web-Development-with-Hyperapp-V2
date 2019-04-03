/*
 * Utilities for different effects
 */
const valueOr = (value, fallback) => typeof value === 'undefined' ? fallback : value;

const requestJson = (http, url, config) =>
  valueOr(http, typeof fetch !== 'undefined' ? fetch : null)(url, config)
    .then(response => {
      if (response.status >= 400) throw new Error(`Server responded with status ${response.status}`);
      return response.json()
    })
    .catch(() => {
      throw 'Unable to fetch resource, try again later';
    });

const getStorage = storage => valueOr(storage, typeof localStorage !== 'undefined' ? localStorage : null);

const storiesUrl = type => `https://hacker-news.firebaseio.com/v0/${type}stories.json`;
const storyUrl = id => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

/*
 * Load a collection of story ids, then batch-load all of those stories
 */

const loadStory = (http, id) => requestJson(http, storyUrl(id))

const loadStories = ({ prevStories, http }) => ids =>
  Promise.all(ids.map((id, index) =>
    prevStories.find(s => s.id === id) || loadStory(http, id)
  ));

const getStories = ({ type, prevStories, success, error, http }, dispatch) =>
  requestJson(http, storiesUrl(type || 'top'))
    .then(loadStories({ http, prevStories, success }))
    .then(stories => dispatch(success, { stories, type }))
    .catch(err => dispatch(error, { error: err }))

export const getStoriesFx = (type, prevStories, success, error, config = {}) => [
  getStories,
  {
    type,
    prevStories,
    success,
    error,
    http: config.http,
  },
];

/*
 * Store state into local storage
 */

const storeState = ({ state, storage }, dispatch) =>
  getStorage(storage).setItem('state', JSON.stringify(state));

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

const retrieveState = ({ action, fallbackType, storage }, dispatch) => {
  try {
    const oldState = getStorage(storage).getItem('state');
    if (oldState) {
      const state = JSON.parse(oldState);
      dispatch(state);
      dispatch(action, { type: state.stories.type });
    } else {
      dispatch(action, { type: fallbackType });
    }

  } catch (err) {
    dispatch(action, { type: fallbackType });
  }
}

export const retrieveStateFx = (action, fallbackType, config = {}) => [
  retrieveState,
  {
    action,
    fallbackType,
    storage: config.storage,
  }
];

/*
 * Scroll window to top
 */

const scrollToTop = ({ scrollFn }, dispatch) => {
  scrollFn({ top: 0, left: 0, behavior: 'smooth' });
};

export const scrollToTopFx = (scrollFn) => [
  scrollToTop,
  {
    scrollFn: scrollFn || window.scrollTo,
  },
];
