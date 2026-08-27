export type ActionResult =
  | { ok: true; code: string }
  | { ok: false; code: string; reason: string };

export type ParsedAction = {
  family: string;
  resource: string;
  value?: string;
  raw: string;
};

/** Parse CODE:arg or CODE:arg:value (value may contain colons). */
export function parseActionCode(raw: string): ParsedAction | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const first = trimmed.indexOf(":");
  if (first < 0) return null;
  const family = trimmed.slice(0, first).toUpperCase();
  const rest = trimmed.slice(first + 1);
  const second = rest.indexOf(":");
  if (second < 0) {
    return { family, resource: rest, raw: trimmed };
  }
  return {
    family,
    resource: rest.slice(0, second),
    value: rest.slice(second + 1),
    raw: trimmed,
  };
}
