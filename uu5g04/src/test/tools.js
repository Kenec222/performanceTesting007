import { mount, shallow } from "enzyme";
import React from "react";
import ReactDOM from "react-dom";
import ReactTestUtils from "react-dom/test-utils";

import MixinProps from "./mixin-props.js";

const DEFAULT_TIMEOUT = 100;
let setTimeout = global.setTimeout;
let clearTimeout = global.clearTimeout;

export const cleanupErrorStack = (message, stack) => {
  // remove stacktrace rows containing tools.js & regenerator-runtime so that Jest
  // displays source code portion from which the Tools method has been called.
  let lines = stack.split(/\n/);
  let i = 0;
  while (i < lines.length && !lines[i].match(/^\s*at\s+/)) i++; // skip 1st/few lines (error message)
  let messageLines = lines.slice(0, i);
  while (
    i < lines.length &&
    lines[i].match(
      /(src|uu5g04[/\\]dist[^/\\]*)[/\\]test[/\\][^.]+\.js:|regenerator-runtime|\(<anonymous>\)|node_modules[/\\]jest-mock[/\\]/
    )
  )
    i++;
  return [...messageLines, ...lines.slice(i)].join("\n");
};

function withSnapshotComment(value, comment) {
  let result = { comment, value };
  result[SYMBOL_SNAPSHOT_WITH_COMMENT] = true;
  return result;
}
// !!! Modify both takeSnaphot & takeSnapshotAsync. !!!
function takeSnapshot(component, comment, opt = {}) {
  let wrapper = Tools.shallow(component, opt.shallowOpt);
  let snapshotValue = comment ? withSnapshotComment(wrapper, comment) : wrapper;
  expect(snapshotValue).toMatchSnapshot();
  let snapshotString = toStringSerializer ? toStringSerializer.lastSnapshotString : null;
  return { wrapper, snapshotString };
}
async function takeSnapshotAsync(component, comment, opt = {}) {
  let wrapper = Tools.shallow(component, opt.shallowOpt);
  await Tools.wait();
  let snapshotValue = comment ? withSnapshotComment(wrapper, comment) : wrapper;
  expect(snapshotValue).toMatchSnapshot();
  let snapshotString = toStringSerializer ? toStringSerializer.lastSnapshotString : null;
  return { wrapper, snapshotString };
}
function toSafeJson(value) {
  if (typeof value === "function" && typeof value.toJSON !== "function") return "[Function]";
  try {
    return JSON.stringify(value);
  } catch (e) {
    return value != null ? value + "" : value;
  }
}

let toStringSerializer;
const SYMBOL_SNAPSHOT_STRING = Symbol.for("UU5.Test.Tools.SNAPSHOT_STRING");
const ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX = "UU5.Test.Tools.getSnapshotStringErrorMessage";
class SnapshotToStringSerializer {
  constructor() {
    toStringSerializer = this;
  }
  getSnapshotString(wrapper, opt = {}) {
    let value = { value: wrapper };
    value[SYMBOL_SNAPSHOT_STRING] = true;
    value.preventSnapshotStore = true;
    try {
      expect(value).toMatchSnapshot();
      return "";
    } catch (e) {
      if (!e || !e.message || !e.message.startsWith(ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX)) throw e;
      return e.message.substr(ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX.length);
    }
  }

  print(val, serialize, ...rest) {
    this._nested = true;
    try {
      if (!val || typeof val !== "object" || !(SYMBOL_SNAPSHOT_STRING in val)) {
        val = { value: val, preventSnapshotStore: false };
      }
      let snapshotString = serialize(val.value);
      if (val.preventSnapshotStore) {
        throw new Error(ERROR_MESSAGE_SNAPSHOT_STRING_PREFIX + snapshotString);
      }
      this.lastSnapshotString = snapshotString;
      return snapshotString;
    } finally {
      this._nested = false;
    }
  }
  test(val) {
    return !this._nested;
  }
}

const SYMBOL_SNAPSHOT_WITH_COMMENT = Symbol.for("UU5.Test.Tools.SNAPSHOT_WITH_COMMENT");
class SnapshotCommentSerializer {
  print(val, serialize, ...rest) {
    return `/* ${val.comment} */\n` + serialize(val.value);
  }
  test(val) {
    return val && typeof val === "object" && SYMBOL_SNAPSHOT_WITH_COMMENT in val;
  }
}

const HookOuterComponent = React.forwardRef(({ children, initialHookParams, hook }, ref) => {
  let [hookParams, setHookParams] = React.useState(() => initialHookParams);
  React.useImperativeHandle(ref, () => ({ setHookParams }), []);
  let result = hook(...hookParams);
  // NOTE Using HookInnerComponent to measure render counts of subtrees (hooks are allowed to change their state during render
  // because it results in re-calling of the Component but not of its subtree - we don't want to measure these
  // shallow re-renders).
  // NOTE This also means that we'll collect only "committed" hook results.
  return <HookInnerComponent result={result}>{children}</HookInnerComponent>;
});
const HookInnerComponent = ({ children, result }) => children(result);

// unmount components after each test
let container;
let lastWrapper;
let inTest = false;
export function initTest() {
  afterEach(() => {
    if (lastWrapper && lastWrapper.length === 1) lastWrapper.unmount();
    if (container) ReactDOM.unmountComponentAtNode(container);
    lastWrapper = null;
  });

  beforeEach(() => {
    inTest = true;
  });
  afterEach(() => {
    inTest = false;
  });
}

export const Tools = {
  SnapshotCommentSerializer,
  SnapshotToStringSerializer,

  mount(jsx, options) {
    // NOTE Condition for inTest - UU5.Bricks.Page uses shallow outside of test to get an instance of Page component
    // and to pass it in "parent" prop => use minimal mount/shallow (and don't auto-unmount it)
    if (inTest) {
      if (!container) {
        container = document.createElement("div");
        document.body.appendChild(container);
      } else {
        ReactDOM.unmountComponentAtNode(container);
        lastWrapper = null;
      }
    }
    let wrapper = mount(jsx, { attachTo: container, ...options });
    if (inTest) lastWrapper = wrapper;
    return wrapper;
  },
  shallow(jsx, options) {
    // NOTE Condition for inTest - UU5.Bricks.Page uses shallow outside of test to get an instance of Page component
    // and to pass it in "parent" prop => use minimal mount/shallow (and don't auto-unmount it)
    if (lastWrapper) lastWrapper.unmount();
    let wrapper = shallow(jsx, options);
    if (inTest) lastWrapper = wrapper;
    return wrapper;
  },

  act(fn, { updateWrapper = true } = {}) {
    // call react-dom's act() and update wrapper (if any)
    let originalSyncStack = new Error().stack;
    let actResult = ReactTestUtils.act(() => {
      let fnResult = fn();
      if (fnResult !== undefined && (!fnResult || typeof fnResult.then !== "function")) {
        // enforce proper behaviour (React logs just warning)
        let error = new Error(
          `The callback passed to act(...) function must return undefined, or a Promise. You returned ${fnResult}`
        );
        error.code = "INVALID_ARGUMENTS";
        error.stack = cleanupErrorStack(error.message, originalSyncStack);
        throw error;
      }
      return fnResult;
    });
    if (actResult && typeof actResult.then === "function") {
      // NOTE We don't want to access actResult.then() right away because react-dom has
      // overridden this particular "then" to provide warning in case that no-one is doing "await".
      // (And we don't want to do it via simple Promise.resolve().then(...) because that would enqueue
      // it for processing in the next tick and call "then" automatically.)
      let runPromise = () =>
        new Promise((resolve, reject) => {
          actResult.then(
            (v) => {
              if (updateWrapper && lastWrapper) lastWrapper.update();
              resolve(v);
            },
            (e) => {
              if (updateWrapper && lastWrapper) lastWrapper.update();
              reject(e);
            }
          );
        });
      return {
        then: (onResolve, onReject) => runPromise().then(onResolve, onReject),
        catch: (onReject) => runPromise().catch(onReject),
      };
    } else {
      if (updateWrapper && lastWrapper) lastWrapper.update();
    }
    return actResult;
  },

  renderHook(hook, ...initialHookParams) {
    let { HookComponent, ...result } = Tools.initHookRenderer(hook, ...initialHookParams);
    let wrapper = Tools.mount(<HookComponent />);
    return { wrapper, ...result };
  },

  initHookRenderer(hook, ...initialHookParams) {
    if (typeof hook !== "function") {
      let error = new Error(
        `Invalid value used as a hook: ${hook}. Are you passing hook parameters but forgot to pass the hook?
Example:
  const { lastResult } = renderHook(useLsi, { "cs": "Ahoj", "en": "Hello" });
  const { lastResult } = initHookRenderer(useLsi, { "cs": "Ahoj", "en": "Hello" });`
      );
      error.code = "INVALID_ARGUMENTS";
      error.stack = cleanupErrorStack(error.message, error.stack);
      throw error;
    }
    if (typeof hook.name === "string" && !hook.name.match(/^use[A-Z]/)) {
      let error = new Error(
        `Invalid value used as a hook (hook name must start with 'use' followed by uppercase letter): "${hook.name}". Are you passing hook parameters but forgot to pass the hook?
Example:
  const { lastResult } = renderHook(useLsi, { "cs": "Ahoj", "en": "Hello" });
  const { lastResult } = initHookRenderer(useLsi, { "cs": "Ahoj", "en": "Hello" });`
      );
      error.code = "INVALID_ARGUMENTS";
      error.stack = cleanupErrorStack(error.message, error.stack);
      throw error;
    }
    let hookResults = [];
    let hookOuterComponentRef = React.createRef();
    let HookComponent = ({ children }) => (
      <HookOuterComponent ref={hookOuterComponentRef} initialHookParams={initialHookParams} hook={hook}>
        {(lastHookResult) => {
          hookResults.push(lastHookResult);
          let child;
          if (typeof children === "function") child = children(lastHookResult);
          else if (children !== undefined) child = children;
          else child = <div />;
          return child;
        }}
      </HookOuterComponent>
    );
    return {
      HookComponent,
      lastResult: () => hookResults[hookResults.length - 1],
      allResults: () => [...hookResults],
      renderCount: () => hookResults.length,
      rerender: (...newHookParams) => {
        if (!hookOuterComponentRef.current) {
          throw new Error("Cannot re-render hook component because it wasn't mounted yet (or is already unmounted)!");
        }
        Tools.act(() => hookOuterComponentRef.current.setHookParams(newHookParams));
      },
    };
  },

  async waitUntilCalled(callbackFn, { timeout = DEFAULT_TIMEOUT, updateWrapper = true } = {}) {
    return Tools.waitUntilCalledTimes(callbackFn, 1, { timeout, updateWrapper });
  },

  async waitUntilCalledTimes(callbackFn, times, { timeout = DEFAULT_TIMEOUT, updateWrapper = true } = {}) {
    let originalSyncStack = new Error().stack;
    if (callbackFn.mock) {
      let now = Date.now();
      while (Date.now() - now < timeout) {
        if (callbackFn.mock.calls.length >= times) break;
        await Tools.wait({ timeout: 2, updateWrapper: false });
      }
      if (callbackFn.mock.calls.length < times) {
        let error = new Error(
          `Mock function should have been called ${times} time(s) but was called only ${callbackFn.mock.calls.length} time(s) within specified timeout (${timeout}ms).`
        );
        error.code = "CALL_COUNT_TOO_LOW";
        error.stack = cleanupErrorStack(error.message, originalSyncStack);
        throw error;
      }
    }
    if (updateWrapper && lastWrapper) lastWrapper.update();
  },

  // wait() or wait(100) or wait({ timeout: 100, updateWrapper: true })
  async wait(...args) {
    let timeout, updateWrapper;
    if (typeof args[0] === "number") timeout = args.shift();
    else timeout = (args[0] || {}).timeout || 0;
    ({ updateWrapper = true } = args[0] || {});

    if (timeout >= 0) {
      await Tools.act(() => new Promise((resolve) => setTimeout(resolve, timeout)), { updateWrapper });
    }
  },

  async waitWhile(conditionFn, { timeout = DEFAULT_TIMEOUT, updateWrapper = true } = {}) {
    let originalSyncStack = new Error().stack;
    let now = Date.now();
    while (Date.now() - now < timeout) {
      let lastResult;
      await Tools.act(async () => (lastResult = conditionFn()), { updateWrapper: false });
      if (!(await lastResult)) break;
      await Tools.wait({ timeout: 2, updateWrapper });
    }
    if (Date.now() - now >= timeout) {
      let error = new Error(`Conditional wait did not finish within specified timeout (${timeout}ms).`);
      error.code = "TIMED_OUT";
      error.stack = cleanupErrorStack(error.message, originalSyncStack);
      throw error;
    }
    if (updateWrapper && lastWrapper) lastWrapper.update();
  },

  setInputValue(wrapper, value, focusBeforeSetting = true, blurAfterSetting = true) {
    let input = wrapper.type() === "input" ? wrapper : wrapper.find("input").first();
    if (input && input.length === 1) {
      if (focusBeforeSetting) {
        Tools.act(() => {
          input.simulate("focus");
        });
      }
      input.getDOMNode().value = value;
      Tools.act(() => {
        input.simulate("change");
      });
      if (blurAfterSetting) {
        Tools.act(() => {
          document.body.dispatchEvent(new MouseEvent("mousedown"));
        });
        Tools.act(() => {
          input.simulate("blur");
        });
        Tools.act(() => {
          document.body.dispatchEvent(new MouseEvent("mouseup"));
        });
        Tools.act(() => {
          document.body.dispatchEvent(new MouseEvent("click"));
        });
      }
    } else {
      let error = new Error("Input not found in specified wrapper.");
      error.code = "INPUT_NOT_FOUND";
      error.stack = cleanupErrorStack(error.message, error.stack);
      throw error;
    }
  },

  testProperty(Component, propName, values, requiredProps = null, opt = {}) {
    let originalSyncStack = new Error().stack;
    !Array.isArray(values) && (values = [values]);

    let { skip, wait } = opt;
    values.forEach((value, i) => {
      let testFn = skip ? it.skip : it;
      testFn(`${propName}=${toSafeJson(value)}`, async () => {
        let props = Object.assign({}, requiredProps);
        props[propName] = value;

        // NOTE Distinguishing here so that sync variant is really sync.
        let { wrapper, snapshotString } =
          wait || wait === undefined
            ? await takeSnapshotAsync(<Component id="uuID" {...props} />, null, opt)
            : takeSnapshot(<Component id="uuID" {...props} />, null, opt);

        let nextValue = values[values.length - 1 > i ? i + 1 : i === 0 ? values.length : i - 1];
        if (nextValue === undefined && requiredProps) nextValue = requiredProps[propName];
        if (nextValue !== undefined && nextValue !== value) {
          wrapper.setProps({ [propName]: nextValue });
          if (wait || wait === undefined) await Tools.wait();
          wrapper.setProps({ [propName]: value });
          if (wait || wait === undefined) await Tools.wait();
          let snapshotString2 = toStringSerializer ? toStringSerializer.getSnapshotString(wrapper, opt) : null;
          if (snapshotString2 !== snapshotString) {
            let chainProp = `${propName}=${toSafeJson(value)} --> ${propName}=${toSafeJson(
              nextValue
            )} --> ${propName}=${toSafeJson(value)}`;
            let simpleProp = `${propName}=${toSafeJson(value)}`;
            // TODO Use some diff to show differences.
            let error = new Error(
              `Changing props dynamically from ${chainProp} results in different snapshot than if simply using ${simpleProp}!
/* ${chainProp} */
${snapshotString2}

/* ${simpleProp} */
${snapshotString}`
            );
            error.code = "PROP_CHANGE_PRODUCES_DIFFERENT_SNAPSHOT";
            error.stack = cleanupErrorStack(error.message, originalSyncStack);
            throw error;
          }
        }
      });
    });
  },

  testProperties(Component, config) {
    // guard against most common error
    if (typeof Component === "string") {
      let error = new Error(
        "Invalid arguments to testProperties - 1st argument must be a component class but it is string."
      );
      error.code = "INVALID_ARGUMENTS";
      error.stack = cleanupErrorStack(error.message, error.stack);
      throw error;
    }

    test(`default props`, async () => {
      // NOTE Distinguishing here so that sync variant is really sync.
      if (!config.opt || config.opt.wait === undefined || config.opt.wait) {
        await takeSnapshotAsync(<Component id="uuID" {...config.requiredProps} />, null, config.opt);
      } else {
        takeSnapshot(<Component id="uuID" {...config.requiredProps} />, null, config.opt);
      }
    });

    if (config.mixins) {
      config.mixins.forEach((mixinName) => {
        let mixinProps = MixinProps[mixinName];
        if (mixinProps) {
          for (let propName in mixinProps) {
            if (propName in config.props) continue;
            let requiredProps = { ...config.requiredProps, ...mixinProps[propName].requiredProps };
            Tools.testProperty(Component, propName, mixinProps[propName].values, requiredProps, {
              ...config.opt,
              ...mixinProps[propName].opt,
            });
          }
        }
      });
    }

    for (let propName in config.props) {
      let requiredProps = { ...config.requiredProps, ...config.props[propName].requiredProps };
      Tools.testProperty(Component, propName, config.props[propName].values, requiredProps, {
        ...config.opt,
        ...config.props[propName].opt,
      });
    }
  },
};

export default Tools;
