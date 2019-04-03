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

const initialState = {
  stories: {
    items: [],
    loading: null,
    error: null,
    type: null,
  },
};

export const setStoriesOk = withStorage((state, { type, stories }) => [
  {
    ...state,
    stories: {
      items: stories,
      loading: null,
      error: null,
      type,
    },
  },
  effects.scrollToTopFx(),
]);

export const setStoriesErr = (state, { error }) => ({
  ...state,
  stories: {
    items: [],
    loading: null,
    error,
    type: null,
  },
});

export const loadStories = (state, { type }) => [
  {
    ...state,
    stories: {
      items: state.stories.items,
      loading: type,
      error: null,
      type: state.stories.type,
    }
  },
  effects.getStoriesFx(type, state.stories.items, setStoriesOk, setStoriesErr),
];

export const init = (fallbackType = 'top') => [
  initialState,
  effects.retrieveStateFx(loadStories, fallbackType),
];
