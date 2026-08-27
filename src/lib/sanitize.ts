/**
 * Text / HTML sanitizers for user-facing and AI-generated strings.
 * Prefer React text nodes; use escapeHtml only when HTML must be built as a string.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape characters that are significant in HTML. */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

/**
 * Strip control chars and cap length for plain UI text (React children).
 * Does not decode entities — safe to render as text.
 */
export function sanitizePlainText(
  input: unknown,
  opts?: { maxLength?: number; fallback?: string }
): string {
  const maxLength = opts?.maxLength ?? 8_000;
  const fallback = opts?.fallback ?? "";
  if (typeof input !== "string") return fallback;
  const cleaned = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .normalize("NFC")
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/** Allow only simple CSS color tokens for theme injection (no urls/expressions). */
export function sanitizeCssColor(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim();
  if (
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ||
    /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(v) ||
    /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/.test(
      v
    ) ||
    /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/.test(v) ||
    /^var\(--[a-zA-Z0-9_-]+\)$/.test(v) ||
    /^[a-zA-Z]{1,20}$/.test(v)
  ) {
    return v;
  }
  return null;
}
