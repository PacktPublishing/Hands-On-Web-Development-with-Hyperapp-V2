import { app, h } from './hyperapp.js';
import * as actions from './actions.js';
import * as subscriptions from'./subscriptions.js';

const getFuzzyTime = (unixTime, msNow) => {
  const diff = msNow - (unixTime * 1000);
  const increments = [
    { word: 'year(s)', incr: 1000 * 60 * 60 * 24 * 365 },
    { word: 'month(s)', incr: 1000 * 60 * 60 * 24 * 30 },
    { word: 'day(s)', incr: 1000 * 60 * 60 * 24 },
    { word: 'hour(s)', incr: 1000 * 60 * 60 },
    { word: 'minute(s)', incr: 1000 * 60 },
  ];
  const increment = increments.find(i => diff >= i.incr);

  return increment
    ? `${Math.floor(diff / increment.incr)} ${increment.word} ago`
    : 'Just now';
};

export const FuzzyTime = (item, dateNow = Date.now()) =>
  h(
    'span',
    { title: (new Date(item.time * 1000)).toISOString() },
    getFuzzyTime(item.time, dateNow),
  );

const navLink = (text, onclick) =>
  h('li', null, h('button', { class: '--link', onclick }, text));

const Navigation = () => h('nav', { class: '--flex-horizontal' }, [
  h('a', { class: 'logo item --flex-center --no-underline', href: '/' }, 'H'),
  h('a', { class: 'item --no-underline --bold', href: '/' }, 'Hyper News'),
  h('ul', { class: '--flex-horizontal item --extra-margin' }, [
    navLink('new', () => [actions.setStoriesType, { type: 'new' }]),
    navLink('top', () => [actions.setStoriesType, { type: 'top' }]),
    navLink('best', () => [actions.setStoriesType, { type: 'best' }]),
    navLink('ask', () => [actions.setStoriesType, { type: 'ask' }]),
    navLink('show', () => [actions.setStoriesType, { type: 'show' }]),
    navLink('jobs', () => [actions.setStoriesType, { type: 'job' }]),
  ]),
]);

const Story = (story, now) => h('story', null, [
  h('a', { class: '--no-underline', href: story.url }, story.title),
  ' ',
  story.url && h('span', { class: '--small' }, [
    '(',
    h('a', { class: '--light', href: story.url }, story.url),
    ')',
  ]),
  h('ul', { class: '--flex-horizontal --light --block --small' }, [
    h('li', null, [
      `${story.score} points by `,
      h('a', { href: '#' }, story.by),
      ' ',
      h('a', { href: '#' }, FuzzyTime(story, now)),
    ]),
    h('li', null, h('a', { href: '#' }, 'hide')),
    h('li', null, h('a', { href: '#' }, 'discussion')),
  ]),
]);

const Comment = (comment, replies, now) => h('comment', null, [
  h('attribution', { class: '--small --light' }, [
    h('a', { class: '', href: '#' }, comment.by),
    ' ',
    h('a', { class: '', href: '#' }, FuzzyTime(comment, now)),
    ' ',
    h('button', { class: '--link', type: 'button' }, '[-]'),
  ]),
  h('article', null,
    comment.text
      .split('<p>')
      .map(text => h('section', null, text))
      .concat(h('replies', null, replies))

  ),
]);

const Spinner = (message) => h('intermediate', null, [
  h('div', { class: '--flex-horizontal spinner-container' }, [
    h('spinner'),
    message && h('span', null, message),
  ]),
]);

const Stories = (collection, now) => h('div', null, [
  h('h1', null, `${collection.type} stories`),
  h(
    'ol',
    null,
    collection.items
      .filter(story => story.title && story.time)
      .map(story => h('li', null, Story(story, now)))
  ),
]);

export default () =>
  app({
    init: actions.init('top'),
    view: ({ stories, now }) => h('div', null, [

      Navigation(),
      Stories(stories, now),
    ]),

    node: document.getElementById('app'),

    subscriptions: state => [
      state.initialized && [
        subscriptions.listenToStoryIdsSub({
          type: state.stories.type,
          action: actions.setStories,
        }),

        state.stories.items.map(story => (
          subscriptions.listenToStorySub({
            id: story.id,
            action: actions.updateStory,
          })
        )),

      ],
      subscriptions.setCurrentTimeSub({ action: actions.setNow }),
      subscriptions.keyUpResponderSub({
        key: 'r',
        action: actions.clearStorage,
      }),
    ],
  });
