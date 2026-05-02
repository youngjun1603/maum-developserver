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
async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [hdr, payload, sig] = parts;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const decode = /* @__PURE__ */ __name((s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)), "decode");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decode(sig),
      new TextEncoder().encode(`${hdr}.${payload}`)
    );
    if (!valid) return null;
    const p = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (p.exp && Date.now() / 1e3 > p.exp) return null;
    return Number(p.sub || p.id) || null;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function getCoupleUserId(req, env2) {
  const secret = await env2.KV.get("JWT_SECRET") ?? env2.JWT_SECRET;
  if (!secret) return null;
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : new URL(req.url).searchParams.get("t") || "";
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.type && !["couple", "game", void 0].includes(payload.type)) return null;
  } catch {
    return null;
  }
  return verifyJWT(token, secret);
}
__name(getCoupleUserId, "getCoupleUserId");
function isMasterAccount(email) {
  return !!email && ["limyj007@gmail.com"].includes(email.toLowerCase());
}
__name(isMasterAccount, "isMasterAccount");
function genSessionCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => chars[b % chars.length]).join("");
}
__name(genSessionCode, "genSessionCode");
async function getAnthropicKey(env2) {
  return env2.ANTHROPIC_API_KEY ?? null;
}
__name(getAnthropicKey, "getAnthropicKey");
async function signVapidJwt(privateKeyB64u, audience) {
  const b64uDec = /* @__PURE__ */ __name((s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)), "b64uDec");
  const b64uEnc = /* @__PURE__ */ __name((buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"), "b64uEnc");
  const raw2 = b64uDec(privateKeyB64u);
  const pkcs8 = new Uint8Array([
    48,
    65,
    2,
    1,
    0,
    48,
    19,
    6,
    7,
    42,
    134,
    72,
    206,
    61,
    2,
    1,
    6,
    8,
    42,
    134,
    72,
    206,
    61,
    3,
    1,
    7,
    4,
    39,
    48,
    37,
    2,
    1,
    1,
    4,
    32,
    ...raw2
  ]);
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1e3);
  const hdr = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const pay = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: "mailto:noreply@maumful.com" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(`${hdr}.${pay}`));
  return `${hdr}.${pay}.${b64uEnc(sig)}`;
}
__name(signVapidJwt, "signVapidJwt");
async function sendWebPush(endpoint, privKey, pubKey) {
  try {
    const origin = new URL(endpoint).origin;
    const jwt = await signVapidJwt(privKey, origin);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Authorization": `vapid t=${jwt},k=${pubKey}`, "TTL": "86400", "Content-Length": "0" }
    });
    return res.status < 300;
  } catch {
    return false;
  }
}
__name(sendWebPush, "sendWebPush");
function calcCost(testType, isMaster) {
  if (isMaster) return 0;
  const count3 = testType.split("+").length;
  if (count3 >= 3) return 45;
  if (count3 === 2) return 35;
  return 20;
}
__name(calcCost, "calcCost");
async function spendCredits(db, userId, amount, reason, refId) {
  const result = await db.prepare(
    "UPDATE users SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND credits >= ?"
  ).bind(amount, userId, amount).run();
  if (!result.meta.changes) {
    const u = await db.prepare("SELECT credits FROM users WHERE id=?").bind(userId).first();
    return { ok: false, balance: u?.credits ?? 0, error: "insufficient_credits" };
  }
  const updated = await db.prepare("SELECT credits FROM users WHERE id=?").bind(userId).first();
  const newBalance = updated.credits;
  await db.prepare(
    "INSERT INTO credit_transactions (user_id,type,amount,reason,balance_after,ref_id) VALUES (?,?,?,?,?,?)"
  ).bind(userId, "spend", amount, reason, newBalance, refId ?? null).run();
  return { ok: true, balance: newBalance };
}
__name(spendCredits, "spendCredits");
function buildCouplePrompt(hostName, guestName, hostBig5, guestBig5, hostLost, guestLost, hostDsi, guestDsi) {
  const NL = "\n";
  let prompt = `\uB2F9\uC2E0\uC740 \uCEE4\uD50C\xB7\uBD80\uBD80 \uC2EC\uB9AC \uBD84\uC11D \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. \uB450 \uC0AC\uB78C\uC758 \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C \uB530\uB73B\uD558\uACE0 \uC2E4\uC9C8\uC801\uC778 \uCEE4\uD50C \uBD84\uC11D \uB9AC\uD3EC\uD2B8\uB97C \uC791\uC131\uD574\uC8FC\uC138\uC694.${NL}${NL}`;
  prompt += `[\uBD84\uC11D \uB300\uC0C1]${NL}\uD30C\uD2B8\uB108 A: ${hostName}${NL}\uD30C\uD2B8\uB108 B: ${guestName}${NL}${NL}`;
  if (hostBig5 && guestBig5) {
    const labels = { O: "\uAC1C\uBC29\uC131", C: "\uC131\uC2E4\uC131", E: "\uC678\uD5A5\uC131", A: "\uCE5C\uD654\uC131", N: "\uC2E0\uACBD\uC131" };
    prompt += `[BIG5 \uC131\uACA9\uAC80\uC0AC \uACB0\uACFC]${NL}`;
    for (const key of ["O", "C", "E", "A", "N"]) {
      const hv = hostBig5[key] ?? 0;
      const gv = guestBig5[key] ?? 0;
      prompt += `${labels[key]}: ${hostName} ${hv}\uC810 / ${guestName} ${gv}\uC810 (\uCC28\uC774: ${Math.abs(Number(hv) - Number(gv)).toFixed(2)}\uC810)${NL}`;
    }
    prompt += NL;
  }
  if (hostLost && guestLost) {
    prompt += `[LOST \uD589\uB3D9 \uC6B4\uC601\uCCB4\uACC4]${NL}`;
    prompt += `${hostName}: ${hostLost.typeCode ?? "?"} \u2014 ${hostLost.typeName ?? ""}${NL}`;
    prompt += `${guestName}: ${guestLost.typeCode ?? "?"} \u2014 ${guestLost.typeName ?? ""}${NL}${NL}`;
  }
  if (hostDsi && guestDsi) {
    const SCALE_MAX = { "\uC790\uAE30\uC785\uC7A5 \uC720\uC9C0": 50, "\uC815\uC11C\uBC18\uC751\uC131": 35, "\uC815\uC11C\uC801 \uB2E8\uC808": 20, "\uC735\uD569\xB7\uAD00\uACC4\uC758\uC874": 20 };
    const hScales = hostDsi.scales ?? {};
    const gScales = guestDsi.scales ?? {};
    const hTotal = hostDsi.total ?? 0;
    const gTotal = guestDsi.total ?? 0;
    prompt += `[\uC790\uC544\uBD84\uD654(SDRI) \uAC80\uC0AC \uACB0\uACFC \u2014 Bowen \uC774\uB860 \uAE30\uBC18]${NL}`;
    prompt += `\uCD1D\uC810: ${hostName} ${hTotal}\uC810 / ${guestName} ${gTotal}\uC810 (\uB9CC\uC810 125\uC810)${NL}`;
    for (const scale of Object.keys(SCALE_MAX)) {
      const hv = hScales[scale] ?? 0;
      const gv = gScales[scale] ?? 0;
      const max = SCALE_MAX[scale];
      const hPct = Math.round(hv / max * 100);
      const gPct = Math.round(gv / max * 100);
      prompt += `  \u2022 ${scale}: ${hostName} ${hv}/${max}(${hPct}%) / ${guestName} ${gv}/${max}(${gPct}%)${NL}`;
    }
    prompt += `[\uC790\uC544\uBD84\uD654 \uCC99\uB3C4 \uD574\uC11D \uCC38\uACE0]${NL}`;
    prompt += `- \uC790\uAE30\uC785\uC7A5 \uC720\uC9C0 \uB192\uC74C: \uC555\uB825 \uC18D\uC5D0\uC11C\uB3C4 \uC790\uAE30 \uAE30\uC900 \uC720\uC9C0 \u2192 \uAC74\uAC15\uD55C \uBD84\uD654${NL}`;
    prompt += `- \uC815\uC11C\uBC18\uC751\uC131 \uB192\uC74C: \uAC08\uB4F1 \uC0C1\uD669\uC5D0\uC11C \uAC10\uC815 \uBC18\uC751\uC131 \uB192\uC74C \u2192 \uC0C1\uD638 \uCD09\uBC1C \uC704\uD5D8${NL}`;
    prompt += `- \uC815\uC11C\uC801 \uB2E8\uC808 \uB192\uC74C: \uAC08\uB4F1 \uC2DC \uC815\uC11C\uC801 \uAC70\uB9AC\uB450\uAE30 \uACBD\uD5A5 \u2192 \uD68C\uD53C \uD328\uD134${NL}`;
    prompt += `- \uC735\uD569\xB7\uAD00\uACC4\uC758\uC874 \uB192\uC74C: \uC0C1\uB300 \uAC10\uC815\uC5D0 \uACFC\uB3C4\uD558\uAC8C \uB3D9\uD654 \u2192 \uACF5\uC0DD \uD328\uD134${NL}${NL}`;
  }
  prompt += `[\uB9AC\uD3EC\uD2B8 \uC791\uC131 \uC9C0\uCE68]${NL}\uB2E4\uC74C \uC21C\uC11C\uB85C \uC791\uC131\uD574\uC8FC\uC138\uC694:${NL}`;
  prompt += `1. \uAD81\uD569 \uC810\uC218 (0~100\uC810 \uC22B\uC790\uB9CC): SCORE:XX${NL}`;
  prompt += `2. \uB450 \uC0AC\uB78C\uC758 \uC2EC\uB9AC \uD2B9\uC131 \uC694\uC57D (\uAC01 3\uC904 \uC774\uB0B4)${NL}`;
  prompt += `3. \uAC15\uC810 \uC601\uC5ED: \uB450 \uC0AC\uB78C\uC774 \uC798 \uB9DE\uB294 \uBD80\uBD84 3\uAC00\uC9C0${NL}`;
  prompt += `4. \uC131\uC7A5 \uC601\uC5ED: \uD568\uAED8 \uB178\uB825\uD558\uBA74 \uC88B\uC744 \uBD80\uBD84 2\uAC00\uC9C0 (\uAE0D\uC815\uC801 \uD45C\uD604\uC73C\uB85C)${NL}`;
  if (hostDsi && guestDsi) {
    prompt += `5. \uC790\uC544\uBD84\uD654 \uAD00\uC810 \uD1B5\uCC30: \uB450 \uC0AC\uB78C\uC758 \uBD84\uD654 \uC218\uC900 \uCC28\uC774\uAC00 \uAD00\uACC4\uC5D0 \uBBF8\uCE58\uB294 \uC601\uD5A5\uACFC \uBC1C\uC804 \uBC29\uD5A5${NL}`;
    prompt += `6. \uAD00\uACC4 \uBC1C\uC804 \uC81C\uC548: \uBD80\uBD80/\uCEE4\uD50C \uC0C1\uB2F4\uC5D0\uC11C \uD65C\uC6A9\uD560 \uC218 \uC788\uB294 \uAD6C\uCCB4\uC801 \uC2E4\uCC9C \uD301 3\uAC00\uC9C0${NL}`;
    prompt += `7. \uB300\uD654 \uC2DC\uC791 \uC9C8\uBB38: \uB450 \uC0AC\uB78C\uC774 \uD568\uAED8 \uD0D0\uC0C9\uD560 \uC8FC\uC81C 2\uAC00\uC9C0${NL}`;
  } else {
    prompt += `5. \uAD00\uACC4 \uBC1C\uC804 \uC81C\uC548: \uAD6C\uCCB4\uC801\uC778 \uC2E4\uCC9C \uD301 3\uAC00\uC9C0${NL}`;
    prompt += `6. \uB300\uD654 \uC2DC\uC791 \uC9C8\uBB38: \uB450 \uC0AC\uB78C\uC774 \uD568\uAED8 \uD574\uBCFC \uB300\uD654 \uC8FC\uC81C 2\uAC00\uC9C0${NL}`;
  }
  prompt += `${NL}\uC804\uCCB4 \uBD84\uB7C9\uC740 700\uC790 \uC774\uB0B4, \uB530\uB73B\uD558\uACE0 \uD76C\uB9DD\uC801\uC778 \uD1A4\uC73C\uB85C \uC791\uC131\uD558\uC138\uC694.${NL}`;
  prompt += `\uC9C4\uB2E8\uBA85\xB7\uBCD1\uBA85\uC740 \uC808\uB300 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC138\uC694. \uC804\uBB38 \uC0C1\uB2F4 \uC5F0\uACC4\uB294 \uB9C8\uC9C0\uB9C9\uC5D0 \uD55C \uBC88\uB9CC \uC5B8\uAE09\uD558\uC138\uC694.`;
  return prompt;
}
__name(buildCouplePrompt, "buildCouplePrompt");
var app = new Hono2();
app.use("/api/*", cors());
var HTML = /* @__PURE__ */ __name((v) => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>\uB9C8\uC74C\uCEE4\uD50C \u2014 \uCEE4\uD50C \uC2EC\uB9AC \uBD84\uC11D</title>
  <meta name="description" content="BIG5\xB7LOST \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB85C \uCEE4\uD50C \uAD81\uD569\uACFC \uAD00\uACC4 \uD328\uD134\uC744 \uBD84\uC11D\uD574\uBCF4\uC138\uC694.">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/static/icon-192.png">
  <meta name="theme-color" content="#E05A8A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="\uB9C8\uC74C\uCEE4\uD50C">
  <meta property="og:title" content="\uB9C8\uC74C\uCEE4\uD50C \u2014 \uCEE4\uD50C \uC2EC\uB9AC \uBD84\uC11D">
  <meta property="og:description" content="BIG5\xB7LOST \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB85C \uCEE4\uD50C \uAD81\uD569\uACFC \uAD00\uACC4 \uD328\uD134\uC744 \uBD84\uC11D\uD574\uBCF4\uC138\uC694.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="/static/icon-512.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans KR', sans-serif; background: #FDF7F9; -webkit-font-smoothing: antialiased; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script type="text/babel" src="/static/couple_hub.jsx?v=${v}"><\/script>
</head>
<body>
  <div id="root"></div>
  <script>
    // URL ?t= \uD30C\uB77C\uBBF8\uD130\uB85C maumful JWT \uD1A0\uD070 \uC218\uC2E0 (SSO \u2014 \uBCC4\uB3C4 \uB85C\uADF8\uC778 \uBD88\uD544\uC694)
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    const codeParam = urlParams.get('code'); // \uD30C\uD2B8\uB108 \uCD08\uB300\uCF54\uB4DC
    if (t) {
      localStorage.setItem('couple_token', t);
      const nextUrl = codeParam ? '/?code=' + encodeURIComponent(codeParam) : '/';
      window.history.replaceState({}, '', nextUrl);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  <\/script>
</body>
</html>`, "HTML");
app.get("/favicon.ico", () => fetch("https://maumful.limyj007.workers.dev/favicon.ico"));
app.get("/favicon.png", () => fetch("https://maumful.limyj007.workers.dev/favicon.png"));
app.get("/", (c) => c.html(HTML(Date.now().toString(36))));
app.get("/api/couple/me", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare(
    "SELECT id, email, nickname, credits, locale FROM users WHERE id=?"
  ).bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const testResults = await DB.prepare(
    `SELECT test_type, result_json, performed_at
     FROM test_history
     WHERE user_id=? AND test_type IN ('BIG5','LOST','DSI') AND result_json IS NOT NULL
     ORDER BY performed_at DESC LIMIT 6`
  ).bind(userId).all();
  const latestBig5 = testResults.results.find((r) => r.test_type === "BIG5") ?? null;
  const latestLost = testResults.results.find((r) => r.test_type === "LOST") ?? null;
  const latestDsi = testResults.results.find((r) => r.test_type === "DSI") ?? null;
  const activeSession = await DB.prepare(
    `SELECT * FROM couple_sessions
     WHERE (host_user_id=? OR guest_user_id=?)
       AND status IN ('waiting','both_done')
       AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, userId).first();
  const recentReports = await DB.prepare(
    `SELECT id, session_code, test_type, status, ai_report_text,
            compatibility_score, created_at, host_user_id, guest_user_id
     FROM couple_sessions
     WHERE (host_user_id=? OR guest_user_id=?) AND status='reported'
     ORDER BY created_at DESC LIMIT 3`
  ).bind(userId, userId).all();
  const isMaster = isMasterAccount(user.email);
  return c.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, nickname: user.nickname, credits: user.credits },
      testResults: {
        // NEW-BUG-3 FIX: JSON.parse 예외처리 추가
        big5: latestBig5 ? (() => {
          try {
            return { ...latestBig5, data: JSON.parse(latestBig5.result_json) };
          } catch {
            return null;
          }
        })() : null,
        lost: latestLost ? (() => {
          try {
            return { ...latestLost, data: JSON.parse(latestLost.result_json) };
          } catch {
            return null;
          }
        })() : null,
        dsi: latestDsi ? (() => {
          try {
            return { ...latestDsi, data: JSON.parse(latestDsi.result_json) };
          } catch {
            return null;
          }
        })() : null,
        hasEnoughData: !!(latestBig5 || latestLost || latestDsi)
      },
      activeSession,
      recentReports: recentReports.results,
      isMaster
    }
  });
});
app.get("/api/couple/credits", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare("SELECT credits FROM users WHERE id=?").bind(userId).first();
  return c.json({ success: true, data: { balance: user?.credits ?? 0 } });
});
app.post("/api/couple/session", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare(
    "SELECT email, credits FROM users WHERE id=?"
  ).bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const { test_type = "BIG5+LOST+DSI" } = await c.req.json().catch(() => ({}));
  const VALID_TYPES = ["BIG5", "LOST", "DSI", "BIG5+LOST", "BIG5+DSI", "LOST+DSI", "BIG5+LOST+DSI"];
  if (!VALID_TYPES.includes(test_type)) return c.json({ success: false, error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAC80\uC0AC \uC870\uD569" }, 400);
  const COST = calcCost(test_type, isMasterAccount(user.email));
  if (!isMasterAccount(user.email) && user.credits < COST) {
    return c.json({
      success: false,
      error: `\uD06C\uB808\uB527 \uBD80\uC871 (\uBCF4\uC720: ${user.credits}, \uD544\uC694: ${COST})`,
      balance: user.credits,
      needsCharge: true
    }, 402);
  }
  const existing = await DB.prepare(
    `SELECT * FROM couple_sessions WHERE host_user_id=? AND status='waiting' AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1`
  ).bind(userId).first();
  if (existing && existing.test_type === test_type) {
    return c.json({ success: true, data: { session: existing, isExisting: true } });
  }
  if (existing && existing.test_type !== test_type) {
    await DB.prepare(
      `UPDATE couple_sessions SET status='expired', updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).bind(existing.id).run();
  }
  const types = test_type.split("+");
  const big5Row = types.includes("BIG5") ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first() : null;
  const lostRow = types.includes("LOST") ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first() : null;
  const dsiRow = types.includes("DSI") ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='DSI' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first() : null;
  const hostResult = {};
  try {
    if (big5Row) hostResult.big5 = JSON.parse(big5Row.result_json);
  } catch {
  }
  try {
    if (lostRow) hostResult.lost = JSON.parse(lostRow.result_json);
  } catch {
  }
  try {
    if (dsiRow) hostResult.dsi = JSON.parse(dsiRow.result_json);
  } catch {
  }
  let code = "";
  for (let i = 0; i < 10; i++) {
    const c2 = genSessionCode();
    const dup = await DB.prepare("SELECT id FROM couple_sessions WHERE session_code=?").bind(c2).first();
    if (!dup) {
      code = c2;
      break;
    }
  }
  if (!code) return c.json({ success: false, error: "\uCF54\uB4DC \uC0DD\uC131 \uC2E4\uD328. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." }, 500);
  if (COST > 0) {
    const result = await spendCredits(DB, userId, COST, "couple", code);
    if (!result.ok) return c.json({ success: false, error: "\uD06C\uB808\uB527 \uCC28\uAC10 \uC2E4\uD328", balance: result.balance }, 402);
  }
  const created = await DB.prepare(
    `INSERT INTO couple_sessions (session_code, host_user_id, test_type, host_result_json, status, credits_spent)
     VALUES (?,?,?,?,?,?)`
  ).bind(code, userId, test_type, JSON.stringify(hostResult), "waiting", COST).run();
  const session = await DB.prepare("SELECT * FROM couple_sessions WHERE id=?").bind(created.meta.last_row_id).first();
  return c.json({ success: true, data: { session, cost: COST } });
});
app.post("/api/couple/join", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { code } = await c.req.json().catch(() => ({}));
  if (!code || code.length !== 6) return c.json({ success: false, error: "\uC62C\uBC14\uB978 \uCF54\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." }, 400);
  const session = await DB.prepare(
    `SELECT * FROM couple_sessions WHERE session_code=? AND expires_at > datetime('now')`
  ).bind(code.toUpperCase()).first();
  if (!session) return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uCF54\uB4DC\uC785\uB2C8\uB2E4. \uCF54\uB4DC\uB97C \uB2E4\uC2DC \uD655\uC778\uD574\uC8FC\uC138\uC694." }, 404);
  if (session.host_user_id === userId) return c.json({ success: false, error: "\uBCF8\uC778\uC774 \uB9CC\uB4E0 \uC138\uC158\uC785\uB2C8\uB2E4. \uD30C\uD2B8\uB108\uC5D0\uAC8C \uCF54\uB4DC\uB97C \uACF5\uC720\uD574\uC8FC\uC138\uC694." }, 400);
  if (session.guest_user_id && session.guest_user_id !== userId) return c.json({ success: false, error: "\uC774\uBBF8 \uB2E4\uB978 \uD30C\uD2B8\uB108\uAC00 \uCC38\uC5EC\uD55C \uC138\uC158\uC785\uB2C8\uB2E4." }, 409);
  if (session.status !== "waiting") return c.json({ success: false, error: "\uC774\uBBF8 \uC644\uB8CC\uB41C \uC138\uC158\uC785\uB2C8\uB2E4." }, 400);
  const gTypes = session.test_type.split("+");
  const gBig5 = gTypes.includes("BIG5") ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first() : null;
  const gLost = gTypes.includes("LOST") ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first() : null;
  const gDsi = gTypes.includes("DSI") ? await DB.prepare(
    `SELECT result_json FROM test_history WHERE user_id=? AND test_type='DSI' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
  ).bind(userId).first() : null;
  const guestResult = {};
  try {
    if (gBig5) guestResult.big5 = JSON.parse(gBig5.result_json);
  } catch {
  }
  try {
    if (gLost) guestResult.lost = JSON.parse(gLost.result_json);
  } catch {
  }
  try {
    if (gDsi) guestResult.dsi = JSON.parse(gDsi.result_json);
  } catch {
  }
  const hostHasData = (() => {
    try {
      return Object.keys(JSON.parse(session.host_result_json || "{}")).length > 0;
    } catch {
      return false;
    }
  })();
  const guestHasData = Object.keys(guestResult).length > 0;
  const newStatus = hostHasData && guestHasData ? "both_done" : "waiting";
  await DB.prepare(
    `UPDATE couple_sessions SET guest_user_id=?, guest_result_json=?, status=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=?`
  ).bind(userId, JSON.stringify(guestResult), newStatus, session.id).run();
  const updated = await DB.prepare("SELECT * FROM couple_sessions WHERE id=?").bind(session.id).first();
  if (c.env.VAPID_PRIVATE_KEY && c.env.VAPID_PUBLIC_KEY) {
    const hostSub = await DB.prepare(
      `SELECT endpoint FROM push_subscriptions WHERE user_id=? AND service='maumcouple'`
    ).bind(session.host_user_id).first();
    if (hostSub) {
      sendWebPush(hostSub.endpoint, c.env.VAPID_PRIVATE_KEY, c.env.VAPID_PUBLIC_KEY).catch(() => {
      });
    }
  }
  return c.json({ success: true, data: { session: updated, guestJoined: true } });
});
app.get("/api/couple/vapid-key", (c) => {
  return c.json({ success: true, key: c.env.VAPID_PUBLIC_KEY || "" });
});
app.post("/api/couple/push-subscribe", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { endpoint, p256dh, auth } = await c.req.json().catch(() => ({}));
  if (!endpoint || !p256dh || !auth) return c.json({ success: false, error: "\uC798\uBABB\uB41C \uAD6C\uB3C5 \uC815\uBCF4" }, 400);
  await DB.prepare(`
    INSERT INTO push_subscriptions (user_id, service, endpoint, p256dh, auth_key)
    VALUES (?, 'maumcouple', ?, ?, ?)
    ON CONFLICT(user_id, service) DO UPDATE SET endpoint=excluded.endpoint, p256dh=excluded.p256dh, auth_key=excluded.auth_key
  `).bind(userId, endpoint, p256dh, auth).run();
  return c.json({ success: true });
});
app.get("/api/couple/session/:code", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const code = c.req.param("code");
  const session = await DB.prepare(
    "SELECT * FROM couple_sessions WHERE session_code=?"
  ).bind(code.toUpperCase()).first();
  if (!session) return c.json({ success: false, error: "\uC138\uC158 \uC5C6\uC74C" }, 404);
  if (session.host_user_id !== userId && session.guest_user_id !== userId) {
    return c.json({ success: false, error: "\uC811\uADFC \uAD8C\uD55C \uC5C6\uC74C" }, 403);
  }
  const otherId = session.host_user_id === userId ? session.guest_user_id : session.host_user_id;
  let partnerName = "\uD30C\uD2B8\uB108";
  if (otherId) {
    const other = await DB.prepare("SELECT nickname, email FROM users WHERE id=?").bind(otherId).first();
    partnerName = other?.nickname || other?.email?.split("@")[0] || "\uD30C\uD2B8\uB108";
  }
  return c.json({ success: true, data: { session, partnerName, myRole: session.host_user_id === userId ? "host" : "guest" } });
});
app.post("/api/couple/report", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { session_code } = await c.req.json().catch(() => ({}));
  if (!session_code) return c.json({ success: false, error: "\uC138\uC158 \uCF54\uB4DC \uD544\uC694" }, 400);
  const session = await DB.prepare(
    "SELECT * FROM couple_sessions WHERE session_code=?"
  ).bind(session_code.toUpperCase()).first();
  if (!session) return c.json({ success: false, error: "\uC138\uC158 \uC5C6\uC74C" }, 404);
  if (session.host_user_id !== userId && session.guest_user_id !== userId) {
    return c.json({ success: false, error: "\uC811\uADFC \uAD8C\uD55C \uC5C6\uC74C" }, 403);
  }
  if (session.status !== "both_done") {
    return c.json({ success: false, error: "\uC544\uC9C1 \uB450 \uC0AC\uB78C \uBAA8\uB450 \uC900\uBE44\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 400);
  }
  if (session.ai_report_text) {
    return c.json({ success: true, data: { report: session.ai_report_text, compatibility_score: session.compatibility_score, cached: true } });
  }
  const host = await DB.prepare("SELECT nickname, email FROM users WHERE id=?").bind(session.host_user_id).first();
  const guest = session.guest_user_id ? await DB.prepare("SELECT nickname, email FROM users WHERE id=?").bind(session.guest_user_id).first() : null;
  const hostName = host?.nickname || host?.email?.split("@")[0] || "A";
  const guestName = guest?.nickname || guest?.email?.split("@")[0] || "B";
  const hostData = (() => {
    try {
      return session.host_result_json ? JSON.parse(session.host_result_json) : {};
    } catch {
      return {};
    }
  })();
  const guestData = (() => {
    try {
      return session.guest_result_json ? JSON.parse(session.guest_result_json) : {};
    } catch {
      return {};
    }
  })();
  const prompt = buildCouplePrompt(
    hostName,
    guestName,
    hostData.big5 ?? null,
    guestData.big5 ?? null,
    hostData.lost ?? null,
    guestData.lost ?? null,
    hostData.dsi ?? null,
    guestData.dsi ?? null
  );
  const apiKey = await getAnthropicKey(c.env);
  if (!apiKey) return c.json({ error: "API \uD0A4 \uBBF8\uC124\uC815" }, 500);
  const res = await fetch("https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1500, stream: false, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[Couple Report] Anthropic error:", res.status, errText);
    return c.json({ error: "AI \uC624\uB958", detail: errText, httpStatus: res.status }, 502);
  }
  const aiData = await res.json();
  const reportText = aiData.content?.find((b) => b.type === "text")?.text ?? "";
  const scoreMatch = reportText.match(/SCORE:(\d+)/);
  const compatScore = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 70;
  const cleanReport = reportText.replace(/SCORE:\d+\n?/, "").trim();
  await DB.prepare(
    `UPDATE couple_sessions SET ai_report_text=?, compatibility_score=?, status='reported', updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(cleanReport, compatScore, session.id).run();
  return c.json({ success: true, data: { report: cleanReport, compatibility_score: compatScore } });
});
app.post("/api/couple/save-result", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { test_type, result_json } = await c.req.json().catch(() => ({}));
  if (!test_type || !result_json) return c.json({ success: false, error: "\uD30C\uB77C\uBBF8\uD130 \uBD80\uC871" }, 400);
  if (!["BIG5", "LOST", "DSI"].includes(test_type)) return c.json({ success: false, error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAC80\uC0AC \uC720\uD615" }, 400);
  await DB.prepare(
    `UPDATE test_history SET result_json=? WHERE id=(
       SELECT id FROM test_history WHERE user_id=? AND test_type=? ORDER BY performed_at DESC LIMIT 1
     )`
  ).bind(JSON.stringify(result_json), userId, test_type).run();
  return c.json({ success: true });
});
app.patch("/api/couple/session/:code/cancel", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const code = c.req.param("code").toUpperCase();
  const session = await DB.prepare(
    "SELECT * FROM couple_sessions WHERE session_code=?"
  ).bind(code).first();
  if (!session) return c.json({ success: false, error: "\uC138\uC158 \uC5C6\uC74C" }, 404);
  if (session.host_user_id !== userId) return c.json({ success: false, error: "host\uB9CC \uCDE8\uC18C \uAC00\uB2A5\uD569\uB2C8\uB2E4" }, 403);
  if (session.status === "reported") return c.json({ success: false, error: "\uC644\uB8CC\uB41C \uC138\uC158\uC740 \uCDE8\uC18C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4" }, 400);
  if (session.status === "expired") return c.json({ success: false, error: "\uC774\uBBF8 \uB9CC\uB8CC\uB41C \uC138\uC158\uC785\uB2C8\uB2E4" }, 400);
  await DB.prepare(
    `UPDATE couple_sessions SET status='expired', updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(session.id).run();
  return c.json({ success: true, message: "\uC138\uC158\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
});
app.get("/api/couple/partner-info/:code", async (c) => {
  const { DB } = c.env;
  const code = c.req.param("code").toUpperCase();
  const session = await DB.prepare(
    `SELECT session_code, test_type, host_user_id, status, expires_at
     FROM couple_sessions WHERE session_code=? AND expires_at > datetime('now')`
  ).bind(code).first();
  if (!session) return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB9C1\uD06C\uC785\uB2C8\uB2E4." }, 404);
  if (session.status !== "waiting") return c.json({ success: false, error: "\uC774\uBBF8 \uD30C\uD2B8\uB108\uAC00 \uCC38\uC5EC\uD55C \uC138\uC158\uC785\uB2C8\uB2E4." }, 400);
  const host = await DB.prepare("SELECT nickname, email FROM users WHERE id=?").bind(session.host_user_id).first();
  const hostName = host?.nickname || host?.email?.split("@")[0] || "\uD30C\uD2B8\uB108";
  return c.json({ success: true, data: { session_code: code, test_type: session.test_type, host_name: hostName } });
});
app.post("/api/couple/partner-submit", async (c) => {
  const { DB } = c.env;
  const { session_code, results } = await c.req.json().catch(() => ({}));
  if (!session_code || !results) return c.json({ success: false, error: "\uD30C\uB77C\uBBF8\uD130 \uBD80\uC871" }, 400);
  const session = await DB.prepare(
    `SELECT * FROM couple_sessions WHERE session_code=? AND expires_at > datetime('now')`
  ).bind(session_code.toUpperCase()).first();
  if (!session) return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB9C1\uD06C\uC785\uB2C8\uB2E4." }, 404);
  if (session.status !== "waiting") return c.json({ success: false, error: "\uC774\uBBF8 \uD30C\uD2B8\uB108\uAC00 \uCC38\uC5EC\uD55C \uC138\uC158\uC785\uB2C8\uB2E4." }, 400);
  if (session.guest_result_json) return c.json({ success: false, error: "\uC774\uBBF8 \uC81C\uCD9C\uB41C \uACB0\uACFC\uAC00 \uC788\uC2B5\uB2C8\uB2E4." }, 409);
  const hostHasData = (() => {
    try {
      return Object.keys(JSON.parse(session.host_result_json || "{}")).length > 0;
    } catch {
      return false;
    }
  })();
  const newStatus = hostHasData ? "both_done" : "waiting";
  await DB.prepare(
    `UPDATE couple_sessions SET guest_result_json=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).bind(JSON.stringify(results), newStatus, session.id).run();
  return c.json({ success: true, data: { status: newStatus } });
});
app.post("/api/couple/coach", async (c) => {
  const { DB, KV } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare("SELECT email, nickname, credits FROM users WHERE id=?").bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const { messages } = await c.req.json().catch(() => ({}));
  if (!messages?.length) return c.json({ success: false, error: "\uBA54\uC2DC\uC9C0 \uD544\uC694" }, 400);
  const isMaster = isMasterAccount(user.email);
  const FREE_LIMIT = 3;
  const PAID_COST = 2;
  const today = new Date(Date.now() + 9 * 3600 * 1e3).toISOString().slice(0, 10);
  const counterKey = `couple_coach:${userId}:${today}`;
  const usedToday = parseInt(await KV.get(counterKey) || "0", 10);
  if (!isMaster) {
    if (usedToday >= FREE_LIMIT) {
      if (user.credits < PAID_COST) {
        return c.json({ success: false, error: `\uD06C\uB808\uB527 \uBD80\uC871 (\uD544\uC694: ${PAID_COST}cr)`, needsCharge: true, usedToday }, 402);
      }
      await spendCredits(DB, userId, PAID_COST, "couple-coach");
    }
  }
  const name = user.nickname || user.email.split("@")[0];
  let personalCtx = "";
  try {
    const big5Row = await DB.prepare(
      `SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`
    ).bind(userId).first();
    if (big5Row) {
      const b = JSON.parse(big5Row.result_json);
      const traits = [];
      if ((b.E || 50) > 60) traits.push("\uC678\uD5A5\uC801");
      else if ((b.E || 50) < 40) traits.push("\uB0B4\uD5A5\uC801");
      if ((b.A || 50) > 65) traits.push("\uCE5C\uD654\uB825 \uB192\uC74C");
      if ((b.N || 50) > 65) traits.push("\uAC10\uC218\uC131 \uC608\uBBFC");
      if ((b.C || 50) > 65) traits.push("\uACC4\uD68D\uC801");
      if (traits.length) personalCtx = `
[\uB0B4\uB2F4\uC790 \uD2B9\uC131] ${name}: ${traits.join(", ")}`;
    }
  } catch {
  }
  const systemPrompt = `\uB2F9\uC2E0\uC740 \uB530\uB73B\uD558\uACE0 \uACF5\uAC10\uC801\uC778 \uCEE4\uD50C\xB7\uC5F0\uC560 \uAD00\uACC4 \uCF54\uCE58\uC785\uB2C8\uB2E4.${personalCtx}

\uB0B4\uB2F4\uC790\uC758 \uC5F0\uC560 \uACE0\uBBFC\uC774\uB098 \uAD00\uACC4 \uBB38\uC81C\uC5D0 \uB300\uD574 \uC804\uBB38\uC801\uC774\uACE0 \uC2E4\uC9C8\uC801\uC778 \uC870\uC5B8\uC744 \uD574\uC8FC\uC138\uC694.
- \uC2EC\uB9AC\uD559 \uAE30\uBC18 \uADFC\uAC70 \uC788\uB294 \uC870\uC5B8 (\uC560\uCC29 \uC774\uB860, \uBE44\uD3ED\uB825 \uC18C\uD1B5 \uB4F1)
- \uC9C4\uB2E8\uBA85\xB7\uBCD1\uBA85 \uC808\uB300 \uC0AC\uC6A9 \uAE08\uC9C0
- \uB530\uB73B\uD558\uACE0 \uBE44\uD310\uD558\uC9C0 \uC54A\uB294 \uD1A4
- \uB2F5\uBCC0\uC740 200\uC790 \uC774\uB0B4, \uAC04\uACB0\uD558\uAC8C
- \uD544\uC694 \uC2DC \uAD6C\uCCB4\uC801\uC778 \uB300\uD654 \uC608\uC2DC\uB098 \uC2E4\uCC9C \uBC29\uBC95 \uC81C\uC548`;
  const apiKey = await getAnthropicKey(c.env);
  if (!apiKey) return c.json({ error: "API \uD0A4 \uBBF8\uC124\uC815" }, 500);
  const res = await fetch("https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    return c.json({ error: "AI \uC624\uB958", detail: errText }, 502);
  }
  const aiData = await res.json();
  const replyText = aiData.content?.find((b) => b.type === "text")?.text ?? "";
  if (!isMaster) {
    await KV.put(counterKey, String(usedToday + 1), { expirationTtl: 86400 });
  }
  return c.json({
    success: true,
    data: {
      reply: replyText,
      usedToday: usedToday + 1,
      freeLimit: FREE_LIMIT,
      isPaid: usedToday >= FREE_LIMIT,
      creditsSpent: !isMaster && usedToday >= FREE_LIMIT ? PAID_COST : 0
    }
  });
});
app.get("/api/couple/checkins", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const rows = await DB.prepare(
    `SELECT id, total_score, answers_json, created_at
     FROM relationship_checkins WHERE user_id=?
     ORDER BY created_at DESC LIMIT 6`
  ).bind(userId).all();
  const now = new Date(Date.now() + 9 * 3600 * 1e3);
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const donThisMonth = rows.results.some((r) => r.created_at.startsWith(thisMonth));
  return c.json({ success: true, data: { checkins: rows.results, doneThisMonth: donThisMonth } });
});
app.post("/api/couple/checkin", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { answers } = await c.req.json().catch(() => ({}));
  if (!answers || typeof answers !== "object") return c.json({ success: false, error: "\uB2F5\uBCC0 \uB370\uC774\uD130 \uD544\uC694" }, 400);
  const now = new Date(Date.now() + 9 * 3600 * 1e3);
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const existing = await DB.prepare(
    `SELECT id FROM relationship_checkins WHERE user_id=? AND created_at >= ? AND created_at < ?`
  ).bind(userId, `${thisMonth}-01`, `${thisMonth}-32`).first();
  if (existing) return c.json({ success: false, error: "\uC774\uBC88 \uB2EC \uCCB4\uD06C\uC778\uC740 \uC774\uBBF8 \uC644\uB8CC\uD588\uC2B5\uB2C8\uB2E4.", doneThisMonth: true }, 409);
  const values = Object.values(answers).map(Number).filter((v) => v >= 1 && v <= 5);
  if (values.length < 5) return c.json({ success: false, error: "\uCDA9\uBD84\uD55C \uB2F5\uBCC0\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 400);
  const totalScore = values.reduce((a, b) => a + b, 0);
  await DB.prepare(
    `INSERT INTO relationship_checkins (user_id, total_score, answers_json) VALUES (?,?,?)`
  ).bind(userId, totalScore, JSON.stringify(answers)).run();
  return c.json({ success: true, data: { totalScore, maxScore: values.length * 5 } });
});
app.post("/api/couple/date-course", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare("SELECT email, credits, nickname FROM users WHERE id=?").bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const { region, mood, duration, budget } = await c.req.json().catch(() => ({}));
  if (!region || !mood || !duration || !budget) {
    return c.json({ success: false, error: "\uC9C0\uC5ED, \uBD84\uC704\uAE30, \uC2DC\uAC04, \uC608\uC0B0\uC744 \uBAA8\uB450 \uC120\uD0DD\uD574\uC8FC\uC138\uC694." }, 400);
  }
  const isMaster = isMasterAccount(user.email);
  const COST = 3;
  if (!isMaster && user.credits < COST) {
    return c.json({ success: false, error: `\uD06C\uB808\uB527 \uBD80\uC871 (\uBCF4\uC720: ${user.credits}, \uD544\uC694: ${COST})`, needsCharge: true }, 402);
  }
  const [big5Row, lostRow] = await Promise.all([
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first(),
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first()
  ]);
  const name = user.nickname || user.email.split("@")[0];
  let personalityCtx = "";
  try {
    if (big5Row) {
      const b = JSON.parse(big5Row.result_json);
      const isExtrovert = (b.E || 50) > 55;
      const isOpenMinded = (b.O || 50) > 55;
      personalityCtx = `
[\uC131\uACA9 \uCC38\uACE0] ${name}\uC740(\uB294) ${isExtrovert ? "\uC678\uD5A5\uC801" : "\uB0B4\uD5A5\uC801"}\uC774\uACE0 ${isOpenMinded ? "\uC0C8\uB85C\uC6B4 \uACBD\uD5D8\uC744 \uC88B\uC544\uD568" : "\uC775\uC219\uD55C \uD658\uACBD\uC744 \uC120\uD638\uD568"}.`;
    }
    if (lostRow) {
      const l = JSON.parse(lostRow.result_json);
      if (l.typeCode) personalityCtx += ` LOST \uC720\uD615: ${l.typeCode}.`;
    }
  } catch {
  }
  const prompt = `\uB2F9\uC2E0\uC740 \uCEE4\uD50C \uB370\uC774\uD2B8 \uD50C\uB798\uB108\uC785\uB2C8\uB2E4. \uC544\uB798 \uC870\uAC74\uC5D0 \uB9DE\uB294 \uB370\uC774\uD2B8 \uCF54\uC2A4\uB97C \uCD94\uCC9C\uD574\uC8FC\uC138\uC694.${personalityCtx}

[\uC870\uAC74]
- \uC9C0\uC5ED: ${region}
- \uBD84\uC704\uAE30: ${mood}
- \uC18C\uC694 \uC2DC\uAC04: ${duration}
- \uC608\uC0B0: ${budget}

[\uC791\uC131 \uD615\uC2DD \u2014 \uBC18\uB4DC\uC2DC \uC774 \uD615\uC2DD\uC73C\uB85C\uB9CC \uC791\uC131]
\u{1F4CD} \uCD94\uCC9C \uC7A5\uC18C
1. [\uC7A5\uC18C\uBA85] \u2014 \uD55C\uC904 \uC124\uBA85 (\uC18C\uC694\uC2DC\uAC04)
2. [\uC7A5\uC18C\uBA85] \u2014 \uD55C\uC904 \uC124\uBA85 (\uC18C\uC694\uC2DC\uAC04)
3. [\uC7A5\uC18C\uBA85] \u2014 \uD55C\uC904 \uC124\uBA85 (\uC18C\uC694\uC2DC\uAC04)

\u{1F5FA}\uFE0F \uCD94\uCC9C \uB3D9\uC120
\uC7A5\uC18C1 \u2192 \uC7A5\uC18C2 \u2192 \uC7A5\uC18C3 \uD750\uB984 \uC124\uBA85 (2\uC904 \uC774\uB0B4)

\u2728 \uC624\uB298\uC758 \uB370\uC774\uD2B8 \uD3EC\uC778\uD2B8
\uC774 \uCF54\uC2A4\uC758 \uD2B9\uBCC4\uD55C \uC810 \uD55C \uAC00\uC9C0 (2\uC904 \uC774\uB0B4)

\u{1F4AC} \uD568\uAED8 \uB098\uB20C \uB300\uD654 \uC8FC\uC81C
\uB300\uD654 \uC81C\uC548 \uD55C \uAC00\uC9C0

\uC804\uCCB4 300\uC790 \uC774\uB0B4\uB85C \uAC04\uACB0\uD558\uAC8C \uC791\uC131\uD558\uC138\uC694.`;
  const apiKey = await getAnthropicKey(c.env);
  if (!apiKey) return c.json({ error: "API \uD0A4 \uBBF8\uC124\uC815" }, 500);
  const res = await fetch("https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 800, stream: false, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) {
    const errText = await res.text();
    return c.json({ error: "AI \uC624\uB958", detail: errText }, 502);
  }
  const aiData = await res.json();
  const courseText = aiData.content?.find((b) => b.type === "text")?.text ?? "";
  if (COST > 0 && !isMaster) {
    await spendCredits(DB, userId, COST, "date-course");
  }
  return c.json({ success: true, data: { course: courseText, region, mood, duration, budget } });
});
app.post("/api/couple/solo-analysis", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare(
    "SELECT email, nickname, credits FROM users WHERE id=?"
  ).bind(userId).first();
  if (!user) return c.json({ success: false, error: "\uC0AC\uC6A9\uC790 \uC5C6\uC74C" }, 404);
  const isMaster = isMasterAccount(user.email);
  const COST = 5;
  if (!isMaster && user.credits < COST) {
    return c.json({ success: false, error: `\uD06C\uB808\uB527 \uBD80\uC871 (\uBCF4\uC720: ${user.credits}, \uD544\uC694: ${COST})`, needsCharge: true }, 402);
  }
  const [big5Row, lostRow, dsiRow] = await Promise.all([
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='BIG5' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first(),
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='LOST' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first(),
    DB.prepare(`SELECT result_json FROM test_history WHERE user_id=? AND test_type='DSI' AND result_json IS NOT NULL ORDER BY performed_at DESC LIMIT 1`).bind(userId).first()
  ]);
  if (!big5Row && !lostRow && !dsiRow) {
    return c.json({ success: false, error: "\uAC80\uC0AC \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9C8\uC74C\uD480\uC5D0\uC11C \uBA3C\uC800 \uAC80\uC0AC\uB97C \uC644\uB8CC\uD574\uC8FC\uC138\uC694." }, 400);
  }
  const name = user.nickname || user.email.split("@")[0];
  let prompt = `\uB2F9\uC2E0\uC740 \uC5F0\uC560\xB7\uAD00\uACC4 \uC2EC\uB9AC \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. \uC544\uB798 \uC2EC\uB9AC\uAC80\uC0AC \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C \uC774 \uC0AC\uB78C\uC758 \uC5F0\uC560 \uC131\uD5A5\uACFC \uC774\uC0C1\uC801\uC778 \uD30C\uD2B8\uB108 \uC720\uD615\uC744 \uBD84\uC11D\uD574\uC8FC\uC138\uC694.

[\uBD84\uC11D \uB300\uC0C1] ${name}

`;
  try {
    if (big5Row) {
      const b = JSON.parse(big5Row.result_json);
      const labels = { O: "\uAC1C\uBC29\uC131", C: "\uC131\uC2E4\uC131", E: "\uC678\uD5A5\uC131", A: "\uCE5C\uD654\uC131", N: "\uC2E0\uACBD\uC131" };
      prompt += `[BIG5 \uC131\uACA9\uAC80\uC0AC]
`;
      for (const key of ["O", "C", "E", "A", "N"]) prompt += `${labels[key]}: ${b[key] ?? 0}\uC810
`;
      prompt += "\n";
    }
    if (lostRow) {
      const l = JSON.parse(lostRow.result_json);
      prompt += `[LOST \uD589\uB3D9\uC720\uD615]
\uC720\uD615: ${l.typeCode ?? "?"} \u2014 ${l.typeName ?? ""}

`;
    }
    if (dsiRow) {
      const d = JSON.parse(dsiRow.result_json);
      prompt += `[\uC790\uC544\uBD84\uD654(SDRI)]
\uCD1D\uC810: ${d.total ?? 0}\uC810 (\uB9CC\uC810 125\uC810)

`;
    }
  } catch {
  }
  prompt += `[\uBD84\uC11D \uC9C0\uCE68]
\uB2E4\uC74C \uC138 \uAC00\uC9C0\uB97C \uAC01\uAC01 3~4\uC904\uB85C \uC791\uC131\uD574\uC8FC\uC138\uC694:
`;
  prompt += `1. \uB098\uC758 \uC5F0\uC560 \uAC15\uC810: \uC774 \uC0AC\uB78C\uC774 \uAD00\uACC4\uC5D0\uC11C \uC798\uD558\uB294 \uAC83\uACFC \uB9E4\uB825 \uD3EC\uC778\uD2B8
`;
  prompt += `2. \uC798 \uB9DE\uB294 \uD30C\uD2B8\uB108 \uC720\uD615: \uC774 \uC0AC\uB78C\uACFC \uAD81\uD569\uC774 \uC88B\uC740 \uC131\uACA9\xB7\uD589\uB3D9 \uD2B9\uC131 (\uAD6C\uCCB4\uC801\uC73C\uB85C)
`;
  prompt += `3. \uD568\uAED8 \uC131\uC7A5\uD560 \uD3EC\uC778\uD2B8: \uB354 \uC88B\uC740 \uAD00\uACC4\uB97C \uC704\uD55C \uAC1C\uC778 \uC131\uC7A5 \uBC29\uD5A5 (\uAE0D\uC815\uC801 \uD45C\uD604\uC73C\uB85C)
`;
  prompt += `
\uC804\uCCB4 500\uC790 \uC774\uB0B4, \uB530\uB73B\uD558\uACE0 \uC2E4\uC6A9\uC801\uC778 \uD1A4\uC73C\uB85C \uC791\uC131\uD558\uC138\uC694. \uC9C4\uB2E8\uBA85\xB7\uBCD1\uBA85\uC740 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC138\uC694.`;
  const apiKey = await getAnthropicKey(c.env);
  if (!apiKey) return c.json({ error: "API \uD0A4 \uBBF8\uC124\uC815" }, 500);
  const res = await fetch("https://gateway.ai.cloudflare.com/v1/313b6305037d45af37c09a60dad1ac2b/maumful/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1e3, stream: false, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) {
    const errText = await res.text();
    return c.json({ error: "AI \uC624\uB958", detail: errText }, 502);
  }
  const aiData = await res.json();
  const reportText = aiData.content?.find((b) => b.type === "text")?.text ?? "";
  if (COST > 0 && !isMaster) {
    await spendCredits(DB, userId, COST, "solo-analysis");
  }
  return c.json({ success: true, data: { report: reportText } });
});
app.get("/api/couple/partner-moments", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const session = await DB.prepare(
    `SELECT host_user_id, guest_user_id FROM couple_sessions
     WHERE (host_user_id=? OR guest_user_id=?)
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, userId).first();
  if (!session) return c.json({ success: true, data: { hasPartner: false } });
  const partnerId = session.host_user_id === userId ? session.guest_user_id : session.host_user_id;
  if (!partnerId) return c.json({ success: true, data: { hasPartner: false } });
  const partner = await DB.prepare("SELECT nickname, email FROM users WHERE id=?").bind(partnerId).first();
  const partnerName = partner?.nickname || partner?.email?.split("@")[0] || "\uD30C\uD2B8\uB108";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1e3).toISOString();
  const [moodRows, gratRows] = await Promise.all([
    DB.prepare(
      `SELECT metadata, created_at FROM game_session_logs
       WHERE user_id=? AND game_id='mood' AND created_at > ?
       ORDER BY created_at DESC LIMIT 7`
    ).bind(partnerId, sevenDaysAgo).all(),
    DB.prepare(
      `SELECT metadata, created_at FROM game_session_logs
       WHERE user_id=? AND game_id='gratitude'
       ORDER BY created_at DESC LIMIT 3`
    ).bind(partnerId).all()
  ]);
  const parse = /* @__PURE__ */ __name((row) => {
    try {
      return { ...JSON.parse(row.metadata), created_at: row.created_at };
    } catch {
      return { created_at: row.created_at };
    }
  }, "parse");
  return c.json({
    success: true,
    data: {
      hasPartner: true,
      partnerName,
      moodEntries: moodRows.results.map(parse),
      gratEntries: gratRows.results.map(parse)
    }
  });
});
app.get("/api/couple/timeline", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const [sessions, checkins] = await Promise.all([
    DB.prepare(`
      SELECT cs.code, cs.status, cs.compatibility_score, cs.created_at, cs.test_types,
             CASE WHEN cs.host_user_id=? THEN u2.nickname ELSE u1.nickname END AS partner_name
      FROM couple_sessions cs
      LEFT JOIN users u1 ON u1.id = cs.host_user_id
      LEFT JOIN users u2 ON u2.id = cs.guest_user_id
      WHERE (cs.host_user_id=? OR cs.guest_user_id=?)
        AND cs.status IN ('both_done','reported','expired')
      ORDER BY cs.created_at DESC LIMIT 20
    `).bind(userId, userId, userId).all(),
    DB.prepare(`
      SELECT total_score, answers_json, created_at
      FROM relationship_checkins WHERE user_id=?
      ORDER BY created_at DESC LIMIT 10
    `).bind(userId).all()
  ]);
  const items = [];
  for (const s of sessions.results) {
    if (s.status === "reported" && s.compatibility_score != null) {
      items.push({
        type: "report",
        date: s.created_at,
        title: "\uCEE4\uD50C \uAD81\uD569 \uB9AC\uD3EC\uD2B8",
        subtitle: s.partner_name ? `${s.partner_name}\uB2D8\uACFC\uC758 \uBD84\uC11D` : "\uD30C\uD2B8\uB108\uC640\uC758 \uBD84\uC11D",
        score: s.compatibility_score,
        emoji: "\u{1F495}"
      });
    } else if (s.status === "both_done" || s.status === "expired") {
      items.push({
        type: "session",
        date: s.created_at,
        title: "\uCEE4\uD50C \uAC80\uC0AC \uC644\uB8CC",
        subtitle: s.partner_name ? `${s.partner_name}\uB2D8\uACFC \uD568\uAED8` : "\uAC80\uC0AC \uC644\uB8CC",
        emoji: "\u{1F9EA}"
      });
    }
  }
  for (const ch of checkins.results) {
    const pct = Math.round(ch.total_score / 50 * 100);
    const label = pct >= 80 ? "\uB9E4\uC6B0 \uAC74\uAC15\uD574\uC694" : pct >= 60 ? "\uAC74\uAC15\uD574\uC694" : pct >= 40 ? "\uBCF4\uD1B5\uC774\uC5D0\uC694" : "\uAC1C\uC120\uC774 \uD544\uC694\uD574\uC694";
    items.push({
      type: "checkin",
      date: ch.created_at,
      title: "\uAD00\uACC4 \uC131\uC7A5 \uCCB4\uD06C\uC778",
      subtitle: `${ch.total_score}/50\uC810 \u2014 ${label}`,
      score: ch.total_score,
      emoji: "\u{1F4CA}"
    });
  }
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return c.json({ success: true, data: items });
});
app.post("/api/couple/invite-email", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const { email, session_code } = await c.req.json();
  if (!email || !session_code) return c.json({ success: false, error: "\uC774\uBA54\uC77C\uACFC \uC138\uC158 \uCF54\uB4DC \uD544\uC694" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return c.json({ success: false, error: "\uC62C\uBC14\uB978 \uC774\uBA54\uC77C \uC8FC\uC18C\uB97C \uC785\uB825\uD558\uC138\uC694" }, 400);
  const session = await DB.prepare(
    "SELECT session_code, host_user_id FROM couple_sessions WHERE session_code=? AND status=?"
  ).bind(session_code, "waiting").first();
  if (!session || session.host_user_id !== userId)
    return c.json({ success: false, error: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC138\uC158\uC785\uB2C8\uB2E4" }, 404);
  const me = await DB.prepare("SELECT nickname, email FROM users WHERE id=?").bind(userId).first();
  const myName = me?.nickname || me?.email?.split("@")[0] || "\uD30C\uD2B8\uB108";
  const base = "https://couple.maumful.com";
  const inviteUrl = `${base}/?code=${session_code}`;
  if (!c.env.RESEND_API_KEY)
    return c.json({ success: false, error: "RESEND_API_KEY \uBBF8\uC124\uC815 \u2014 \uC774\uBA54\uC77C \uBC1C\uC1A1 \uBD88\uAC00" }, 500);
  const html = `
<div style="font-family:'Apple SD Gothic Neo',sans-serif;max-width:480px;margin:0 auto;background:#FFF8F9;padding:0;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#D4587A,#E8829E);padding:32px 24px;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">\u{1F495}</div>
    <h1 style="color:white;font-size:20px;margin:0;font-weight:700">\uB9C8\uC74C\uCEE4\uD50C \uCD08\uB300\uAC00 \uB3C4\uCC29\uD588\uC5B4\uC694</h1>
  </div>
  <div style="padding:28px 28px 24px">
    <p style="font-size:15px;color:#333;line-height:1.7;margin-bottom:20px">
      \uC548\uB155\uD558\uC138\uC694! <strong>${myName}</strong>\uB2D8\uC774 \uB9C8\uC74C\uCEE4\uD50C\uC5D0\uC11C \uC2EC\uB9AC \uAD81\uD569 \uBD84\uC11D\uC744 \uD568\uAED8 \uD574\uBCF4\uC790\uACE0 \uCD08\uB300\uD588\uC5B4\uC694.
    </p>
    <div style="background:white;border-radius:12px;padding:18px 20px;margin-bottom:24px;border:1px solid #F0D8E0;text-align:center">
      <div style="font-size:12px;color:#B07088;margin-bottom:6px">\uCD08\uB300\uCF54\uB4DC</div>
      <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#D4587A;font-family:monospace">${session_code}</div>
    </div>
    <a href="${inviteUrl}" style="display:block;text-align:center;padding:14px;background:linear-gradient(135deg,#D4587A,#E8829E);color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:16px">
      \u{1F495} \uAC80\uC0AC \uC2DC\uC791\uD558\uAE30
    </a>
    <p style="font-size:12px;color:#A09098;text-align:center;line-height:1.6">
      \uB85C\uADF8\uC778 \uC5C6\uC774 \uBC14\uB85C \uCC38\uC5EC\uD560 \uC218 \uC788\uC5B4\uC694.<br>\uC704 \uBC84\uD2BC\uC744 \uD074\uB9AD\uD558\uAC70\uB098 <a href="https://couple.maumful.com" style="color:#D4587A">couple.maumful.com</a>\uC5D0\uC11C \uCF54\uB4DC\uB97C \uC785\uB825\uD558\uC138\uC694.
    </p>
  </div>
  <div style="padding:12px 28px 20px;text-align:center">
    <p style="font-size:11px;color:#C0A8B0">\uB9C8\uC74C\uCEE4\uD50C \u2014 \uCEE4\uD50C \uC2EC\uB9AC \uBD84\uC11D \uC11C\uBE44\uC2A4</p>
  </div>
</div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${c.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: "\uB9C8\uC74C\uCEE4\uD50C <noreply@maumful.com>", to: [email], subject: `\u{1F495} ${myName}\uB2D8\uC774 \uB9C8\uC74C\uCEE4\uD50C\uC5D0 \uCD08\uB300\uD588\uC5B4\uC694`, html })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[invite-email] Resend \uC624\uB958:", err);
      return c.json({ success: false, error: "\uC774\uBA54\uC77C \uBC1C\uC1A1 \uC2E4\uD328" }, 500);
    }
    return c.json({ success: true });
  } catch (e) {
    console.error("[invite-email] \uC608\uC678:", e);
    return c.json({ success: false, error: "\uC774\uBA54\uC77C \uBC1C\uC1A1 \uC2E4\uD328" }, 500);
  }
});
app.get("/api/couple/admin/stats", async (c) => {
  const { DB } = c.env;
  const userId = await getCoupleUserId(c.req.raw, c.env);
  if (!userId) return c.json({ success: false, error: "\uB85C\uADF8\uC778 \uD544\uC694" }, 401);
  const user = await DB.prepare("SELECT email FROM users WHERE id=?").bind(userId).first();
  if (!isMasterAccount(user?.email)) return c.json({ success: false, error: "\uAD8C\uD55C \uC5C6\uC74C" }, 403);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [total, todayCount, reported, avgScore, byType, recentSessions] = await DB.batch([
    DB.prepare("SELECT COUNT(*) AS cnt FROM couple_sessions"),
    DB.prepare(`SELECT COUNT(*) AS cnt FROM couple_sessions WHERE DATE(created_at)=?`).bind(today),
    DB.prepare(`SELECT COUNT(*) AS cnt FROM couple_sessions WHERE status='reported'`),
    DB.prepare(`SELECT ROUND(AVG(compatibility_score),1) AS avg FROM couple_sessions WHERE status='reported' AND compatibility_score > 0`),
    DB.prepare(`SELECT test_type, COUNT(*) AS cnt FROM couple_sessions GROUP BY test_type ORDER BY cnt DESC`),
    DB.prepare(`SELECT cs.id, cs.session_code, cs.test_type, cs.status, cs.compatibility_score, cs.credits_spent, cs.created_at,
                  hu.email AS host_email, gu.email AS guest_email
                FROM couple_sessions cs
                LEFT JOIN users hu ON cs.host_user_id = hu.id
                LEFT JOIN users gu ON cs.guest_user_id = gu.id
                ORDER BY cs.created_at DESC LIMIT 10`)
  ]);
  return c.json({
    success: true,
    data: {
      total: total.results[0].cnt,
      today: todayCount.results[0].cnt,
      reported: reported.results[0].cnt,
      avgScore: avgScore.results[0].avg ?? 0,
      byType: byType.results,
      recent: recentSessions.results
    }
  });
});
async function sendCoupleInsightEmail(env2, to, name, data) {
  if (!env2.RESEND_API_KEY) return;
  const { checkinScore, prevScore, partnerName, sessionStatus } = data;
  const displayName = name || "\uD68C\uC6D0";
  const scoreLine = checkinScore != null ? `<p style="font-size:15px;color:#333;margin:0 0 8px">\u{1F4CA} \uC774\uBC88 \uB2EC \uAD00\uACC4 \uAC74\uAC15\uB3C4: <strong style="color:#E05A8A">${checkinScore}\uC810</strong>${prevScore != null ? ` (\uC9C0\uB09C\uB2EC \uB300\uBE44 ${checkinScore >= prevScore ? `+${checkinScore - prevScore}` : checkinScore - prevScore}\uC810)` : ""}</p>` : `<p style="font-size:14px;color:#888;margin:0 0 8px">\u{1F4A1} \uC774\uBC88 \uB2EC \uAD00\uACC4 \uC131\uC7A5 \uCCB4\uD06C\uC778\uC744 \uC544\uC9C1 \uD558\uC9C0 \uC54A\uC558\uC5B4\uC694.</p>`;
  const partnerLine = partnerName ? `<p style="font-size:14px;color:#555;margin:0 0 8px">\u{1F495} \uD30C\uD2B8\uB108 <strong>${partnerName}</strong>\uB2D8\uACFC \uD568\uAED8\uD558\uACE0 \uC788\uC5B4\uC694</p>` : `<p style="font-size:14px;color:#888;margin:0 0 8px">\uC544\uC9C1 \uD30C\uD2B8\uB108\uAC00 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694. \uCF54\uB4DC\uB97C \uACF5\uC720\uD574 \uBCF4\uC138\uC694!</p>`;
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#fdf2f8;margin:0;padding:20px">
<div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)">
  <div style="background:linear-gradient(135deg,#E05A8A,#f472b6);padding:28px 24px;text-align:center">
    <div style="font-size:32px;margin-bottom:8px">\u{1F495}</div>
    <h1 style="margin:0;font-size:20px;color:white;font-weight:700">\uC774\uBC88 \uC8FC \uB9C8\uC74C\uCEE4\uD50C \uC778\uC0AC\uC774\uD2B8</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px">${displayName}\uB2D8\uC744 \uC704\uD55C \uAD00\uACC4 \uC694\uC57D</p>
  </div>
  <div style="padding:24px">
    ${partnerLine}
    ${scoreLine}
    <div style="background:#fdf2f8;border-radius:12px;padding:16px;margin:16px 0">
      <p style="font-size:13px;color:#9d4f7c;font-weight:700;margin:0 0 8px">\u{1F4AC} \uC774\uBC88 \uC8FC \uB300\uD654 \uC9C8\uBB38</p>
      <p style="font-size:14px;color:#555;margin:0;line-height:1.6">\uD30C\uD2B8\uB108\uC5D0\uAC8C \uBB3C\uC5B4\uBCF4\uC138\uC694: <em>"\uC694\uC998 \uB2F9\uC2E0\uC5D0\uAC8C \uAC00\uC7A5 \uACE0\uB9C8\uC6B4 \uC21C\uAC04\uC740 \uC5B8\uC81C\uC600\uB098\uC694?"</em></p>
    </div>
    <div style="text-align:center;margin-top:20px">
      <a href="https://couple.maumful.com" style="display:inline-block;background:linear-gradient(135deg,#E05A8A,#f472b6);color:white;padding:12px 28px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px">\uB9C8\uC74C\uCEE4\uD50C \uC5F4\uAE30 \u2192</a>
    </div>
  </div>
  <div style="padding:16px 24px;border-top:1px solid #f0f0f0;text-align:center">
    <p style="font-size:11px;color:#bbb;margin:0">\uB9C8\uC74C\uCEE4\uD50C \xB7 <a href="https://couple.maumful.com" style="color:#E05A8A">\uC218\uC2E0 \uAC70\uBD80</a></p>
  </div>
</div>
</body></html>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env2.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "\uB9C8\uC74C\uCEE4\uD50C <noreply@maumful.com>",
      to,
      subject: `\u{1F495} ${displayName}\uB2D8\uC758 \uC774\uBC88 \uC8FC \uAD00\uACC4 \uC778\uC0AC\uC774\uD2B8`,
      html
    })
  }).catch((e) => console.error("[Email] \uBC1C\uC1A1 \uC2E4\uD328", e));
}
__name(sendCoupleInsightEmail, "sendCoupleInsightEmail");
var index_default = {
  fetch: app.fetch,
  async scheduled(event, env2, _ctx) {
    if (event.cron === "0 3 1 * *") {
      const result = await env2.DB.prepare(
        `UPDATE couple_sessions
            SET status = 'expired', updated_at = CURRENT_TIMESTAMP
          WHERE status IN ('waiting', 'both_done')
            AND expires_at < datetime('now')`
      ).run();
      console.log(`[Cron] \uB9CC\uB8CC \uC138\uC158 \uC815\uB9AC: ${result.meta.changes}\uAC74`);
      return;
    }
    if (event.cron === "0 23 * * 0") {
      if (!env2.RESEND_API_KEY) {
        console.log("[Cron] RESEND_API_KEY \uBBF8\uC124\uC815 \u2014 \uC774\uBA54\uC77C \uBC1C\uC1A1 \uAC74\uB108\uB700");
        return;
      }
      const users = await env2.DB.prepare(`
        SELECT DISTINCT u.id, u.email, u.nickname
        FROM users u
        WHERE u.id IN (
          SELECT DISTINCT host_user_id FROM couple_sessions WHERE status IN ('waiting','both_done','reported') AND created_at > datetime('now','-30 days')
          UNION
          SELECT DISTINCT guest_user_id FROM couple_sessions WHERE guest_user_id IS NOT NULL AND status IN ('both_done','reported') AND created_at > datetime('now','-30 days')
        )
        AND u.email IS NOT NULL
        LIMIT 200
      `).all();
      let sent = 0;
      for (const u of users.results) {
        try {
          const checkins = await env2.DB.prepare(
            `SELECT total_score, created_at FROM relationship_checkins WHERE user_id=? ORDER BY created_at DESC LIMIT 2`
          ).bind(u.id).all();
          const session = await env2.DB.prepare(
            `SELECT host_user_id, guest_user_id FROM couple_sessions WHERE (host_user_id=? OR guest_user_id=?) AND status IN ('both_done','reported') ORDER BY created_at DESC LIMIT 1`
          ).bind(u.id, u.id).first();
          let partnerName = null;
          if (session) {
            const partnerId = session.host_user_id === u.id ? session.guest_user_id : session.host_user_id;
            if (partnerId) {
              const partner = await env2.DB.prepare("SELECT nickname FROM users WHERE id=?").bind(partnerId).first();
              partnerName = partner?.nickname || null;
            }
          }
          await sendCoupleInsightEmail(env2, u.email, u.nickname || "\uD68C\uC6D0", {
            checkinScore: checkins.results[0]?.total_score ?? null,
            prevScore: checkins.results[1]?.total_score ?? null,
            partnerName,
            sessionStatus: "active"
          });
          sent++;
          await new Promise((r) => setTimeout(r, 100));
        } catch (e) {
          console.error(`[Cron] \uC774\uBA54\uC77C \uBC1C\uC1A1 \uC2E4\uD328 uid=${u.id}`, e);
        }
      }
      console.log(`[Cron] \uC8FC\uAC04 \uC778\uC0AC\uC774\uD2B8 \uC774\uBA54\uC77C \uBC1C\uC1A1: ${sent}\uAC74`);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
