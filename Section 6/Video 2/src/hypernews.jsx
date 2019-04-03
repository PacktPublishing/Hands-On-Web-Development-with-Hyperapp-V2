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

export const FuzzyTime = ({ item, now }) => {
  try {
    return (
      <span title={(new Date(item.time * 1000)).toISOString()}>
        {getFuzzyTime(item.time, now || Date.now())}
      </span>
    );
  } catch (err) {
    console.log('FuzzyTime Error', { item }, err);
    return null;
  }
}

const NavLink = ({ url }, children) => (
  <li>
    <a class="--link" href={`/${url || text }`}>{children}</a>
  </li>
);

const Navigation = () => (
  <nav class="--flex-horizontal">
    <a class="logo item --flex-center --no-underline" href="/">H</a>
    <a class="item --no-underline --bold" href="/">Hyper News</a>
    <ul class="--flex-horizontal item --extra-margin">
      <NavLink url="new">new</NavLink>
      <NavLink url="top">top</NavLink>
      <NavLink url="best">best</NavLink>
      <NavLink url="ask">ask</NavLink>
      <NavLink url="show">show</NavLink>
      <NavLink url="job">jobs</NavLink>
    </ul>
  </nav>
);

const StoryData = ({ story, now, showText }) => {
  const url = story.url || `/story/${story.id}`;

  return (
    <story>
      <a class="--no-underline" href={url}>{story.title}</a>
      {' '}
      {story.url && (
        <span class="--small">
          (<a class="--light" href={story.url}>{story.url}</a>)
        </span>
      )}
      {story.text && showText && (
        <div class="--normal">
          {story.text.split('<p>').map(text => <p>{text}</p>)}
        </div>
      )}
      <ul class="--flex-horizontal --light --block --small --unbreakable">
        <li>
          {story.score} points by
          {' '}
          <a href="#todo">{story.by}</a>
          {' '}
          <a href={`/story/${story.id}`}><FuzzyTime item={story} now={now} /></a>
        </li>
        <li>
          <a href="#">hide</a></li>
        <li>
          <a href={`/story/${story.id}`}>
            {story.descendants ? `${story.descendants} comments` : 'discussion'}
          </a>
        </li>
      </ul>
    </story>
  );
}

const StoryShadow = () => (
  <story>
    <shadow style={{ width: '50%' }} />
    {' '}
    <shadow class="--small" style={{ width: '20%', borderRadius: '5px', borderLeft: '1px black solid', borderRight: '1px black solid' }} />
    <ul class="--flex-horizontal --light --block --small --unbreakable">
      <li><shadow class="--small" style={{ width: '200px' }} /></li>
      <li><shadow class="--small" style={{ width: '100px' }} /></li>
      <li><shadow class="--small" style={{ width: '100px' }} /></li>
    </ul>
  </story>
);

const Story = ({ story, now, showText = false }) => {
  return story.title && story.time
    ? <StoryData story={story} now={now} showText={showText} />
    : <StoryShadow />;
};

const LazyStory = (props) => (
  <Lazy {...props} view={Story} />
);

const CommentData = ({ comment, replies, now }) => {
  const article = comment.collapsed
    ? []
    : (comment.deleted
        ? ['deleted']
        : comment.text.split('<p>').map(text => <section>{text}</section>))
          .concat(<replies>{replies}</replies>);

  return (
    <comment>
      <attribution class="--small --light">
        <a href="#">{comment.deleted ? 'deleted' : comment.by}</a>
        {' '}
        <a href="#"><FuzzyTime item={comment} now={now} /></a>
        {' '}
        <button class="--link" type="button" onclick={[actions.toggleCollapseComment, { comment }]}>
          {comment.collapsed ? '[+]' : '[-]'}
        </button>
      </attribution>
      <article>{article}</article>
    </comment>
  );
};

const CommentShadow = () => (
  <comment>
    <attribution class="--small --light">
      <shadow class="--small" style={{ width: '200px' }} />
      {' '}
      <button class='--link' type="button">[-]</button>
    </attribution>
    <article>
      <p><shadow style={{ width: '350px', display: 'block' }} /></p>
      <p><shadow style={{ width: '350px', display: 'block' }} /></p>
    </article>
  </comment>
);

const Comment = ({ comment, replies, now }) => {
  return comment && comment.time
    ? <CommentData comment={comment} replies={replies} now={now} />
    : <CommentShadow />;
}

const Stories = ({ stories, now }) => {
  const isLoading = stories.items.some(item => !item.title || !item.time);
  return (
    <div>
      <h1>{stories.type} stories {isLoading && <spinner />}</h1>
      <ol>
        {stories.items.map(story => (
          <li><LazyStory story={story} now={now} /></li>
        ))}
      </ol>
    </div>
  );
};

const Thread = ({ comment, allComments, now }) => {
  const replies = (comment && comment.kids || []).map(id => {
    const child = allComments.find(c => c.id === id);
    return child && <Thread comment={child} allComments={allComments} now={now} />;
  });
  return <Comment comment={comment} replies={replies} now={now} />;
};

const Discussion = ({ story: { item, comments }, now }) => (
  <div>
    <storyRoot>
      <Story story={item} now={now} showText={true} />
      <hr />
    </storyRoot>
    {(item.kids || []).map(id => {
      const comment = comments.find(c => c.id === id);
      return comment && (
        <Thread comment={comment} allComments={comments} now={now} />
      );
    })}
  </div>
);

const Layout = ({ page, stories, story, now }) => (
  <div>
    <Navigation />
    <content>
      {page === 'index'
        ? <Stories stories={stories} now={now} />
        : <Discussion story={story || {}} now={now} />
      }
    </content>
  </div>
);


export default () => {
  const routes = {
    '/': actions.goToIndex,
    '/:type': actions.goToIndex,
    '/story/:id': actions.goToShow,
  };

  app({
    init: actions.init(),
    view: ({ page, stories, story, now, transition }) => (
      <div>
        <Layout page={page} stories={stories} story={story} now={now} />
        {transition && <div class="transition"><Layout {...transition} /></div>}
      </div>
    ),

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
      })
    ],
  });
};
