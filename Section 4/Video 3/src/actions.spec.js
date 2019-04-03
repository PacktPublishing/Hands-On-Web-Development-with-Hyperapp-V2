import * as actions from './actions.js';
import * as effects from './effects.js';

const initialState = {
  initialized: false,
  now: null,
  stories: {
    items: [],
    type: null,
  },
};

describe('actions', () => {
  const makeState = (augment = {}) => ({
    ...initialState,
    stories: {
      ...initialState.stories,
      ...augment,
    },
  });

  describe('setInitialized', () => {
    it('sets the initialized state to true', () => {
      const state = actions.setInitialized(initialState);
      expect(state.initialized).toBe(true);
    });
  });

  describe('reinitializeAppTo', () => {
    it('sets the entire state, and sets initialized to true', () => {
      const prevState = makeState({ type: 'top', items: [{ id: 1 }] });
      const state = actions.reinitializeAppTo(prevState, { state: initialState });
      expect(state).toEqual({
        ...initialState,
        initialized: true,
      });
    });
  });

  describe('init', () => {
    it('sets the initial state', () => {
      const [state, _] = actions.init('top');
      expect(state).toEqual(makeState({ type: 'top' }));
    });

    it('runs the retireveStateFx effect', () => {
      const [_, fx] = actions.init('top');
      expect(fx).toEqual(effects.retrieveStateFx(actions.reinitializeAppTo, actions.setInitialized));
    });
  });

  describe('setStories', () => {
    it('sets the stories.type and stories.items state', () => {
      const prevState = makeState();
      const state = actions.setStories(prevState, { type: 'top', ids: [1, 2, 3] });
      expect(state).toEqual(makeState({
        type: 'top',
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ],
      }));
    });

    it('removes stories without a matching new id', () => {
      const prevState = makeState({ items: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]});
      const state = actions.setStories(prevState, { type: 'top', ids: [1, 2, 3] });
      expect(state).toEqual(makeState({
        type: 'top',
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ],
      }));
    });

    it('persists previous stories with matching new ids', () => {
      const prevState = makeState({ items: [
        { id: 1, title: 'foo' },
      ]});
      const state = actions.setStories(prevState, { type: 'top', ids: [1, 2, 3] });
      expect(state).toEqual(makeState({
        type: 'top',
        items: [
          { id: 1, title: 'foo' },
          { id: 2 },
          { id: 3 },
        ],
      }));
    });
  });

  describe('updateStory', () => {
    it('uses withStorage() HoF', () => {
      const prevState = makeState({
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ]
      });
      const [state, fx] = actions.updateStory(prevState, { story: { id: 2, title: 'foo' } });
      expect(fx).toEqual(effects.storeStateFx(state));
    });

    it('updates an individual story', () => {
      const prevState = makeState({
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ]
      });
      const [state, _] = actions.updateStory(prevState, { story: { id: 2, title: 'foo' } });
      expect(state).toEqual(makeState({
        items: [
          { id: 1 },
          { id: 2, title: 'foo' },
          { id: 3 },
        ],
      }));
    });

    it('bails if the story is removed', () => {
      const prevState = makeState({
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ]
      });
      const [state, _] = actions.updateStory(prevState, { story: null });
      expect(state).toBe(prevState);
    });

    it('bails if the story is not in the items collection', () => {
      const prevState = makeState({
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ]
      });
      const [state, _] = actions.updateStory(prevState, { story: { id: 4 } });
      expect(state).toBe(prevState);
    });
  });

  describe('setNow', () => {
    it('sets now to the current time', () => {
      const state = actions.setNow(initialState, { now: 5000 });
      expect(state).toEqual({ ...initialState, now: 5000 });
    });
  });

  describe('clearStorage', () => {
    it('does not change the state', () => {
      const [state, _] = actions.clearStorage(initialState);
      expect(state).toBe(initialState);
    });

    it('runs the clearStateFx', () => {
      const [_, fx] = actions.clearStorage(initialState);
      expect(fx).toEqual(effects.clearStateFx());
    });
  });
});
