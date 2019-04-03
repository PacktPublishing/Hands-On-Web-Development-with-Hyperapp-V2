import { FuzzyTime } from './hypernews';
import { h } from './hyperapp';

const asMilliseconds = iso8601 => (new Date(iso8601)).getTime();
const itemWithTime = iso8601 => ({ time: asMilliseconds(iso8601) / 1000 });

describe('FuzzyTime', () => {
  it('matches snapshot', () => {
    const item = itemWithTime('1970-01-01T00:00:00.000Z');
    const currentTime = asMilliseconds('1970-01-02T00:00:00.000Z');
    
    expect(FuzzyTime(item, currentTime))
      .toMatchSnapshot();
  });

  it('creates a span with a title and fuzzy time child', () => {
    const itemTime = '1970-01-01T00:00:00.000Z';
    const item = itemWithTime(itemTime);
    const currentTime = asMilliseconds('1970-01-02T00:00:00.000Z');
    
    expect(FuzzyTime(item, currentTime))
      .toEqual(h('span', { title: itemTime }, '1 day(s) ago'));
  });

})
