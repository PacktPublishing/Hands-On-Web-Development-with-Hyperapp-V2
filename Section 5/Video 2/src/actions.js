import * as effects from './effects.js';

const withStorage = (action, name) => (state, props) => {
  const result = action(state, props);
  if (Array.isArray(result)) {
    return [
      result[0],
      [
        effects.storeStateFx(result[0]),
        result[1],
      ],
    ];
  }

  return [result, effects.storeStateFx(result)];
};

const initialState = defaultType => ({
  initialized: false,
  now: null,
  page: 'index',
  stories: {
    items: [],
    type: defaultType,
  },
  story: {
    item: {},
    comments: [],
  }
});

export const setInitialized = state => ({
  ...state,
  initialized: true,
});

export const reinitializeAppTo = (_, { state }) => setInitialized({
  ...initialState,
  ...state,
  stories: {
    ...initialState.stories,
    ...(state.stories || {}),
  },
  story: {
    ...initialState.story,
    ...(state.story || {}),
  },
});

export const setStories = (state, { type, ids }) => ({
  ...state,
  stories: {
    ...state.stories,
    items: ids.map(id => {
      return state.stories.items.find(s => s.id === id) || { id };
    }),
    type,
  },
});

const commentsFromKids = (prevCollection, comment) =>
    (comment && comment.kids || []).map(id => (
      prevCollection.find(c => c.id === id)
      || { id, parent: comment.id, kids: [] }
    ));

const flattenComments = (prevCollection, comments) =>
  comments.reduce((allComments, comment) => {
    return [
      ...allComments,
      comment,
      ...flattenComments(prevCollection, commentsFromKids(prevCollection, comment))
    ];
  }, []);

export const updateShowComments = (state, { comment }) => {
  const comments = flattenComments(state.story.comments, commentsFromKids(state.story.comments, state.story.item));
  const index = comments.findIndex(c => c.id === comment.id);
  if (index < 0) {
    return state;
  }

  comments[index] = comment;

  return {
    ...state,
    story: {
      ...state.story,
      comments,
    },
  };
};

const updateIndexStory = (state, { story }) => {
  const items = [...state.stories.items];
  const index = items.findIndex(i => i.id === story.id);
  if (index === -1) {
    return state;
  }

  items[index] = story;

  return {
    ...state,
    stories: {
      ...state.stories,
      items,
    },
  };
};

const updateShowStory = (state, { story }) => ({
  ...state,
  story: {
    ...state.story,
    item: story,
    comments: story.kids
      ? story.kids.map(id => ({ id, kids: [] }))
      : [],
  },
});

export const updateStory = withStorage((state, { story }) => {
  if (!story) {
    return state;
  }

  return state.page === 'index'
    ? updateIndexStory(state, { story })
    : updateShowStory(state, { story });
}, 'updateStory');


export const setNow = (state, { now }) => ({
  ...state,
  now,
});

export const clearStorage = state => [
  state,
  effects.clearStateFx(),
]

export const setRoute = (state, { name, params }) => {
  const type = params.type || state.stories.type;

  const item = (params.id ? { id: params.id, kids: [] } : state.story.item);

  return {
    ...state,
    page: name,
    stories: {
      ...state.stories,
      type,
    },
    story: {
      ...state.story,
      item,
      comments: flattenComments(state.story.comments, commentsFromKids(state.story.comments, item)),
    },
  };
};

export const init = (defaultType = 'top') => [
  initialState(defaultType),
  effects.retrieveStateFx(reinitializeAppTo, setInitialized),
];
