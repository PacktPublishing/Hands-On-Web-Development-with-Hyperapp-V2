import { app, h } from 'https://unpkg.com/hyperapp@2.0.0-alpha.10?module';
import { story, comment } from './data.js';

const initialState = { stories: [story, story, story], comment };

const Navigation = () => h('nav', { class: '--flex-horizontal' }, [
  h('a', { class: 'logo item --flex-center --no-underline', href: '#' }, 'H'),
  h('a', { class: 'item --no-underline --bold', href: '#' }, 'Hyper News'),
  h('ul', { class: '--flex-horizontal item --extra-margin' }, [
    h('li', null, h('a', { href: '#' }, 'new')),
    h('li', null, h('a', { href: '#' }, 'threads')),
    h('li', null, h('a', { href: '#' }, 'past')),
    h('li', null, h('a', { href: '#' }, 'comments')),
    h('li', null, h('a', { href: '#' }, 'ask')),
    h('li', null, h('a', { href: '#' }, 'show')),
    h('li', null, h('a', { href: '#' }, 'jobs')),
  ]),
]);

const Story = story => h('story', null, [
  h('a', { class: '--no-underline', href: story.url }, story.title),
  ' ',
  h('span', { class: '--small' }, [
    '(',
    h('a', { class: '--light', href: story.url }, story.url),
    ')',
  ]),
  h('ul', { class: '--flex-horizontal --light --block --small' }, [
    h('li', null, [
      `${story.score} points by `,
      h('a', { href: '#' }, story.by),
      ' ',
      h('a', { href: '#' }, story.time),
    ]),
    h('li', null, h('a', { href: '#' }, 'hide')),
    h('li', null, h('a', { href: '#' }, 'discuss')),
  ]),
]);

const Comment = (comment, replies) => h('comment', null, [
  h('attribution', { class: '--small --light' }, [
    h('a', { class: '', href: '#' }, comment.by),
    ' ',
    h('a', { class: '', href: '#' }, comment.time),
    ' ',
    h('button', { class: '--link', type: 'button' }, '[-]'),
  ]),
  h('article', null,
    comment.text
      .split('<p>')
      .map((text) => h('section', null, text))
      .concat(h('replies', null, replies))

  ),
]);

app({
  init: initialState,
  view: ({ stories, comment }) => h('div', null, [

    Navigation(),
    h('ol', null, stories.map(story =>
      h('li', null, Story(story)),
    )),

    Comment(comment, Comment(comment)),

  ]),
  container: document.body,
});
