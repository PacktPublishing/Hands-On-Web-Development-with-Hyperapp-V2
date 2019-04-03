import { app, h, Lazy } from './hyperapp.js';
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
      {
        title: 'Date Time',
        'data-toggle': 'popover',
        'data-content': (new Date(item.time * 1000)).toISOString(),
      },
      getFuzzyTime(item.time, dateNow),
    );
  } catch (err) {
    console.log('FuzzyTime Error', { item }, err);
    return null;
  }
}

const navLink = (text, url, filter) =>
  h('li', { class: { 'navbar-item': true, active: url === filter } },
    h('a', { class: 'nav-link', href: `/${url || text}` }, text),
  );

const Navigation = (filterType) => (
  h('nav', { class: 'navbar navbar-expand-md navbar-light bg-light sticky-top' }, [
    h('a', { class: 'navbar-brand', href: '/' }, 'Hyper News'),

    h('button', {
      class: 'navbar-toggler',
      type: 'button',
      'aria-controls': 'navbarSypportedContent',
      'aria-expanded': 'false',
      'aria-label': 'Toggle navigation',
      // TODO: These are controlled by jQuery+Bootstrap
      // 'data-toggle': 'collapse',
      // 'data-target': '#navbarSupportedContent',
    }, [
      h('span', { class: 'navbar-toggler-icon' }),
    ]),

    h('div', { class: 'collapse navbar-collapse', id: 'navbarSupportedContent' }, [
      h('ul', { class: 'navbar-nav mr-auto' }, [
        navLink('new', 'new', filterType),
        navLink('top', 'top', filterType),
        navLink('best', 'best', filterType),
        navLink('ask', 'ask', filterType),
        navLink('show', 'show', filterType),
        navLink('jobs', 'job', filterType),
      ]),
    ]),
  ])
);

const StoryMeta = story => (
  h('div', { class: 'mr-2 w-20' }, [
    h('div', { class: 'pr-2' },
      h('h5', { class: 'text-nowrap' }, `${story.score} points`),
    ),
    h('div', { class: 'pr-2' },
      h('a', { class: 'text-nowrap', href: `/story/${story.id}` },
        `${story.descendants} replies`
      ),
    ),
  ])
);

const StoryData = (story, now, showText = false) => {
  const url = story.url || `/story/${story.id}`;
  return h('div', { class: 'd-flex w-100' }, [
    StoryMeta(story),
    h('div', { class: 'flex-grow-1 w-100' }, [
      h('div', { class: 'd-flex w-100 justify-content-between' }, [
        h('a', { href: url, rel: 'nofollow', target: '_blank', class: 'mr-3' },
          h('h4', { class: 'mb-1' }, story.title),
        ),
        h('small', null, [
          FuzzyTime(story, now),
          ` by ${story.by}`
        ]),
      ]),
      story.url && h('small', null, story.url),
      story.text && h('div', null, story.text.split('<p>').map(text => h('p', null, text))),
    ]),
  ]);
};

const StoryShadow = () => {
  return h('div', { class: 'd-flex w-100' }, [
    h('div', { class: 'mr-2 w-20' }, [
      h('div', { class: 'pr-2' },
        h('h5', { class: 'text-nowrap' }, h('shadow', { style: { width: '80%' } })),
      ),
      h('div', { class: 'pr-2' },
        h('shadow', { style: { width: '80%' } })
      ),
    ]),
    h('div', { class: 'flex-grow-1 w-100' }, [
      h('div', { class: 'd-flex w-100 justify-content-between' }, [
        h('shadow', { style: { width: '40%' } }),
        h('small', null, [
          h('shadow', { style: { width: '10%' } })
        ]),
      ]),
      h('shadow', { style: { width: '70%' } })
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

const Spinner = () => h('div', { class: 'spinner-grow', role: 'status' }, [
  h('span', { class: 'sr-only' }, 'Loading...'),
]);

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
      { class: 'list-group list-group-flush' },
      collection.items
        .map(story => h('li', { class: 'list-group-item list-group-item-action' }, LazyStory(story, now)))
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
  Navigation(page === 'index' && stories.type),
  h('content', null, [
    page === 'index'
      ? Stories(stories, now)
      : Discussion(story || {}, now)
  ]),
]);


export default () => {
  const routes = {
    '/': actions.goToIndex,
    '/:type': actions.goToIndex,
    '/story/:id': actions.goToShow,
  };

  app({
    init: actions.init(),
    view: ({ page, stories, story, now, transition }) => h('div', null, [
      Layout({ page, stories, story, now }),
      transition && h('div', { class: 'transition' }, Layout(transition)),
    ]),

    node: document.getElementById('app'),

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

      state.transition && subscriptions.animationEndWatcherSub({
        selector: '.transition',
        action: actions.removeTransition,
      }),

      subscriptions.bootstrapPopoversSub(),
    ],
  });
};
