/**
 * Dev-only logger. No-ops in production so console noise and accidental
 * data leaks stay out of student builds.
 */

type LogArgs = unknown[];

const isDev = import.meta.env.DEV;

function emit(
  level: "debug" | "info" | "warn" | "error",
  scope: string | undefined,
  args: LogArgs
): void {
  if (!isDev) return;
  const prefix = scope ? `[${scope}]` : "[rebon]";
  const fn =
    level === "debug"
      ? console.debug
      : level === "info"
        ? console.info
        : level === "warn"
          ? console.warn
          : console.error;
  fn(prefix, ...args);
}

export const logger = {
  debug: (scope: string, ...args: LogArgs): void => emit("debug", scope, args),
  info: (scope: string, ...args: LogArgs): void => emit("info", scope, args),
  warn: (scope: string, ...args: LogArgs): void => emit("warn", scope, args),
  error: (scope: string, ...args: LogArgs): void => emit("error", scope, args),
};
