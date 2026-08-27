import { useMemo, useState } from "react";
import { executeAction, listActionCodes } from "./executeAction";

/** Work-mode smoke panel — open with ?actionMap=1 */
export function ActionMapDevPanel() {
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("actionMap") === "1";
  }, []);
  const codes = useMemo(() => listActionCodes(), []);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  const run = async (code: string) => {
    setBusy(true);
    const sample = code
      .replace("{id}", "i-0demo")
      .replace("{value}", "demo-value")
      .replace("{service}", "iam");
    const result = await executeAction(sample);
    setLog((prev) => [
      `${result.ok ? "OK" : "FAIL"} ${sample}${result.ok ? "" : ` — ${result.reason}`}`,
      ...prev.slice(0, 40),
    ]);
    setBusy(false);
  };

  const runAll = async () => {
    setBusy(true);
    for (const code of codes) {
      const sample = code
        .replace("{id}", "i-0demo")
        .replace("{value}", "rebon-demo")
        .replace("{service}", "ec2");
      const result = await executeAction(sample);
      setLog((prev) => [
        `${result.ok ? "OK" : "FAIL"} ${sample}${result.ok ? "" : ` — ${result.reason}`}`,
        ...prev.slice(0, 80),
      ]);
      await new Promise((r) => setTimeout(r, 80));
    }
    setBusy(false);
  };

  return (
    <div className="aws-action-map-panel">
      <div className="aws-action-map-panel-head">
        <strong>ACTION_MAP smoke</strong>
        <button type="button" disabled={busy} onClick={() => void runAll()}>
          Run all
        </button>
      </div>
      <div className="aws-action-map-panel-codes">
        {codes.map((c) => (
          <button
            key={c}
            type="button"
            disabled={busy}
            onClick={() => void run(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <pre className="aws-action-map-panel-log">{log.join("\n")}</pre>
    </div>
  );
}
