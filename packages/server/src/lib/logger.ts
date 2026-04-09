type LogFn = (msg: string, ...args: unknown[]) => void;

interface Logger {
  info: LogFn;
  error: LogFn;
  warn: LogFn;
  debug: LogFn;
}

function ts(): string {
  return new Date().toISOString();
}

const stderrWrite: LogFn = (msg, ...args) => {
  const extra = args.length ? ` ${args.map(String).join(' ')}` : '';
  process.stderr.write(`${ts()} ${msg + extra}\n`);
};

const stdoutLogger: Logger = {
  info: (msg, ...args) => console.log(`${ts()} [INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`${ts()} [ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`${ts()} [WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`${ts()} [DEBUG] ${msg}`, ...args),
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
