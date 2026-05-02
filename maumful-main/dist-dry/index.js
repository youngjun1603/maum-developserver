var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context2.finalized === false && onNotFound) {
          res = await onNotFound(context2);
        }
      }
      if (res && (context2.finalized === false || isError)) {
        context2.res = res;
      }
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context2, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context2.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context2, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// src/index.tsx
var app = new Hono2();
app.use("/api/*", cors());
async function logError(db, opts) {
  try {
    await db.prepare(
      `INSERT INTO error_logs (service,status_code,method,path,message,stack,user_id)
       VALUES (?,?,?,?,?,?,?)`
    ).bind(
      opts.service || "maumful",
      opts.status ?? null,
      opts.method ?? null,
      opts.path ?? null,
      opts.message.slice(0, 500),
      (opts.stack ?? "").slice(0, 1e3),
      opts.userId ?? null
    ).run();
    await db.prepare(
      `DELETE FROM error_logs WHERE id NOT IN (SELECT id FROM error_logs ORDER BY created_at DESC LIMIT 500)`
    ).run();
  } catch {
  }
}
__name(logError, "logError");
app.onError(async (err, c) => {
  const db = c.env?.DB;
  if (db) {
    await logError(db, {
      status: 500,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      message: err.message || String(err),
      stack: err.stack
    }).catch(() => {
    });
  }
  console.error("[UnhandledError]", c.req.method, new URL(c.req.url).pathname, err.message);
  return c.json({ success: false, error: "\uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." }, 500);
});
async function checkRateLimit(kv, key, limit, windowSec = 60) {
  const kvKey = `rl:${key}`;
  const now = Math.floor(Date.now() / 1e3);
  const bucket = Math.floor(now / windowSec);
  const fullKey = `${kvKey}:${bucket}`;
  try {
    const raw2 = await kv.get(fullKey);
    const count3 = raw2 ? parseInt(raw2) : 0;
    if (count3 >= limit) return { allowed: false, remaining: 0 };
    kv.put(fullKey, String(count3 + 1), { expirationTtl: windowSec * 2 }).catch(() => {
    });
    return { allowed: true, remaining: limit - count3 - 1 };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
__name(checkRateLimit, "checkRateLimit");
function isAdminIp(c) {
  const allowedIps = c.env.ADMIN_ALLOWED_IPS;
  if (!allowedIps) return true;
  const clientIp = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "";
  return allowedIps.split(",").map((ip) => ip.trim()).includes(clientIp);
}
__name(isAdminIp, "isAdminIp");
async function hashPassword(password) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const buf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 1e5, hash: "SHA-256" },
    key,
    256
  );
  const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:sha256:100000:${salt}:${hash}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, stored) {
  try {
    const [, , iterStr, salt, expected] = stored.split(":");
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
    const buf = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: parseInt(iterStr), hash: "SHA-256" },
      key,
      256
    );
    const actual = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}
__name(verifyPassword, "verifyPassword");
async function signJwt(payload, secret) {
  const toB64 = /* @__PURE__ */ __name((obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"), "toB64");
  const header = toB64({ alg: "HS256", typ: "JWT" });
  const body = toB64(payload);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${header}.${body}.${sigB64}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, secret) {
  try {
    const [header, body, sig] = token.split(".");
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sigB = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", key, sigB, enc.encode(`${header}.${body}`));
    if (!ok) return null;
    const p = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (p.exp && p.exp < Date.now() / 1e3) return null;
    return p;
  } catch {
    return null;
  }
}
__name(verifyJwt, "verifyJwt");
var MASTER_EMAILS = ["limyj007@gmail.com"];
function isMasterAccount(email) {
  return !!email && MASTER_EMAILS.includes(email.toLowerCase());
}
__name(isMasterAccount, "isMasterAccount");
async function getJwtSecret(kv) {
  return await kv.get("JWT_SECRET") ?? "dev_secret_change_in_production";
}
__name(getJwtSecret, "getJwtSecret");
async function getAuthUserId(req, kv) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const secret = await getJwtSecret(kv);
  const payload = await verifyJwt(auth.slice(7), secret);
  if (!payload || typeof payload.sub !== "number") return null;
  return payload.sub;
}
__name(getAuthUserId, "getAuthUserId");
async function spendCredits(db, userId, amount, reason, refId) {
  const result = await db.prepare(
    "UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits >= ?"
  ).bind(amount, userId, amount).run();
  if (!result.meta.changes || result.meta.changes === 0) {
    const user = await db.prepare("SELECT credits FROM users WHERE id = ?").bind(userId).first();
    if (!user) return { ok: false, balance: 0, error: "user_not_found" };
    return { ok: false, balance: user.credits, error: "insufficient_credits" };
  }
  const updated = await db.prepare("SELECT credits FROM users WHERE id = ?").bind(userId).first();
  const newBalance = updated.credits;
  await db.prepare("INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,?,?)").bind(userId, "spend", amount, reason, newBalance, refId ?? null).run();
  return { ok: true, balance: newBalance };
}
__name(spendCredits, "spendCredits");
async function gainCredits(db, userId, amount, reason, refId) {
  await db.prepare(
    "UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(amount, userId).run();
  const updated = await db.prepare("SELECT credits FROM users WHERE id = ?").bind(userId).first();
  const newBalance = updated?.credits ?? 0;
  await db.prepare("INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,?,?)").bind(userId, "gain", amount, reason, newBalance, refId ?? null).run();
  return newBalance;
}
__name(gainCredits, "gainCredits");
async function getAnthropicKey(db, env2) {
  return env2.ANTHROPIC_API_KEY ?? null;
}
__name(getAnthropicKey, "getAnthropicKey");
function getAiModel(env2) {
  return env2.AI_MODEL ?? "claude-sonnet-4-6";
}
__name(getAiModel, "getAiModel");
function randomToken(bytes = 32) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes))).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(randomToken, "randomToken");
app.get("/api/config/region", (c) => {
  const country = (c.req.header("cf-ipcountry") ?? "KR").toUpperCase();
  const lang = (c.req.header("accept-language") ?? "ko").slice(0, 2).toLowerCase();
  const isKorea = country === "KR" || lang === "ko";
  const globalTests = ["PHQ9", "GAD7", "DASS21", "BIG5", "LOST"];
  const koreaTests = ["SCT", "DSI", ...globalTests, "BURNOUT"];
  return c.json({
    country,
    lang: isKorea ? "ko" : "en",
    pg: isKorea ? "toss" : "stripe",
    currency: isKorea ? "KRW" : "USD",
    availableTests: isKorea ? koreaTests : globalTests,
    crisisLine: isKorea ? { label: "\uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654", number: "1393" } : { label: "Crisis Lifeline", number: "988" },
    creditPrices: isKorea ? {
      starter: { credits: 50, amount: 2900 },
      standard: { credits: 120, amount: 5900 },
      premium: { credits: 300, amount: 12900 },
      pro: { credits: 700, amount: 24900 }
    } : {
      starter: { credits: 50, amount: 299 },
      standard: { credits: 120, amount: 599 },
      premium: { credits: 300, amount: 1299 },
      pro: { credits: 700, amount: 2499 }
    }
  });
});
app.post("/api/auth/register", async (c) => {
  const { DB, KV } = c.env;
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(KV, `register:${ip}`, 5, 3600);
  if (!rl.allowed) return c.json({ success: false, error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
  const body = await c.req.json();
  const { email, password, nickname, locale = "ko" } = body;
  if (!email || !password)
    return c.json({ success: false, error: "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB294 \uD544\uC218\uC785\uB2C8\uB2E4." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4." }, 400);
  if (password.length < 8)
    return c.json({ success: false, error: "\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4." }, 400);
  const existing = await DB.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (existing) return c.json({ success: false, error: "\uC774\uBBF8 \uAC00\uC785\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4." }, 409);
  const passwordHash = await hashPassword(password);
  const country = (c.req.header("cf-ipcountry") ?? "KR").toUpperCase();
  const result = await DB.prepare(`
    INSERT INTO users (email, password_hash, nickname, locale, country_code, credits, is_email_verified)
    VALUES (?, ?, ?, ?, ?, 20, 0)
  `).bind(email.toLowerCase(), passwordHash, nickname ?? email.split("@")[0], locale, country).run();
  const userId = result.meta.last_row_id;
  await DB.batch([
    DB.prepare("INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)").bind(userId, "gain", 20, "signup_bonus", 20)
  ]);
  const verifyToken = randomToken();
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1e3).toISOString();
  await DB.prepare(
    "INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(userId, verifyToken, "email_verify", expiresAt).run();
  await sendVerifyEmail(c.env, email.toLowerCase(), nickname ?? email.split("@")[0], verifyToken);
  return c.json({
    success: true,
    message: "\uAC00\uC785 \uC644\uB8CC! \uC774\uBA54\uC77C\uB85C \uBC1C\uC1A1\uB41C \uC778\uC99D \uB9C1\uD06C\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694. (6\uC2DC\uAC04 \uC774\uB0B4)",
    data: { userId, email: email.toLowerCase(), credits: 20, requiresVerification: true }
  }, 201);
});
app.get("/api/auth/verify/:token", async (c) => {
  const { DB } = c.env;
  const token = c.req.param("token");
  const row = await DB.prepare(`
    SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token = ? AND type = 'email_verify'
  `).bind(token).first();
  if (!row) return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC778\uC99D \uB9C1\uD06C\uC785\uB2C8\uB2E4." }, 400);
  if (row.used_at) return c.json({ success: false, error: "\uC774\uBBF8 \uC0AC\uC6A9\uB41C \uC778\uC99D \uB9C1\uD06C\uC785\uB2C8\uB2E4." }, 400);
  if (new Date(row.expires_at) < /* @__PURE__ */ new Date())
    return c.json({ success: false, error: "\uB9CC\uB8CC\uB41C \uB9C1\uD06C\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uC694\uCCAD\uD574\uC8FC\uC138\uC694." }, 400);
  await DB.batch([
    DB.prepare("UPDATE users SET is_email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.user_id),
    DB.prepare("UPDATE auth_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id)
  ]);
  return c.json({ success: true, message: "\uC774\uBA54\uC77C \uC778\uC99D \uC644\uB8CC. \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694." });
});
app.post("/api/auth/login", async (c) => {
  const { DB, KV } = c.env;
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(KV, `login:${ip}`, 10, 60);
  if (!rl.allowed) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uC2DC\uB3C4\uAC00 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
  const { email, password } = await c.req.json();
  if (!email || !password)
    return c.json({ success: false, error: "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." }, 400);
  const user = await DB.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (!user)
    return c.json({ success: false, error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }, 401);
  if (!user.password_hash)
    return c.json({ success: false, error: "\uC18C\uC15C \uB85C\uADF8\uC778 \uACC4\uC815\uC785\uB2C8\uB2E4." }, 401);
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid)
    return c.json({ success: false, error: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }, 401);
  const secret = await getJwtSecret(KV);
  const now = Math.floor(Date.now() / 1e3);
  const accessToken = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret);
  const refreshToken = await signJwt({ sub: user.id, type: "refresh", iat: now, exp: now + 30 * 86400 }, secret);
  await KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 30 * 86400 });
  return c.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits },
      emailVerified: user.is_email_verified === 1
    }
  });
});
app.post("/api/auth/refresh", async (c) => {
  const { KV } = c.env;
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ success: false, error: "refresh token \uD544\uC694" }, 400);
  const secret = await getJwtSecret(KV);
  const payload = await verifyJwt(refreshToken, secret);
  if (!payload || payload.type !== "refresh" || typeof payload.sub !== "number")
    return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD1A0\uD070" }, 401);
  const stored = await KV.get(`refresh:${payload.sub}`);
  if (stored !== refreshToken) return c.json({ success: false, error: "\uB9CC\uB8CC\uB41C \uD1A0\uD070" }, 401);
  const now = Math.floor(Date.now() / 1e3);
  const accessToken = await signJwt({ sub: payload.sub, iat: now, exp: now + 3600 }, secret);
  return c.json({ success: true, data: { accessToken } });
});
app.post("/api/auth/logout", async (c) => {
  const { KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (userId) await KV.delete(`refresh:${userId}`);
  return c.json({ success: true });
});
app.post("/api/auth/resend-verify", async (c) => {
  const { DB, KV } = c.env;
  const { email } = await c.req.json();
  if (!email) return c.json({ success: false, error: "\uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694." }, 400);
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(KV, `resend-verify:${ip}`, 3, 3600);
  if (!rl.allowed) return c.json({ success: false, error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
  const user = await DB.prepare(
    "SELECT id, nickname, is_email_verified FROM users WHERE email = ?"
  ).bind(email.toLowerCase()).first();
  if (!user) return c.json({ success: true, message: "\uC778\uC99D \uBA54\uC77C\uC744 \uBC1C\uC1A1\uD588\uC2B5\uB2C8\uB2E4." });
  if (user.is_email_verified === 1) return c.json({ success: false, error: "\uC774\uBBF8 \uC778\uC99D\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4." }, 400);
  await DB.prepare(
    "UPDATE auth_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND type = 'email_verify' AND used_at IS NULL"
  ).bind(user.id).run();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 6 * 3600 * 1e3).toISOString();
  await DB.prepare("INSERT INTO auth_tokens (user_id, token, type, expires_at) VALUES (?,?,?,?)").bind(user.id, token, "email_verify", expiresAt).run();
  await sendVerifyEmail(c.env, email.toLowerCase(), user.nickname || "", token);
  return c.json({ success: true, message: "\uC778\uC99D \uBA54\uC77C\uC744 \uBC1C\uC1A1\uD588\uC2B5\uB2C8\uB2E4. \uBC1B\uC740 \uD3B8\uC9C0\uD568\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694." });
});
app.post("/api/auth/google", async (c) => {
  const { DB, KV } = c.env;
  const { idToken } = await c.req.json();
  if (!idToken) return c.json({ success: false, error: "idToken \uD544\uC694" }, 400);
  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!verifyRes.ok) return c.json({ success: false, error: "\uAD6C\uAE00 \uD1A0\uD070 \uAC80\uC99D \uC2E4\uD328" }, 401);
  const info3 = await verifyRes.json();
  let user = await DB.prepare("SELECT * FROM users WHERE social_provider = ? AND social_id = ?").bind("google", info3.sub).first();
  if (!user) {
    const existing = await DB.prepare("SELECT * FROM users WHERE email = ?").bind(info3.email.toLowerCase()).first();
    if (existing) {
      await DB.prepare("UPDATE users SET social_provider=?,social_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind("google", info3.sub, existing.id).run();
      user = { ...existing, social_provider: "google", social_id: info3.sub };
    } else {
      const country = (c.req.header("cf-ipcountry") ?? "KR").toUpperCase();
      const r = await DB.prepare(
        "INSERT INTO users (email,social_provider,social_id,nickname,locale,country_code,is_email_verified,credits) VALUES (?,?,?,?,?,?,1,20)"
      ).bind(info3.email.toLowerCase(), "google", info3.sub, info3.name ?? info3.email.split("@")[0], "ko", country).run();
      const newId = r.meta.last_row_id;
      await DB.batch([
        DB.prepare("INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) VALUES (?,?,?,?,?)").bind(newId, "gain", 20, "signup_bonus", 20)
      ]);
      user = await DB.prepare("SELECT * FROM users WHERE id = ?").bind(newId).first();
    }
  }
  const secret = await getJwtSecret(KV);
  const now = Math.floor(Date.now() / 1e3);
  const accessToken = await signJwt({ sub: user.id, email: user.email, iat: now, exp: now + 3600 }, secret);
  const refreshToken = await signJwt({ sub: user.id, type: "refresh", iat: now, exp: now + 30 * 86400 }, secret);
  await KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 30 * 86400 });
  return c.json({ success: true, data: { accessToken, refreshToken, user: { id: user.id, email: user.email, nickname: user.nickname, locale: user.locale, credits: user.credits } } });
});
app.post("/api/auth/forgot-password", async (c) => {
  const { DB, KV } = c.env;
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(KV, `forgot-pw:${ip}`, 3, 3600);
  if (!rl.allowed) return c.json({ success: false, error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
  const { email } = await c.req.json();
  if (!email) return c.json({ success: false, error: "\uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694." }, 400);
  const user = await DB.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (!user) return c.json({ success: true, message: "\uC774\uBA54\uC77C\uC774 \uC874\uC7AC\uD558\uBA74 \uC7AC\uC124\uC815 \uB9C1\uD06C\uB97C \uBC1C\uC1A1\uD569\uB2C8\uB2E4." });
  const resetToken = randomToken();
  const expiresAt = new Date(Date.now() + 3600 * 1e3).toISOString();
  await DB.prepare("INSERT INTO auth_tokens (user_id,token,type,expires_at) VALUES (?,?,?,?)").bind(user.id, resetToken, "pw_reset", expiresAt).run();
  const userForEmail = await DB.prepare("SELECT nickname FROM users WHERE id=?").bind(user.id).first();
  sendPasswordResetEmail(c.env, email.toLowerCase(), userForEmail?.nickname || "", resetToken).catch((e) => console.error("[ForgotPw] \uBA54\uC77C \uBC1C\uC1A1 \uC2E4\uD328:", e));
  return c.json({
    success: true,
    message: "\uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815 \uB9C1\uD06C\uB97C \uBC1C\uC1A1\uD588\uC2B5\uB2C8\uB2E4.",
    ...!c.env.RESEND_API_KEY ? { _dev: { resetToken } } : {}
  });
});
app.post("/api/auth/reset-password", async (c) => {
  const { DB, KV } = c.env;
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(KV, `reset-pw:${ip}`, 5, 3600);
  if (!rl.allowed) return c.json({ success: false, error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
  const { token, newPassword } = await c.req.json();
  if (!token || !newPassword) return c.json({ success: false, error: "\uD1A0\uD070\uACFC \uC0C8 \uBE44\uBC00\uBC88\uD638\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }, 400);
  if (newPassword.length < 8) return c.json({ success: false, error: "\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4." }, 400);
  const row = await DB.prepare(`
    SELECT id, user_id, expires_at, used_at FROM auth_tokens WHERE token = ? AND type = 'pw_reset'
  `).bind(token).first();
  if (!row || row.used_at || new Date(row.expires_at) < /* @__PURE__ */ new Date())
    return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uB9C1\uD06C\uC785\uB2C8\uB2E4." }, 400);
  const newHash = await hashPassword(newPassword);
  await DB.batch([
    DB.prepare("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(newHash, row.user_id),
    DB.prepare("UPDATE auth_tokens SET used_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id)
  ]);
  return c.json({ success: true, message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694." });
});
app.post("/api/auth/change-password", async (c) => {
  const { DB, KV } = c.env;
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(KV, `change-pw:${ip}`, 5, 3600);
  if (!rl.allowed) return c.json({ success: false, error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const { currentPassword, newPassword } = await c.req.json().catch(() => ({}));
  if (!currentPassword || !newPassword)
    return c.json({ success: false, error: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uC640 \uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." }, 400);
  if (newPassword.length < 8)
    return c.json({ success: false, error: "\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4." }, 400);
  const user = await DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(userId).first();
  if (!user?.password_hash)
    return c.json({ success: false, error: "\uC18C\uC15C \uB85C\uADF8\uC778 \uACC4\uC815\uC740 \uBE44\uBC00\uBC88\uD638\uB97C \uBCC0\uACBD\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 400);
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid)
    return c.json({ success: false, error: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }, 401);
  const newHash = await hashPassword(newPassword);
  await DB.prepare("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(newHash, userId).run();
  return c.json({ success: true, message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
});
app.get("/api/user/me", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const user = await DB.prepare(
    "SELECT id,email,nickname,locale,country_code,credits,is_email_verified,social_provider,created_at FROM users WHERE id=?"
  ).bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  return c.json({ success: true, data: user });
});
app.get("/api/user/credits", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const user = await DB.prepare("SELECT credits FROM users WHERE id=?").bind(userId).first();
  const txns = await DB.prepare(`
    SELECT ct.type, ct.amount, ct.reason, ct.balance_after, ct.created_at, ct.ref_id,
           cc.amount AS pg_amount, cc.currency AS pg_currency
    FROM credit_transactions ct
    LEFT JOIN credit_charges cc ON ct.ref_id = cc.pg_tid AND ct.reason = 'charge'
    WHERE ct.user_id = ?
    ORDER BY ct.created_at DESC
    LIMIT 50
  `).bind(userId).all();
  return c.json({ success: true, data: { balance: user?.credits ?? 0, transactions: txns.results } });
});
app.patch("/api/user/me", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const { nickname, locale } = await c.req.json();
  const sets = [];
  const vals = [];
  if (nickname) {
    sets.push("nickname=?");
    vals.push(nickname);
  }
  if (locale && ["ko", "en"].includes(locale)) {
    sets.push("locale=?");
    vals.push(locale);
  }
  if (!sets.length) return c.json({ success: false, error: "\uBCC0\uACBD \uD56D\uBAA9 \uC5C6\uC74C" }, 400);
  sets.push("updated_at=CURRENT_TIMESTAMP");
  vals.push(userId);
  await DB.prepare(`UPDATE users SET ${sets.join(",")} WHERE id=?`).bind(...vals).run();
  return c.json({ success: true });
});
app.delete("/api/user/me", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  await DB.prepare(`
    UPDATE users SET
      email='deleted_'||id||'@deleted.local',
      password_hash=NULL, social_provider=NULL, social_id=NULL,
      nickname='\uD0C8\uD1F4 \uD68C\uC6D0', email_verify_token=NULL,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(userId).run();
  await KV.delete(`refresh:${userId}`);
  return c.json({ success: true, message: "\uD0C8\uD1F4 \uC644\uB8CC" });
});
var FREE_TESTS_SERVER = ["PHQ9", "GAD7"];
app.post("/api/test/start", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const { testType, lang = "ko" } = await c.req.json();
  if (!testType) return c.json({ success: false, error: "testType \uD544\uC694" }, 400);
  const userRow = await DB.prepare("SELECT email, credits FROM users WHERE id=?").bind(userId).first();
  if (FREE_TESTS_SERVER.includes(testType) || isMasterAccount(userRow?.email)) {
    DB.prepare("INSERT INTO test_history (user_id,test_type,lang,credits_spent) VALUES (?,?,?,?)").bind(userId, testType, lang, 0).run().catch(() => {
    });
    return c.json({ success: true, data: { testType, creditsSpent: 0, balance: userRow?.credits ?? 0, isFree: true } });
  }
  const COST = 10;
  const result = await spendCredits(DB, userId, COST, "test");
  if (!result.ok) {
    return c.json({
      success: false,
      error: result.error === "insufficient_credits" ? `\uD06C\uB808\uB527 \uBD80\uC871 (\uBCF4\uC720: ${result.balance}, \uD544\uC694: ${COST})` : "\uC624\uB958 \uBC1C\uC0DD",
      balance: result.balance,
      needsCharge: true
    }, 402);
  }
  DB.prepare("INSERT INTO test_history (user_id,test_type,lang,credits_spent) VALUES (?,?,?,?)").bind(userId, testType, lang, COST).run().catch(() => {
  });
  return c.json({ success: true, data: { testType, creditsSpent: COST, balance: result.balance, isFree: false } });
});
app.get("/api/test/history", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const h = await DB.prepare(
    "SELECT test_type,lang,credits_spent,performed_at,score,level FROM test_history WHERE user_id=? ORDER BY performed_at DESC LIMIT 50"
  ).bind(userId).all();
  return c.json({ success: true, data: h.results });
});
app.post("/api/test/save-score", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const { test_type, score, level } = await c.req.json().catch(() => ({}));
  if (!test_type || score === void 0) return c.json({ success: false, error: "\uD30C\uB77C\uBBF8\uD130 \uBD80\uC871" }, 400);
  await DB.prepare(
    `UPDATE test_history SET score=?, level=?
     WHERE id=(SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1)`
  ).bind(score, level ?? null, userId, test_type).run();
  return c.json({ success: true });
});
function buildAnalysisPrompt(req) {
  const lang = req.lang ?? "ko";
  const isBiblical = req.counselingType === "biblical";
  const r = req.responses;
  const sysKo = isBiblical ? "\uB2F9\uC2E0\uC740 \uAE30\uB3C5\uAD50 \uC0C1\uB2F4\uC0AC\uC785\uB2C8\uB2E4. \uC131\uACBD \uB9D0\uC500\uACFC \uB530\uB73B\uD55C \uC2E0\uC559\uC801 \uACF5\uAC10\uC73C\uB85C \uB0B4\uB2F4\uC790\uC758 \uB9C8\uC74C\uC744 \uC0B4\uD54D\uB2C8\uB2E4. \uC9C4\uB2E8\uC801 \uD45C\uD604\uC740 \uC808\uB300 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC138\uC694." : "\uB2F9\uC2E0\uC740 \uB9C8\uC74C\uD480\uC758 \uC2EC\uB9AC \uC548\uB0B4\uC790\uC785\uB2C8\uB2E4. \uD310\uB2E8 \uC5C6\uC774 \uB0B4\uB2F4\uC790\uC758 \uB9C8\uC74C\uC744 \uAD00\uCC30\uD558\uACE0, \uC0C1\uB2F4\uC0AC\uAC00 \uD65C\uC6A9\uD560 \uC218 \uC788\uB294 \uB530\uB73B\uD55C \uD1B5\uCC30\uC744 \uC81C\uACF5\uD569\uB2C8\uB2E4. \uC784\uC0C1\uC801\xB7\uC9C4\uB2E8\uC801 \uD45C\uD604\uC740 \uC808\uB300 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC138\uC694.";
  const sysEn = "You are a compassionate psychological guide. Observe without judgment and provide warm insights. Never use clinical diagnostic language.";
  const ctx = lang === "ko" ? sysKo : sysEn;
  const psychFormat = `
\uC544\uB798 4\uAC1C \uC139\uC158\uB9CC \uC791\uC131\uD574 \uC8FC\uC138\uC694. \uC784\uC0C1 \uC9C4\uB2E8\uBA85\xB7\uBCD1\uBA85\uC740 \uC808\uB300 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC138\uC694.

[\uD604\uC7AC \uC0C1\uD0DC \uC694\uC57D]
\uD310\uB2E8 \uC5C6\uC774 \uAD00\uCC30\uB85C\uB9CC 1~2\uBB38\uC7A5. "~\uCC98\uB7FC \uBCF4\uC785\uB2C8\uB2E4", "~\uACBD\uD5A5\uC774 \uB098\uD0C0\uB0A9\uB2C8\uB2E4" \uAC19\uC740 \uD45C\uD604 \uC0AC\uC6A9.

[\uB208\uC5D0 \uB744\uB294 \uC751\uB2F5]
\uC810\uC218\uAC00 \uB192\uAC70\uB098 \uC8FC\uBAA9\uD560 \uC751\uB2F5 2~3\uAC00\uC9C0\uB97C \uAC04\uACB0\uD558\uAC8C \uB098\uC5F4\uD558\uACE0, \uB9C8\uC9C0\uB9C9\uC5D0 "\uC774 \uBD80\uBD84\uC744 \uC880 \uB354 \uC5EC\uCB64\uBCF4\uC2DC\uBA74 \uC88B\uC744 \uAC83 \uAC19\uC2B5\uB2C8\uB2E4" \uD55C \uBB38\uC7A5 \uCD94\uAC00.

[\uC0C1\uB2F4 \uC2DC \uCC38\uACE0 \uD3EC\uC778\uD2B8]
- \uB300\uD654 \uC2DC\uC791 \uC9C8\uBB38: \uB9C8\uC74C\uC744 \uC5F4 \uC218 \uC788\uB294 \uC5F4\uB9B0 \uC9C8\uBB38 2\uAC1C (\uC608\uC2DC \uD615\uC2DD\uC73C\uB85C \uC791\uC131)
- \uC8FC\uC758 \uAE4A\uAC8C \uC0B4\uD3B4\uBCFC \uBD80\uBD84: \uB193\uCE58\uAE30 \uC26C\uC6B4 \uC2E0\uD638\uB098 \uB9E5\uB77D 1~2\uAC00\uC9C0

[\uC77C\uC0C1 \uC81C\uC548]
\uBD80\uB2F4 \uC5C6\uC774 \uC2E4\uCC9C \uAC00\uB2A5\uD55C \uC791\uC740 \uAC83 1~2\uAC00\uC9C0. \uCE58\uB8CC\uB098 \uC57D\uBB3C \uC5B8\uAE09 \uAE08\uC9C0.`;
  const biblicalFormat = `
\uC544\uB798 4\uAC1C \uC139\uC158\uB9CC \uC791\uC131\uD574 \uC8FC\uC138\uC694. \uB530\uB73B\uD558\uACE0 \uC2E0\uC559\uC801\uC778 \uC5B8\uC5B4\uB97C \uC0AC\uC6A9\uD558\uC138\uC694.

[\uB9C8\uC74C \uC0B4\uD53C\uAE30]
\uACF5\uAC10\uC801\uC73C\uB85C \uB9C8\uC74C \uC0C1\uD0DC 1~2\uBB38\uC7A5. \uD310\uB2E8 \uC5C6\uC774 \uB0B4\uB2F4\uC790\uC758 \uAC10\uC815\uC744 \uBC18\uC601.

[\uB9D0\uC500 \uBB35\uC0C1]
- \uC5F0\uACB0 \uB9D0\uC500: \uAD6C\uC808 \uC804\uBB38 (\uCC45\uBA85 \uC7A5:\uC808 \uD615\uC2DD)
- \uB9D0\uC500 \uC758\uBBF8: \uC774 \uAD6C\uC808\uC774 \uB0B4\uB2F4\uC790 \uC0C1\uD669\uC5D0 \uC8FC\uB294 \uC704\uB85C 2~3\uBB38\uC7A5
- \uC0C1\uB2F4 \uC5F0\uACB0: \uC0C1\uB2F4\uC0AC\uAC00 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uAEBC\uB0BC \uBC29\uBC95 \uD55C \uBB38\uC7A5

[\uC0C1\uB2F4 \uB098\uB214 \uD3EC\uC778\uD2B8]
- \uB300\uD654 \uC8FC\uC81C: \uC2E0\uC559\uACFC \uC5F0\uACB0\uB41C \uC5F4\uB9B0 \uC9C8\uBB38 2\uAC00\uC9C0
- \uD568\uAED8 \uAE30\uB3C4\uD560 \uBC29\uD5A5: \uAE30\uB3C4 \uC81C\uBAA9 1~2\uAC00\uC9C0

[\uC18C\uB9DD\uC758 \uD55C\uB9C8\uB514]
\uACA9\uB824\uC640 \uC131\uACBD\uC801 \uC18C\uB9DD\uC744 \uB2F4\uC740 \uD55C \uBB38\uC7A5.`;
  const fmt = isBiblical ? biblicalFormat : psychFormat;
  const NL = "\n";
  if (req.testType === "PHQ9") {
    const total = r.total;
    const level = r.level;
    const items = r.items ?? [];
    const formatted = items.map((item, idx) => idx + 1 + ". " + item.question + ": " + item.score + "\uC810").join(NL);
    if (lang === "ko") return ctx + NL + NL + "PHQ-9 \uC6B0\uC6B8 \uC790\uAC00\uC810\uAC80 \uACB0\uACFC" + NL + "\uCD1D\uC810: " + total + "/27 (" + level + ")" + NL + NL + "\uBB38\uD56D\uBCC4 \uC751\uB2F5:" + NL + formatted + NL + fmt;
    return ctx + NL + NL + "PHQ-9 Result \u2014 Total: " + total + "/27 (" + level + ")" + NL + formatted + NL + NL + "[Summary][Notable Responses][Counseling Points][Daily Suggestions]";
  }
  if (req.testType === "GAD7") {
    const total = r.total;
    const level = r.level;
    const items = r.items ?? [];
    const formatted = items.map((item, idx) => idx + 1 + ". " + item.question + ": " + item.score + "\uC810").join(NL);
    if (lang === "ko") return ctx + NL + NL + "GAD-7 \uBD88\uC548 \uC790\uAC00\uC810\uAC80 \uACB0\uACFC" + NL + "\uCD1D\uC810: " + total + "/21 (" + level + ")" + NL + NL + "\uBB38\uD56D\uBCC4 \uC751\uB2F5:" + NL + formatted + NL + fmt;
    return ctx + NL + NL + "GAD-7 Result \u2014 Total: " + total + "/21 (" + level + ")" + NL + formatted + NL + NL + "[Summary][Notable Responses][Counseling Points][Daily Suggestions]";
  }
  if (req.testType === "DASS21") {
    const dep = r.depression;
    const anx = r.anxiety;
    const str = r.stress;
    if (lang === "ko") return ctx + NL + NL + "DASS-21 \uACB0\uACFC" + NL + "\uC6B0\uC6B8: " + dep?.score + "\uC810 (" + dep?.level + ") \xB7 \uBD88\uC548: " + anx?.score + "\uC810 (" + anx?.level + ") \xB7 \uC2A4\uD2B8\uB808\uC2A4: " + str?.score + "\uC810 (" + str?.level + ")" + NL + fmt;
    return ctx + NL + NL + "DASS-21" + NL + "Depression: " + dep?.score + " (" + dep?.level + ") \xB7 Anxiety: " + anx?.score + " (" + anx?.level + ") \xB7 Stress: " + str?.score + " (" + str?.level + ")" + NL + "[Summary][Notable][Counseling Points][Daily Suggestions]";
  }
  if (req.testType === "BIG5") {
    const factors = r.factors;
    const formatted = Object.entries(factors ?? {}).map(([k, v]) => k + ": " + v + "/5").join(NL);
    if (lang === "ko") return ctx + NL + NL + "Big5 \uC131\uACA9\uAC80\uC0AC \uACB0\uACFC" + NL + formatted + NL + fmt;
    return ctx + NL + NL + "Big Five Personality" + NL + formatted + NL + "[Summary][Notable][Counseling Points][Daily Suggestions]";
  }
  if (req.testType === "LOST") {
    const typeCode = r.typeCode;
    const typeName = r.typeName;
    const axisAvg = r.axisAvg;
    const axisText = Object.entries(axisAvg ?? {}).map(([k, v]) => k + ": " + Number(v).toFixed(2)).join(NL);
    if (lang === "ko") return ctx + NL + NL + "LOST \uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4 \uAC80\uC0AC" + NL + "\uC720\uD615: " + typeCode + " (" + typeName + ")" + NL + NL + "\uCD95\uBCC4 \uC810\uC218:" + NL + axisText + NL + fmt;
    return ctx + NL + NL + "LOST Assessment" + NL + "Type: " + typeCode + " (" + typeName + ")" + NL + axisText + NL + "[Summary][Notable][Counseling Points][Daily Suggestions]";
  }
  if (req.testType === "SCT") {
    const sample = r.completionSample ?? [];
    const sampleText = sample.map((s, i) => "[" + s.scale + "] " + s.prompt + " \u2192 " + s.answer).join(NL);
    return ctx + NL + NL + "SRCI \uC790\uAE30\uBC18\uC751 \uC644\uC131 \uAC80\uC0AC \uACB0\uACFC (\uBB38\uC7A5\uC644\uC131\uD615 25\uBB38\uD56D)" + NL + NL + "\uC18C\uCC99\uB3C4\uBCC4 \uC751\uB2F5 \uC608\uC2DC:" + NL + sampleText + NL + fmt;
  }
  if (req.testType === "DSI") {
    const scales = r.scales ?? {};
    const total = r.total ?? 0;
    const scaleText = Object.entries(scales).map(([k, v]) => k + ": " + v + "\uC810").join(NL);
    return ctx + NL + NL + "SDRI \uC790\uAE30\uBD84\uD654 \uBC18\uC751\uC131 \uAC80\uC0AC \uACB0\uACFC" + NL + "\uCD1D\uC810: " + total + "\uC810" + NL + NL + "\uC18C\uCC99\uB3C4\uBCC4 \uC810\uC218:" + NL + scaleText + NL + fmt;
  }
  if (req.testType === "BURNOUT") {
    const totalScore = r.totalScore;
    const level = r.level;
    const domains = r.domains;
    const domainText = (domains ?? []).map((d) => d.name + ": " + d.score + "/" + d.max + " (" + d.percentage + "%) - " + d.level).join(NL);
    return ctx + NL + NL + "K-MBI+ \uC18C\uC9C4 \uC790\uAC00\uC810\uAC80 \uACB0\uACFC" + NL + "\uC804\uCCB4 \uC18C\uC9C4 \uC9C0\uC218: " + totalScore + "/240 (" + level + ")" + NL + NL + "\uC601\uC5ED\uBCC4 \uACB0\uACFC:" + NL + domainText + NL + fmt;
  }
  return ctx + NL + NL + "\uAC80\uC0AC: " + req.testType + NL + "\uACB0\uACFC: " + JSON.stringify(r, null, 2) + NL + fmt;
}
__name(buildAnalysisPrompt, "buildAnalysisPrompt");
app.post("/api/ai-analyze", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const analyzeUser = await DB.prepare("SELECT email FROM users WHERE id=?").bind(userId).first();
  if (!isMasterAccount(analyzeUser?.email)) {
    const rl = await checkRateLimit(KV, `analyze:${userId}`, 10, 60);
    if (!rl.allowed) return c.json({ error: "\uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
  }
  const apiKey = await getAnthropicKey(DB, c.env);
  if (!apiKey) return c.json({ error: "API \uD0A4 \uBBF8\uC124\uC815" }, 500);
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "\uC798\uBABB\uB41C \uC694\uCCAD" }, 400);
  }
  const prompt = buildAnalysisPrompt(body);
  const ANALYZE_FALLBACKS = [
    getAiModel(c.env),
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6"
  ];
  let upstream;
  let analyzedModel = ANALYZE_FALLBACKS[0];
  for (const model of [...new Set(ANALYZE_FALLBACKS)]) {
    upstream = await fetch("https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1500, stream: true, messages: [{ role: "user", content: prompt }] })
    });
    if (upstream.ok || upstream.status !== 404 && upstream.status !== 403) {
      analyzedModel = model;
      break;
    }
    analyzedModel = model;
  }
  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => "");
    console.error("[ai-analyze] Anthropic error:", upstream.status, analyzedModel, errBody.slice(0, 300));
    return c.json({ error: `AI \uC11C\uBE44\uC2A4 \uC624\uB958 (${upstream.status}, \uBAA8\uB378: ${analyzedModel})`, detail: errBody.slice(0, 500) }, 502);
  }
  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  return new Response(upstream.body, { headers: sseHeaders });
});
app.get("/api/game-token", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const secret = await getJwtSecret(KV);
  const now = Math.floor(Date.now() / 1e3);
  const gameToken = await signJwt(
    { sub: userId, type: "game", iat: now, exp: now + 7 * 86400 },
    secret
  );
  return c.json({ success: true, gameToken });
});
app.get("/api/couple-token", async (c) => {
  const { KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const secret = await getJwtSecret(KV);
  const now = Math.floor(Date.now() / 1e3);
  const coupleToken = await signJwt(
    { sub: userId, type: "couple", iat: now, exp: now + 7 * 86400 },
    secret
  );
  return c.json({ success: true, coupleToken });
});
app.post("/api/test/save-result", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const { test_type, result_json } = await c.req.json().catch(() => ({}));
  if (!test_type || !result_json) return c.json({ error: "\uD30C\uB77C\uBBF8\uD130 \uBD80\uC871" }, 400);
  if (!["BIG5", "LOST", "DSI"].includes(test_type)) return c.json({ error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC720\uD615" }, 400);
  const resultStr = JSON.stringify(result_json);
  const upd = await DB.prepare(
    `UPDATE test_history SET result_json=? WHERE id=(
       SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1
     )`
  ).bind(resultStr, userId, test_type).run();
  if (upd.meta.changes === 0) {
    await DB.prepare(
      `INSERT INTO test_history (user_id, test_type, lang, credits_spent, result_json) VALUES (?, ?, 'ko', 0, ?)`
    ).bind(userId, test_type, resultStr).run();
  }
  return c.json({ success: true });
});
app.post("/api/ai-chat", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  const isGuest = !userId;
  const today = new Date(Date.now() + 9 * 3600 * 1e3).toISOString().slice(0, 10);
  let chatDailyKey = "";
  let chatIsMaster = false;
  if (isGuest) {
    const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
    const guestKey = `ai_guest:${ip}:${today}`;
    const guestUsed = parseInt(await KV.get(guestKey) || "0", 10);
    const GUEST_LIMIT = 5;
    if (guestUsed >= GUEST_LIMIT) {
      return c.json({
        success: false,
        error: `\uBE44\uB85C\uADF8\uC778 AI \uC0C1\uB2F4\uC740 \uD558\uB8E8 ${GUEST_LIMIT}\uD68C\uAE4C\uC9C0 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uD68C\uC6D0\uAC00\uC785\uD558\uBA74 \uB354 \uB9CE\uC774 \uC774\uC6A9\uD560 \uC218 \uC788\uC5B4\uC694.`,
        dailyUsed: guestUsed,
        dailyLimit: GUEST_LIMIT,
        needsSignup: true,
        errorCode: "guest_limit_exceeded"
      }, 429);
    }
    await KV.put(guestKey, String(guestUsed + 1), { expirationTtl: 86400 });
  } else {
    const userRow = await DB.prepare("SELECT email, credits FROM users WHERE id=?").bind(userId).first();
    chatIsMaster = isMasterAccount(userRow?.email);
    if (!chatIsMaster) {
      const rl = await checkRateLimit(KV, `chat:${userId}`, 20, 60);
      if (!rl.allowed) return c.json({ success: false, error: "\uC694\uCCAD\uC774 \uB108\uBB34 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 429);
      chatDailyKey = `ai_daily:${userId}:${today}`;
      const dailyUsed = parseInt(await KV.get(chatDailyKey) || "0", 10);
      const dailyLimit = (userRow?.credits ?? 0) > 0 ? 10 : 5;
      if (dailyUsed >= dailyLimit) {
        return c.json({
          success: false,
          error: `\uC624\uB298 AI \uC0C1\uB2F4 \uD69F\uC218(${dailyLimit}\uD68C)\uB97C \uBAA8\uB450 \uC0AC\uC6A9\uD588\uC2B5\uB2C8\uB2E4.`,
          dailyUsed,
          dailyLimit,
          needsCharge: (userRow?.credits ?? 0) <= 0,
          errorCode: "daily_limit_exceeded"
        }, 429);
      }
      await KV.put(chatDailyKey, String(dailyUsed + 1), { expirationTtl: 86400 });
      const COST = 5;
      const result = await spendCredits(DB, userId, COST, "chat");
      if (!result.ok) {
        return c.json({
          success: false,
          error: `\uD06C\uB808\uB527 \uBD80\uC871 (\uBCF4\uC720: ${result.balance}, \uD544\uC694: ${COST})`,
          balance: result.balance,
          needsCharge: true
        }, 402);
      }
    }
  }
  async function refundChat() {
    if (!isGuest && userId && !chatIsMaster) {
      if (chatDailyKey) {
        const cnt = parseInt(await KV.get(chatDailyKey) || "1", 10);
        await KV.put(chatDailyKey, String(Math.max(0, cnt - 1)), { expirationTtl: 86400 });
      }
      await gainCredits(DB, userId, 5, "refund_api_error");
    }
  }
  __name(refundChat, "refundChat");
  const { messages, testContext } = await c.req.json();
  const { testType, counselingType = "psychological", summary, lang = "ko" } = testContext ?? {};
  const apiKey = await getAnthropicKey(DB, c.env);
  if (!apiKey) {
    await refundChat();
    return c.json({ error: "API \uD0A4 \uBBF8\uC124\uC815" }, 500);
  }
  const systemKo = counselingType === "biblical" ? `\uB2F9\uC2E0\uC740 \uAE30\uB3C5\uAD50 \uC0C1\uB2F4 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. \uB530\uB73B\uD558\uACE0 \uACF5\uAC10\uC801\uC778 \uD0DC\uB3C4\uB85C \uC0C1\uB2F4\uD558\uC138\uC694.

\uAC80\uC0AC \uACB0\uACFC \uB9E5\uB77D:
${summary ?? "\uAC80\uC0AC \uACB0\uACFC \uC5C6\uC74C \u2014 \uC77C\uBC18\uC801\uC778 \uB9C8\uC74C \uB3CC\uBD04 \uC0C1\uB2F4\uC73C\uB85C \uC9C4\uD589\uD558\uC138\uC694."}

\uC0C1\uB2F4 \uC6D0\uCE59:
- \uC9C4\uB2E8\uBA85\uC774\uB098 \uBCD1\uBA85\uC744 \uC808\uB300 \uB2E8\uC815\uD558\uC9C0 \uB9C8\uC138\uC694
- "\uC758\uB8CC\uC801 \uC9C4\uB2E8\uC774 \uD544\uC694\uD569\uB2C8\uB2E4"\uB294 \uD45C\uD604 \uB300\uC2E0 "\uC804\uBB38\uAC00\uC640 \uC774\uC57C\uAE30 \uB098\uB220\uBCF4\uC138\uC694"\uB85C \uD45C\uD604\uD558\uC138\uC694
- \uC131\uACBD \uB9D0\uC500\uC740 \uAC15\uC694\uD558\uC9C0 \uB9D0\uACE0 \uC704\uB85C\uC758 \uB9E5\uB77D\uC5D0\uC11C \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC778\uC6A9\uD558\uC138\uC694
- \uC57D\uBB3C \uBCF5\uC6A9\uC774\uB098 \uCC98\uBC29\uC740 \uC808\uB300 \uC5B8\uAE09\uD558\uC9C0 \uB9C8\uC138\uC694

\uB2F5\uBCC0 \uD615\uC2DD (\uB9E4\uBC88 \uC774 \uC21C\uC11C\uB85C \uC791\uC131, \uCD1D 350\uC790 \uC774\uB0B4):
**\uACF5\uAC10** - \uAC10\uC815\uC744 1~2\uBB38\uC7A5\uC73C\uB85C \uB530\uB73B\uD558\uAC8C \uBC18\uC601
**\uB9D0\uC500** - \uC704\uB85C\uAC00 \uB418\uB294 \uC9E7\uC740 \uC131\uACBD \uAD6C\uC808 1\uAC1C (\uC120\uD0DD)
**\uC81C\uC548** - \uC9C0\uAE08 \uBC14\uB85C \uD560 \uC218 \uC788\uB294 \uC791\uC740 \uAC83 1\uAC00\uC9C0` : `\uB2F9\uC2E0\uC740 \uB530\uB73B\uD558\uACE0 \uC804\uBB38\uC801\uC778 \uB9C8\uC74C \uB3CC\uBD04 \uC0C1\uB2F4\uC0AC\uC785\uB2C8\uB2E4.

\uAC80\uC0AC \uACB0\uACFC \uB9E5\uB77D:
${summary ?? "\uAC80\uC0AC \uACB0\uACFC \uC5C6\uC74C \u2014 \uC77C\uBC18\uC801\uC778 \uB9C8\uC74C \uB3CC\uBD04 \uC0C1\uB2F4\uC73C\uB85C \uC9C4\uD589\uD558\uC138\uC694."}

\uC0C1\uB2F4 \uC6D0\uCE59:
- \uC9C4\uB2E8\uBA85\uC774\uB098 \uBCD1\uBA85\uC744 \uC808\uB300 \uB2E8\uC815\uD558\uC9C0 \uB9C8\uC138\uC694 (\uC608: "\uC6B0\uC6B8\uC99D\uC785\uB2C8\uB2E4" \uAE08\uC9C0)
- "\uC758\uB8CC\uC801 \uC9C4\uB2E8\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" \uB300\uC2E0 "\uC804\uBB38\uAC00\uC640 \uC774\uC57C\uAE30 \uB098\uB220\uBCF4\uC2DC\uBA74 \uB3C4\uC6C0\uC774 \uB420 \uAC83 \uAC19\uC544\uC694"\uB85C \uD45C\uD604\uD558\uC138\uC694
- \uC57D\uBB3C \uBCF5\uC6A9\uC774\uB098 \uCC98\uBC29\uC740 \uC808\uB300 \uC5B8\uAE09\uD558\uC9C0 \uB9C8\uC138\uC694
- \uC0AC\uC6A9\uC790\uAC00 \uC704\uAE30 \uC2E0\uD638(\uC790\uD574, \uC8FD\uACE0 \uC2F6\uB2E4 \uB4F1)\uB97C \uBCF4\uC774\uBA74 \uC989\uC2DC "\uC790\uC0B4\uC608\uBC29\uC0C1\uB2F4\uC804\uD654 1393"\uC744 \uC548\uB0B4\uD558\uC138\uC694

\uB2F5\uBCC0 \uD615\uC2DD (\uB9E4\uBC88 \uC774 \uC21C\uC11C\uB85C \uC791\uC131, \uCD1D 350\uC790 \uC774\uB0B4):
**\uACF5\uAC10** - \uAC10\uC815\uC744 1~2\uBB38\uC7A5\uC73C\uB85C \uB530\uB73B\uD558\uAC8C \uBC18\uC601
**\uD0D0\uC0C9** - \uB9C8\uC74C\uC744 \uC5F4 \uC218 \uC788\uB294 \uC5F4\uB9B0 \uC9C8\uBB38 1\uAC1C
**\uC81C\uC548** - \uC9C0\uAE08 \uBC14\uB85C \uC2E4\uCC9C \uAC00\uB2A5\uD55C \uC791\uC740 \uAC83 1\uAC00\uC9C0`;
  const systemEn = `You are a licensed mental health counselor.

Test summary:
${summary ?? "N/A"}

Always reply in this format (under 300 chars):
**Empathy** - reflect feelings in 1-2 sentences
**Explore** - one open question
**Suggest** - one small actionable step`;
  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ error: "\uBA54\uC2DC\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }, 400);
  }
  const MODEL_FALLBACKS = [
    getAiModel(c.env),
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6"
  ];
  const reqBody = { max_tokens: 1500, stream: true, system: lang === "ko" ? systemKo : systemEn, messages };
  let res;
  let usedModel = MODEL_FALLBACKS[0];
  for (const model of [...new Set(MODEL_FALLBACKS)]) {
    res = await fetch("https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, ...reqBody })
    });
    if (res.ok || res.status !== 404 && res.status !== 403) {
      usedModel = model;
      break;
    }
    usedModel = model;
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[ai-chat] Anthropic error:", res.status, usedModel, errBody.slice(0, 300));
    await refundChat();
    const msg = res.status === 404 ? `AI \uBAA8\uB378(${usedModel})\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. Anthropic API \uD0A4\uB97C \uD655\uC778\uD558\uC138\uC694.` : res.status === 401 ? "AI API \uD0A4\uAC00 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD558\uC138\uC694." : res.status === 400 ? "AI \uC694\uCCAD \uD615\uC2DD \uC624\uB958\uC785\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." : res.status === 403 ? `AI \uBAA8\uB378(${usedModel}) \uC811\uADFC \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. Anthropic \uD50C\uB79C\uC744 \uD655\uC778\uD558\uC138\uC694.` : res.status === 529 ? "AI \uC11C\uBC84\uAC00 \uD63C\uC7A1\uD569\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." : `AI \uC11C\uBE44\uC2A4 \uC624\uB958 (${res.status}): ${errBody.slice(0, 200)}`;
    return c.json({ error: msg, status: res.status, model: usedModel, detail: errBody.slice(0, 500) }, 502);
  }
  if (!isGuest && userId) {
    DB.prepare("INSERT INTO chat_sessions (user_id,test_type,lang,credits_spent) VALUES (?,?,?,?)").bind(userId, testType ?? null, lang, 5).run().catch(() => {
    });
  }
  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  return new Response(res.body, { headers: sseHeaders });
});
var PACKAGES = {
  starter_kr: { credits: 50, amount: 2900, label: "\uC2A4\uD0C0\uD130" },
  standard_kr: { credits: 120, amount: 5900, label: "\uD45C\uC900" },
  premium_kr: { credits: 300, amount: 12900, label: "\uD504\uB9AC\uBBF8\uC5C4" },
  pro_kr: { credits: 700, amount: 24900, label: "\uB300\uC6A9\uB7C9" },
  starter_g: { credits: 50, amount: 299, label: "Starter" },
  standard_g: { credits: 120, amount: 599, label: "Standard" },
  premium_g: { credits: 300, amount: 1299, label: "Premium" },
  pro_g: { credits: 700, amount: 2499, label: "Pro" }
};
var SUBSCRIPTION_PLANS = {
  basic: { name: "\uBCA0\uC774\uC9C1", monthlyCredits: 60, price: 3900, currency: "KRW", features: ["\uC6D4 60 \uD06C\uB808\uB527", "\uC2EC\uB9AC\uAC80\uC0AC 6\uD68C", "AI \uCC44\uD305 \uBB34\uC81C\uD55C", "\uB9C8\uC74C \uAC8C\uC784 \uBB34\uB8CC"] },
  standard: { name: "\uC2A4\uD0E0\uB2E4\uB4DC", monthlyCredits: 150, price: 8900, currency: "KRW", features: ["\uC6D4 150 \uD06C\uB808\uB527", "\uC2EC\uB9AC\uAC80\uC0AC 15\uD68C", "AI \uCC44\uD305 \uBB34\uC81C\uD55C", "\uB9C8\uC74C \uAC8C\uC784 \uBB34\uB8CC", "\uC0C1\uB2F4 \uC608\uC57D \uD560\uC778 10%"] },
  pro: { name: "\uD504\uB85C", monthlyCredits: 400, price: 19900, currency: "KRW", features: ["\uC6D4 400 \uD06C\uB808\uB527", "\uC2EC\uB9AC\uAC80\uC0AC \uBB34\uC81C\uD55C", "AI \uCC44\uD305 \uBB34\uC81C\uD55C", "\uB9C8\uC74C \uAC8C\uC784 \uBB34\uB8CC", "\uC0C1\uB2F4 \uC608\uC57D \uD560\uC778 20%", "\uC804\uBB38\uAC00 \uC6D4\uAC04 \uB9AC\uD3EC\uD2B8"] }
};
app.get("/api/subscription/plans", (c) => {
  return c.json({ success: true, data: SUBSCRIPTION_PLANS });
});
app.get("/api/subscription/me", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const sub = await DB.prepare(
    'SELECT * FROM user_subscriptions WHERE user_id=? AND status="active" ORDER BY created_at DESC LIMIT 1'
  ).bind(userId).first();
  return c.json({ success: true, data: sub || null });
});
app.post("/api/subscription/checkout", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { planKey } = await c.req.json();
  const plan = SUBSCRIPTION_PLANS[planKey];
  if (!plan) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uD50C\uB79C" }, 400);
  const user = await DB.prepare("SELECT email, nickname FROM users WHERE id=?").bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const serviceUrl = c.env.SERVICE_URL || "http://localhost:3000";
  const customerKey = `maumful_user_${userId}`;
  const successUrl = `${serviceUrl}/api/subscription/toss/success?planKey=${planKey}&userId=${userId}`;
  const failUrl = `${serviceUrl}/?sub=fail`;
  const tossClientKey = c.env.TOSS_CLIENT_KEY;
  if (!tossClientKey) return c.json({ success: false, error: "TOSS_CLIENT_KEY \uBBF8\uC124\uC815. wrangler secret put TOSS_CLIENT_KEY" }, 500);
  return c.json({
    success: true,
    data: {
      authUrl: `https://api.tosspayments.com/v1/billing/authorizations/card?customerKey=${customerKey}&successUrl=${encodeURIComponent(successUrl)}&failUrl=${encodeURIComponent(failUrl)}`,
      clientKey: tossClientKey,
      customerKey,
      planKey,
      plan
    }
  });
});
app.get("/api/subscription/toss/success", async (c) => {
  const { DB } = c.env;
  const { authKey, customerKey, planKey, userId } = c.req.query();
  if (!userId || !customerKey || customerKey !== `maumful_user_${userId}`) {
    return c.redirect("/?sub=fail&msg=\uC694\uCCAD\uC624\uB958");
  }
  const tossKey = c.env.TOSS_SECRET_KEY;
  if (!tossKey) return c.redirect("/?sub=fail&msg=\uC11C\uBC84\uC624\uB958");
  try {
    const res = await fetch("https://api.tosspayments.com/v1/billing/authorizations/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Basic " + btoa(tossKey + ":") },
      body: JSON.stringify({ authKey, customerKey })
    });
    if (!res.ok) return c.redirect("/?sub=fail&msg=\uBE4C\uB9C1\uD0A4\uBC1C\uAE09\uC2E4\uD328");
    const billing = await res.json();
    const plan = SUBSCRIPTION_PLANS[planKey];
    if (!plan || !billing.billingKey) return c.redirect("/?sub=fail&msg=\uD50C\uB79C\uC624\uB958");
    const uId = parseInt(userId);
    const nextBillingDate = /* @__PURE__ */ new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    try {
      await DB.prepare(`
        INSERT OR REPLACE INTO user_subscriptions
        (user_id, plan_key, billing_key, customer_key, status, monthly_credits, price, next_billing_date)
        VALUES (?,?,?,?,'active',?,?,?)
      `).bind(
        uId,
        planKey,
        billing.billingKey,
        customerKey,
        plan.monthlyCredits,
        plan.price,
        nextBillingDate.toISOString()
      ).run();
    } catch {
    }
    await DB.prepare("UPDATE users SET credits = credits + ? WHERE id=?").bind(plan.monthlyCredits, uId).run();
    await DB.prepare("INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) SELECT ?,?,?,?,credits FROM users WHERE id=?").bind(uId, "gain", plan.monthlyCredits, `subscription_${planKey}`, uId).run();
    return c.redirect("/?sub=success&plan=" + planKey);
  } catch (e) {
    console.error("[\uAD6C\uB3C5] \uC624\uB958:", e);
    return c.redirect("/?sub=fail&msg=\uCC98\uB9AC\uC624\uB958");
  }
});
app.delete("/api/subscription/cancel", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  try {
    await DB.prepare("UPDATE user_subscriptions SET status='cancelled', cancelled_at=CURRENT_TIMESTAMP WHERE user_id=? AND status='active'").bind(userId).run();
    return c.json({ success: true, message: "\uAD6C\uB3C5\uC774 \uD574\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD604\uC7AC \uAE30\uAC04 \uB9CC\uB8CC \uD6C4 \uAC31\uC2E0\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
  } catch {
    return c.json({ success: false, error: "\uAD6C\uB3C5 \uC815\uBCF4 \uC5C6\uC74C" }, 404);
  }
});
app.post("/api/webhook/toss", async (c) => {
  const { DB } = c.env;
  const rawBody = await c.req.text();
  const tossSecret = c.env.TOSS_WEBHOOK_SECRET;
  if (tossSecret) {
    const authHeader = c.req.header("Authorization") ?? "";
    const expected = "Basic " + btoa(tossSecret + ":");
    if (authHeader !== expected) {
      console.error("[Toss Webhook] \uC11C\uBA85 \uBD88\uC77C\uCE58 \u2014 \uC704\uC870 \uC694\uCCAD \uCC28\uB2E8");
      return c.json({ error: "Unauthorized" }, 401);
    }
  } else {
    console.warn("[Toss Webhook] TOSS_WEBHOOK_SECRET \uBBF8\uC124\uC815 \u2014 \uC11C\uBA85 \uAC80\uC99D \uAC74\uB108\uB700");
  }
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  if (body.status !== "DONE") return c.json({ ok: true });
  const { userId, packageKey } = body.metadata ?? {};
  if (!userId || !packageKey) return c.json({ error: "metadata \uB204\uB77D" }, 400);
  const pkg = PACKAGES[packageKey];
  if (!pkg) return c.json({ error: "\uC798\uBABB\uB41C \uD328\uD0A4\uC9C0" }, 400);
  const pgTid = body.paymentKey;
  if (!pgTid) return c.json({ error: "paymentKey \uB204\uB77D" }, 400);
  const existing = await DB.prepare("SELECT id FROM credit_charges WHERE pg_tid=?").bind(pgTid).first();
  if (existing) return c.json({ ok: true, msg: "already_processed" });
  await DB.prepare("UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE pg=? AND status=? AND user_id=?").bind("completed", pgTid, "toss", "pending", parseInt(userId)).run();
  await gainCredits(DB, parseInt(userId), pkg.credits, "charge", pgTid);
  console.log("[Toss Webhook] \uD06C\uB808\uB527 \uC9C0\uAE09 \uC644\uB8CC \u2014 userId:", userId, "credits:", pkg.credits);
  completeReferral(DB, parseInt(userId)).catch(() => {
  });
  const twUser = await DB.prepare("SELECT email, nickname FROM users WHERE id=?").bind(parseInt(userId)).first();
  if (twUser) sendReceiptEmail(c.env, twUser.email, twUser.nickname || "", pkg.credits, pkg.amount, "KRW", pgTid).catch(() => {
  });
  return c.json({ ok: true });
});
app.post("/api/webhook/stripe", async (c) => {
  const { DB } = c.env;
  const rawBody = await c.req.text();
  const stripeSecret = c.env.STRIPE_WEBHOOK_SECRET;
  if (stripeSecret) {
    const sigHeader = c.req.header("stripe-signature") ?? "";
    const tMatch = sigHeader.match(/t=(\d+)/);
    const v1Match = sigHeader.match(/v1=([a-f0-9]+)/);
    if (!tMatch || !v1Match) {
      console.error("[Stripe Webhook] stripe-signature \uD5E4\uB354 \uD615\uC2DD \uC624\uB958");
      return c.json({ error: "Unauthorized" }, 401);
    }
    const timestamp = tMatch[1];
    const received = v1Match[1];
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(stripeSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(timestamp + "." + rawBody));
    const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (received.length !== expected.length) {
      console.error("[Stripe Webhook] \uC11C\uBA85 \uBD88\uC77C\uCE58 \u2014 \uC704\uC870 \uC694\uCCAD \uCC28\uB2E8");
      return c.json({ error: "Unauthorized" }, 401);
    }
    let diff = 0;
    for (let i = 0; i < received.length; i++) diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0) {
      console.error("[Stripe Webhook] \uC11C\uBA85 \uBD88\uC77C\uCE58 \u2014 \uC704\uC870 \uC694\uCCAD \uCC28\uB2E8");
      return c.json({ error: "Unauthorized" }, 401);
    }
    const age = Math.floor(Date.now() / 1e3) - parseInt(timestamp);
    if (age > 300) {
      console.error("[Stripe Webhook] \uD0C0\uC784\uC2A4\uD0EC\uD504 \uB9CC\uB8CC \u2014 \uB9AC\uD50C\uB808\uC774 \uACF5\uACA9 \uCC28\uB2E8");
      return c.json({ error: "Request too old" }, 400);
    }
  } else {
    console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET \uBBF8\uC124\uC815 \u2014 \uC11C\uBA85 \uAC80\uC99D \uAC74\uB108\uB700");
  }
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  if (body.type !== "checkout.session.completed") return c.json({ ok: true });
  const session = body.data;
  const obj = session?.object ?? {};
  const meta = obj.metadata ?? {};
  const { userId, packageKey } = meta;
  if (!userId || !packageKey) return c.json({ error: "metadata \uB204\uB77D" }, 400);
  const pkg = PACKAGES[packageKey];
  if (!pkg) return c.json({ error: "\uC798\uBABB\uB41C \uD328\uD0A4\uC9C0" }, 400);
  const pgTid = obj.id;
  if (!pgTid) return c.json({ error: "session.id \uB204\uB77D" }, 400);
  const existing = await DB.prepare("SELECT id FROM credit_charges WHERE pg_tid=?").bind(pgTid).first();
  if (existing) return c.json({ ok: true, msg: "already_processed" });
  await DB.prepare("UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE pg=? AND status=? AND user_id=?").bind("completed", pgTid, "stripe", "pending", parseInt(userId)).run();
  await gainCredits(DB, parseInt(userId), pkg.credits, "charge", pgTid);
  console.log("[Stripe Webhook] \uD06C\uB808\uB527 \uC9C0\uAE09 \uC644\uB8CC \u2014 userId:", userId, "credits:", pkg.credits);
  completeReferral(DB, parseInt(userId)).catch(() => {
  });
  const swUser = await DB.prepare("SELECT email, nickname FROM users WHERE id=?").bind(parseInt(userId)).first();
  if (swUser) sendReceiptEmail(c.env, swUser.email, swUser.nickname || "", pkg.credits, pkg.amount, "USD", pgTid).catch(() => {
  });
  return c.json({ ok: true });
});
app.post("/api/payment/toss/checkout", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const tossKey = c.env.TOSS_SECRET_KEY;
  if (!tossKey) return c.json({ success: false, error: "\uD1A0\uC2A4\uD398\uC774\uBA3C\uCE20 \uD0A4 \uBBF8\uC124\uC815. wrangler secret put TOSS_SECRET_KEY" }, 500);
  const { packageKey } = await c.req.json();
  const pkg = PACKAGES[packageKey];
  if (!pkg) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uD328\uD0A4\uC9C0" }, 400);
  const user = await DB.prepare("SELECT email, nickname FROM users WHERE id=?").bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const r = await DB.prepare(
    "INSERT INTO credit_charges (user_id,package_key,credits,amount,currency,pg) VALUES (?,?,?,?,?,?)"
  ).bind(userId, packageKey, pkg.credits, pkg.amount, "KRW", "toss").run();
  const chargeId = r.meta.last_row_id;
  const orderId = `charge_${chargeId}_${Date.now()}`;
  const serviceUrl = c.env.SERVICE_URL || "http://localhost:3000";
  const tossClientKey = c.env.TOSS_CLIENT_KEY;
  if (!tossClientKey) return c.json({ success: false, error: "TOSS_CLIENT_KEY \uBBF8\uC124\uC815. wrangler secret put TOSS_CLIENT_KEY" }, 500);
  return c.json({
    success: true,
    data: {
      clientKey: tossClientKey,
      orderId,
      orderName: `${pkg.label} \uD06C\uB808\uB527 ${pkg.credits}\uAC1C`,
      amount: pkg.amount,
      customerName: user.nickname || user.email.split("@")[0],
      customerEmail: user.email,
      successUrl: `${serviceUrl}/api/payment/toss/success?chargeId=${chargeId}&orderId=${orderId}`,
      failUrl: `${serviceUrl}/api/payment/toss/fail?chargeId=${chargeId}`,
      chargeId
    }
  });
});
app.get("/api/payment/toss/success", async (c) => {
  const { DB } = c.env;
  const { paymentKey, orderId, amount, chargeId } = c.req.query();
  const tossKey = c.env.TOSS_SECRET_KEY;
  if (!tossKey) return c.redirect("/?payment=fail&msg=\uC11C\uBC84\uC624\uB958");
  try {
    const confirmRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(tossKey + ":")
      },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) })
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json();
      console.error("[Toss] \uACB0\uC81C \uC2B9\uC778 \uC2E4\uD328:", err);
      return c.redirect(`/?payment=fail&msg=${encodeURIComponent(err.message || "\uC2B9\uC778\uC2E4\uD328")}`);
    }
    const existing = await DB.prepare("SELECT id FROM credit_charges WHERE pg_tid=?").bind(paymentKey).first();
    if (!existing) {
      const charge = await DB.prepare(
        "SELECT user_id, credits, package_key FROM credit_charges WHERE id=? AND status=?"
      ).bind(parseInt(chargeId), "pending").first();
      if (charge) {
        await DB.prepare(
          "UPDATE credit_charges SET status=?,pg_tid=?,completed_at=CURRENT_TIMESTAMP WHERE id=?"
        ).bind("completed", paymentKey, parseInt(chargeId)).run();
        const newBalance = await gainCredits(DB, charge.user_id, charge.credits, "charge", paymentKey);
        console.log("[Toss] \uD06C\uB808\uB527 \uC9C0\uAE09:", charge.user_id, "+", charge.credits, "\u2192", newBalance);
        completeReferral(DB, charge.user_id).catch(() => {
        });
        const user = await DB.prepare("SELECT email, nickname FROM users WHERE id=?").bind(charge.user_id).first();
        const pkg = PACKAGES[charge.package_key];
        if (user && pkg) {
          await sendReceiptEmail(c.env, user.email, user.nickname || "", charge.credits, pkg.amount, "KRW", paymentKey);
        }
      }
    }
    return c.redirect("/?payment=success");
  } catch (e) {
    console.error("[Toss] \uCC98\uB9AC \uC624\uB958:", e);
    return c.redirect("/?payment=fail&msg=\uCC98\uB9AC\uC624\uB958");
  }
});
app.get("/api/payment/toss/fail", async (c) => {
  const { DB } = c.env;
  const { code, message, chargeId } = c.req.query();
  if (chargeId) {
    await DB.prepare("UPDATE credit_charges SET status=? WHERE id=? AND status=?").bind("failed", parseInt(chargeId), "pending").run();
  }
  console.error("[Toss] \uACB0\uC81C \uC2E4\uD328:", code, message);
  return c.redirect(`/?payment=fail&msg=${encodeURIComponent(message || "\uACB0\uC81C\uCDE8\uC18C")}`);
});
app.post("/api/payment/stripe/checkout", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return c.json({ success: false, error: "Stripe \uD0A4 \uBBF8\uC124\uC815. wrangler secret put STRIPE_SECRET_KEY" }, 500);
  const { packageKey } = await c.req.json();
  const pkg = PACKAGES[packageKey];
  if (!pkg) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uD328\uD0A4\uC9C0" }, 400);
  const user = await DB.prepare("SELECT email, nickname FROM users WHERE id=?").bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const r = await DB.prepare(
    "INSERT INTO credit_charges (user_id,package_key,credits,amount,currency,pg) VALUES (?,?,?,?,?,?)"
  ).bind(userId, packageKey, pkg.credits, pkg.amount, "USD", "stripe").run();
  const chargeId = r.meta.last_row_id;
  const serviceUrl = c.env.SERVICE_URL || "http://localhost:3000";
  try {
    const params = new URLSearchParams({
      "payment_method_types[]": "card",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(pkg.amount),
      "line_items[0][price_data][product_data][name]": `${pkg.label} \u2014 ${pkg.credits} Credits`,
      "line_items[0][quantity]": "1",
      "mode": "payment",
      "customer_email": user.email,
      "metadata[userId]": String(userId),
      "metadata[packageKey]": packageKey,
      "metadata[chargeId]": String(chargeId),
      "payment_intent_data[metadata][userId]": String(userId),
      "payment_intent_data[metadata][packageKey]": packageKey,
      "payment_intent_data[metadata][chargeId]": String(chargeId),
      "success_url": `${serviceUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${serviceUrl}/?payment=cancel`
    });
    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + stripeKey, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
    if (!sessionRes.ok) {
      const err = await sessionRes.json();
      console.error("[Stripe] \uC138\uC158 \uC0DD\uC131 \uC2E4\uD328:", err);
      return c.json({ success: false, error: err.error?.message || "Stripe \uC624\uB958" }, 502);
    }
    const session = await sessionRes.json();
    console.log("[Stripe] Checkout \uC138\uC158 \uC0DD\uC131:", session.id);
    return c.json({ success: true, data: { checkoutUrl: session.url, sessionId: session.id, chargeId } });
  } catch (e) {
    console.error("[Stripe] \uC138\uC158 \uC0DD\uC131 \uC624\uB958:", e);
    return c.json({ success: false, error: "\uACB0\uC81C \uC138\uC158 \uC0DD\uC131 \uC2E4\uD328" }, 500);
  }
});
app.get("/api/payment/stripe/verify", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare("SELECT credits FROM users WHERE id=?").bind(userId).first();
  return c.json({ success: true, data: { credits: user?.credits ?? 0 } });
});
async function sendEmail(env2, to, subject, html) {
  const key = env2.RESEND_API_KEY;
  if (!key) {
    console.warn("[Email] RESEND_API_KEY \uBBF8\uC124\uC815");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      // 발신자: RESEND_FROM_EMAIL 환경변수 없으면 기본값 사용
      // wrangler secret put RESEND_FROM_EMAIL 으로 등록 (예: noreply@your-domain.com)
      body: JSON.stringify({
        from: env2.RESEND_FROM_EMAIL || "noreply@maumful.kr",
        to: [to],
        subject,
        html
      })
    });
    if (!res.ok) {
      console.error("[Email] \uC624\uB958:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Email] \uBC1C\uC1A1 \uC2E4\uD328:", e);
    return false;
  }
}
__name(sendEmail, "sendEmail");
async function sendVerifyEmail(env2, to, nickname, token) {
  const url = `${env2.SERVICE_URL || "http://localhost:3000"}/api/auth/verify/${token}`;
  const name = nickname || to.split("@")[0];
  await sendEmail(
    env2,
    to,
    "\uB9C8\uC74C\uD480 \u2014 \uC774\uBA54\uC77C \uC778\uC99D",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#4f46e5">\u{1F33F} \uB9C8\uC74C\uD480</h2>
      <p>\uC548\uB155\uD558\uC138\uC694 <strong>${name}</strong>\uB2D8,</p>
      <p>\uC544\uB798 \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC774\uBA54\uC77C \uC778\uC99D\uC744 \uC644\uB8CC\uD574\uC8FC\uC138\uC694. <em>(6\uC2DC\uAC04 \uC774\uB0B4)</em></p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">\uC774\uBA54\uC77C \uC778\uC99D\uD558\uAE30</a>
      <p style="color:#999;font-size:12px">\uBC84\uD2BC\uC774 \uC791\uB3D9\uD558\uC9C0 \uC54A\uC73C\uBA74: ${url}</p>
    </div>`
  );
}
__name(sendVerifyEmail, "sendVerifyEmail");
async function sendPasswordResetEmail(env2, to, nickname, token) {
  const url = `${env2.SERVICE_URL || "http://localhost:3000"}/?reset_token=${token}`;
  const name = nickname || to.split("@")[0];
  await sendEmail(
    env2,
    to,
    "\uB9C8\uC74C\uD480 \u2014 \uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#4f46e5">\u{1F33F} \uB9C8\uC74C\uD480</h2>
      <p>\uC548\uB155\uD558\uC138\uC694 <strong>${name}</strong>\uB2D8, \uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815 \uB9C1\uD06C\uC785\uB2C8\uB2E4. <em>(1\uC2DC\uAC04 \uC774\uB0B4)</em></p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">\uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815</a>
      <p style="color:#999;font-size:12px">\uBCF8\uC778\uC774 \uC694\uCCAD\uD558\uC9C0 \uC54A\uC558\uB2E4\uBA74 \uBB34\uC2DC\uD558\uC138\uC694.</p>
    </div>`
  );
}
__name(sendPasswordResetEmail, "sendPasswordResetEmail");
async function sendReceiptEmail(env2, to, nickname, credits, amount, currency, txId) {
  const amountStr = currency === "KRW" ? `\u20A9${amount.toLocaleString()}` : `$${(amount / 100).toFixed(2)}`;
  const name = nickname || to.split("@")[0];
  await sendEmail(
    env2,
    to,
    "\uB9C8\uC74C\uD480 \u2014 \uD06C\uB808\uB527 \uCDA9\uC804 \uC644\uB8CC",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#4f46e5">\u{1F33F} \uB9C8\uC74C\uD480</h2>
      <p>\uC548\uB155\uD558\uC138\uC694 <strong>${name}</strong>\uB2D8, \uD06C\uB808\uB527 \uCDA9\uC804\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!</p>
      <div style="background:#f0f0ff;border-radius:12px;padding:20px;margin:16px 0">
        <p style="margin:4px 0">\u2726 \uCDA9\uC804 \uD06C\uB808\uB527: <strong>${credits}\uAC1C</strong></p>
        <p style="margin:4px 0">\u{1F4B3} \uACB0\uC81C \uAE08\uC561: <strong>${amountStr}</strong></p>
        <p style="margin:4px 0;color:#aaa;font-size:12px">\uAC70\uB798 ID: ${txId}</p>
      </div>
      <p style="color:#999;font-size:12px">\uBB38\uC758: support@maumful.kr</p>
    </div>`
  );
}
__name(sendReceiptEmail, "sendReceiptEmail");
app.post("/api/credits/notify-plan", async (c) => {
  const { KV } = c.env;
  try {
    const { plan, email } = await c.req.json();
    if (!plan || !email) return c.json({ success: false }, 400);
    const key = `plan_notify:${email.toLowerCase()}`;
    const existing = await KV.get(key);
    const list = existing ? JSON.parse(existing) : [];
    if (!list.includes(plan)) list.push(plan);
    await KV.put(key, JSON.stringify(list), { expirationTtl: 90 * 86400 });
    return c.json({ success: true });
  } catch {
    return c.json({ success: false });
  }
});
app.post("/api/credits/prepare-charge", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { packageKey, pg } = await c.req.json();
  const pkg = PACKAGES[packageKey];
  if (!pkg) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uD328\uD0A4\uC9C0" }, 400);
  const r = await DB.prepare("INSERT INTO credit_charges (user_id,package_key,credits,amount,currency,pg) VALUES (?,?,?,?,?,?)").bind(userId, packageKey, pkg.credits, pkg.amount, pg === "stripe" ? "USD" : "KRW", pg).run();
  return c.json({ success: true, data: { chargeId: r.meta.last_row_id, credits: pkg.credits, amount: pkg.amount } });
});
function requireAdmin(c) {
  const adminSecret = c.env.ADMIN_SECRET;
  if (!adminSecret) {
    console.error("[Admin] ADMIN_SECRET \uBBF8\uC124\uC815 \u2014 \uC811\uADFC \uCC28\uB2E8");
    return "ADMIN_SECRET_NOT_SET";
  }
  const auth = c.req.header("Authorization") ?? "";
  if (auth !== "Bearer " + adminSecret) return "Unauthorized";
  return null;
}
__name(requireAdmin, "requireAdmin");
app.get("/api/referral/code", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const kvKey = `referral_code:${userId}`;
  let code = await KV.get(kvKey);
  if (!code) {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    code = `PSY${userId}${rand}`;
    await KV.put(kvKey, code);
    await KV.put(`referral_user:${code}`, String(userId));
  }
  const stats = await DB.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'completed' THEN referrer_bonus ELSE 0 END) AS earned
    FROM referrals WHERE referrer_id = ?
  `).bind(userId).first();
  const serviceUrl = c.env.SERVICE_URL || "http://localhost:3000";
  return c.json({
    success: true,
    data: {
      code,
      inviteUrl: `${serviceUrl}/?ref=${code}`,
      stats: {
        totalInvited: stats?.total ?? 0,
        completed: stats?.completed ?? 0,
        totalEarned: stats?.earned ?? 0
      },
      rewards: {
        referrerBonus: 30,
        // 피초대자 첫 결제 완료 시 지급
        refereeBonus: 10
        // 초대 링크로 가입 시 즉시 지급
      }
    }
  });
});
app.post("/api/referral/apply", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const { code } = await c.req.json();
  if (!code) return c.json({ success: false, error: "\uCD08\uB300 \uCF54\uB4DC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }, 400);
  const alreadyApplied = await DB.prepare("SELECT id FROM referrals WHERE referee_id = ?").bind(userId).first();
  if (alreadyApplied) return c.json({ success: false, error: "\uC774\uBBF8 \uCD08\uB300 \uCF54\uB4DC\uB97C \uC801\uC6A9\uD588\uC2B5\uB2C8\uB2E4." }, 409);
  const referrerIdStr = await KV.get(`referral_user:${code.toUpperCase()}`);
  if (!referrerIdStr) return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uCD08\uB300 \uCF54\uB4DC\uC785\uB2C8\uB2E4." }, 404);
  const referrerId = parseInt(referrerIdStr);
  if (referrerId === userId) return c.json({ success: false, error: "\uBCF8\uC778\uC758 \uCD08\uB300 \uCF54\uB4DC\uB294 \uC0AC\uC6A9\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 400);
  await DB.prepare(
    'INSERT INTO referrals (referrer_id, referee_id, referrer_bonus, referee_bonus, status) VALUES (?,?,30,10,"pending")'
  ).bind(referrerId, userId).run();
  const newBalance = await gainCredits(DB, userId, 10, "referral", code);
  return c.json({
    success: true,
    message: "\uCD08\uB300 \uCF54\uB4DC \uC801\uC6A9 \uC644\uB8CC! 10 \uD06C\uB808\uB527\uC774 \uC9C0\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    data: { credits: 10, balance: newBalance }
  });
});
async function completeReferral(db, refereeId) {
  const ref2 = await db.prepare(
    'SELECT id, referrer_id, referrer_bonus FROM referrals WHERE referee_id = ? AND status = "pending"'
  ).bind(refereeId).first();
  if (!ref2) return;
  await db.prepare('UPDATE referrals SET status = "completed" WHERE id = ?').bind(ref2.id).run();
  await gainCredits(db, ref2.referrer_id, ref2.referrer_bonus, "referral", `referee_${refereeId}`);
}
__name(completeReferral, "completeReferral");
app.get("/api/referral/list", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const list = await DB.prepare(`
    SELECT
      r.id, r.status, r.referrer_bonus, r.referee_bonus, r.created_at,
      u.nickname AS referee_nickname,
      SUBSTR(u.email, 1, 3) || '***' AS referee_email_masked
    FROM referrals r
    JOIN users u ON u.id = r.referee_id
    WHERE r.referrer_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).bind(userId).all();
  return c.json({ success: true, data: list.results });
});
function adminGuard(c) {
  if (!isAdminIp(c)) return "Forbidden";
  return requireAdmin(c);
}
__name(adminGuard, "adminGuard");
app.get("/api/admin/stats", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  try {
    const now = /* @__PURE__ */ new Date();
    const today = now.toISOString().slice(0, 10);
    const month1st = now.toISOString().slice(0, 7) + "-01";
    const [users, activeToday, newThisMonth, credits, tests, chats, charges, referrals] = await DB.batch([
      // 전체 회원 수
      DB.prepare('SELECT COUNT(*) AS cnt FROM users WHERE email NOT LIKE "deleted_%"'),
      // 오늘 로그인 (credit_transactions 기준)
      DB.prepare(`SELECT COUNT(DISTINCT user_id) AS cnt FROM credit_transactions WHERE DATE(created_at) = ?`).bind(today),
      // 이번 달 신규 가입
      DB.prepare(`SELECT COUNT(*) AS cnt FROM users WHERE created_at >= ? AND email NOT LIKE "deleted_%"`).bind(month1st),
      // 전체 발행 크레딧 합계 (gain)
      DB.prepare(`SELECT COALESCE(SUM(amount),0) AS total, COALESCE(SUM(CASE WHEN reason='charge' THEN amount ELSE 0 END),0) AS paid FROM credit_transactions WHERE type='gain'`),
      // 검사 수행 수 (전체 / 오늘)
      DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN DATE(performed_at)=? THEN 1 ELSE 0 END) AS today FROM test_history`).bind(today),
      // AI 채팅 수 (전체 / 오늘)
      DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN DATE(created_at)=? THEN 1 ELSE 0 END) AS today FROM chat_sessions`).bind(today),
      // 결제 완료 (이번 달)
      DB.prepare(`SELECT COUNT(*) AS cnt, COALESCE(SUM(amount),0) AS revenue FROM credit_charges WHERE status='completed' AND created_at >= ?`).bind(month1st),
      // 친구 초대 완료 수
      DB.prepare(`SELECT COUNT(*) AS cnt FROM referrals WHERE status='completed'`)
    ]);
    const u = users.results[0];
    const at = activeToday.results[0];
    const nm = newThisMonth.results[0];
    const cr = credits.results[0];
    const te = tests.results[0];
    const ch = chats.results[0];
    const pg = charges.results[0];
    const rf = referrals.results[0];
    return c.json({
      success: true,
      data: {
        users: {
          total: u?.cnt ?? 0,
          activeToday: at?.cnt ?? 0,
          newThisMonth: nm?.cnt ?? 0
        },
        credits: {
          totalIssued: cr?.total ?? 0,
          totalPaid: cr?.paid ?? 0
        },
        tests: {
          total: te?.total ?? 0,
          today: te?.today ?? 0
        },
        chats: {
          total: ch?.total ?? 0,
          today: ch?.today ?? 0
        },
        revenue: {
          thisMonthCount: pg?.cnt ?? 0,
          thisMonthAmount: pg?.revenue ?? 0
        },
        referrals: {
          completed: rf?.cnt ?? 0
        }
      }
    });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});
app.get("/api/admin/stats/daily", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const days = Math.min(parseInt(c.req.query("days") || "30"), 90);
  try {
    const [signups, tests, chats, revenue] = await DB.batch([
      DB.prepare(`
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt
        FROM users WHERE created_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`),
      DB.prepare(`
        SELECT DATE(performed_at) AS day, COUNT(*) AS cnt
        FROM test_history WHERE performed_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`),
      DB.prepare(`
        SELECT DATE(created_at) AS day, COUNT(*) AS cnt
        FROM chat_sessions WHERE created_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`),
      DB.prepare(`
        SELECT DATE(completed_at) AS day,
               COUNT(*) AS cnt,
               COALESCE(SUM(amount),0) AS amount
        FROM credit_charges
        WHERE status='completed' AND completed_at >= DATE('now', ? || ' days')
        GROUP BY day ORDER BY day
      `).bind(`-${days}`)
    ]);
    return c.json({
      success: true,
      data: {
        signups: signups.results,
        tests: tests.results,
        chats: chats.results,
        revenue: revenue.results
      }
    });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});
app.get("/api/admin/stats/tests", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  try {
    const result = await DB.prepare(`
      SELECT test_type, lang,
             COUNT(*) AS cnt,
             COALESCE(SUM(credits_spent),0) AS credits
      FROM test_history
      GROUP BY test_type, lang
      ORDER BY cnt DESC
    `).all();
    return c.json({ success: true, data: result.results });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});
app.get("/api/admin/users", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(50, parseInt(c.req.query("limit") || "20"));
  const search = (c.req.query("search") || "").trim();
  const offset = (page - 1) * limit;
  try {
    const whereClause = search ? `WHERE (u.email LIKE ? OR u.nickname LIKE ?) AND u.email NOT LIKE 'deleted_%'` : `WHERE u.email NOT LIKE 'deleted_%'`;
    const bindParams = search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset];
    const [countResult, rows] = await DB.batch([
      DB.prepare(`SELECT COUNT(*) AS cnt FROM users u ${whereClause}`).bind(...search ? [`%${search}%`, `%${search}%`] : []),
      DB.prepare(`
        SELECT
          u.id, u.email, u.nickname, u.locale, u.country_code,
          u.credits, u.is_email_verified, u.social_provider, u.created_at,
          (SELECT COUNT(*) FROM test_history th WHERE th.user_id = u.id) AS test_count,
          (SELECT COUNT(*) FROM chat_sessions cs WHERE cs.user_id = u.id) AS chat_count,
          (SELECT COALESCE(SUM(amount),0) FROM credit_charges cc WHERE cc.user_id = u.id AND cc.status='completed') AS total_paid
        FROM users u
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindParams)
    ]);
    const total = countResult.results[0]?.cnt ?? 0;
    return c.json({
      success: true,
      data: {
        users: rows.results,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});
app.post("/api/admin/users/:id/credits", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const userId = parseInt(c.req.param("id"));
  const { amount, reason = "admin_grant", type = "gain" } = await c.req.json();
  if (!amount || amount <= 0) return c.json({ success: false, error: "\uAE08\uC561\uC740 1 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4." }, 400);
  if (!["gain", "spend"].includes(type)) return c.json({ success: false, error: "type\uC740 gain \uB610\uB294 spend" }, 400);
  try {
    const user = await DB.prepare("SELECT id, credits, email FROM users WHERE id = ?").bind(userId).first();
    if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
    let newBalance;
    if (type === "gain") {
      newBalance = await gainCredits(DB, userId, amount, reason);
    } else {
      const result = await spendCredits(DB, userId, amount, reason);
      if (!result.ok) return c.json({ success: false, error: result.error || "\uCC28\uAC10 \uC2E4\uD328", balance: result.balance }, 400);
      newBalance = result.balance;
    }
    return c.json({
      success: true,
      message: `${user.email} \u2014 ${type === "gain" ? "+" : "-"}${amount} \uD06C\uB808\uB527 \uCC98\uB9AC \uC644\uB8CC`,
      data: { userId, newBalance }
    });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});
app.get("/api/admin/payments", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(50, parseInt(c.req.query("limit") || "20"));
  const offset = (page - 1) * limit;
  try {
    const [countResult, rows] = await DB.batch([
      DB.prepare(`SELECT COUNT(*) AS cnt FROM credit_charges`),
      DB.prepare(`
        SELECT cc.*, u.email, u.nickname
        FROM credit_charges cc
        JOIN users u ON u.id = cc.user_id
        ORDER BY cc.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset)
    ]);
    const total = countResult.results[0]?.cnt ?? 0;
    return c.json({
      success: true,
      data: {
        payments: rows.results,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});
app.get("/api/admin/api-settings", async (c) => {
  const { DB } = c.env;
  if (!isAdminIp(c)) return c.json({ success: false, error: "Forbidden" }, 403);
  const denied = requireAdmin(c);
  if (denied) return c.json({ success: false, error: denied }, 401);
  try {
    await DB.prepare("CREATE TABLE IF NOT EXISTS api_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key_name TEXT UNIQUE NOT NULL, key_value TEXT NOT NULL, is_active INTEGER DEFAULT 1, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)").run();
    const rows = await DB.prepare("SELECT id,key_name,is_active,description,created_at,updated_at FROM api_settings ORDER BY id").all();
    return c.json({ success: true, data: rows.results });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});
app.post("/api/admin/api-settings", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const { key_name, key_value, description } = await c.req.json();
  if (!key_name || !key_value) return c.json({ success: false, error: "\uD0A4\uC640 \uAC12 \uD544\uC218" }, 400);
  const secret = c.env.ADMIN_SECRET || "psy_system_secret_2026";
  const kB = new TextEncoder().encode(secret.padEnd(32, "0").slice(0, 32));
  const vB = new TextEncoder().encode(key_value);
  const enc = btoa(String.fromCharCode(...vB.map((b, i) => b ^ kB[i % kB.length])));
  await DB.prepare("INSERT INTO api_settings (key_name,key_value,is_active,description,updated_at) VALUES (?,?,1,?,CURRENT_TIMESTAMP) ON CONFLICT(key_name) DO UPDATE SET key_value=excluded.key_value,is_active=1,description=excluded.description,updated_at=CURRENT_TIMESTAMP").bind(key_name, enc, description ?? "").run();
  return c.json({ success: true, message: `${key_name} \uC800\uC7A5\uB428` });
});
app.get("/api/admin/error-logs", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const limit = Math.min(100, parseInt(c.req.query("limit") || "50", 10));
  const service = c.req.query("service");
  const rows = await DB.prepare(
    service ? `SELECT * FROM error_logs WHERE service=? ORDER BY created_at DESC LIMIT ?` : `SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?`
  ).bind(...service ? [service, limit] : [limit]).all();
  return c.json({ success: true, data: rows.results });
});
app.delete("/api/admin/error-logs", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  await DB.prepare("DELETE FROM error_logs").run();
  return c.json({ success: true });
});
app.get("/api/admin/test-ai", async (c) => {
  const { DB } = c.env;
  const adminSecret = c.env.ADMIN_SECRET ?? "psy_system_secret_2026";
  const qSecret = c.req.query("secret") ?? "";
  if (qSecret !== adminSecret) {
    return c.html('<h2 style="font-family:sans-serif;color:red">\uC811\uADFC \uAC70\uBD80: secret \uD30C\uB77C\uBBF8\uD130\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</h2>', 403);
  }
  const apiKey = await getAnthropicKey(DB, c.env);
  if (!apiKey) return c.html('<h2 style="font-family:sans-serif;color:red">Anthropic API \uD0A4\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.</h2>', 500);
  const candidates = [
    "claude-sonnet-4-6",
    "claude-opus-4-7",
    "claude-haiku-4-5-20251001",
    "claude-haiku-4-5",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-haiku-20240307"
  ];
  const rows = [];
  for (const model of candidates) {
    let status = "";
    let color = "";
    try {
      const r = await fetch("https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: 5, messages: [{ role: "user", content: "hi" }] })
      });
      const body = await r.text().catch(() => "");
      if (r.ok) {
        status = "\u2705 \uC0AC\uC6A9 \uAC00\uB2A5";
        color = "#16a34a";
      } else {
        status = `\u274C ${r.status} \u2014 ${body.slice(0, 150)}`;
        color = "#dc2626";
      }
    } catch (e) {
      status = `\u26A0\uFE0F \uC624\uB958: ${e instanceof Error ? e.message : String(e)}`;
      color = "#d97706";
    }
    rows.push(`<tr><td style="padding:8px 16px;font-weight:600">${model}</td><td style="padding:8px 16px;color:${color}">${status}</td></tr>`);
  }
  const current = getAiModel(c.env);
  return c.html(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>AI \uBAA8\uB378 \uC9C4\uB2E8</title></head><body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px">
<h2>\u{1F50D} Anthropic \uBAA8\uB378 \uC811\uADFC \uC9C4\uB2E8</h2>
<p>\uD604\uC7AC \uAE30\uBCF8 \uBAA8\uB378: <strong style="color:#2563eb">${current}</strong></p>
<table border="1" cellspacing="0" style="border-collapse:collapse;width:100%;border-color:#e5e7eb">
<thead><tr style="background:#f3f4f6"><th style="padding:8px 16px;text-align:left">\uBAA8\uB378 ID</th><th style="padding:8px 16px;text-align:left">\uC0C1\uD0DC</th></tr></thead>
<tbody>${rows.join("")}</tbody></table>
<p style="margin-top:24px;color:#6b7280;font-size:14px">\u2705 \uC0AC\uC6A9 \uAC00\uB2A5 \uBAA8\uB378\uC744 Cloudflare \uB300\uC2DC\uBCF4\uB4DC \u2192 Workers \u2192 Settings \u2192 Variables \u2192 <strong>AI_MODEL</strong> \uC5D0 \uB4F1\uB85D\uD558\uC138\uC694.</p>
</body></html>`);
});
app.get("/", (c) => {
  const v = Date.now();
  const googleClientId = c.env.GOOGLE_CLIENT_ID || "";
  return c.html(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>\uB9C8\uC74C\uD480 \u2014 \uC804\uBB38 \uC2EC\uB9AC\uAC80\uC0AC & AI \uC0C1\uB2F4</title>
  <meta name="description" content="PHQ-9\xB7GAD-7\xB7Big5 \uB4F1 \uC804\uBB38 \uC2EC\uB9AC\uAC80\uC0AC 8\uC885\uC744 \uC628\uB77C\uC778\uC5D0\uC11C. AI \uC0C1\uB2F4\uC73C\uB85C \uB098\uC758 \uACB0\uACFC\uB97C \uAE4A\uC774 \uC774\uD574\uD558\uC138\uC694.">

  <!-- PWA -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2D6A4F">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="\uB9C8\uC74C\uD480">
  <link rel="apple-touch-icon" href="/static/icon-192.png">

  <!-- Open Graph (SNS \uACF5\uC720) -->
  <meta property="og:title" content="\uB9C8\uC74C\uD480 \u2014 \uC804\uBB38 \uC2EC\uB9AC\uAC80\uC0AC & AI \uC0C1\uB2F4">
  <meta property="og:description" content="PHQ-9\xB7Big5 \uB4F1 8\uC885 \uC804\uBB38 \uC2EC\uB9AC\uAC80\uC0AC. \uAC00\uC785 \uC989\uC2DC 10 \uD06C\uB808\uB527 \uBB34\uB8CC \uC9C0\uAE09.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/static/icon-512.png">

  <!-- \uD3F0\uD2B8 \uD504\uB9AC\uB85C\uB4DC -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/static/style.css?v=${v}">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"><\/script>
  ${googleClientId ? `<script src="https://accounts.google.com/gsi/client" async defer><\/script>` : ""}
  <script>window.GOOGLE_CLIENT_ID = ${JSON.stringify(googleClientId)};<\/script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" src="/static/landing.jsx?v=${v}"><\/script>
  <script type="text/babel" src="/static/counseling.jsx?v=${v}"><\/script>
  <script type="text/babel" src="/static/counseling_admin.jsx?v=${v}"><\/script>
  <script type="text/babel" src="/static/app.jsx?v=${v}"><\/script>
  <script>
    // Service Worker \uB4F1\uB85D (PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  <\/script>
</body>
</html>`);
});
function genJitsiRoom() {
  const adj = ["calm", "safe", "warm", "clear", "bright", "gentle", "quiet", "still"];
  const noun = ["forest", "river", "sky", "garden", "dawn", "wave", "leaf", "path"];
  const a = adj[Math.floor(Math.random() * adj.length)];
  const n = noun[Math.floor(Math.random() * noun.length)];
  const r = Math.random().toString(36).slice(2, 7);
  return `maumful-${a}-${n}-${r}`;
}
__name(genJitsiRoom, "genJitsiRoom");
async function sendAppointmentEmail(env2, to, nickname, opts) {
  const typeLabel = { video: "\uD654\uC0C1 \uC0C1\uB2F4", phone: "\uC804\uD654 \uC0C1\uB2F4", visit: "\uBC29\uBB38 \uC0C1\uB2F4" };
  const feeStr = opts.feeAmount.toLocaleString("ko-KR") + "\uC6D0";
  const dt = new Date(opts.scheduledAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
  const name = nickname || to.split("@")[0];
  const videoBlock = opts.videoUrl ? `<a href="${opts.videoUrl}" style="display:inline-block;margin:12px 0;padding:12px 28px;background:#2D6A4F;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">\u{1F4F9} \uD654\uC0C1 \uC0C1\uB2F4 \uC785\uC7A5\uD558\uAE30</a>` : "";
  await sendEmail(
    env2,
    to,
    `\u{1F33F} \uB9C8\uC74C\uD480 \u2014 ${opts.counselorName} \uC0C1\uB2F4\uC0AC \uC608\uC57D \uD655\uC815`,
    `<div style="font-family:'Noto Sans KR',sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#FAFAF8">
      <div style="background:#2D6A4F;color:white;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <h2 style="margin:0 0 4px;font-size:20px">\u{1F33F} \uB9C8\uC74C\uD480 \uC0C1\uB2F4 \uC608\uC57D \uD655\uC815</h2>
        <p style="margin:0;opacity:.8;font-size:13px">\uC544\uB798 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uC138\uC694</p>
      </div>
      <p>\uC548\uB155\uD558\uC138\uC694 <strong>${name}</strong>\uB2D8,<br>\uC0C1\uB2F4 \uC608\uC57D\uC774 \uD655\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</p>
      <div style="background:white;border-radius:12px;padding:20px;margin:16px 0;border:1px solid rgba(0,0,0,.08)">
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:7px 0;color:#888">\uC0C1\uB2F4\uC0AC</td><td style="font-weight:600">${opts.counselorName} \xB7 ${opts.centerName}</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">\uC77C\uC2DC</td><td style="border-top:1px solid #f0f0f0;font-weight:600">${dt}</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">\uC18C\uC694\uC2DC\uAC04</td><td style="border-top:1px solid #f0f0f0">${opts.durationMin}\uBD84</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">\uC720\uD615</td><td style="border-top:1px solid #f0f0f0">${typeLabel[opts.sessionType] || opts.sessionType}</td></tr>
          <tr><td style="padding:7px 0;color:#888;border-top:1px solid #f0f0f0">\uACB0\uC81C\uAE08\uC561</td><td style="border-top:1px solid #f0f0f0;font-weight:700;color:#2D6A4F">${feeStr}</td></tr>
        </table>
      </div>
      ${videoBlock}
      <p style="color:#888;font-size:12px;margin-top:24px">\uCDE8\uC18C\xB7\uBCC0\uACBD: \uC0C1\uB2F4 24\uC2DC\uAC04 \uC804\uAE4C\uC9C0 \uC804\uC561 \uD658\uBD88 \uAC00\uB2A5 \xB7 \uBB38\uC758: support@maumful.kr</p>
    </div>`
  );
}
__name(sendAppointmentEmail, "sendAppointmentEmail");
app.get("/api/counseling/centers", async (c) => {
  const { DB } = c.env;
  const rows = await DB.prepare(
    "SELECT id,name,logo_emoji,description,address,specialty_tags,status,contact_email,contact_phone,commission_rate FROM counseling_centers ORDER BY id"
  ).all();
  return c.json({ success: true, data: rows.results });
});
app.get("/api/counseling/counselors", async (c) => {
  const { DB } = c.env;
  const centerId = c.req.query("centerId");
  const q = centerId ? 'SELECT co.*,ce.name as center_name FROM counselors co JOIN counseling_centers ce ON co.center_id=ce.id WHERE co.center_id=? AND co.status="active" ORDER BY co.avg_rating DESC' : 'SELECT co.*,ce.name as center_name FROM counselors co JOIN counseling_centers ce ON co.center_id=ce.id WHERE co.status="active" ORDER BY co.avg_rating DESC';
  const rows = centerId ? await DB.prepare(q).bind(parseInt(centerId)).all() : await DB.prepare(q).all();
  return c.json({ success: true, data: rows.results });
});
app.get("/api/counseling/counselors/:id/slots", async (c) => {
  const { DB } = c.env;
  const counselorId = parseInt(c.req.param("id"));
  const dateStr = c.req.query("date");
  if (!dateStr) return c.json({ success: false, error: "date \uD30C\uB77C\uBBF8\uD130 \uD544\uC694" }, 400);
  const date = new Date(dateStr);
  const dow = date.getDay();
  const schedule = await DB.prepare(
    "SELECT start_time,end_time,slot_minutes FROM counselor_schedules WHERE counselor_id=? AND day_of_week=?"
  ).bind(counselorId, dow).first();
  if (!schedule) return c.json({ success: true, data: [] });
  const booked = await DB.prepare(
    'SELECT scheduled_at FROM appointments WHERE counselor_id=? AND DATE(scheduled_at)=? AND status NOT IN ("cancelled")'
  ).bind(counselorId, dateStr).all();
  const bookedTimes = new Set(booked.results.map((r) => r.scheduled_at.slice(11, 16)));
  const slots = [];
  const [sh, sm] = schedule.start_time.split(":").map(Number);
  const [eh, em] = schedule.end_time.split(":").map(Number);
  const endMin = eh * 60 + em;
  const slotMin = schedule.slot_minutes || 50;
  for (let cur = sh * 60 + sm; cur + slotMin <= endMin; cur += slotMin) {
    const h = String(Math.floor(cur / 60)).padStart(2, "0");
    const m = String(cur % 60).padStart(2, "0");
    const time3 = `${h}:${m}`;
    slots.push({ time: time3, available: !bookedTimes.has(time3) });
  }
  return c.json({ success: true, data: slots });
});
app.post("/api/counseling/appointments/prepare", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const body = await c.req.json();
  const { counselorId, scheduledAt, sessionType, userMemo } = body;
  const counselor = await DB.prepare(
    "SELECT co.*,ce.name as center_name,ce.commission_rate FROM counselors co JOIN counseling_centers ce ON co.center_id=ce.id WHERE co.id=?"
  ).bind(counselorId).first();
  if (!counselor) return c.json({ success: false, error: "\uC0C1\uB2F4\uC0AC \uC5C6\uC74C" }, 404);
  const user = await DB.prepare("SELECT email,nickname FROM users WHERE id=?").bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const conflict = await DB.prepare(
    'SELECT id FROM appointments WHERE counselor_id=? AND scheduled_at=? AND status NOT IN ("cancelled")'
  ).bind(counselorId, scheduledAt).first();
  if (conflict) return c.json({ success: false, error: "\uC774\uBBF8 \uC608\uC57D\uB41C \uC2DC\uAC04\uC785\uB2C8\uB2E4" }, 409);
  const videoRoomId = sessionType === "video" ? genJitsiRoom() : null;
  const videoRoomUrl = videoRoomId ? `https://meet.jit.si/${videoRoomId}` : null;
  const r = await DB.prepare(`
    INSERT INTO appointments (user_id,counselor_id,center_id,scheduled_at,duration_min,session_type,status,fee_amount,video_room_id,video_room_url,user_memo)
    VALUES (?,?,?,?,?,?,'pending',?,?,?,?)
  `).bind(userId, counselorId, counselor.center_id, scheduledAt, counselor.session_minutes, sessionType, counselor.fee_per_session, videoRoomId, videoRoomUrl, userMemo || null).run();
  const appointmentId = r.meta.last_row_id;
  const orderId = `appt_${appointmentId}_${Date.now()}`;
  const serviceUrl = c.env.SERVICE_URL || "http://localhost:3000";
  const tossClientKey = c.env.TOSS_CLIENT_KEY || "test_ck_OyL0qZ4G1VOgAKo3MaZVKX2m";
  return c.json({
    success: true,
    data: {
      appointmentId,
      orderId,
      amount: counselor.fee_per_session,
      orderName: `${counselor.name} \uC0C1\uB2F4\uC0AC ${sessionType === "video" ? "\uD654\uC0C1" : sessionType === "phone" ? "\uC804\uD654" : "\uBC29\uBB38"} \uC0C1\uB2F4 (${counselor.session_minutes}\uBD84)`,
      customerName: user.nickname || user.email.split("@")[0],
      customerEmail: user.email,
      successUrl: `${serviceUrl}/api/counseling/appointments/toss/success?appointmentId=${appointmentId}&orderId=${orderId}`,
      failUrl: `${serviceUrl}/api/counseling/appointments/toss/fail?appointmentId=${appointmentId}`,
      tossClientKey,
      videoRoomUrl
    }
  });
});
app.get("/api/counseling/appointments/toss/success", async (c) => {
  const { DB } = c.env;
  const { paymentKey, orderId, amount, appointmentId } = c.req.query();
  const tossKey = c.env.TOSS_SECRET_KEY;
  if (!tossKey) return c.redirect("/?counseling=fail&msg=\uC11C\uBC84\uC624\uB958");
  try {
    const confirmRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Basic " + btoa(tossKey + ":") },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) })
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json();
      await DB.prepare("UPDATE appointments SET status='cancelled' WHERE id=? AND status='pending'").bind(parseInt(appointmentId)).run();
      return c.redirect(`/?counseling=fail&msg=${encodeURIComponent(err.message || "\uACB0\uC81C\uC2E4\uD328")}`);
    }
    const appt = await DB.prepare(
      "SELECT ap.*,co.name as counselor_name,co.session_minutes,ce.name as center_name FROM appointments ap JOIN counselors co ON ap.counselor_id=co.id JOIN counseling_centers ce ON ap.center_id=ce.id WHERE ap.id=?"
    ).bind(parseInt(appointmentId)).first();
    if (appt) {
      await DB.prepare("UPDATE appointments SET status='confirmed',pg_tid=?,paid_at=CURRENT_TIMESTAMP WHERE id=?").bind(paymentKey, parseInt(appointmentId)).run();
      const user = await DB.prepare("SELECT email,nickname FROM users WHERE id=?").bind(appt.user_id).first();
      if (user) {
        await sendAppointmentEmail(c.env, user.email, user.nickname || "", {
          counselorName: appt.counselor_name,
          centerName: appt.center_name,
          scheduledAt: appt.scheduled_at,
          durationMin: appt.duration_min,
          sessionType: appt.session_type,
          feeAmount: appt.fee_amount,
          videoUrl: appt.video_room_url
        });
      }
    }
    return c.redirect(`/?counseling=success&appointmentId=${appointmentId}`);
  } catch (e) {
    console.error("[Counseling Toss] \uC624\uB958:", e);
    return c.redirect("/?counseling=fail&msg=\uC11C\uBC84\uC624\uB958");
  }
});
app.get("/api/counseling/appointments/toss/fail", async (c) => {
  const { DB } = c.env;
  const { appointmentId } = c.req.query();
  if (appointmentId) {
    await DB.prepare("UPDATE appointments SET status='cancelled' WHERE id=? AND status='pending'").bind(parseInt(appointmentId)).run();
  }
  return c.redirect("/?counseling=fail");
});
app.get("/api/counseling/appointments", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const rows = await DB.prepare(`
    SELECT ap.id,ap.scheduled_at,ap.duration_min,ap.session_type,ap.status,
           ap.fee_amount,ap.video_room_url,ap.video_room_id,ap.user_memo,ap.pg_tid,ap.paid_at,
           co.name as counselor_name,co.photo_emoji,co.title as counselor_title,
           ce.name as center_name
    FROM appointments ap
    JOIN counselors co ON ap.counselor_id=co.id
    JOIN counseling_centers ce ON ap.center_id=ce.id
    WHERE ap.user_id=?
    ORDER BY ap.scheduled_at DESC
    LIMIT 50
  `).bind(userId).all();
  return c.json({ success: true, data: rows.results });
});
app.patch("/api/counseling/appointments/:id/cancel", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const apptId = parseInt(c.req.param("id"));
  const appt = await DB.prepare(
    "SELECT * FROM appointments WHERE id=? AND user_id=?"
  ).bind(apptId, userId).first();
  if (!appt) return c.json({ success: false, error: "\uC608\uC57D \uC5C6\uC74C" }, 404);
  if (appt.status === "cancelled") return c.json({ success: false, error: "\uC774\uBBF8 \uCDE8\uC18C\uB428" }, 400);
  const scheduledMs = new Date(appt.scheduled_at).getTime();
  const nowMs = Date.now();
  const canRefund = scheduledMs - nowMs > 24 * 60 * 60 * 1e3;
  await DB.prepare("UPDATE appointments SET status='cancelled',cancelled_at=CURRENT_TIMESTAMP WHERE id=?").bind(apptId).run();
  return c.json({
    success: true,
    data: {
      refundable: canRefund,
      message: canRefund ? "\uD658\uBD88 \uCC98\uB9AC\uAC00 \uC9C4\uD589\uB429\uB2C8\uB2E4 (1~3 \uC601\uC5C5\uC77C)" : "24\uC2DC\uAC04 \uC774\uB0B4 \uCDE8\uC18C\uB294 \uD658\uBD88\uC774 \uBD88\uAC00\uD569\uB2C8\uB2E4"
    }
  });
});
app.get("/api/counseling/appointments/:id", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const apptId = parseInt(c.req.param("id"));
  const row = await DB.prepare(`
    SELECT ap.*,co.name as counselor_name,co.photo_emoji,co.title as counselor_title,ce.name as center_name
    FROM appointments ap JOIN counselors co ON ap.counselor_id=co.id JOIN counseling_centers ce ON ap.center_id=ce.id
    WHERE ap.id=? AND ap.user_id=?
  `).bind(apptId, userId).first();
  if (!row) return c.json({ success: false, error: "\uC5C6\uC74C" }, 404);
  return c.json({ success: true, data: row });
});
app.get("/api/admin/counseling/stats", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const month1st = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7) + "-01";
  const [centers, counselors, appts, revenue, reviews, onboarding] = await DB.batch([
    DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN status="active" THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN status="pending" THEN 1 ELSE 0 END) AS pending FROM counseling_centers'),
    DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN status="active" THEN 1 ELSE 0 END) AS active FROM counselors'),
    DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed, SUM(CASE WHEN DATE(created_at)=? THEN 1 ELSE 0 END) AS today FROM appointments`).bind(today),
    DB.prepare(`SELECT COALESCE(SUM(fee_amount),0) AS total_revenue, COALESCE(SUM(CASE WHEN created_at>=? THEN fee_amount ELSE 0 END),0) AS month_revenue FROM appointments WHERE status IN ('confirmed','completed') AND paid_at IS NOT NULL`).bind(month1st),
    DB.prepare("SELECT COUNT(*) AS total, AVG(rating) AS avg_rating FROM counseling_reviews WHERE admin_hidden=0"),
    DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN status="pending" THEN 1 ELSE 0 END) AS pending FROM center_onboarding_requests')
  ]);
  return c.json({ success: true, data: {
    centers: centers.results[0],
    counselors: counselors.results[0],
    appointments: appts.results[0],
    revenue: revenue.results[0],
    reviews: reviews.results[0],
    onboarding: onboarding.results[0]
  } });
});
app.get("/api/admin/counseling/centers", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const rows = await DB.prepare(`
    SELECT cc.*, COUNT(DISTINCT co.id) AS counselor_count,
           COUNT(DISTINCT ap.id) AS appt_count
    FROM counseling_centers cc
    LEFT JOIN counselors co ON co.center_id=cc.id AND co.status='active'
    LEFT JOIN appointments ap ON ap.center_id=cc.id AND ap.status IN ('confirmed','completed')
    GROUP BY cc.id ORDER BY cc.created_at DESC
  `).all();
  return c.json({ success: true, data: rows.results });
});
app.patch("/api/admin/counseling/centers/:id/status", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const { status, rejected_reason } = await c.req.json();
  if (!["pending", "active", "suspended"].includes(status)) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uC0C1\uD0DC" }, 400);
  const approvedAt = status === "active" ? "CURRENT_TIMESTAMP" : "NULL";
  await DB.prepare(`UPDATE counseling_centers SET status=?,approved_at=${status === "active" ? "CURRENT_TIMESTAMP" : "NULL"},rejected_reason=? WHERE id=?`).bind(status, rejected_reason || null, id).run();
  return c.json({ success: true });
});
app.get("/api/admin/counseling/counselors", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const rows = await DB.prepare(`
    SELECT co.*, ce.name AS center_name, ce.status AS center_status,
           COUNT(DISTINCT ap.id) AS total_appts,
           COALESCE(SUM(CASE WHEN ap.status='completed' THEN ap.fee_amount ELSE 0 END),0) AS total_earned
    FROM counselors co
    JOIN counseling_centers ce ON co.center_id=ce.id
    LEFT JOIN appointments ap ON ap.counselor_id=co.id
    GROUP BY co.id ORDER BY co.created_at DESC
  `).all();
  return c.json({ success: true, data: rows.results });
});
app.patch("/api/admin/counseling/counselors/:id", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const allowed = ["status", "fee_per_session", "session_minutes", "title", "bio", "specialties", "available_types"];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (body[k] !== void 0) {
      sets.push(`${k}=?`);
      vals.push(body[k]);
    }
  }
  if (sets.length === 0) return c.json({ success: false, error: "\uBCC0\uACBD \uC0AC\uD56D \uC5C6\uC74C" }, 400);
  vals.push(id);
  await DB.prepare(`UPDATE counselors SET ${sets.join(",")} WHERE id=?`).bind(...vals).run();
  return c.json({ success: true });
});
app.get("/api/admin/counseling/appointments", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const status = c.req.query("status") || "";
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;
  const where = status ? `WHERE ap.status=?` : "";
  const binds = status ? [status, limit, offset] : [limit, offset];
  const rows = await DB.prepare(`
    SELECT ap.id, ap.scheduled_at, ap.session_type, ap.status, ap.fee_amount, ap.paid_at,
           ap.video_room_id, ap.earning_processed,
           u.email AS user_email, u.nickname AS user_nickname,
           co.name AS counselor_name, co.photo_emoji,
           ce.name AS center_name
    FROM appointments ap
    JOIN users u ON ap.user_id=u.id
    JOIN counselors co ON ap.counselor_id=co.id
    JOIN counseling_centers ce ON ap.center_id=ce.id
    ${where}
    ORDER BY ap.created_at DESC LIMIT ? OFFSET ?
  `).bind(...binds).all();
  return c.json({ success: true, data: rows.results, page, limit });
});
app.patch("/api/admin/counseling/appointments/:id/complete", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const appt = await DB.prepare(
    "SELECT ap.*,co.commission_rate as cr_rate,ce.commission_rate as center_rate FROM appointments ap JOIN counselors co ON ap.counselor_id=co.id JOIN counseling_centers ce ON ap.center_id=ce.id WHERE ap.id=?"
  ).bind(id).first();
  if (!appt) return c.json({ success: false, error: "\uC608\uC57D \uC5C6\uC74C" }, 404);
  if (appt.status === "completed") return c.json({ success: false, error: "\uC774\uBBF8 \uC644\uB8CC\uB428" }, 400);
  const commRate = appt.center_rate || 10;
  const commAmt = Math.round(appt.fee_amount * commRate / 100);
  const netAmt = appt.fee_amount - commAmt;
  await DB.batch([
    DB.prepare("UPDATE appointments SET status='completed',completed_at=CURRENT_TIMESTAMP,earning_processed=1 WHERE id=?").bind(id),
    DB.prepare("INSERT INTO counselor_earnings (counselor_id,appointment_id,gross_amount,commission_rate,commission_amt,net_amount) VALUES (?,?,?,?,?,?)").bind(appt.counselor_id, id, appt.fee_amount, commRate, commAmt, netAmt),
    DB.prepare("UPDATE counselors SET avg_rating=(SELECT AVG(rating) FROM counseling_reviews WHERE counselor_id=?),review_count=(SELECT COUNT(*) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0) WHERE id=?").bind(appt.counselor_id, appt.counselor_id, appt.counselor_id)
  ]);
  return c.json({ success: true, data: { net_amount: netAmt, commission_amt: commAmt } });
});
app.get("/api/admin/counseling/settlements", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const rows = await DB.prepare(`
    SELECT s.*, cc.name AS center_name, cc.logo_emoji
    FROM settlements s JOIN counseling_centers cc ON s.center_id=cc.id
    ORDER BY s.created_at DESC LIMIT 50
  `).all();
  return c.json({ success: true, data: rows.results });
});
app.post("/api/admin/counseling/settlements", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const { center_id, period_start, period_end } = await c.req.json();
  const center = await DB.prepare("SELECT commission_rate FROM counseling_centers WHERE id=?").bind(parseInt(center_id)).first();
  if (!center) return c.json({ success: false, error: "\uC13C\uD130 \uC5C6\uC74C" }, 404);
  const agg = await DB.prepare(`
    SELECT COUNT(*) AS appt_count, COALESCE(SUM(fee_amount),0) AS total_revenue
    FROM appointments
    WHERE center_id=? AND status='completed' AND DATE(completed_at) BETWEEN ? AND ?
      AND earning_processed=1
  `).bind(parseInt(center_id), period_start, period_end).first();
  if (!agg || agg.appt_count === 0) return c.json({ success: false, error: "\uC815\uC0B0\uD560 \uC644\uB8CC \uC608\uC57D \uC5C6\uC74C" }, 400);
  const commRate = center.commission_rate || 10;
  const commAmt = Math.round(agg.total_revenue * commRate / 100);
  const payoutAmt = agg.total_revenue - commAmt;
  const r = await DB.prepare(`
    INSERT INTO settlements (center_id,period_start,period_end,total_revenue,commission_amt,payout_amt,appt_count)
    VALUES (?,?,?,?,?,?,?)
  `).bind(parseInt(center_id), period_start, period_end, agg.total_revenue, commAmt, payoutAmt, agg.appt_count).run();
  return c.json({ success: true, data: { settlement_id: r.meta.last_row_id, payout_amt: payoutAmt, appt_count: agg.appt_count } });
});
app.patch("/api/admin/counseling/settlements/:id/process", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const { note } = await c.req.json();
  await DB.prepare("UPDATE settlements SET status='completed',processed_at=CURRENT_TIMESTAMP,note=? WHERE id=?").bind(note || null, id).run();
  return c.json({ success: true });
});
app.get("/api/admin/counseling/onboarding", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const rows = await DB.prepare("SELECT * FROM center_onboarding_requests ORDER BY created_at DESC LIMIT 50").all();
  return c.json({ success: true, data: rows.results });
});
app.patch("/api/admin/counseling/onboarding/:id", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const { status, admin_note } = await c.req.json();
  if (!["reviewing", "approved", "rejected"].includes(status)) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uC0C1\uD0DC" }, 400);
  await DB.prepare("UPDATE center_onboarding_requests SET status=?,admin_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?").bind(status, admin_note || null, id).run();
  if (status === "approved") {
    const req = await DB.prepare("SELECT * FROM center_onboarding_requests WHERE id=?").bind(id).first();
    if (req) {
      await DB.prepare(`
        INSERT INTO counseling_centers (name,description,address,specialty_tags,status,contact_email,contact_phone,approved_at)
        VALUES (?,?,?,?,'active',?,?,CURRENT_TIMESTAMP)
      `).bind(req.center_name, req.description || "", req.address || "", req.specialty_tags || "[]", req.contact_email, req.contact_phone || "").run();
    }
  }
  return c.json({ success: true });
});
app.post("/api/admin/counseling/centers", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const body = await c.req.json();
  if (!body.name?.trim()) return c.json({ success: false, error: "\uC13C\uD130\uBA85\uC740 \uD544\uC218\uC785\uB2C8\uB2E4" }, 400);
  const result = await DB.prepare(`
    INSERT INTO counseling_centers
      (name, description, address, specialty_tags, contact_email, contact_phone,
       logo_emoji, commission_rate, status, approved_at)
    VALUES (?,?,?,?,?,?,?,?,?,CASE WHEN ? = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END)
  `).bind(
    body.name.trim(),
    body.description || "",
    body.address || "",
    body.specialty_tags || "[]",
    body.contact_email || "",
    body.contact_phone || "",
    body.logo_emoji || "\u{1F3E5}",
    body.commission_rate ?? 10,
    body.status || "active",
    body.status || "active"
  ).run();
  return c.json({ success: true, data: { id: result.meta.last_row_id } });
});
app.put("/api/admin/counseling/centers/:id", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const allowed = [
    "name",
    "description",
    "address",
    "specialty_tags",
    "contact_email",
    "contact_phone",
    "logo_emoji",
    "commission_rate",
    "status"
  ];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (body[k] !== void 0) {
      sets.push(`${k}=?`);
      vals.push(body[k]);
      if (k === "status" && body[k] === "active") {
        sets.push("approved_at=CURRENT_TIMESTAMP");
      }
    }
  }
  if (sets.length === 0) return c.json({ success: false, error: "\uBCC0\uACBD \uC0AC\uD56D \uC5C6\uC74C" }, 400);
  vals.push(id);
  await DB.prepare(`UPDATE counseling_centers SET ${sets.join(",")} WHERE id=?`).bind(...vals).run();
  return c.json({ success: true });
});
app.delete("/api/admin/counseling/centers/:id", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const counselorCount = await DB.prepare(
    "SELECT COUNT(*) AS cnt FROM counselors WHERE center_id=?"
  ).bind(id).first();
  if ((counselorCount?.cnt ?? 0) > 0)
    return c.json({ success: false, error: "\uC18C\uC18D \uC0C1\uB2F4\uC0AC\uAC00 \uC788\uC5B4 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C1\uB2F4\uC0AC\uB97C \uBA3C\uC800 \uC774\uC804\uD558\uAC70\uB098 \uC0AD\uC81C\uD558\uC138\uC694." }, 409);
  await DB.prepare("DELETE FROM counseling_centers WHERE id=?").bind(id).run();
  return c.json({ success: true });
});
app.post("/api/admin/counseling/counselors", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const body = await c.req.json();
  if (!body.center_id || !body.name?.trim())
    return c.json({ success: false, error: "\uC18C\uC18D \uC13C\uD130\uC640 \uC774\uB984\uC740 \uD544\uC218\uC785\uB2C8\uB2E4" }, 400);
  const center = await DB.prepare("SELECT id FROM counseling_centers WHERE id=?").bind(body.center_id).first();
  if (!center) return c.json({ success: false, error: "\uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uC13C\uD130\uC785\uB2C8\uB2E4" }, 404);
  const result = await DB.prepare(`
    INSERT INTO counselors
      (center_id, name, title, bio, specialties, available_types,
       fee_per_session, session_minutes, photo_emoji, status, contact_email, avg_rating, review_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0)
  `).bind(
    body.center_id,
    body.name.trim(),
    body.title || "",
    body.bio || "",
    body.specialties || "[]",
    body.available_types || '["visit"]',
    body.fee_per_session ?? 5e4,
    body.session_minutes ?? 50,
    body.photo_emoji || "\u{1F464}",
    body.status || "active",
    body.contact_email || ""
  ).run();
  return c.json({ success: true, data: { id: result.meta.last_row_id } });
});
app.put("/api/admin/counseling/counselors/:id", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const allowed = [
    "center_id",
    "name",
    "title",
    "bio",
    "specialties",
    "available_types",
    "fee_per_session",
    "session_minutes",
    "photo_emoji",
    "status",
    "contact_email"
  ];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (body[k] !== void 0) {
      sets.push(`${k}=?`);
      vals.push(body[k]);
    }
  }
  if (sets.length === 0) return c.json({ success: false, error: "\uBCC0\uACBD \uC0AC\uD56D \uC5C6\uC74C" }, 400);
  vals.push(id);
  await DB.prepare(`UPDATE counselors SET ${sets.join(",")} WHERE id=?`).bind(...vals).run();
  return c.json({ success: true });
});
app.delete("/api/admin/counseling/counselors/:id", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const activeAppts = await DB.prepare(
    "SELECT COUNT(*) AS cnt FROM appointments WHERE counselor_id=? AND status IN ('pending','confirmed')"
  ).bind(id).first();
  if ((activeAppts?.cnt ?? 0) > 0)
    return c.json({ success: false, error: "\uC9C4\uD589 \uC911\uC778 \uC608\uC57D\uC774 \uC788\uC5B4 \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 409);
  await DB.prepare("DELETE FROM counselor_schedules WHERE counselor_id=?").bind(id).run();
  await DB.prepare("DELETE FROM counselors WHERE id=?").bind(id).run();
  return c.json({ success: true });
});
app.get("/api/admin/counseling/counselors/:id/schedules", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const rows = await DB.prepare(
    "SELECT * FROM counselor_schedules WHERE counselor_id=? ORDER BY day_of_week"
  ).bind(id).all();
  return c.json({ success: true, data: rows.results });
});
app.post("/api/admin/counseling/counselors/:id/schedules", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const counselorId = parseInt(c.req.param("id"));
  const { schedules } = await c.req.json();
  if (!Array.isArray(schedules)) return c.json({ success: false, error: "\uC2A4\uCF00\uC904 \uBC30\uC5F4 \uD544\uC694" }, 400);
  await DB.prepare("DELETE FROM counselor_schedules WHERE counselor_id=?").bind(counselorId).run();
  for (const s of schedules) {
    if (s.day_of_week < 0 || s.day_of_week > 6) continue;
    await DB.prepare(
      "INSERT INTO counselor_schedules (counselor_id,day_of_week,start_time,end_time,slot_minutes) VALUES (?,?,?,?,?)"
    ).bind(counselorId, s.day_of_week, s.start_time, s.end_time, s.slot_minutes || 50).run();
  }
  return c.json({ success: true });
});
app.post("/api/counseling/reviews", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { appointment_id, rating, content, is_anonymous } = await c.req.json();
  if (rating < 1 || rating > 5) return c.json({ success: false, error: "\uD3C9\uC810\uC740 1~5" }, 400);
  const appt = await DB.prepare('SELECT * FROM appointments WHERE id=? AND user_id=? AND status="completed"').bind(appointment_id, userId).first();
  if (!appt) return c.json({ success: false, error: "\uC644\uB8CC\uB41C \uC608\uC57D\uC774 \uC5C6\uAC70\uB098 \uC811\uADFC \uBD88\uAC00" }, 404);
  const existing = await DB.prepare("SELECT id FROM counseling_reviews WHERE appointment_id=?").bind(appointment_id).first();
  if (existing) return c.json({ success: false, error: "\uC774\uBBF8 \uB9AC\uBDF0\uB97C \uC791\uC131\uD588\uC2B5\uB2C8\uB2E4" }, 409);
  await DB.prepare("INSERT INTO counseling_reviews (appointment_id,user_id,counselor_id,rating,content,is_anonymous) VALUES (?,?,?,?,?,?)").bind(appointment_id, userId, appt.counselor_id, rating, content || null, is_anonymous ? 1 : 0).run();
  await DB.prepare("UPDATE counselors SET avg_rating=(SELECT AVG(rating) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0),review_count=(SELECT COUNT(*) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0) WHERE id=?").bind(appt.counselor_id, appt.counselor_id, appt.counselor_id).run();
  return c.json({ success: true });
});
app.get("/api/counseling/reviews/:counselorId", async (c) => {
  const { DB } = c.env;
  const counselorId = parseInt(c.req.param("counselorId"));
  const page = parseInt(c.req.query("page") || "1");
  const limit = 10;
  const rows = await DB.prepare(`
    SELECT cr.id, cr.rating, cr.content, cr.is_anonymous, cr.counselor_reply, cr.created_at,
           CASE WHEN cr.is_anonymous=1 THEN '\uC775\uBA85' ELSE COALESCE(u.nickname, u.email) END AS reviewer_name
    FROM counseling_reviews cr JOIN users u ON cr.user_id=u.id
    WHERE cr.counselor_id=? AND cr.admin_hidden=0 AND cr.is_public=1
    ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
  `).bind(counselorId, limit, (page - 1) * limit).all();
  return c.json({ success: true, data: rows.results, page });
});
app.get("/api/admin/counseling/reviews", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const rows = await DB.prepare(`
    SELECT cr.id, cr.rating, cr.content, cr.is_anonymous, cr.admin_hidden, cr.created_at,
           co.name AS counselor_name, co.id AS counselor_id,
           CASE WHEN cr.is_anonymous=1 THEN '\uC775\uBA85' ELSE COALESCE(u.nickname, u.email) END AS reviewer_name
    FROM counseling_reviews cr
    JOIN counselors co ON cr.counselor_id=co.id
    JOIN users u ON cr.user_id=u.id
    ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, (page - 1) * limit).all();
  const total = await DB.prepare("SELECT COUNT(*) AS cnt FROM counseling_reviews").first();
  return c.json({ success: true, data: rows.results, total: total?.cnt || 0, page });
});
app.patch("/api/admin/counseling/reviews/:id/visibility", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const { hidden } = await c.req.json();
  await DB.prepare("UPDATE counseling_reviews SET admin_hidden=? WHERE id=?").bind(hidden ? 1 : 0, id).run();
  const rev = await DB.prepare("SELECT counselor_id FROM counseling_reviews WHERE id=?").bind(id).first();
  if (rev) {
    await DB.prepare("UPDATE counselors SET avg_rating=(SELECT AVG(rating) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0),review_count=(SELECT COUNT(*) FROM counseling_reviews WHERE counselor_id=? AND admin_hidden=0) WHERE id=?").bind(rev.counselor_id, rev.counselor_id, rev.counselor_id).run();
  }
  return c.json({ success: true });
});
app.get("/api/push/vapid-key", (c) => {
  const key = c.env.VAPID_PUBLIC_KEY || "";
  return c.json({ success: true, key });
});
app.post("/api/push/subscribe", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { endpoint, p256dh, auth } = await c.req.json();
  if (!endpoint || !p256dh || !auth) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uAD6C\uB3C5 \uC815\uBCF4" }, 400);
  await DB.prepare(`
    INSERT INTO push_subscriptions (user_id, service, endpoint, p256dh, auth_key)
    VALUES (?, 'maumful', ?, ?, ?)
    ON CONFLICT(user_id, service) DO UPDATE SET endpoint=excluded.endpoint, p256dh=excluded.p256dh, auth_key=excluded.auth_key
  `).bind(userId, endpoint, p256dh, auth).run();
  return c.json({ success: true });
});
app.post("/api/counseling/onboarding", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  const body = await c.req.json();
  const { center_name, contact_name, contact_email, contact_phone, address, specialty_tags, description, counselor_count, website_url, business_reg_num } = body;
  if (!center_name || !contact_name || !contact_email) return c.json({ success: false, error: "\uD544\uC218 \uD56D\uBAA9 \uB204\uB77D" }, 400);
  const r = await DB.prepare(`
    INSERT INTO center_onboarding_requests (user_id,center_name,contact_name,contact_email,contact_phone,address,specialty_tags,description,counselor_count,website_url,business_reg_num)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).bind(userId || null, center_name, contact_name, contact_email, contact_phone || null, address || null, specialty_tags || "[]", description || null, counselor_count || 1, website_url || null, business_reg_num || null).run();
  return c.json({ success: true, data: { request_id: r.meta.last_row_id } });
});
app.patch("/api/admin/counseling/appointments/:id/note", async (c) => {
  const { DB } = c.env;
  const denied = adminGuard(c);
  if (denied) return c.json({ success: false, error: denied }, denied === "Forbidden" ? 403 : 401);
  const id = parseInt(c.req.param("id"));
  const { counselor_note } = await c.req.json();
  await DB.prepare("UPDATE appointments SET counselor_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(counselor_note || null, id).run();
  return c.json({ success: true });
});
async function handleScheduled(env2) {
  const DB = env2.DB;
  const tossKey = env2.TOSS_BILLING_KEY || env2.TOSS_SECRET_KEY;
  if (!tossKey) {
    console.error("[Cron] TOSS_BILLING_KEY \uBBF8\uC124\uC815");
    return;
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const subs = await DB.prepare(
    "SELECT * FROM user_subscriptions WHERE status='active' AND DATE(next_billing_date) <= ?"
  ).bind(today).all();
  const plans = {
    basic: { name: "\uBCA0\uC774\uC9C1", monthlyCredits: 60, price: 3900 },
    standard: { name: "\uC2A4\uD0E0\uB2E4\uB4DC", monthlyCredits: 150, price: 8900 },
    pro: { name: "\uD504\uB85C", monthlyCredits: 400, price: 19900 }
  };
  for (const sub of subs.results) {
    const plan = plans[sub.plan_key];
    if (!plan || !sub.billing_key) continue;
    try {
      const res = await fetch("https://api.tosspayments.com/v1/billing/" + sub.billing_key, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Basic " + btoa(tossKey + ":") },
        body: JSON.stringify({
          customerKey: sub.customer_key,
          amount: plan.price,
          orderId: `sub_${sub.user_id}_${Date.now()}`,
          orderName: `\uB9C8\uC74C\uD480 ${plan.name} \uAD6C\uB3C5`,
          customerEmail: ""
        })
      });
      const result = await res.json();
      if (res.ok && result.paymentKey) {
        const nextDate = /* @__PURE__ */ new Date();
        nextDate.setMonth(nextDate.getMonth() + 1);
        await DB.batch([
          DB.prepare("UPDATE users SET credits = credits + ? WHERE id=?").bind(plan.monthlyCredits, sub.user_id),
          DB.prepare("INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after) SELECT ?,?,?,?,credits FROM users WHERE id=?").bind(sub.user_id, "gain", plan.monthlyCredits, `subscription_renewal_${sub.plan_key}`, sub.user_id),
          DB.prepare("UPDATE user_subscriptions SET next_billing_date=?, current_period_start=CURRENT_TIMESTAMP WHERE id=?").bind(nextDate.toISOString(), sub.id),
          DB.prepare("INSERT INTO subscription_invoices (user_id,subscription_id,plan_key,amount,status,pg_tid) VALUES (?,?,?,?,?,?)").bind(sub.user_id, sub.id, sub.plan_key, plan.price, "paid", result.paymentKey)
        ]);
        console.log(`[Cron] \uAD6C\uB3C5 \uAC31\uC2E0 \uC131\uACF5: user_id=${sub.user_id}, plan=${sub.plan_key}`);
      } else {
        await DB.prepare("UPDATE user_subscriptions SET status='past_due' WHERE id=?").bind(sub.id).run();
        await DB.prepare("INSERT INTO subscription_invoices (user_id,subscription_id,plan_key,amount,status) VALUES (?,?,?,?,'failed')").bind(sub.user_id, sub.id, sub.plan_key, plan.price).run();
        console.error(`[Cron] \uAD6C\uB3C5 \uAC31\uC2E0 \uC2E4\uD328: user_id=${sub.user_id}, code=${result.code}`);
      }
    } catch (e) {
      console.error("[Cron] \uC624\uB958:", e);
    }
  }
}
__name(handleScheduled, "handleScheduled");
app.post("/api/user/cookie-consent", async (c) => {
  const { KV } = c.env;
  const { consent } = await c.req.json();
  const userId = await getAuthUserId(c.req.raw, KV);
  const key = userId ? `cookie_consent:${userId}` : `cookie_consent:ip:${c.req.header("cf-connecting-ip") || "unknown"}`;
  await KV.put(key, JSON.stringify({ consent, timestamp: (/* @__PURE__ */ new Date()).toISOString() }), { expirationTtl: 365 * 86400 });
  return c.json({ success: true });
});
app.get("/api/user/cookie-consent", async (c) => {
  const { KV } = c.env;
  const userId = await getAuthUserId(c.req.raw, KV);
  const key = userId ? `cookie_consent:${userId}` : `cookie_consent:ip:${c.req.header("cf-connecting-ip") || "unknown"}`;
  const val = await KV.get(key);
  return c.json({ success: true, data: val ? JSON.parse(val) : null });
});
var index_default = {
  fetch: app.fetch.bind(app),
  async scheduled(_event, env2) {
    await handleScheduled(env2);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
