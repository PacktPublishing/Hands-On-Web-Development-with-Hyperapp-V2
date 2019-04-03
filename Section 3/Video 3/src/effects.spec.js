import * as effects from './effects.js';

const dispatchEffect = ([fn, prop]) => {
  const dispatch = jest.fn();
  return Promise.resolve(fn(prop, dispatch)).then(() => dispatch);
};

const mockFetch = mocks => url => {
  const mock = mocks.find(m => m[0] === url || (m[0].test && m[0].test(url)));
  if (!mock) return Promise.reject(new Error('Mock not found'));

  try {
    const [status, json] = mock[1](url.match(mock[0]));

    return Promise.resolve({
      json: () => Promise.resolve(json),
      status
    });
  } catch (err) {
    return Promise.reject(err);
  }
};

const mockStorage = (initialMemory = {}) => {
  const memory = { ...initialMemory };

  return {
    getItem: jest.fn().mockImplementation(key => memory[key]),
    setItem: jest.fn().mockImplementation((key, value) => { memory[key] = value; }),
  }
}


describe('effects', () => {
  describe('getStoriesFx', () => {
    const fetchOk = mockFetch([
      [/v0\/(.+)stories\.json$/, () => [200, [1, 2, 3]]],
      [/v0\/item\/(\d+).json$/, ([_, id]) => [200, { id: Number(id), type: 'story' }]],
    ]);

    const fetchErr = mockFetch([
      [/v0\/(.+)stories\.json$/, () => [400, null]],
      [/v0\/item\/(\d+).json$/, () => [400, null]],
    ]);

    const dispatchGetStoriesFx = (type, success, error, config) =>
      dispatchEffect(
        effects.getStoriesFx(type, [], success, error, config),
      );

    it('runs success on successful request to collection', () => {
      const success = jest.fn();
      const error = jest.fn();

      const expectedPayload = {
        stories: [
          { id: 1, type: 'story' },
          { id: 2, type: 'story' },
          { id: 3, type: 'story' },
        ],
        type: 'top',
      };

      return dispatchGetStoriesFx('top', success, error, { http: fetchOk })
        .then((dispatch) =>
          expect(dispatch).toHaveBeenCalledWith(success, expectedPayload)
        );
    });

    it('runs error on failed request to collection', () => {
      const success = jest.fn();
      const error = jest.fn();

      const expectedPayload = {
        error: 'Unable to fetch resource, try again later',
      };

      return dispatchGetStoriesFx('top', success, error, { http: fetchErr })
        .then(dispatch =>
          expect(dispatch).toHaveBeenCalledWith(error, expectedPayload)
        );
    });
  });

  describe('storeStateFx', () => {
    it('calls storage.setItem', () => {
      const storage = mockStorage()
      const state = { foo: 'bar' };
      return dispatchEffect(effects.storeStateFx(state, { storage }))
        .then((dispatch) => {
          expect(dispatch).not.toHaveBeenCalled();
          expect(storage.setItem).toHaveBeenCalledWith('state', JSON.stringify(state));
        });
    });
  });

  describe('retrieveStateFx', () => {
    it('retrieves the state when available', () => {
      const action = jest.fn();
      const storedState = { stories: { type: 'foo' } };
      const storage = mockStorage({ state: JSON.stringify(storedState) });

      return dispatchEffect(effects.retrieveStateFx(action, 'baz', { storage }))
        .then((dispatch) => {
          expect(storage.getItem).toHaveBeenCalledWith('state');
          expect(dispatch).toHaveBeenCalledWith(storedState);
          expect(dispatch).toHaveBeenLastCalledWith(action, { type: 'foo' })
        });
    });

    it('fetches fallbackType when not available', () => {
      const action = jest.fn();
      const storage = mockStorage();

      return dispatchEffect(effects.retrieveStateFx(action, 'baz', { storage }))
        .then((dispatch) => {
          expect(dispatch).toHaveBeenLastCalledWith(action, { type: 'baz' })
        });
    });
  });

  describe('scrollToTopFx', () => {
    it('calls the scrollFn with the correct parameters', () => {
      const scroll = jest.fn();
      return dispatchEffect(effects.scrollToTopFx(scroll))
        .then((dispatch) => {
          expect(dispatch).not.toHaveBeenCalled();
          expect(scroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
        });
    });
  });

});
