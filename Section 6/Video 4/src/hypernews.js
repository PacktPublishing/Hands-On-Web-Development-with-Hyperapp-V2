import { app, h, Lazy } from './hyperapp.js';
import * as actions from './actions.js';
import * as subscriptions from'./subscriptions.js';

const getFuzzyTime = (unixTime, msNow) => {
  const diff = msNow - (unixTime * 1000);
  const increments = [ { word: 'year(s)', incr: 1000 * 60 * 60 * 24 * 365 },
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

const navLink = (text, url) =>
  h('li', null, h('a', { class: '--link', href: `/${url || text}` }, text));

const Navigation = () => h('nav', { class: '--flex-horizontal' }, [
  h('a', { class: 'logo item --flex-center --no-underline', href: '/' }, 'H'),
  h('a', { class: 'item --no-underline --bold', href: '/' }, 'Hyper News'),
  h('ul', { class: '--flex-horizontal item --extra-margin' }, [ navLink('new'),
    navLink('top'),
    navLink('best'),
    navLink('ask'),
    navLink('show'),
    navLink('jobs', 'job'),
  ]),
]);

const StoryData = (story, now, showText = false) => {
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
}

const StoryShadow = () => {
  return h('story', null, [
    h('shadow', { style: { width: '50%' } }),
    ' ',
    h('shadow', { class: '--small', style: { width: '20%', borderRadius: '5px', borderLeft: '1px black solid', borderRight: '1px black solid' } }),
    h('ul', { class: '--flex-horizontal --light --block --small --unbreakable' }, [
      h('li', null, [
        h('shadow', { class: '--small', style: { width: '200px' } }),
      ]),
      h('li', null, [
        h('shadow', { class: '--small', style: { width: '100px' } }),
      ]),
      h('li', null, [
        h('shadow', { class: '--small', style: { width: '100px' } }),
      ]),
    ]),
  ]);
}

const Story = (story, now, showText = false) => {
  return story.title && story.time
    ? StoryData(story, now, showText)
    : StoryShadow()
};

const StoryComponent = ({ story, now, showText }) => Story(story, now, showText);
const LazyStory = (story, now, showText) => h(Lazy, { view: StoryComponent, story, now, showText });

const CommentData = (comment, replies, now) => {
  const article = comment.collapsed
    ? []
    : (comment.deleted
        ? ['deleted']
        : comment.text.split('<p>').map(text => h('section', null, text)))
        .concat(h('replies', null, replies));

  return h('comment', null, [
    h('attribution', { class: '--small --light' }, [
      h('a', { class: '', href: '#' }, comment.deleted ? 'deleted' : comment.by),
      ' ',
      h('a', { class: '', href: '#' }, FuzzyTime(comment, now)),
      ' ',
      h(
        'button',
        {
          class: '--link',
          type: 'button',
          onclick: [actions.toggleCollapseComment, { comment }],
        },
        comment.collapsed ? '[+]' : '[-]',
      ),
    ]),
    h('article', null, article),
  ]);
};

const CommentShadow = () => h('comment', null, [
  h('attribution', { class: '--small --light' }, [
    h('shadow', { class: '--small', style: { width: '200px' } }),
    ' ',
    h('button', { class: '--link', type: 'button' }, '[-]'),
  ]),
  h('article', null, [
    h('p', null, h('shadow', { style: { width: '350px', display: 'block' } })),
    h('p', null, h('shadow', { style: { width: '350px', display: 'block' } })),
  ])
]);

const Comment = (comment, replies, now) => {
  return comment && comment.time
    ? CommentData(comment, replies, now)
    : CommentShadow();
}

const Spinner = () => h('spinner');

const Stories = (collection, now) => {
  const isLoading = collection.items.some(item => !item.title || !item.time);
  return h('div', null, [
    h(
      'h1',
      null,
      [
        `${collection.type} stories`,
        isLoading && Spinner()

      ],
    ),
    h(
      'ol',
      null,
      collection.items
        .map(story => h('li', null, LazyStory(story, now)))
    ),
  ]);
};

const Thread = (comment, allComments, now) => h('div', null, [
  Comment(comment, (comment && comment.kids || []).map(id => {
    const child = allComments.find(c => c.id === id);
    return child && Thread(child, allComments, now);
  }), now),
]);

const Discussion = ({ item, comments }, now) => h('div', null, [
  h('storyRoot', null, [
    Story(item, now, true),
    h('hr'),
  ]),
  (item.kids || []).map(id => {
    const comment = comments.find(c => c.id === id);
    return comment && Thread(comment, comments, now);
  }),
]);

const Layout = ({ page, stories, story, now }) => h('div', null, [
  Navigation(),
  h('content', null, [
    page === 'index'
      ? Stories(stories, now)
      : Discussion(story || {}, now)
  ]),
]);


export default (node, webComponentEmitter) => {
  const routes = {
    '/': actions.goToIndex,
    '/:type': actions.goToIndex,
    '/story/:id': actions.goToShow,
  };

  app({
    init: actions.init(),
    view: ({ page, stories, story, now, transition }) => h('div', null, [
      Layout({ page, stories, story, now }),
      // transition && h('div', { class: 'transition' }, Layout(transition)),
    ]),

    node,

    subscriptions: state => [
      subscriptions.routerSub({
        routes,
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

      webComponentEmitter && subscriptions.webComponentAttrChangeSub({
        action: actions.goToIndex,
        emitter: webComponentEmitter,
      }),

      // Doesn't work in web components :(
      // state.transition && subscriptions.animationEndWatcherSub({
      //   selector: '.transition',
      //   action: actions.removeTransition,
      // })
    ],
  });
};
