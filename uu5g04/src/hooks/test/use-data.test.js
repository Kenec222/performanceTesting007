import UU5 from "uu5g04";
import { useData } from "uu5g04-hooks";

const { mount, shallow, wait } = UU5.Test.Tools;

// eslint-disable-next-line react/prop-types
function Component({ children, hookArgs }) {
  let result = useData(...hookArgs);
  // NOTE Using Inner to measure render counts of subtrees (hooks are allowed to change their state during render
  // because it results in re-calling of the Component but not of its subtree - we don't want to measure these
  // shallow re-renders).
  return <Inner result={result}>{children}</Inner>;
}
function Inner({ children, result }) {
  return children(result);
}

function mountHook(...hookArgs) {
  let renderFn = jest.fn(() => <div />);
  let wrapper = mount(<Component hookArgs={hookArgs}>{renderFn}</Component>);
  // expect(renderFn.mock.calls.length).toBe(1);
  return {
    lastResult: () => renderFn.mock.calls[renderFn.mock.calls.length - 1][0],
    renderCount: () => renderFn.mock.calls.length,
    changeArgs: (...newArgs) => wrapper.setProps({ hookArgs: newArgs })
  };
}

function mountHookParallelOps(initialData) {
  let waitable = defaultFn => {
    return jest.fn(async (...args) => {
      let lastArg = args.pop();
      if (!lastArg || !lastArg.fn) return defaultFn(...args, lastArg); // this happens for onLoad which is called automatically (without our "startOp().unblock()" stuff)
      await lastArg.promise;
      return lastArg.fn(...args);
    });
  };
  let onLoad = waitable(async () => initialData);
  let onUpdate = waitable();

  let result = mountHook({ onLoad, onUpdate });
  result.onLoad = onLoad;
  result.onUpdate = onUpdate;
  result.startOp = (type, ...args) => {
    let pausingPromiseResolve;
    let pausingPromise = new Promise((resolve, reject) => {
      pausingPromiseResolve = resolve;
    });
    let opFinisherFn = typeof args[args.length - 1] === "function" ? args.pop() : null;
    let typeCapitalized = type.replace(/^./, m => m.toUpperCase());
    let hookValue = result.lastResult();
    hookValue["handle" + typeCapitalized](...args, { promise: pausingPromise, fn: opFinisherFn });
    return {
      async unblock() {
        pausingPromiseResolve();
        await wait();
      }
    };
  };
  return result;
}

const INITIAL_DATA1 = {
  key: "initial1"
};
const LOAD_DATA1 = {
  key: "load1"
};
const LOAD_DATA2 = {
  key: "load2"
};

describe("[uu5g04-hooks] useData behaviour", () => {
  let lastResult, renderCount, changeArgs, startOp;

  it("should return expected result API", () => {
    ({ lastResult } = mountHook());
    expect(lastResult()).toMatchObject({
      syncData: null,
      asyncData: null,
      viewState: "ready",
      errorState: null,
      error: null,
      handleLoad: expect.any(Function),
      handleUpdate: expect.any(Function),
      setData: expect.any(Function)
    });
  });

  it("data; should use initial data", () => {
    ({ lastResult } = mountHook({ data: INITIAL_DATA1 }));
    expect(lastResult()).toMatchObject({
      syncData: INITIAL_DATA1,
      asyncData: INITIAL_DATA1,
      viewState: "ready",
      errorState: null,
      error: null
    });
  });

  it("data; should use initial data without calling onLoad", async () => {
    let onLoad = jest.fn(async () => LOAD_DATA1);
    ({ lastResult } = mountHook({ onLoad, data: INITIAL_DATA1 }));
    expect(lastResult()).toMatchObject({
      syncData: INITIAL_DATA1,
      asyncData: INITIAL_DATA1,
      viewState: "ready",
      errorState: null,
      error: null
    });
    await wait();
    expect(onLoad).toHaveBeenCalledTimes(0);
  });

  it("dtoIn; should pass dtoIn to initial load", async () => {
    let dtoIn = { a: "b" };
    let onLoad = jest.fn(async () => LOAD_DATA1);
    ({ lastResult } = mountHook({ onLoad, dtoIn }));
    await wait();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith(dtoIn);
  });

  it("dtoIn; should pass dtoIn if onLoad changes", async () => {
    let dtoIn = { a: "b" };
    let onLoad1 = jest.fn(async () => LOAD_DATA1);
    let onLoad2 = jest.fn(async () => LOAD_DATA2);
    ({ lastResult, changeArgs } = mountHook({ onLoad: onLoad1, dtoIn }));
    await wait();
    changeArgs({ onLoad: onLoad2, dtoIn });
    await wait();
    expect(onLoad2).toHaveBeenCalledTimes(1);
    expect(onLoad2).toHaveBeenCalledWith(dtoIn);
  });

  it("dtoIn; should reload if dtoIn changes", async () => {
    let dtoIn1 = { a: "b" };
    let dtoIn2 = { a: "c" };
    let onLoad = jest.fn(async () => LOAD_DATA1);
    ({ lastResult, changeArgs } = mountHook({ onLoad, dtoIn: dtoIn1 }));
    await wait();
    changeArgs({ onLoad, dtoIn: dtoIn2 });
    await wait();
    expect(onLoad).toHaveBeenCalledTimes(2);
    expect(onLoad).toHaveBeenLastCalledWith(dtoIn2);
  });

  it("dtoIn; should not reload if dtoIn is deeply same as before", async () => {
    let dtoIn1 = { a: "b" };
    let dtoIn1Copy = { ...dtoIn1 };
    let onLoad = jest.fn(async () => LOAD_DATA1);
    ({ lastResult, changeArgs } = mountHook({ onLoad, dtoIn: dtoIn1 }));
    await wait();
    changeArgs({ onLoad, dtoIn: dtoIn1Copy });
    await wait();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenLastCalledWith(dtoIn1Copy);
  });

  it("dtoIn; should not pass dtoIn to handleLoad loads", async () => {
    let dtoIn = { a: "b" };
    let onLoad = jest.fn(async () => LOAD_DATA1);
    ({ lastResult } = mountHook({ onLoad, dtoIn }));
    await wait();
    lastResult().handleLoad();
    expect(onLoad).toHaveBeenCalledTimes(2);
    expect(onLoad).toHaveBeenLastCalledWith();
  });

  it("onLoad; should update state after onLoad (success)", async () => {
    ({ lastResult, renderCount } = mountHook({ onLoad: jest.fn(async () => LOAD_DATA1) }));
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: LOAD_DATA1,
      asyncData: LOAD_DATA1,
      viewState: "ready",
      errorState: null,
      error: null
    });
  });

  it("onLoad; should update state after onLoad (error)", async () => {
    let error = 123;
    ({ lastResult, renderCount, changeArgs } = mountHook({
      onLoad: jest.fn(async () => {
        throw (error = new Error("Test error"));
      })
    }));
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: null,
      asyncData: null,
      viewState: "error",
      errorState: "load",
      error: error
    });
  });

  it("onLoad; should do reload if onLoad changes && should reset error state", async () => {
    let error = 123;
    ({ lastResult, renderCount, changeArgs } = mountHook({
      onLoad: jest.fn(async () => {
        throw (error = new Error("Test error"));
      })
    }));
    await wait();
    expect(lastResult()).toMatchObject({ error });

    changeArgs({ onLoad: jest.fn(async () => LOAD_DATA2) });
    expect(lastResult()).toMatchObject({ viewState: "load" });
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: LOAD_DATA2,
      asyncData: LOAD_DATA2,
      viewState: "ready",
      errorState: null,
      error: null
    });
  });

  it("handleLoad; should reload (success)", async () => {
    const LOAD_PARAMS = { p: "v" };
    let onLoad = jest.fn();
    onLoad.mockImplementationOnce(async () => LOAD_DATA1);
    onLoad.mockImplementationOnce(async () => LOAD_DATA2);
    ({ lastResult, renderCount } = mountHook({ onLoad }));
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: LOAD_DATA1,
      asyncData: LOAD_DATA1,
      viewState: "ready",
      errorState: null,
      error: null
    });

    let handleLoadResolved;
    lastResult()
      .handleLoad(LOAD_PARAMS)
      .then(() => (handleLoadResolved = true));
    expect(onLoad).toHaveBeenCalledTimes(2);
    expect(onLoad).lastCalledWith(LOAD_PARAMS);
    expect(lastResult()).toMatchObject({
      syncData: LOAD_DATA1,
      asyncData: LOAD_DATA1,
      viewState: "load",
      errorState: null,
      error: null
    });

    await wait(); // finish update
    expect(lastResult()).toMatchObject({
      syncData: LOAD_DATA2,
      asyncData: LOAD_DATA2,
      viewState: "ready",
      errorState: null,
      error: null
    });
    expect(handleLoadResolved).toBe(true);
  });

  it("handleLoad; should pass extra call args to onLoad()", async () => {
    let onLoad = jest.fn(async () => null);
    ({ lastResult, renderCount } = mountHook({ onLoad }));
    await wait();
    lastResult().handleLoad("a", "b", 123, false);
    await wait();
    expect(onLoad).lastCalledWith("a", "b", 123, false);
  });

  it("handleUpdate; should replace data (success)", async () => {
    const UPDATE1 = { key: "updated1" };
    const UPDATE1_FULL = { a: "b" };
    let onUpdate = jest.fn(async () => UPDATE1_FULL);
    ({ lastResult, renderCount, changeArgs } = mountHook({ onUpdate, data: INITIAL_DATA1 }));
    await wait();

    let handleUpdateResolved;
    lastResult()
      .handleUpdate(UPDATE1)
      .then(() => (handleUpdateResolved = true));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(UPDATE1);
    expect(lastResult()).toMatchObject({
      syncData: UPDATE1,
      asyncData: INITIAL_DATA1,
      viewState: "update",
      errorState: null,
      error: null
    });

    await wait(); // finish update
    expect(lastResult()).toMatchObject({
      syncData: UPDATE1_FULL,
      asyncData: UPDATE1_FULL,
      viewState: "ready",
      errorState: null,
      error: null
    });
    expect(handleUpdateResolved).toBe(true);
  });

  it("handleUpdate; should not replace data & should set error state (failure)", async () => {
    const UPDATE1 = { key: "updated1" };
    let error = 123;
    let onUpdate = jest.fn(async () => {
      throw (error = new Error("Test error"));
    });
    ({ lastResult, renderCount, changeArgs } = mountHook({ onUpdate, data: INITIAL_DATA1 }));
    await wait();

    lastResult()
      .handleUpdate(UPDATE1)
      .catch(e => null);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(UPDATE1);
    expect(lastResult()).toMatchObject({
      syncData: UPDATE1,
      asyncData: INITIAL_DATA1
    });

    await wait(); // finish update
    expect(lastResult()).toMatchObject({
      syncData: INITIAL_DATA1,
      asyncData: INITIAL_DATA1,
      viewState: "error",
      errorState: "update",
      error
    });
  });

  it("handleUpdate; should reset error state on success", async () => {
    let error = 123;
    ({ lastResult, renderCount, changeArgs } = mountHook({
      onLoad: jest.fn(async () => {
        throw (error = new Error("Test error"));
      }),
      onUpdate: jest.fn(async value => value)
    }));
    await wait();
    expect(lastResult()).toMatchObject({ viewState: "error", errorState: "load", error });

    lastResult()
      .handleUpdate(123)
      .catch(e => null);
    expect(lastResult()).toMatchObject({ viewState: "update" });
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: 123,
      asyncData: 123,
      viewState: "ready",
      errorState: null,
      error: null
    });
  });

  it("handleUpdate; should pass extra call args to onUpdate()", async () => {
    let onUpdate = jest.fn(async () => null);
    ({ lastResult, renderCount } = mountHook({ onUpdate, data: INITIAL_DATA1 }));
    await wait();
    lastResult().handleUpdate("a", "b", 123, false);
    await wait();
    expect(onUpdate).lastCalledWith("a", "b", 123, false);
  });

  it("setData; should set new data", async () => {
    ({ lastResult, renderCount, changeArgs } = mountHook({ data: INITIAL_DATA1 }));
    await wait();

    lastResult().setData(LOAD_DATA1);
    expect(lastResult()).toMatchObject({
      syncData: LOAD_DATA1,
      asyncData: LOAD_DATA1,
      viewState: "ready",
      errorState: null,
      error: null
    });
  });

  it.skip("parallel operations; should replace data in proper order even if calls resolve out-of-order", async () => {
    let onUpdate;
    ({ lastResult, renderCount, startOp, onUpdate } = mountHookParallelOps(INITIAL_DATA1));
    await wait();
    expect(lastResult()).toMatchObject({ syncData: INITIAL_DATA1, asyncData: INITIAL_DATA1 });

    // start performing "update#1", "update#2" and let them finish in order: "update#2", "update#1"
    let updateOp1 = startOp("update", 123, async () => 123);
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: 123,
      asyncData: INITIAL_DATA1
    });

    // FIXME It is better to
    // a) (optimal) keep it in the order it was supposed to end up, i.e. onUpdate#2 must not be called
    //    until onUpdate#1 finishes to ensure that server/call does processing in the proper order too
    // b) (suboptimal) keep it in the order as it was "processed by server", i.e. if onUpdate#1 finishes after
    //    onUpdate#2 then the end result should be onUpdate#1. This keeps display in sync with server but
    //    the user will have to repeat update#2 as it got overwritten by slower update#1.
    // c) (risky) keep it displayed in the order it was supposed to end up, but without ensuring that
    //    the calls finished in that particular order. This keeps display as it was supposed to be
    //    but can be out of sync with server (i.e. we're displaying that update#2 is what wins but
    //    if update#1 was slower and got processed later then the server will actually have data from update#1 as the latest).
    let updateOp2 = startOp("update", 234, async () => 234);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: 234,
      asyncData: INITIAL_DATA1
    });

    await updateOp2.unblock();
    await updateOp1.unblock();
    expect(lastResult()).toMatchObject({
      syncData: 234,
      asyncData: 234
    });
  });

  it.skip("parallel operations; should wait with update-s until currently running update finishes", async () => {
    let onUpdate;
    ({ lastResult, renderCount, startOp, onUpdate } = mountHookParallelOps(INITIAL_DATA1));
    await wait();

    // start performing "update#1", "update#2", "update#3"
    let updateOp1 = startOp("update", 123, async () => 123);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: 123,
      asyncData: INITIAL_DATA1
    });

    let updateOp2 = startOp("update", 234, async () => 234);
    await wait();
    expect(onUpdate).toHaveBeenCalledTimes(1); // update#2 should not have started executing yet
    expect(lastResult()).toMatchObject({
      syncData: 234,
      asyncData: INITIAL_DATA1
    });

    let updateOp3 = startOp("update", 345, async () => 345);
    expect(onUpdate).toHaveBeenCalledTimes(1); // update#3 should not have started executing yet
    await wait();
    expect(lastResult()).toMatchObject({
      syncData: 345,
      asyncData: INITIAL_DATA1
    });

    await updateOp1.unblock();
    expect(lastResult()).toMatchObject({
      syncData: 345,
      asyncData: 123
    });
    await updateOp2.unblock();
    await updateOp3.unblock();
    expect(onUpdate).toHaveBeenCalledTimes(3); // TODO If we allow skipping of updates (update#2 could have been skipped altogether), this can be 2.
    expect(lastResult()).toMatchObject({
      syncData: 345,
      asyncData: 345
    });
  });
});