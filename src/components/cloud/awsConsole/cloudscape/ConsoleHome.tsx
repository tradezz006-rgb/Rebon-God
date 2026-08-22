import { useState } from "react";
import { useAccountStore } from "./store";
import { SERVICES } from "./ui";
import type { ServiceId } from "./types";

export function ConsoleHome() {
  const navigate = useAccountStore((s) => s.navigate);
  const markClick = useAccountStore((s) => s.markClick);
  const interactive = useAccountStore((s) => s.interactive);
  const region = useAccountStore((s) => s.identity.region);
  const account = useAccountStore((s) => s.identity.account_name);
  const recentlyVisited = useAccountStore((s) => s.recentlyVisited);
  const alarms = useAccountStore((s) => s.alarms);
  const cost = useAccountStore((s) => s.cost_rows);
  const [q, setQ] = useState("");

  const recent = recentlyVisited
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean);

  const filtered = SERVICES.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.blurb.toLowerCase().includes(q.toLowerCase())
  );

  const monthSpend = cost.reduce((n, r) => n + r.this_month, 0);
  const alarmCount = alarms.filter((a) => a.state === "ALARM").length;

  const go = (id: ServiceId, target: string) => {
    if (!interactive) return;
    markClick(target);
    navigate(id);
  };

  return (
    <div className="aws-home">
      <h1 className="aws-home-title">Console Home</h1>
      <p className="aws-home-sub">
        {account} · {region}
      </p>

      <div className="aws-home-search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="#5f6b7a" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="#5f6b7a" strokeWidth="1.5" />
        </svg>
        <input
          data-console-target="home-search"
          placeholder="Search for services, features, docs, and more"
          value={q}
          disabled={!interactive}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <section className="aws-home-section">
        <h2>Recently visited</h2>
        <div className="aws-recent-row">
          {recent.map((svc) =>
            svc ? (
              <button
                key={svc.id}
                type="button"
                className="aws-recent-chip"
                data-console-target={`home-${svc.id}`}
                disabled={!interactive}
                onClick={() => go(svc.id, `home-${svc.id}`)}
              >
                <span className="aws-svc-icon" style={{ background: svc.color, width: 24, height: 24, fontSize: 9 }}>
                  {svc.name.slice(0, 2).toUpperCase()}
                </span>
                {svc.name}
              </button>
            ) : null
          )}
        </div>
      </section>

      <div className="aws-widget-row" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="aws-home-section"
          style={{ margin: 0, textAlign: "left", cursor: interactive ? "pointer" : "default", border: "none", width: "100%" }}
          disabled={!interactive}
          onClick={() => go("cloudwatch", "home-health")}
        >
          <h2>AWS Health</h2>
          <div className="aws-widget-stat" style={{ color: alarmCount ? "#d13212" : "#037f0c" }}>
            {alarmCount ? `${alarmCount} alarm(s)` : "All services operating normally"}
          </div>
          <div className="aws-widget-label">Open issues in {region}</div>
        </button>
        <button
          type="button"
          className="aws-home-section"
          style={{ margin: 0, textAlign: "left", cursor: interactive ? "pointer" : "default", border: "none", width: "100%" }}
          disabled={!interactive}
          onClick={() => go("billing", "home-cost")}
        >
          <h2>Cost and usage</h2>
          <div className="aws-widget-stat">${monthSpend.toFixed(2)}</div>
          <div className="aws-widget-label">Month-to-date (unblended)</div>
        </button>
      </div>

      <section className="aws-home-section">
        <h2>Applications</h2>
        <div className="aws-svc-cards">
          {filtered.map((svc) => (
            <button
              key={svc.id}
              type="button"
              className="aws-svc-card"
              data-console-target={svc.target}
              disabled={!interactive}
              onClick={() => go(svc.id, svc.target)}
            >
              <span className="aws-svc-icon" style={{ background: svc.color }}>
                {svc.name === "Billing and Cost Management" ? "$" : svc.name.slice(0, 3).toUpperCase()}
              </span>
              <span>
                <strong>{svc.name}</strong>
                <em>{svc.category}</em>
                <p>{svc.blurb}</p>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
