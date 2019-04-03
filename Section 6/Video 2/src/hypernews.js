function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import { app, h, Lazy } from './hyperapp.js';
import * as actions from './actions.js';
import * as subscriptions from './subscriptions.js';

const getFuzzyTime = (unixTime, msNow) => {
  const diff = msNow - unixTime * 1000;
  const increments = [{
    word: 'year(s)',
    incr: 1000 * 60 * 60 * 24 * 365
  }, {
    word: 'month(s)',
    incr: 1000 * 60 * 60 * 24 * 30
  }, {
    word: 'day(s)',
    incr: 1000 * 60 * 60 * 24
  }, {
    word: 'hour(s)',
    incr: 1000 * 60 * 60
  }, {
    word: 'minute(s)',
    incr: 1000 * 60
  }];
  const increment = increments.find(i => diff >= i.incr);
  return increment ? `${Math.floor(diff / increment.incr)} ${increment.word} ago` : 'Just now';
};

export const FuzzyTime = ({
  item,
  now
}) => {
  try {
    return h("span", {
      title: new Date(item.time * 1000).toISOString()
    }, getFuzzyTime(item.time, now || Date.now()));
  } catch (err) {
    console.log('FuzzyTime Error', {
      item
    }, err);
    return null;
  }
};

const NavLink = ({
  url
}, children) => h("li", null, h("a", {
  class: "--link",
  href: `/${url || text}`
}, children));

const Navigation = () => h("nav", {
  class: "--flex-horizontal"
}, h("a", {
  class: "logo item --flex-center --no-underline",
  href: "/"
}, "H"), h("a", {
  class: "item --no-underline --bold",
  href: "/"
}, "Hyper News"), h("ul", {
  class: "--flex-horizontal item --extra-margin"
}, h(NavLink, {
  url: "new"
}, "new"), h(NavLink, {
  url: "top"
}, "top"), h(NavLink, {
  url: "best"
}, "best"), h(NavLink, {
  url: "ask"
}, "ask"), h(NavLink, {
  url: "show"
}, "show"), h(NavLink, {
  url: "job"
}, "jobs")));

const StoryData = ({
  story,
  now,
  showText
}) => {
  const url = story.url || `/story/${story.id}`;
  return h("story", null, h("a", {
    class: "--no-underline",
    href: url
  }, story.title), ' ', story.url && h("span", {
    class: "--small"
  }, "(", h("a", {
    class: "--light",
    href: story.url
  }, story.url), ")"), story.text && showText && h("div", {
    class: "--normal"
  }, story.text.split('<p>').map(text => h("p", null, text))), h("ul", {
    class: "--flex-horizontal --light --block --small --unbreakable"
  }, h("li", null, story.score, " points by", ' ', h("a", {
    href: "#todo"
  }, story.by), ' ', h("a", {
    href: `/story/${story.id}`
  }, h(FuzzyTime, {
    item: story,
    now: now
  }))), h("li", null, h("a", {
    href: "#"
  }, "hide")), h("li", null, h("a", {
    href: `/story/${story.id}`
  }, story.descendants ? `${story.descendants} comments` : 'discussion'))));
};

const StoryShadow = () => h("story", null, h("shadow", {
  style: {
    width: '50%'
  }
}), ' ', h("shadow", {
  class: "--small",
  style: {
    width: '20%',
    borderRadius: '5px',
    borderLeft: '1px black solid',
    borderRight: '1px black solid'
  }
}), h("ul", {
  class: "--flex-horizontal --light --block --small --unbreakable"
}, h("li", null, h("shadow", {
  class: "--small",
  style: {
    width: '200px'
  }
})), h("li", null, h("shadow", {
  class: "--small",
  style: {
    width: '100px'
  }
})), h("li", null, h("shadow", {
  class: "--small",
  style: {
    width: '100px'
  }
}))));

const Story = ({
  story,
  now,
  showText = false
}) => {
  return story.title && story.time ? h(StoryData, {
    story: story,
    now: now,
    showText: showText
  }) : h(StoryShadow, null);
};

const LazyStory = props => h(Lazy, _extends({}, props, {
  view: Story
}));

const CommentData = ({
  comment,
  replies,
  now
}) => {
  const article = comment.collapsed ? [] : (comment.deleted ? ['deleted'] : comment.text.split('<p>').map(text => h("section", null, text))).concat(h("replies", null, replies));
  return h("comment", null, h("attribution", {
    class: "--small --light"
  }, h("a", {
    href: "#"
  }, comment.deleted ? 'deleted' : comment.by), ' ', h("a", {
    href: "#"
  }, h(FuzzyTime, {
    item: comment,
    now: now
  })), ' ', h("button", {
    class: "--link",
    type: "button",
    onclick: [actions.toggleCollapseComment, {
      comment
    }]
  }, comment.collapsed ? '[+]' : '[-]')), h("article", null, article));
};

const CommentShadow = () => h("comment", null, h("attribution", {
  class: "--small --light"
}, h("shadow", {
  class: "--small",
  style: {
    width: '200px'
  }
}), ' ', h("button", {
  class: "--link",
  type: "button"
}, "[-]")), h("article", null, h("p", null, h("shadow", {
  style: {
    width: '350px',
    display: 'block'
  }
})), h("p", null, h("shadow", {
  style: {
    width: '350px',
    display: 'block'
  }
}))));

const Comment = ({
  comment,
  replies,
  now
}) => {
  return comment && comment.time ? h(CommentData, {
    comment: comment,
    replies: replies,
    now: now
  }) : h(CommentShadow, null);
};

const Stories = ({
  stories,
  now
}) => {
  const isLoading = stories.items.some(item => !item.title || !item.time);
  return h("div", null, h("h1", null, stories.type, " stories ", isLoading && h("spinner", null)), h("ol", null, stories.items.map(story => h("li", null, h(LazyStory, {
    story: story,
    now: now
  })))));
};

const Thread = ({
  comment,
  allComments,
  now
}) => {
  const replies = (comment && comment.kids || []).map(id => {
    const child = allComments.find(c => c.id === id);
    return child && h(Thread, {
      comment: child,
      allComments: allComments,
      now: now
    });
  });
  return h(Comment, {
    comment: comment,
    replies: replies,
    now: now
  });
};

const Discussion = ({
  story: {
    item,
    comments
  },
  now
}) => h("div", null, h("storyRoot", null, h(Story, {
  story: item,
  now: now,
  showText: true
}), h("hr", null)), (item.kids || []).map(id => {
  const comment = comments.find(c => c.id === id);
  return comment && h(Thread, {
    comment: comment,
    allComments: comments,
    now: now
  });
}));

const Layout = ({
  page,
  stories,
  story,
  now
}) => h("div", null, h(Navigation, null), h("content", null, page === 'index' ? h(Stories, {
  stories: stories,
  now: now
}) : h(Discussion, {
  story: story || {},
  now: now
})));

export default (() => {
  const routes = {
    '/': actions.goToIndex,
    '/:type': actions.goToIndex,
    '/story/:id': actions.goToShow
  };
  app({
    init: actions.init(),
    view: ({
      page,
      stories,
      story,
      now,
      transition
    }) => h("div", null, h(Layout, {
      page: page,
      stories: stories,
      story: story,
      now: now
    }), transition && h("div", {
      class: "transition"
    }, h(Layout, transition))),
    node: document.getElementById('app'),
    subscriptions: state => [subscriptions.routerSub({
      routes
    }), state.initialized && [state.page === 'index' && [subscriptions.listenToStoryIdsSub({
      type: state.stories.type,
      action: actions.setStories
    }), state.stories.items.map(story => subscriptions.listenToStorySub({
      id: story.id,
      action: actions.updateStory
    }))], state.initialized && state.page === 'show' && [subscriptions.listenToStorySub({
      id: state.story.item.id,
      action: actions.updateStory
    }), (state.story.comments || []).map(comment => subscriptions.listenToCommentSub({
      id: comment.id,
      action: actions.updateShowComments
    }))]], subscriptions.setCurrentTimeSub({
      action: actions.setNow
    }), subscriptions.keyUpResponderSub({
      key: 'r',
      action: actions.clearStorage
    }), state.transition && subscriptions.animationEndWatcherSub({
      selector: '.transition',
      action: actions.removeTransition
    })]
  });
});
