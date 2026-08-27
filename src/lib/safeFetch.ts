/**
 * Hardened fetch helpers for external/API calls.
 * - timeout (default 15s)
 * - retry once on network / 5xx / timeout
 * - safe JSON parse (non-JSON bodies fail gracefully)
 */

export type SafeFetchErrorCode =
  | "timeout"
  | "network"
  | "http"
  | "invalid_json"
  | "aborted";

export type SafeFetchError = {
  code: SafeFetchErrorCode;
  message: string;
  status?: number;
};

export type SafeFetchSuccess<T> = {
  ok: true;
  data: T;
  status: number;
};

export type SafeFetchFailure = {
  ok: false;
  error: SafeFetchError;
};

export type SafeFetchResult<T> = SafeFetchSuccess<T> | SafeFetchFailure;

export type SafeFetchOptions = {
  /** Request timeout in ms. Default 15000. */
  timeoutMs?: number;
  /** Retry once after failure. Default true. */
  retryOnce?: boolean;
  /** Delay before retry in ms. Default 400. */
  retryDelayMs?: number;
  /** Parse body as JSON. Default true. */
  parseJson?: boolean;
  /** Optional AbortSignal from the caller (merged with timeout). */
  signal?: AbortSignal;
} & Omit<RequestInit, "signal">;

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function userMessageFor(code: SafeFetchErrorCode, status?: number): string {
  switch (code) {
    case "timeout":
      return "The request timed out. Please try again.";
    case "network":
      return "Network error. Check your connection and try again.";
    case "invalid_json":
      return "The server returned an unexpected response. Please try again.";
    case "aborted":
      return "The request was cancelled.";
    case "http":
      return status
        ? `Request failed (${status}). Please try again.`
        : "Request failed. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * Parse a Response body as JSON without throwing on HTML/empty/invalid bodies.
 */
export async function safeParseJson<T>(response: Response): Promise<SafeFetchResult<T>> {
  const status = response.status;
  let text: string;
  try {
    text = await response.text();
  } catch {
    return {
      ok: false,
      error: {
        code: "network",
        message: userMessageFor("network"),
        status,
      },
    };
  }

  if (!text.trim()) {
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "http",
          message: userMessageFor("http", status),
          status,
        },
      };
    }
    return { ok: true, data: null as T, status };
  }

  try {
    const data = JSON.parse(text) as T;
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "http",
          message: userMessageFor("http", status),
          status,
        },
      };
    }
    return { ok: true, data, status };
  } catch {
    return {
      ok: false,
      error: {
        code: "invalid_json",
        message: userMessageFor("invalid_json"),
        status,
      },
    };
  }
}

async function fetchOnce(
  input: RequestInfo | URL,
  options: SafeFetchOptions,
  timeoutMs: number
): Promise<{ response?: Response; error?: SafeFetchError }> {
  const controller = new AbortController();
  const external = options.signal;

  const onExternalAbort = (): void => {
    controller.abort();
  };
  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { timeoutMs: _t, retryOnce: _r, retryDelayMs: _d, parseJson: _p, signal: _s, ...init } =
      options;
    const response = await fetch(input, { ...init, signal: controller.signal });
    return { response };
  } catch (err) {
    const aborted =
      (err instanceof DOMException && err.name === "AbortError") ||
      (err instanceof Error && err.name === "AbortError");
    if (aborted) {
      if (external?.aborted) {
        return {
          error: { code: "aborted", message: userMessageFor("aborted") },
        };
      }
      return {
        error: { code: "timeout", message: userMessageFor("timeout") },
      };
    }
    return {
      error: { code: "network", message: userMessageFor("network") },
    };
  } finally {
    window.clearTimeout(timer);
    external?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Fetch with timeout, optional one retry, and safe JSON parsing.
 * Never throws — always returns a typed result.
 */
export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryOnce = options.retryOnce !== false;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const parseJson = options.parseJson !== false;

  const attempt = async (): Promise<SafeFetchResult<T>> => {
    const { response, error } = await fetchOnce(input, options, timeoutMs);
    if (error || !response) {
      return { ok: false, error: error ?? { code: "network", message: userMessageFor("network") } };
    }

    if (!parseJson) {
      if (!response.ok) {
        return {
          ok: false,
          error: {
            code: "http",
            message: userMessageFor("http", response.status),
            status: response.status,
          },
        };
      }
      return { ok: true, data: undefined as T, status: response.status };
    }

    return safeParseJson<T>(response);
  };

  const first = await attempt();
  if (first.ok) return first;

  const shouldRetry =
    retryOnce &&
    (first.error.code === "timeout" ||
      first.error.code === "network" ||
      (first.error.code === "http" &&
        typeof first.error.status === "number" &&
        isRetryableStatus(first.error.status)));

  if (!shouldRetry) return first;

  await sleep(retryDelayMs);
  return attempt();
}

/**
 * Map a SafeFetchFailure to a short user-facing string.
 */
export function safeFetchErrorMessage(result: SafeFetchFailure | SafeFetchError): string {
  if ("ok" in result && result.ok === false) {
    return result.error.message;
  }
  return (result as SafeFetchError).message;
}
