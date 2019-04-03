import * as effects from './effects.js';

const dispatchEffect = ([fn, prop]) => {
  const dispatch = jest.fn();
  return Promise.resolve(fn(prop, dispatch)).then(() => dispatch);
};

const mockStorage = (initialMemory = {}) => {
  const memory = { ...initialMemory };

  return {
    getItem: jest.fn().mockImplementation(key => memory[key]),
    setItem: jest.fn().mockImplementation((key, value) => { memory[key] = value; }),
    removeItem: jest.fn().mockImplementation((key) => { delete memory[key]; }),
  }
}


describe('effects', () => {
  describe('storeStateFx', () => {
    it('sets transition to null and calls storage.setItem', () => {
      const storage = mockStorage()
      const state = { foo: 'bar' };
      return dispatchEffect(effects.storeStateFx(state, { storage }))
        .then((dispatch) => {
          expect(dispatch).not.toHaveBeenCalled();
          expect(storage.setItem).toHaveBeenCalledWith('state', JSON.stringify({ ...state, transition: null }));
        });
    });
  });

  describe('retrieveStateFx', () => {
    it('retrieves the state when available', () => {
      const storedState = { stories: { type: 'foo' } };
      const storage = mockStorage({ state: JSON.stringify(storedState) });
      const success = jest.fn();
      const error = jest.fn();

      return dispatchEffect(effects.retrieveStateFx(success, error, { storage }))
        .then((dispatch) => {
          expect(storage.getItem).toHaveBeenCalledWith('state');
          expect(dispatch).toHaveBeenCalledWith(success, { state: storedState });
        });
    });

    it('retrieves the state when available', () => {
      const storedState = { stories: { type: 'foo' } };
      const storage = mockStorage({ state: undefined });
      const success = jest.fn();
      const error = jest.fn();

      return dispatchEffect(effects.retrieveStateFx(success, error, { storage }))
        .then((dispatch) => {
          expect(storage.getItem).toHaveBeenCalledWith('state');
          expect(dispatch).toHaveBeenCalledWith(error, {});
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

  describe('clearState', () => {
    it('removes "state" from localstorage', () => {
      const storage = mockStorage();
      return dispatchEffect(effects.clearStateFx({ storage }))
        .then((dispatch) => {
          expect(storage.removeItem).toHaveBeenCalledWith('state');
        });
    });
  });

  describe('runAfterRender', () => {
    it('dispatches the action', () => {
      const action = () => {};
      return dispatchEffect(effects.runAfterRenderFx({ action }))
        .then((dispatch) => {
          expect(dispatch).toHaveBeenCalledWith(action);
        });
    });
  });

});
