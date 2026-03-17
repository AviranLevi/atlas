type LogFn = (msg: string, ...args: unknown[]) => void;

interface Logger {
  info: LogFn;
  error: LogFn;
  warn: LogFn;
  debug: LogFn;
}

const stderrWrite: LogFn = (msg, ...args) => {
  const extra = args.length ? ' ' + args.map(String).join(' ') : '';
  process.stderr.write(msg + extra + '\n');
};

const stdoutLogger: Logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args),
};

const stderrLogger: Logger = {
  info: (msg, ...args) => stderrWrite(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => stderrWrite(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => stderrWrite(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => stderrWrite(`[DEBUG] ${msg}`, ...args),
};

export let logger: Logger = stdoutLogger;

export function useStderrLogger() {
  logger = stderrLogger;
}
