import {h, app} from 'hyperapp'
/** @jsx h */

/* Subscription for pushstate */
const Push = (() => {
    const sub = (dispatch, { action, routes }) => {
        const clickHandler = (event) => {
            const isAnchor = event.target.matches('a');
            const route = isAnchor && routes[event.target.pathname];
            if (!route) {
                return;
            }

            event.preventDefault();
            history.pushState(null, null, event.target.href);
            dispatch(action, route);
        }

        document.addEventListener('click', clickHandler)

        const popStateHandler = () => {
          const pathname = routes[location.pathname]
              ? location.pathname
              : Object.keys(routes)[0];

          const route = routes[pathname];

          dispatch(action, route);
        };

        window.addEventListener('popstate', popStateHandler)

        popStateHandler();

        return () => {
            document.removeEventListener('click', clickHandler)
            window.removeEventListener('popstate', popStateHandler)
        }
    }
    return (action, routes) => [sub, { action, routes }]
})()

/*
    Reusable menu for routed page
*/
const Menu = () => (
    <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/counter">Counter</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
    </ul>
)


/*
    Reusable page compnent
    adds menu above the content,
*/
const Page = (_, content) => (
    <main>
        <Menu />
        {content}
    </main>
)

/*
    Home page
*/
const Home = () => (
    <Page>
        <h1>Home</h1>
        <p> Welcome to my home page </p>
    </Page>
)

/*
    About page
*/
const About = () => (
    <Page>
        <h1>About</h1>
        <p>Just a fellow surfer on the world wide web</p>
    </Page>
)

/*
    Contact page
*/
const Contact = () => (
    <Page>
        <h1>Contact</h1>
        <p>You can reach me at foo@bar.baz</p>
    </Page>
)


/*
    Page with a counter demo
*/
const Increment = state => ({...state, counter: state.counter + 1})
const Decrement = state => ({...state, counter: state.counter - 1})
const Counter = state => (
    <Page>
        <h1>Counter</h1>
        <p>
            <button onclick={Decrement}>-</button>
            {state.counter}
            <button onclick={Increment}>+</button>
        </p>
    </Page>
)



/*
    Route=>Page mapping
*/
const ROUTES = {
    '/': Home,
    '/about': About,
    '/contact': Contact,
    '/counter': Counter,
}

/*
    Action to be called by the hash-subscription,
    to set the page we want to show.

    For now it's just a simple lookup, but can be
    as advanced as you like.
*/
const HandleRoute = (state, page) => ({...state, page})


/*
    App definition
*/
app({
    subscriptions: state => [Push(HandleRoute, ROUTES)],
    init: {counter: 0},
    view: state => (<body>{state.page(state)}</body>),
    node: document.getElementById('app'),
})
