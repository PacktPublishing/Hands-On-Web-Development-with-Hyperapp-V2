import * as effects from './effects.js';

const withStorage = action => (state, props) => {
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
  stories: {
    items: [],
    type: defaultType,
  },
});

export const setInitialized = state => ({
  ...state,
  initialized: true,
});

export const reinitializeAppTo = (_, { state }) => setInitialized(state);

export const setStoriesType = (state, { type }) => ({
  ...state,
  stories: {
    ...state.stories,
    type,
  },
});

export const setStories = (state, { type, ids }) => (
  setStoriesType({
    ...state,
    stories: {
      ...state.stories,
      items: ids.map(id => {
        return state.stories.items.find(s => s.id === id) || { id };
      }),
    },
  }, { type })
);

export const updateStory = withStorage((state, { story }) => {
  if (!story) {
    return state;
  }

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
});


export const setNow = (state, { now }) => ({
  ...state,
  now,
});

export const clearStorage = state => [
  state,
  effects.clearStateFx(),
]

export const init = (defaultType = 'top') => [
  initialState(defaultType),
  effects.retrieveStateFx(reinitializeAppTo, setInitialized),
];
