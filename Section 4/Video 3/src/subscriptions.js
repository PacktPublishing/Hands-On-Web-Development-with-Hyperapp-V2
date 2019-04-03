/*
 * Interval to set current time
 */

const setCurrentTime = ({ action }, dispatch) => {
  const tick = () => {
    dispatch(action, { now: Date.now() });
  };

  const handle = setInterval(tick, 10000);
  tick();

  return () => {
    clearInterval(handle);
  };
};

export const setCurrentTimeSub = ({ action }) => [setCurrentTime, { action }];

/*
 * Run action on key up event
 */

const keyUpResponder = ({ key, action }, dispatch) => {
  const handler = (event) => {
    if (event.key !== key) {
      return;
    }
    dispatch(action);
  }

  window.addEventListener('keyup', handler);

  return () => {
    window.removeEventListener('keyup', handler);
  };
};

export const keyUpResponderSub = ({ key, action }) => [keyUpResponder, { key, action }];

/*
 * Firebase configuration
 */
const firebaseConfig = { databaseURL: 'https://hacker-news.firebaseio.com',
  projectId: 'hacker-news',
};

const getFirebaseApp = (name) => {
  if (typeof firebase === 'undefined') return null;
  const app = firebase.apps.find(a => a.name === name);
  return app || firebase.initializeApp({ databaseURL: 'https://hacker-news.firebaseio.com' }, name);
}

/*
 * Get a list of story ids for a story type
 * See https://github.com/HackerNews/API#live-data for a list of different <type>stories
 */
const listenToStoryIds = ({ type, action }, dispatch) => {
  if (!type) {
    return () => {};
  }

  const database = getFirebaseApp('hyper-news').database();
  const ref = database.ref(`/v0/${type}stories`);

  const refCallback = ref.on('value', (snapshot) => {
    const payload = { type, ids: snapshot.val() };
    dispatch(action, payload);
  }, (err) => {
    console.log('listenToStoryIds.ref.value canceled', err);
  });

  return () => {
    ref.off('value', refCallback);
  };
};

export const listenToStoryIdsSub = ({ type, action }) => [
  listenToStoryIds,
  {
    type,
    action,
  },
];

/*
 * Listen to a single story for value changes
 * See https://github.com/HackerNews/API#items for different data structures
 */
const listenToStory = ({ id, action }, dispatch) => {
  const database = getFirebaseApp('hyper-news').database();
  const ref = database.ref(`/v0/item/${id}`);

  const refCallback = ref.on('value', (snapshot) => {
    const payload = { story: snapshot.val() };
    dispatch(action, payload);
  }, (err) => {
    console.log('listenToStory.ref.value canceled', err);
  });

  return () => {
    ref.off('value', refCallback);
  };
};

export const listenToStorySub = ({ id, action }) => [
  listenToStory,
  {
    id,
    action,
  },
];

