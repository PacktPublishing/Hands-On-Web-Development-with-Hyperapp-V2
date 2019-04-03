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

export const FuzzyTime = (item, dateNow = Date.now()) => {
  try {
    return h(
      'span',
      { title: (new Date(item.time * 1000)).toISOString() },
      getFuzzyTime(item.time, dateNow),
    );
  } catch (err) {
    console.log('FuzzyTime Error', { item }, err);
    return null;
  }
}

const navLink = (text) =>
  h('li', null, h('a', { class: '--link', href: `/${text}` }, text));

const Navigation = () => h('nav', { class: '--flex-horizontal' }, [
  h('a', { class: 'logo item --flex-center --no-underline', href: '/' }, 'H'),
  h('a', { class: 'item --no-underline --bold', href: '/' }, 'Hyper News'),
  h('ul', { class: '--flex-horizontal item --extra-margin' }, [
    navLink('new'),
    navLink('top'),
    navLink('best'),
    navLink('ask'),
    navLink('show'),
    navLink('jobs'),
  ]),
]);

const Story = (story, now, showText = false) => {
  const url = story.url || `/story/${story.id}`;
  return h('story', null, [
    h('a', { class: '--no-underline', href: url }, story.title),
    ' ',
    story.url && h('span', { class: '--small' }, [
      '(',
      h('a', { class: '--light', href: story.url }, story.url),
      ')',
    ]),
    story.text && showText && h('div', { class: '--normal' }, story.text.split('<p>').map(text => h('p', null, text))),
    h('ul', { class: '--flex-horizontal --light --block --small --unbreakable' }, [
      h('li', null, [
        `${story.score} points by `,
        h('a', { href: '#' }, story.by),
        ' ',
        h('a', { href: `/story/${story.id}` }, FuzzyTime(story, now)),
      ]),
      h('li', null, h('a', { href: '#' }, 'hide')),
      h('li', null, h('a', { href: `/story/${story.id}` }, story.descendants ? `${story.descendants} comments` : 'discussion')),
    ]),
  ]);
};

const Comment = (comment, replies, now) => h('comment', null, [
  h('attribution', { class: '--small --light' }, [
    h('a', { class: '', href: '#' }, comment.by),
    ' ',
    h('a', { class: '', href: '#' }, FuzzyTime(comment, now)),
    ' ',
    h('button', { class: '--link', type: 'button' }, '[-]'), ]),
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

const Thread = (comment, allComments, now) => h('div', null, [
  comment.text && comment.time && Comment(comment, (comment.kids || []).map(id => {
    const child = allComments.find(c => c.id === id);
    return child
      ? Thread(child, allComments, now)
      : null;
  }), now),
]);

const Discussion = ({ item, comments }, now) => h('div', null, [
  item.by && item.time && h('storyRoot', null, [
    Story(item, now, true),
    h('hr'),
  ]),
  (item.kids || []).map(id => {
    const comment = comments.find(c => c.id === id);
    return comment
      ? Thread(comment, comments, now)
      : null;
  }),
]);

export default () => {
  const routes = {
    '/': { name: 'index' },
    '/:type': { name: 'index' },
    '/story/:id': { name: 'show' },
  };

  app({
    init: actions.init('top'),
    view: ({ page, stories, story, now }) => h('div', null, [
      Navigation(),
      h('content', null, [
        page === 'index'
          ? Stories(stories, now)
          : Discussion(story, now)
      ]),
    ]),

    node: document.getElementById('app'),

    subscriptions: state => [
      subscriptions.routerSub({
        routes,
        action: actions.setRoute,
      }),
      state.initialized && [
        state.page === 'index' && [
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
        state.initialized && state.page === 'show' && [
          subscriptions.listenToStorySub({
            id: state.story.item.id,
            action: actions.updateStory,
          }),

          (state.story.comments || []).map(comment => (
            subscriptions.listenToCommentSub({
              id: comment.id,
              action: actions.updateShowComments,
            })
          )),
        ],
      ],
      subscriptions.setCurrentTimeSub({ action: actions.setNow }),
      subscriptions.keyUpResponderSub({
        key: 'r',
        action: actions.clearStorage,
      }),
    ],
  });
};
