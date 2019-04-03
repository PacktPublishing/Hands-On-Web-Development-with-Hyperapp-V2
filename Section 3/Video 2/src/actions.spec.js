import * as actions from './actions.js';
import * as effects from './effects.js';

const initialState = {
  stories: {
    items: [],
    loading: null,
    error: null,
    type: null,
  },
};

describe('actions', () => {
  describe('stories', () => {
    const makeState = (augment = {}) => ({
      ...initialState,
      stories: {
        ...initialState.stories,
        ...augment,
      }
    });

    describe('loadStories', () => {
      const previousState = makeState({ items: [{}], error: 'foo' });

      it('resets stories, adds loading flag', () => {
        const type = 'new';
        const expectedState = makeState({ items: previousState.stories.items, loading: type });
        const [state, _] = actions.loadStories(previousState, { type });

        expect(state).toEqual(expectedState);
      });

      it('runs the getStories effect', () => {
        const type = 'new';
        const expectedEffect = effects.getStoriesFx(
          type,
          previousState.stories.items,
          actions.setStoriesOk,
          actions.setStoriesErr
        );
        const [_, effect] = actions.loadStories(previousState, { type });

        expect(effect).toEqual(expectedEffect);
      });
    });

    describe('setStoriesOk', () => {
      it('overrides items, resets loading and error', () => {
        const previousState = makeState({ loading: 'best', error: 'test' });
        const stories = [{}];
        const expectedState = makeState({ items: stories, type: 'best' });
        const [state, _] = actions.setStoriesOk(previousState, { stories, type: 'best' });

        expect(state).toEqual(expectedState);
      });

      it('calls storeState and scrollsToTop effects', () => {
        const previousState = makeState({ loading: 'best', error: 'test' });
        const stories = [{}];
        const [state, effect] = actions.setStoriesOk(previousState, { stories, type: 'best' });
        const expectedEffect = [
          effects.storeStateFx(state),
          effects.scrollToTopFx(),
        ];

        expect(effect).toEqual(expectedEffect);
      });
    });

    describe('setStoriesErr', () => {
      it('sets error, resets loading and items', () => {
        const previousState = makeState({ loading: 'top', items: [{}] });
        const error = 'Some error message';
        const expectedState = makeState({ error });
        const state = actions.setStoriesErr(previousState, { error });

        expect(state).toEqual(expectedState);
      });
    });
  });
});
