import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import { useAccountStore } from "./store";
import { SERVICES } from "./ui";
import type { HomeWidgetId, ServiceId } from "./types";

const ALL_WIDGETS: { id: HomeWidgetId; label: string; actionId: string }[] = [
  { id: "welcome", label: "Welcome to AWS", actionId: "TOGGLE:widget-welcome-visibility" },
  { id: "recent", label: "Recently visited", actionId: "TOGGLE:widget-recent-visibility" },
  { id: "cost", label: "Cost and usage", actionId: "TOGGLE:widget-cost-visibility" },
  { id: "health", label: "AWS Health", actionId: "TOGGLE:widget-health-visibility" },
  { id: "favorites", label: "Favorites", actionId: "TOGGLE:widget-favorites-visibility" },
  {
    id: "trusted",
    label: "Trusted Advisor",
    actionId: "TOGGLE:widget-trusted-advisor-visibility",
  },
  { id: "explore", label: "Explore AWS", actionId: "TOGGLE:widget-explore-visibility" },
];

const EXPLORE_ACTIVITIES = [
  { name: "Launch an instance using EC2", reward: 20, status: "Not started" },
  { name: "Create a bucket in Amazon S3", reward: 20, status: "Not started" },
  {
    name: "Use a foundation model in Amazon Bedrock",
    reward: 20,
    status: "Not started",
  },
  { name: "Create a CloudWatch alarm", reward: 20, status: "Not started" },
  { name: "Build a VPC with public and private subnets", reward: 20, status: "Not started" },
];

const ALL_SERVICE_COLUMNS: {
  title: string;
  color: string;
  items: { name: string; id?: ServiceId }[];
}[] = [
  {
    title: "Compute",
    color: "#ed7100",
    items: [
      { name: "EC2", id: "ec2" },
      { name: "Lambda" },
      { name: "Elastic Beanstalk" },
      { name: "Lightsail" },
    ],
  },
  {
    title: "Storage",
    color: "#3f8624",
    items: [
      { name: "S3", id: "s3" },
      { name: "EBS" },
      { name: "EFS" },
      { name: "Glacier" },
    ],
  },
  {
    title: "Networking & Content Delivery",
    color: "#8c4fff",
    items: [
      { name: "VPC", id: "vpc" },
      { name: "CloudFront" },
      { name: "Route 53" },
      { name: "API Gateway" },
    ],
  },
  {
    title: "Security, Identity, & Compliance",
    color: "#dd344c",
    items: [
      { name: "IAM", id: "iam" },
      { name: "Cognito" },
      { name: "WAF" },
      { name: "Secrets Manager" },
    ],
  },
  {
    title: "Management & Governance",
    color: "#e7157b",
    items: [
      { name: "CloudWatch", id: "cloudwatch" },
      { name: "CloudTrail" },
      { name: "Systems Manager" },
      { name: "Config" },
    ],
  },
  {
    title: "Cloud Financial Management",
    color: "#ff9900",
    items: [
      { name: "Billing and Cost Management", id: "billing" },
      { name: "Cost Explorer", id: "billing" },
      { name: "Budgets", id: "billing" },
      { name: "AWS Marketplace" },
    ],
  },
];

const TRUSTED_CHECKS = [
  { pillar: "Security", count: 2, icon: "🛡", detail: "MFA not enabled; S3 public access" },
  { pillar: "Cost Optimization", count: 1, icon: "💰", detail: "Unassociated Elastic IP" },
  { pillar: "Performance", count: 0, icon: "⚡", detail: "No alerts" },
  { pillar: "Fault Tolerance", count: 0, icon: "🔁", detail: "No alerts" },
  { pillar: "Service Limits", count: 0, icon: "📊", detail: "Within limits" },
];

function WidgetChrome({
  title,
  children,
  footer,
  onRemove,
  dragId,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onRemove?: () => void;
  dragId?: string;
  onDragStart?: (id: string) => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <section
      className="aws-home-widget"
      draggable={Boolean(dragId)}
      onDragStart={() => dragId && onDragStart?.(dragId)}
      onDragOver={(e) => {
        if (!dragId) return;
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (dragId) onDrop?.(dragId);
      }}
    >
      <header className="aws-home-widget-head">
        <span className="aws-home-widget-drag" aria-hidden title="Drag to rearrange">
          ⋮⋮
        </span>
        <h2>
          {title}{" "}
          <button type="button" className="aws-home-info-link">
            Info
          </button>
        </h2>
        <div className="aws-home-widget-menu-wrap">
          <button
            type="button"
            className="aws-home-widget-kebab"
            aria-label={`${title} options`}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ⋮
          </button>
          {menuOpen && (
            <div className="aws-home-widget-menu">
              <button type="button" onClick={() => setMenuOpen(false)}>
                Refresh
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => {
                    onRemove();
                    setMenuOpen(false);
                  }}
                >
                  Remove widget
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      <div className="aws-home-widget-body">{children}</div>
      {footer && <footer className="aws-home-widget-foot">{footer}</footer>}
    </section>
  );
}

function resourceCountLabel(id: ServiceId, counts: {
  instances: number;
  buckets: number;
  users: number;
  roles: number;
  vpcs: number;
  alarms: number;
}): string {
  switch (id) {
    case "ec2":
      return `${counts.instances} instance${counts.instances === 1 ? "" : "s"}`;
    case "s3":
      return `${counts.buckets} bucket${counts.buckets === 1 ? "" : "s"}`;
    case "iam":
      return `${counts.users} user${counts.users === 1 ? "" : "s"}, ${counts.roles} role${counts.roles === 1 ? "" : "s"}`;
    case "vpc":
      return `${counts.vpcs} VPC${counts.vpcs === 1 ? "" : "s"}`;
    case "cloudwatch":
      return `${counts.alarms} alarm${counts.alarms === 1 ? "" : "s"}`;
    case "billing":
      return "Cost Explorer";
    default:
      return "";
  }
}

export function ConsoleHome() {
  const navigate = useAccountStore((s) => s.navigate);
  const markClick = useAccountStore((s) => s.markClick);
  const interactive = useAccountStore((s) => s.interactive);
  const region = useAccountStore((s) => s.identity.region);
  const username = useAccountStore((s) => s.identity.iam_username);
  const recentlyVisited = useAccountStore((s) => s.recentlyVisited);
  const favorites = useAccountStore((s) => s.favorites);
  const homeLayout = useAccountStore((s) => s.homeLayout);
  const setHomeLayout = useAccountStore((s) => s.setHomeLayout);
  const resetHomeLayout = useAccountStore((s) => s.resetHomeLayout);
  const setFavorites = useAccountStore((s) => s.setFavorites);
  const alarms = useAccountStore((s) => s.alarms);
  const cost = useAccountStore((s) => s.cost_rows);
  const instances = useAccountStore((s) => s.instances);
  const buckets = useAccountStore((s) => s.buckets);
  const users = useAccountStore((s) => s.users);
  const roles = useAccountStore((s) => s.roles);
  const vpcs = useAccountStore((s) => s.vpcs);
  const setOverlay = useAccountStore((s) => s.setOverlay);

  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<"home" | "all-services">("home");
  const [sideOpen, setSideOpen] = useState(false);
  const [dragWidget, setDragWidget] = useState<HomeWidgetId | null>(null);
  const [dragFav, setDragFav] = useState<ServiceId | null>(null);

  const widgets = homeLayout.widgets;
  const recent = recentlyVisited
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean)
    .slice(0, 4);

  const monthSpend = cost.reduce((n, r) => n + r.this_month, 0);
  const forecast = monthSpend * 1.12;
  const openIssues = alarms.filter((a) => a.state === "ALARM").length;
  const otherNotifs = Math.max(1, alarms.filter((a) => a.state === "INSUFFICIENT_DATA").length);

  const counts = {
    instances: instances.length,
    buckets: buckets.length,
    users: users.length,
    roles: roles.length,
    vpcs: vpcs.length,
    alarms: alarms.length,
  };

  const costBars = useMemo(() => {
    const base = Math.max(monthSpend * 0.84, 1);
    return [
      { label: "Jan", value: Math.round(base * 0.85) },
      { label: "Feb", value: Math.round(base * 0.95) },
      { label: "Mar", value: Math.round(monthSpend || base) },
    ];
  }, [monthSpend]);

  const go = (id: ServiceId, target: string) => {
    if (!interactive) return;
    markClick(target);
    navigate(id);
  };

  const removeWidget = (id: HomeWidgetId) =>
    setHomeLayout({ widgets: widgets.filter((x) => x !== id) });

  const toggleWidget = (id: HomeWidgetId) => {
    if (widgets.includes(id)) {
      setHomeLayout({ widgets: widgets.filter((x) => x !== id) });
    } else {
      setHomeLayout({ widgets: [...widgets, id] });
    }
  };

  const reorderWidgets = (toId: HomeWidgetId) => {
    if (!dragWidget || dragWidget === toId) return;
    const next = [...widgets];
    const from = next.indexOf(dragWidget);
    const to = next.indexOf(toId);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, dragWidget);
    setHomeLayout({ widgets: next });
    setDragWidget(null);
  };

  const reorderFavorites = (toId: ServiceId) => {
    if (!dragFav || dragFav === toId) return;
    const next = [...favorites];
    const from = next.indexOf(dragFav);
    const to = next.indexOf(toId);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    next.splice(to, 0, dragFav);
    setFavorites(next);
    setDragFav(null);
  };

  const widgetDragProps = (id: HomeWidgetId) => ({
    dragId: id,
    onDragStart: (wid: string) => setDragWidget(wid as HomeWidgetId),
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDrop: (wid: string) => reorderWidgets(wid as HomeWidgetId),
  });

  const regionLabel = useMemo(() => {
    const map: Record<string, string> = {
      "ap-south-1": "Asia Pacific (Mumbai)",
      "ap-south-2": "Asia Pacific (Hyderabad)",
      "ap-southeast-2": "Asia Pacific (Sydney)",
      "us-east-1": "US East (N. Virginia)",
      "eu-west-1": "Europe (Ireland)",
      "eu-north-1": "Europe (Stockholm)",
    };
    return map[region] || region;
  }, [region]);

  if (view === "all-services") {
    return (
      <div className="aws-home aws-home-allsvc">
        <div className="aws-home-toolbar">
          <button
            type="button"
            className="aws-home-hamburger"
            aria-label="Back to Console Home"
            onClick={() => setView("home")}
          >
            ☰
          </button>
          <nav className="aws-home-crumb">
            <button type="button" onClick={() => setView("home")}>
              Console Home
            </button>
            <span>›</span>
            <strong>All services</strong>
          </nav>
        </div>
        <h1 className="aws-home-title">All services</h1>
        <div className="aws-allsvc-grid">
          {ALL_SERVICE_COLUMNS.map((col) => (
            <div key={col.title} className="aws-allsvc-col">
              <h3>
                <i style={{ background: col.color }} />
                {col.title}
              </h3>
              <ul>
                {col.items.map((item) => (
                  <li key={item.name}>
                    {item.id ? (
                      <button
                        type="button"
                        className="aws-link-btn"
                        disabled={!interactive}
                        onClick={() => go(item.id!, `allsvc-${item.id}`)}
                      >
                        {item.name}
                      </button>
                    ) : (
                      <span className="aws-allsvc-stub">{item.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderWidget = (id: HomeWidgetId) => {
    switch (id) {
      case "recent":
        return (
          <WidgetChrome
            key={id}
            {...widgetDragProps(id)}
            title="Recently visited"
            onRemove={() => removeWidget(id)}
            footer={
              <button
                type="button"
                className="aws-link-btn"
                onClick={() => setView("all-services")}
              >
                View all services
              </button>
            }
          >
            {recent.length === 0 ? (
              <div className="aws-home-empty">
                <div className="aws-home-cube" aria-hidden />
                <p>
                  No recently visited services. Explore one of these commonly visited
                  AWS services:{" "}
                  {(["ec2", "s3", "cloudwatch", "iam"] as ServiceId[]).map((sid, i) => (
                    <span key={sid}>
                      {i > 0 && ", "}
                      <button
                        type="button"
                        className="aws-link-btn"
                        disabled={!interactive}
                        onClick={() => go(sid, `home-quick-${sid}`)}
                      >
                        {SERVICES.find((s) => s.id === sid)?.name}
                      </button>
                    </span>
                  ))}
                  .
                </p>
              </div>
            ) : (
              <ul className="aws-recent-list">
                {recent.map((svc) =>
                  svc ? (
                    <li key={svc.id}>
                      <button
                        type="button"
                        className="aws-recent-chip"
                        data-console-target={`home-${svc.id}`}
                        disabled={!interactive}
                        onClick={() => go(svc.id, `home-${svc.id}`)}
                      >
                        <span
                          className="aws-svc-icon"
                          style={{ background: svc.color }}
                        >
                          {svc.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <strong>{svc.name}</strong>
                          <em>{resourceCountLabel(svc.id, counts)}</em>
                        </span>
                      </button>
                    </li>
                  ) : null
                )}
              </ul>
            )}
          </WidgetChrome>
        );
      case "welcome":
        return (
          <WidgetChrome
            key={id}
            {...widgetDragProps(id)}
            title="Welcome to AWS"
            onRemove={() => removeWidget(id)}
          >
            <p className="aws-welcome-greet">
              Welcome to AWS, <strong>{username || "user"}</strong>!
            </p>
            <ul className="aws-welcome-list">
              <li>
                <div>
                  <strong>Getting started with AWS</strong>
                  <p>Learn the basics and launch your first workload.</p>
                  <a
                    className="aws-link-btn"
                    href="https://aws.amazon.com/getting-started/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Getting Started Guide ↗
                  </a>
                </div>
              </li>
              <li>
                <div>
                  <strong>Launch a virtual machine</strong>
                  <p>Start an EC2 instance in minutes.</p>
                  <button
                    type="button"
                    className="aws-link-btn"
                    disabled={!interactive}
                    onClick={() => go("ec2", "home-welcome-ec2")}
                  >
                    Launch VM
                  </button>
                </div>
              </li>
              <li>
                <div>
                  <strong>Start migrating to AWS</strong>
                  <p>Explore migration paths and tools.</p>
                  <button
                    type="button"
                    className="aws-link-btn"
                    disabled={!interactive}
                    onClick={() => go("billing", "home-welcome-migrate")}
                  >
                    Explore migration
                  </button>
                </div>
              </li>
            </ul>
          </WidgetChrome>
        );
      case "health":
        return (
          <WidgetChrome
            key={id}
            {...widgetDragProps(id)}
            title="AWS Health"
            onRemove={() => removeWidget(id)}
            footer={
              <button
                type="button"
                className="aws-link-btn"
                disabled={!interactive}
                onClick={() => go("cloudwatch", "home-health")}
              >
                Go to AWS Health
              </button>
            }
          >
            <table className="aws-health-table">
              <thead>
                <tr>
                  <th />
                  <th>Past 7 days</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className={`aws-health-dot ${openIssues ? "is-bad" : "is-ok"}`} />
                    Open issues
                  </td>
                  <td className={openIssues ? "is-bad" : ""}>
                    {openIssues} {openIssues === 0 ? "(Healthy)" : ""}
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="aws-health-dot is-ok" />
                    Scheduled changes
                  </td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>
                    <span className="aws-health-dot is-warn" />
                    Other notifications
                  </td>
                  <td>{otherNotifs}</td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <em>Operational status: All systems normal</em>
                  </td>
                </tr>
              </tbody>
            </table>
          </WidgetChrome>
        );
      case "cost":
        return (
          <WidgetChrome
            key={id}
            {...widgetDragProps(id)}
            title="Cost and usage"
            onRemove={() => removeWidget(id)}
            footer={
              <button
                type="button"
                className="aws-link-btn"
                data-action-id="CLICK:widget-cost-view-explorer"
                disabled={!interactive}
                onClick={() => go("billing", "cost-explorer")}
              >
                View in Cost Explorer ➔
              </button>
            }
          >
            <div className="aws-cost-widget">
              <div>
                <div className="aws-widget-label">Current month</div>
                <div className="aws-widget-stat">${monthSpend.toFixed(2)}</div>
              </div>
              <div>
                <div className="aws-widget-label">Forecasted month end</div>
                <div className="aws-widget-stat">${forecast.toFixed(2)}</div>
              </div>
            </div>
            <div className="aws-home-cost-bars" aria-hidden>
              {costBars.map((b) => (
                <span
                  key={b.label}
                  style={{ height: `${Math.max(18, (b.value / Math.max(...costBars.map((x) => x.value), 1)) * 100)}%` }}
                  title={`${b.label}: $${b.value}`}
                >
                  {b.label}
                  <br />${b.value}
                </span>
              ))}
            </div>
          </WidgetChrome>
        );
      case "favorites":
        return (
          <WidgetChrome
            key={id}
            {...widgetDragProps(id)}
            title="Favorites"
            onRemove={() => removeWidget(id)}
            footer={
              <button
                type="button"
                className="aws-link-btn"
                onClick={() => setOverlay({ services_open: true })}
              >
                Manage favorites
              </button>
            }
          >
            {favorites.length === 0 ? (
              <p className="aws-home-empty">Star services from the Services menu to pin them here.</p>
            ) : (
              <div className="aws-recent-row">
                {favorites.map((fid) => {
                  const svc = SERVICES.find((s) => s.id === fid);
                  if (!svc) return null;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      className="aws-recent-chip"
                      draggable
                      disabled={!interactive}
                      onDragStart={() => setDragFav(svc.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        reorderFavorites(svc.id);
                      }}
                      onClick={() => go(svc.id, `home-fav-${svc.id}`)}
                    >
                      <span className="aws-home-widget-drag" aria-hidden>
                        ⋮⋮
                      </span>
                      {homeLayout.showFavIcon && (
                        <span
                          className="aws-svc-icon"
                          style={{ background: svc.color }}
                        >
                          {svc.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      {homeLayout.showFavName && (
                        <span>
                          ★{" "}
                          {svc.id === "vpc"
                            ? "Virtual Private Cloud"
                            : svc.id === "billing"
                              ? "Cost Explorer"
                              : svc.id === "iam"
                                ? "IAM"
                                : `Amazon ${svc.name}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </WidgetChrome>
        );
      case "trusted":
        return (
          <WidgetChrome
            key={id}
            {...widgetDragProps(id)}
            title="Trusted Advisor (5 Checks)"
            onRemove={() => removeWidget(id)}
          >
            <ul className="aws-trusted-list">
              {TRUSTED_CHECKS.map((c) => (
                <li key={c.pillar}>
                  <span aria-hidden>{c.icon}</span>
                  <div>
                    <strong>
                      {c.pillar}: {c.count} {c.count === 1 ? "Action" : "Alerts"}
                    </strong>
                    <span>{c.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </WidgetChrome>
        );
      case "explore":
        return (
          <WidgetChrome
            key={id}
            {...widgetDragProps(id)}
            title="Explore AWS"
            onRemove={() => removeWidget(id)}
          >
            <div className="aws-explore-meta">
              <span>Filter: Earn AWS credits</span>
              <span>Activities completed: 0 of 5</span>
              <span>Total credits earned: $0 of $100 USD</span>
            </div>
            <table className="aws-explore-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Reward</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {EXPLORE_ACTIVITIES.map((a) => (
                  <tr key={a.name}>
                    <td>
                      <button
                        type="button"
                        className="aws-link-btn"
                        disabled={!interactive}
                        onClick={() => {
                          if (a.name.includes("EC2")) go("ec2", "explore-ec2");
                          else if (a.name.includes("S3")) go("s3", "explore-s3");
                          else if (a.name.includes("CloudWatch"))
                            go("cloudwatch", "explore-cw");
                          else if (a.name.includes("VPC")) go("vpc", "explore-vpc");
                        }}
                      >
                        {a.name}
                      </button>
                    </td>
                    <td>${a.reward}</td>
                    <td>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </WidgetChrome>
        );
      default:
        return null;
    }
  };

  return (
    <div className="aws-home" data-action-id="NAV:console-home">
      <div className="aws-home-toolbar">
        <button
          type="button"
          className="aws-home-hamburger"
          aria-label="Open console navigation"
          data-console-target="home-hamburger"
          onClick={() => setSideOpen((o) => !o)}
        >
          ☰
        </button>
        <div className="aws-home-title-row">
          <h1 className="aws-home-title">
            Console Home{" "}
            <button type="button" className="aws-home-info-link">
              Info
            </button>
          </h1>
          <div className="aws-home-actions">
            <button
              type="button"
              className="aws-home-btn-secondary"
              data-action-id="CLICK:btn-reset-home-layout"
              disabled={!interactive}
              onClick={() => {
                resetHomeLayout();
                setAddOpen(false);
              }}
            >
              Reset to default layout
            </button>
            <button
              type="button"
              className="aws-home-btn-primary"
              disabled={!interactive}
              data-console-target="home-add-widgets"
              data-action-id="CLICK:btn-add-widgets-drawer"
              onClick={() => setAddOpen((o) => !o)}
            >
              + Add widgets
            </button>
          </div>
        </div>
      </div>

      {sideOpen && (
        <aside className="aws-home-side" data-console-target="home-side-nav">
          <button type="button" className="is-active" onClick={() => setView("home")}>
            Console Home
          </button>
          <button type="button" onClick={() => setView("all-services")}>
            All services
          </button>
          <button
            type="button"
            onClick={() => {
              setOverlay({ services_open: true });
              setSideOpen(false);
            }}
          >
            Favorites
          </button>
          {SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={!interactive}
              onClick={() => go(s.id, `side-${s.id}`)}
            >
              {s.name}
            </button>
          ))}
        </aside>
      )}

      {addOpen && (
        <>
          <div
            className="aws-home-drawer-backdrop"
            onClick={() => setAddOpen(false)}
            aria-hidden
          />
          <div
            className="aws-home-add-drawer"
            role="dialog"
            aria-label="Add widgets"
          >
            <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <strong>Add widgets</strong>
              <button type="button" aria-label="Close" onClick={() => setAddOpen(false)}>
                ×
              </button>
            </header>
            <p style={{ fontSize: 13, color: "#545b64", marginBottom: 12 }}>
              Toggle widgets on or off. Layout is saved automatically.
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {ALL_WIDGETS.map((w) => (
                <li key={w.id} style={{ marginBottom: 10 }}>
                  <label className="aws-settings-check">
                    <input
                      type="checkbox"
                      checked={widgets.includes(w.id)}
                      data-action-id={w.actionId}
                      disabled={!interactive}
                      onChange={() => toggleWidget(w.id)}
                    />
                    {w.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className={`aws-home-grid${sideOpen ? " with-side" : ""}`}>
        {widgets.map((id) => renderWidget(id))}
      </div>
    </div>
  );
}
