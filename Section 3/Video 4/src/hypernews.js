import { app, h } from './hyperapp.js';
import * as actions from './actions.js';

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
    navLink('new', () => [actions.loadStories, { type: 'new' }]),
    navLink('top', () => [actions.loadStories, { type: 'top' }]),
    navLink('best', () => [actions.loadStories, { type: 'best' }]),
    navLink('ask', () => [actions.loadStories, { type: 'ask' }]),
    navLink('show', () => [actions.loadStories, { type: 'show' }]),
    navLink('jobs', () => [actions.loadStories, { type: 'job' }]),
  ]),
]);

const Story = story => h('story', null, [
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
      h('a', { href: '#' }, FuzzyTime(story)),
    ]),
    h('li', null, h('a', { href: '#' }, 'hide')),
    h('li', null, h('a', { href: '#' }, 'discussion')),
  ]),
]);

const Comment = (comment, replies) => h('comment', null, [
  h('attribution', { class: '--small --light' }, [
    h('a', { class: '', href: '#' }, comment.by),
    ' ',
    h('a', { class: '', href: '#' }, FuzzyTime(comment)),
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

const Error = (message) => h('intermediate', null, h('error', null, [
  h('strong', null, 'Error:'),
  ' ',
  message.toString(),
]));

const Stories = collection => h('div', null, [
  collection.type && h('h1', null, `${collection.type} stories`),
  h(
    'ol',
    null,
    collection.items
      .map(story => h('li', null, Story(story)))
  ),
]);

const Show = (collection, renderFn) => {
  const isUpdate = collection.loading === collection.type;
  const verb = isUpdate ? 'Updating' : 'Loading';

  return h('div', null, [
    collection.loading && Spinner(`${verb} ${collection.loading} stories...`),
    collection.error && Error(collection.error),
    renderFn(collection),
  ]);
};

export default () =>
  app({
    init: actions.init('top'),
    view: ({ stories }) => h('div', null, [

      Navigation(),
      Show(stories, Stories),
    ]),

    node: document.getElementById('app'),
  });
