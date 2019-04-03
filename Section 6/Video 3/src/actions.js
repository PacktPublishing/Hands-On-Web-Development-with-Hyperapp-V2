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

const initialState = {
  initialized: false,
  now: null,
  page: 'index',
  stories: {
    items: [],
    type: 'top',
  },
  story: {
    item: {},
    comments: [],
  },
  transition: null,
};

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
  transition: null,
});

export const setStories = (state, { ids }) => ({
  ...state,
  stories: {
    ...state.stories,
    items: ids.map(id => {
      return state.stories.items.find(s => s.id === id) || { id };
    }),
  },
});

const commentsFromKids = (prevCollection, comment) =>
    comment.kids.map(id => (
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

  const prev = comments[index];

  comments[index] = { kids: [], collapsed: prev.collapsed || false, ...comment };

  return {
    ...state,
    story: {
      ...state.story,
      comments,
    },
  };
};

export const toggleCollapseComment = (state, { comment }) => {
  return updateShowComments(state, {
    comment: {
      ...comment,
      collapsed: !comment.collapsed,
    }
  });
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

const updateShowStory = (state, { story }) => {
  const item = { kids: [], ...story };
  const comments = flattenComments(state.story.comments, commentsFromKids(state.story.comments, item));

  return {
    ...state,
    story: {
      ...state.story,
      item,
      comments,
    },
  };
};

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
];

export const goToIndex = (state, { params }) => {
  const type = params.type || 'top';

  const isChange = state.page !== 'index' || type !== state.stories.type;

  return [
    {
      ...state,
      page: 'index',
      stories: {
        ...state.stories,
        items: type === state.stories.type ? state.stories.items : [],
        type,
      },
    },
    [
      effects.scrollToTopFx(),
      isChange && effects.runAfterRenderFx({
        action: [setTransition, { oldState: state }]
      }),
    ],
  ];
};

export const goToShow = (state, { params }) => {
  const item = { id: params.id, kids: [] };

  const isChange = state.page !== 'show' || item.id !== state.story.item.id;

  return [
    {
      ...state,
      page: 'show',
      story: {
        item,
        comments: [],
        collapsedComments: [],
      },
    },
    [
      effects.scrollToTopFx(),
      isChange && effects.runAfterRenderFx({
        action: [setTransition, { oldState: state }]
      }),
    ]
  ]
};

export const setTransition = (state, { oldState }) => ({
  ...state,
  transition: oldState,
});

export const removeTransition = state => ({
  ...state,
  transition: null,
});

export const init = () => [
  initialState,
  effects.retrieveStateFx(reinitializeAppTo, setInitialized),
];
