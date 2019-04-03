import * as subscriptions from './subscriptions.js';

const subRig = ([fx, props]) => {
  const dispatch = jest.fn();
  const cancel = fx(props, dispatch);
  return { dispatch, cancel };
}

describe('subscriptions', () => {
  describe('setCurrentTimeSub', () => {
    it('dispatches an effect at regular intervals', () => {
      jest.useFakeTimers();
      const spy = jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2);
      const action = () => {};
      const app = subRig(subscriptions.setCurrentTimeSub({ action }));

      jest.runOnlyPendingTimers();
      app.cancel();

      expect(app.dispatch).toHaveBeenCalledTimes(2);
      expect(app.dispatch).toHaveBeenNthCalledWith(1, action, { now: 1 });
      expect(app.dispatch).toHaveBeenNthCalledWith(2, action, { now: 2 });

      jest.useRealTimers();
      spy.mockRestore();
    });
  });

  describe('keyUpResponder', () => {
    let spies = {};
    let triggerKeyUp = null;

    beforeEach(() => {
      let eventCallback = null;

      spies = {
        addEventListener: jest.spyOn(window, 'addEventListener').mockImplementation((type, callback) => {
          eventCallback = callback;
        }),
        removeEventListener: jest.spyOn(window, 'removeEventListener').mockImplementation(() => {
          eventCallback = null;
        }),
      };

      triggerKeyUp = key => eventCallback({ key });
    });

    afterEach(() => {
      spies.addEventListener.mockRestore();
      spies.removeEventListener.mockRestore();
    });

    it('triggers an action with the correct key', () => {
      const action = () => {};
      const app = subRig(subscriptions.keyUpResponderSub({ key: ' ', action }));

      expect(window.addEventListener).toHaveBeenCalled();

      expect(app.dispatch).not.toHaveBeenCalled();
      triggerKeyUp(' ');
      expect(app.dispatch).toHaveBeenCalledWith(action);

      app.cancel();
      expect(window.removeEventListener).toHaveBeenCalled();
    });

    it('ignores all other keys', () => {
      const action = () => {};
      const app = subRig(subscriptions.keyUpResponderSub({ key: ' ', action }));

      expect(window.addEventListener).toHaveBeenCalled();

      expect(app.dispatch).not.toHaveBeenCalled();
      triggerKeyUp('a');
      expect(app.dispatch).not.toHaveBeenCalled();

      app.cancel();
      expect(window.removeEventListener).toHaveBeenCalled();
    });
  });


  describe('firebase', () => {
    let triggerValue = null;

    beforeEach(() => {
      let callback = null;
      triggerValue = (value) => {
        callback({
          val: () => value,
        });
      };

      global.firebase = {
        apps: [],
        initializeApp: jest.fn(() => ({
          database: () => ({
            ref: jest.fn(() => ({
              on: jest.fn((_, onCallback) => {
                callback = onCallback;
              }),
              off: jest.fn(() => {
                callback = null;
              }),
            })),
          }),
        })),
      };
    });

    afterEach(() => {
      delete global.firebase;
    });

    describe('listenToStoryIds', () => {
      it('listens to stories', () => {
        const action = () => {};
        const app = subRig(subscriptions.listenToStoryIdsSub({ type: 'foo', action }));

        expect(app.dispatch).not.toHaveBeenCalled();
        triggerValue([1, 2, 3]);
        expect(app.dispatch).toHaveBeenCalledWith(action, { type: 'foo', ids: [1, 2, 3] });
        app.cancel();
      });
    });

    describe('listenToStory', () => {
      it('listens to a story', () => {
        const action = () => {};
        const app = subRig(subscriptions.listenToStorySub({ id: 1, action }));

        expect(app.dispatch).not.toHaveBeenCalled();
        triggerValue({ id: 1, foo: 'bar' });
        expect(app.dispatch).toHaveBeenCalledWith(action, { story: { id: 1, foo: 'bar' } });
        app.cancel();
      });
    });
  });

  describe('router', () => {
    let navigateTo = () => {};

    beforeEach(() => {
      let initialUrl = '/';
      let routes = {};
      global.page = jest.fn((path, callback) => {
        routes[path] = callback;
      });

      global.page.start = jest.fn(() => {
        navigateTo(initialUrl);
      });

      global.page.stop = jest.fn();

      navigateTo = (url) => {
        const route = routes[url];
        if (route) {
          route({ params: {} });
        }
      };
    });

    afterEach(() => {
      delete global.page;
    });

    it('sets up the router', () => {
      const index = () => {};
      const foo = () => {};
      const app = subRig(subscriptions.routerSub({
        routes: {
          '/': index,
          '/foo': foo,
        }
      }));

      expect(page).toHaveBeenNthCalledWith(1, '/', expect.anything());
      expect(page).toHaveBeenNthCalledWith(2, '/foo', expect.anything());
      expect(page.start).toHaveBeenCalled();
      expect(page.stop).not.toHaveBeenCalled();

      app.cancel();

      expect(page.stop).toHaveBeenCalled();
    });

    it('dispatches on navigation', () => {
      const index = () => {};
      const foo = () => {};
      const app = subRig(subscriptions.routerSub({
        routes: {
          '/': index,
          '/foo': foo,
        }
      }));

      navigateTo('/foo');
      expect(app.dispatch).toHaveBeenCalledWith(foo, { params: {} });

      app.cancel();
    });
  });
});

