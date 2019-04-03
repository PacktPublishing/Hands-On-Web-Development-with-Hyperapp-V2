import * as actions from './actions.js';
import * as effects from './effects.js';

const initialState = {
  initialized: false,
  now: null,
  page: null,
  stories: {
    items: [],
    type: 'top',
  },
  story: {
    item: {},
    comments: [],
    collapsedComments: [],
  },
  transition: null,
};

const makeStoriesState = (augment = {}) => ({
  ...initialState,
  page: 'index',
  stories: {
    ...initialState.stories,
    ...augment,
  },
});

const makeStoryState = (augment = {}) => ({
  ...initialState,
  page: 'show',
  story: {
    ...initialState.story,
    ...augment,
  },
});

describe('actions', () => {
  describe('setInitialized', () => {
    it('sets the initialized state to true', () => {
      const state = actions.setInitialized(initialState);
      expect(state.initialized).toBe(true);
    });
  });

  describe('reinitializeAppTo', () => {
    it('sets the entire state, and sets initialized to true', () => {
      const prevState = makeStoriesState({ type: 'top', items: [{ id: 1 }] });
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
      expect(state).toEqual(makeStoriesState({ type: 'top' }));
    });

    it('runs the retireveStateFx effect', () => {
      const [_, fx] = actions.init('top');
      expect(fx).toEqual(effects.retrieveStateFx(actions.reinitializeAppTo, actions.setInitialized));
    });
  });

  describe('setStories', () => {
    it('sets the stories.type and stories.items state', () => {
      const prevState = makeStoriesState();
      const state = actions.setStories(prevState, { ids: [1, 2, 3] });
      expect(state).toEqual(makeStoriesState({
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ],
      }));
    });

    it('removes stories without a matching new id', () => {
      const prevState = makeStoriesState({ items: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ]});
      const state = actions.setStories(prevState, { ids: [1, 2, 3] });
      expect(state).toEqual(makeStoriesState({
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ],
      }));
    });

    it('persists previous stories with matching new ids', () => {
      const prevState = makeStoriesState({
        items: [
          { id: 1, title: 'foo' },
        ],
      });
      const state = actions.setStories(prevState, { ids: [1, 2, 3] });
      expect(state).toEqual(makeStoriesState({
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
      const prevState = makeStoriesState({
        items: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ]
      });
      const [state, fx] = actions.updateStory(prevState, { story: { id: 2, title: 'foo' } });
      expect(fx).toEqual(effects.storeStateFx(state));
    });

    describe('with state.page === "show"', () => {
      it('updates the story', () => {
        const prevState = makeStoryState();
        const [state, _] = actions.updateStory(prevState, { story: { id: 1, title: 'foo' } });
        expect(state).toEqual(makeStoryState({
          item: { id: 1, title: 'foo', kids: [] },
        }));
      });

      it('recursively sets comments', () => {
        const prevState = makeStoryState();
        const [state, _] = actions.updateStory(prevState, { story: { id: 1, title: 'foo', kids: [2] } });
        expect(state).toEqual(makeStoryState({
          item: { id: 1, title: 'foo', kids: [2] },
          comments: [
            { id: 2, kids: [], parent: 1 },
          ]
        }));
      });
    });

    describe('with state.page === "index"', () => {
      it('updates an individual story', () => {
        const prevState = makeStoriesState({
          items: [
            { id: 1 },
            { id: 2 },
            { id: 3 },
          ]
        });
        const [state, _] = actions.updateStory(prevState, { story: { id: 2, title: 'foo' } });
        expect(state).toEqual(makeStoriesState({
          items: [
            { id: 1 },
            { id: 2, title: 'foo' },
            { id: 3 },
          ],
        }));
      });

      it('bails if the story is removed', () => {
        const prevState = makeStoriesState({
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
        const prevState = makeStoriesState({
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

  describe('goToIndex', () => {
    it('resets the story state, and sets page to show', () => {
      const prevState = makeStoryState();
      const [state, _] = actions.goToIndex(prevState, { params: { type: 'new' } });
      expect(state).toEqual(makeStoriesState({ type: 'new', items: [] }));
    });

    it('adds the scrollToTop and runAfterRenderFx effect', () => {
      const prevState = makeStoryState();
      const [_, fx] = actions.goToIndex(prevState, { params: { type: 'job' } });
      expect(fx).toEqual([
        effects.scrollToTopFx(),
        effects.runAfterRenderFx({ action: [actions.setTransition, { oldState: prevState }] }),
      ]);
    });

    it('only adds the scrollToTop effect if the page or page data have not changed', () => {
      const prevState = makeStoriesState({ type: 'foo' });
      const [_, fx] = actions.goToIndex(prevState, { params: { type: 'foo' } });
      expect(fx).toEqual([
        effects.scrollToTopFx(),
        false,
      ]);
    });
  });

  describe('goToShow', () => {
    it('resets the story state, and sets page to show', () => {
      const prevState = makeStoriesState();
      const [state, _] = actions.goToShow(prevState, { params: { id: 1 } });
      expect(state).toEqual(makeStoryState({ item: { id: 1, kids: [] } }));
    });

    it('adds the scrollToTop and runAfterRenderFx effect', () => {
      const prevState = makeStoriesState();
      const [_, fx] = actions.goToShow(prevState, { params: { id: 1 } });
      expect(fx).toEqual([
        effects.scrollToTopFx(),
        effects.runAfterRenderFx({ action: [actions.setTransition, { oldState: prevState }] }),
      ]);
    });

    it('only adds the scrollToTop effect if the page or page data have not changed', () => {
      const prevState = makeStoryState({ item: { id: 1 } });
      const [_, fx] = actions.goToShow(prevState, { params: { id: 1 } });
      expect(fx).toEqual([
        effects.scrollToTopFx(),
        false,
      ]);
    });
  });

  describe('toggleCollapseComment', () => {
    it('adds a comment id to the collapsed list if it is not present', () => {
      const prevState = makeStoryState({ collapsedComments: [] });
      const state = actions.toggleCollapseComment(prevState, { id: 1 });
      expect(state).toEqual(makeStoryState({ collapsedComments: [1] }));
    });

    it('removes a comment id to the collapsed list if it is present', () => {
      const prevState = makeStoryState({ collapsedComments: [1] });
      const state = actions.toggleCollapseComment(prevState, { id: 1 });
      expect(state).toEqual(makeStoryState({ collapsedComments: [] }));
    });
  });

  describe('updateShowComments', () => {
    it('returns the previous state if the comment is not in the comments array', () => {
      const prevState = makeStoryState({ item: { id: 1, kids: [] } });
      const state = actions.updateShowComments(prevState, { comment: { id: 999, kids: [] } });
      expect(state).toBe(prevState);
    });

    it('returns the previous state if the comment is not in the comments array', () => {
      const item = { id: 1, kids: [999] };
      const prevState = makeStoryState({ item });
      const state = actions.updateShowComments(prevState, { comment: { id: 999, text: 'hello', kids: [] } });
      expect(state).toEqual(makeStoryState({
        item,
        comments: [
          { id: 999, text: 'hello', kids: [] },
        ],
      }));
    });
  });

  describe('setTransition', () => {
    it('sets state.transition', () => {
      const prevState = {};
      const state = actions.setTransition(prevState, { oldState: { foo: 'bar' } });
      expect(state).toEqual({ transition: { foo: 'bar' } });
    });
  });

  describe('removeTransition', () => {
    it('clears state.transition', () => {
      const prevState = { transition: { foo: 'bar' } };
      const state = actions.removeTransition(prevState);
      expect(state).toEqual({ transition: null });
    });
  });
});
