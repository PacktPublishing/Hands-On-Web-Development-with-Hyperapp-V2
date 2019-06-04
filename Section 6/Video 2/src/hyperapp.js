var RECYCLED_NODE = 1;
var LAZY_NODE = 2;
var TEXT_NODE = 3;
var EMPTY_OBJ = {};
var EMPTY_ARR = [];

var map = EMPTY_ARR.map;
var isArray = Array.isArray;
var defer = requestAnimationFrame || setTimeout;

var createClass = function (obj) {
  var out = "";

  if (typeof obj === "string") return obj;

  if (isArray(obj) && obj.length > 0) {
    for (var k = 0, tmp; k < obj.length; k++) {
      if ((tmp = createClass(obj[k])) !== "") {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (var k in obj) {
      if (obj[k]) {
        out += (out && " ") + k;
      }
    }
  }

  return out;
};

var merge = function (a, b) {
  var out = {};

  for (var k in a) out[k] = a[k];
  for (var k in b) out[k] = b[k];

  return out;
};

var batch = function (list) {
  return list.reduce(function (out, item) {
    return out.concat(
    !item || item === true ?
    false :
    typeof item[0] === "function" ?
    [item] :
    batch(item));

  }, EMPTY_ARR);
};

var isSameAction = function (a, b) {
  return isArray(a) && isArray(b) && a[0] === b[0] && typeof a[0] === "function";
};

var shouldRestart = function (a, b) {
  for (var k in merge(a, b)) {
    if (a[k] !== b[k] && !isSameAction(a[k], b[k])) return true;
    b[k] = a[k];
  }
};

var patchSubs = function (oldSubs, newSubs, dispatch) {
  for (
  var i = 0, oldSub, newSub, subs = [];
  i < oldSubs.length || i < newSubs.length;
  i++)
  {
    oldSub = oldSubs[i];
    newSub = newSubs[i];
    subs.push(
    newSub ?
    !oldSub ||
    newSub[0] !== oldSub[0] ||
    shouldRestart(newSub[1], oldSub[1]) ?
    [
    newSub[0],
    newSub[1],
    newSub[0](dispatch, newSub[1]),
    oldSub && oldSub[2]()] :

    oldSub :
    oldSub && oldSub[2]());

  }
  return subs;
};

var patchProperty = function (node, key, oldValue, newValue, listener, isSvg) {
  if (key === "key") {
  } else if (key === "style") {
    for (var k in merge(oldValue, newValue)) {
      oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
      if (k[0] === "-") {
        node[key].setProperty(k, oldValue);
      } else {
        node[key][k] = oldValue;
      }
    }
  } else if (key[0] === "o" && key[1] === "n") {
    if (
    !((node.actions || (node.actions = {}))[
    key = key.slice(2).toLowerCase()] =
    newValue))
    {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== "list" && key in node) {
    node[key] = newValue == null ? "" : newValue;
  } else if (
  newValue == null ||
  newValue === false ||
  key === "class" && !(newValue = createClass(newValue)))
  {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};

var createNode = function (vnode, listener, isSvg) {
  var node =
  vnode.type === TEXT_NODE ?
  document.createTextNode(vnode.name) :
  (isSvg = isSvg || vnode.name === "svg") ?
  document.createElementNS("http://www.w3.org/2000/svg", vnode.name) :
  document.createElement(vnode.name);
  var props = vnode.props;

  for (var k in props) {
    patchProperty(node, k, null, props[k], listener, isSvg);
  }

  for (var i = 0, len = vnode.children.length; i < len; i++) {
    node.appendChild(
    createNode(
    vnode.children[i] = getVNode(vnode.children[i]),
    listener,
    isSvg));


  }

  return vnode.node = node;
};

var getKey = function (vnode) {
  return vnode == null ? null : vnode.key;
};

var patch = function (parent, node, oldVNode, newVNode, listener, isSvg) {
  if (oldVNode === newVNode) {
  } else if (
  oldVNode != null &&
  oldVNode.type === TEXT_NODE &&
  newVNode.type === TEXT_NODE)
  {
    if (oldVNode.name !== newVNode.name) node.nodeValue = newVNode.name;
  } else if (oldVNode == null || oldVNode.name !== newVNode.name) {
    node = parent.insertBefore(
    createNode(newVNode = getVNode(newVNode), listener, isSvg),
    node);

    if (oldVNode != null) parent.removeChild(oldVNode.node);
  } else {
    var tmpVKid;
    var oldVKid;

    var oldKey;
    var newKey;

    var oldVProps = oldVNode.props;
    var newVProps = newVNode.props;

    var oldVKids = oldVNode.children;
    var newVKids = newVNode.children;

    var oldHead = 0;
    var newHead = 0;
    var oldTail = oldVKids.length - 1;
    var newTail = newVKids.length - 1;

    isSvg = isSvg || newVNode.name === "svg";

    for (var i in merge(oldVProps, newVProps)) {
      if (
      (i === "value" || i === "selected" || i === "checked" ?
      node[i] :
      oldVProps[i]) !== newVProps[i])
      {
        patchProperty(node, i, oldVProps[i], newVProps[i], listener, isSvg);
      }
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
      (oldKey = getKey(oldVKids[oldHead])) == null ||
      oldKey !== getKey(newVKids[newHead]))
      {
        break;
      }

      patch(
      node,
      oldVKids[oldHead].node,
      oldVKids[oldHead],
      newVKids[newHead] = getVNode(
      newVKids[newHead++],
      oldVKids[oldHead++]),

      listener,
      isSvg);

    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
      (oldKey = getKey(oldVKids[oldTail])) == null ||
      oldKey !== getKey(newVKids[newTail]))
      {
        break;
      }

      patch(
      node,
      oldVKids[oldTail].node,
      oldVKids[oldTail],
      newVKids[newTail] = getVNode(
      newVKids[newTail--],
      oldVKids[oldTail--]),

      listener,
      isSvg);

    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
        createNode(
        newVKids[newHead] = getVNode(newVKids[newHead++]),
        listener,
        isSvg),

        (oldVKid = oldVKids[oldHead]) && oldVKid.node);

      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node);
      }
    } else {
      for (var i = oldHead, keyed = {}, newKeyed = {}; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i];
        }
      }

      while (newHead <= newTail) {
        oldKey = getKey(oldVKid = oldVKids[oldHead]);
        newKey = getKey(
        newVKids[newHead] = getVNode(newVKids[newHead], oldVKid));


        if (
        newKeyed[oldKey] ||
        newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue;
        }

        if (newKey == null || oldVNode.type === RECYCLED_NODE) {
          if (oldKey == null) {
            patch(
            node,
            oldVKid && oldVKid.node,
            oldVKid,
            newVKids[newHead],
            listener,
            isSvg);

            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patch(
            node,
            oldVKid.node,
            oldVKid,
            newVKids[newHead],
            listener,
            isSvg);

            newKeyed[newKey] = true;
            oldHead++;
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patch(
              node,
              node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
              tmpVKid,
              newVKids[newHead],
              listener,
              isSvg);

              newKeyed[newKey] = true;
            } else {
              patch(
              node,
              oldVKid && oldVKid.node,
              null,
              newVKids[newHead],
              listener,
              isSvg);

            }
          }
          newHead++;
        }
      }

      while (oldHead <= oldTail) {
        if (getKey(oldVKid = oldVKids[oldHead++]) == null) {
          node.removeChild(oldVKid.node);
        }
      }

      for (var i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node);
        }
      }
    }
  }

  return newVNode.node = node;
};

var propsChanged = function (a, b) {
  for (var k in a) if (a[k] !== b[k]) return true;
  for (var k in b) if (a[k] !== b[k]) return true;
};

var getVNode = function (newVNode, oldVNode) {
  return newVNode.type === LAZY_NODE ? (
  (!oldVNode || propsChanged(oldVNode.lazy, newVNode.lazy)) && (
  (oldVNode = newVNode.lazy.view(newVNode.lazy)).lazy = newVNode.lazy),
  oldVNode) :
  newVNode;
};

var createVNode = function (name, props, children, node, key, type) {
  return {
    name: name,
    props: props,
    children: children,
    node: node,
    type: type,
    key: key };

};

var createTextVNode = function (value, node) {
  return createVNode(value, EMPTY_OBJ, EMPTY_ARR, node, null, TEXT_NODE);
};

var recycleNode = function (node) {
  return node.nodeType === TEXT_NODE ?
  createTextVNode(node.nodeValue, node) :
  createVNode(
  node.nodeName.toLowerCase(),
  EMPTY_OBJ,
  map.call(node.childNodes, recycleNode),
  node,
  null,
  RECYCLED_NODE);

};

export var Lazy = function (props) {
  return {
    lazy: props,
    type: LAZY_NODE };

};

export var h = function (name, props) {
  for (var vnode, rest = [], children = [], i = arguments.length; i-- > 2;) {
    rest.push(arguments[i]);
  }

  while (rest.length > 0) {
    if (isArray(vnode = rest.pop())) {
      for (var i = vnode.length; i-- > 0;) {
        rest.push(vnode[i]);
      }
    } else if (vnode === false || vnode === true || vnode == null) {
    } else {
      children.push(typeof vnode === "object" ? vnode : createTextVNode(vnode));
    }
  }

  props = props || EMPTY_OBJ;

  return typeof name === "function" ?
  name(props, children) :
  createVNode(name, props, children, null, props.key);
};

export var app = function (props, enhance) {
  var state = {};
  var lock = false;
  var view = props.view;
  var node = props.node;
  var vdom = node && recycleNode(node);
  var subscriptions = props.subscriptions;
  var subs = [];

  var listener = function (event) {
    dispatch(this.actions[event.type], event);
  };

  var setState = function (newState) {
    return (
      state === newState || lock || defer(render, lock = true),
      state = newState);

  };

  var dispatch = (enhance ||
  function (any) {
    return any;
  })(function (action, props, obj) {
    return typeof action === "function" ?
    dispatch(action(state, props), obj || props) :
    isArray(action) ?
    typeof action[0] === "function" ?
    dispatch(
    action[0],
    typeof (action = action[1]) === "function" ? action(props) : action,
    props) : (

    batch(action.slice(1)).map(function (fx) {
      fx && fx[0](dispatch, fx[1], props);
    }, setState(action[0])),
    state) :
    setState(action);
  });

  var render = function () {
    lock = false;
    if (subscriptions) {
      subs = patchSubs(subs, batch(subscriptions(state)), dispatch);
    }
    if (view) {
      node = patch(
      node.parentNode,
      node,
      vdom,
      typeof (vdom = view(state)) === "string" ? createTextVNode(vdom) : vdom,
      listener);

    }
  };

  dispatch(props.init);
};