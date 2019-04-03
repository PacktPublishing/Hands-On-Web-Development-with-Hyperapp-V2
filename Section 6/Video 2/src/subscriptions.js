/*
 * Interval to set current time
 */

const setCurrentTime = (dispatch, { action }) => {
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

const keyUpResponder = (dispatch, { key, action }) => {
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
const listenToStoryIds = (dispatch, { type, action }) => {
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

const decodeString = string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = string;
  return textarea.value;
};

/*
 * Listen to a single story for value changes
 * See https://github.com/HackerNews/API#items for different data structures
 */
const listenToStory = (dispatch, { id, action }) => {
  if (!id) {
    return () => {};
  }

  const database = getFirebaseApp('hyper-news').database();
  const ref = database.ref(`/v0/item/${id}`);

  const refCallback = ref.on('value', (snapshot) => {
    const story = snapshot.val();
    if (story) {
      const payload = { story };
      if (story.text) {
        payload.story.text = decodeString(story.text);
      }
      dispatch(action, payload);
    } else {
      dispatch(action, {
        story: {
          id,
          title: 'deleted',
          by: 'deleted',
          time: Date.now(),
        }
      });
    }
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

/*
 * Listen to a single comment for value changes
 * See https://github.com/HackerNews/API#items for different data structures
 */
const listenToComment = (dispatch, { id, action }) => {
  if (!id) {
    return () => {};
  }

  const database = getFirebaseApp('hyper-news').database();
  const ref = database.ref(`/v0/item/${id}`);
  const textarea = document.createElement('textarea');

  const refCallback = ref.on('value', (snapshot) => {
    const comment = snapshot.val();
    const text = decodeString(comment.text);
    const payload = { comment: { ...comment, text } };
    dispatch(action, payload);
  }, (err) => {
    console.log('listenToStory.ref.value canceled', err);
  });

  return () => {
    ref.off('value', refCallback);
  };
};

export const listenToCommentSub = ({ id, action }) => [
  listenToComment,
  {
    id,
    action,
  },
];

/*
 * Router
 */

const router = (dispatch, { routes }) => {
  const paths = Object.keys(routes);
  paths.forEach((path) => {
    const route = routes[path];
    page(path, (context) => {
      dispatch(route, { params: context.params });
    });
  });

  page.start();

  return () => {
    page.stop();
  };
};

export const routerSub = ({ routes }) => [
  router,
  {
    routes,
  },
];

/*
 * Wait for animations to end
 */
const animationEndWatcher = (dispatch, { selector, action }) => {
  const handler = (event) => {
    if (event.target.matches(selector)) {
      dispatch(action);
    }
  };

  window.addEventListener('animationend', handler);

  return () => {
    window.removeEventListener('animationend', handler);
  };
};

export const animationEndWatcherSub = ({ selector, action }) => [
  animationEndWatcher,
  {
    selector,
    action,
  },
];
