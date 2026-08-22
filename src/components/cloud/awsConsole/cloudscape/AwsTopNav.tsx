import { useEffect, useState } from "react";
import { useAccountStore } from "./store";
import { REGIONS, SERVICES } from "./ui";
import type { ServiceId } from "./types";

function AwsWordmark() {
  return (
    <svg width="52" height="28" viewBox="0 0 80 40" aria-hidden>
      <text
        x="2"
        y="22"
        fill="#ffffff"
        fontFamily="Amazon Ember, Helvetica Neue, Arial, sans-serif"
        fontSize="22"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        aws
      </text>
      <path
        fill="#FF9900"
        d="M18.2 30.4c8.6 6.3 19.9 5.1 26.6-.6.6-.5 1.1.1.6.7-5.8 6.6-15.2 8.5-25.7 5.9-1.1-.3-.6-1.8.5-2.2.8-.3 1.6-.6 2.5-.8.8-.2 1.6-.4 2.5-.6.8-.2 1.7-.4 2.5-.6.8-.2 1.6-.4 2.4-.6z"
      />
      <path
        fill="none"
        stroke="#FF9900"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M16 29c7.4 5.6 20.2 5.8 29.2-.4"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="aws-topnav-search-icon" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="#aab7b8" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" stroke="#aab7b8" strokeWidth="1.5" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 2.2a3.6 3.6 0 00-3.6 3.6v2.1l-1.2 1.8h12l-1.2-1.8V5.8A3.6 3.6 0 008 2.2z"
        stroke="#fff"
        strokeWidth="1.4"
      />
      <path d="M6.2 13.2a1.8 1.8 0 003.6 0" stroke="#fff" strokeWidth="1.4" />
    </svg>
  );
}

function IconSupport() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="1.4" />
      <path d="M8 7.2V12" stroke="#fff" strokeWidth="1.4" />
      <circle cx="8" cy="5.2" r="0.8" fill="#fff" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.2" stroke="#fff" strokeWidth="1.4" />
      <path
        d="M8 2.2l.7 1.4 1.5-.3.8 1.3 1.4.7-.3 1.5 1.4.7-1.4.7.3 1.5-1.4.7-.8 1.3-1.5-.3L8 13.8l-.7-1.4-1.5.3-.8-1.3-1.4-.7.3-1.5L2.5 8.5l1.4-.7-.3-1.5 1.4-.7.8-1.3 1.5.3L8 2.2z"
        stroke="#fff"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export function AwsTopNav() {
  const identity = useAccountStore((s) => s.identity);
  const search_query = useAccountStore((s) => s.search_query);
  const services_open = useAccountStore((s) => s.services_open);
  const search_open = useAccountStore((s) => s.search_open);
  const region_open = useAccountStore((s) => s.region_open);
  const account_open = useAccountStore((s) => s.account_open);
  const notifications_open = useAccountStore((s) => s.notifications_open);
  const settings_open = useAccountStore((s) => s.settings_open);
  const support_open = useAccountStore((s) => s.support_open);
  const cloudshell_open = useAccountStore((s) => s.cloudshell_open);
  const interactive = useAccountStore((s) => s.interactive);
  const recentlyVisited = useAccountStore((s) => s.recentlyVisited);
  const alarms = useAccountStore((s) => s.alarms);
  const navigate = useAccountStore((s) => s.navigate);
  const setOverlay = useAccountStore((s) => s.setOverlay);
  const setRegion = useAccountStore((s) => s.setRegion);
  const setSearch = useAccountStore((s) => s.setSearch);
  const markClick = useAccountStore((s) => s.markClick);
  const hydrate = useAccountStore((s) => s.hydrate);

  const [shellCmd, setShellCmd] = useState("");
  const [shellOut, setShellOut] = useState(
    "Welcome to AWS CloudShell (simulated).\nType: help | aws iam list-users | aws s3 ls | aws ec2 describe-instances | clear\n"
  );

  const closeAll = () =>
    setOverlay({
      services_open: false,
      search_open: false,
      region_open: false,
      account_open: false,
      notifications_open: false,
      settings_open: false,
      support_open: false,
    });

  const openUtility = (
    key: "notifications_open" | "settings_open" | "support_open"
  ) => {
    const currently = useAccountStore.getState()[key];
    setOverlay({
      services_open: false,
      search_open: false,
      region_open: false,
      account_open: false,
      notifications_open: false,
      settings_open: false,
      support_open: false,
      [key]: !currently,
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setOverlay({
          search_open: true,
          services_open: false,
          region_open: false,
          account_open: false,
          notifications_open: false,
          settings_open: false,
          support_open: false,
        });
        document
          .querySelector<HTMLInputElement>('[data-console-target="search-bar-input"]')
          ?.focus();
      }
      if (e.key === "Escape") {
        closeAll();
        setOverlay({ cloudshell_open: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOverlay]);

  const go = (id: ServiceId, target: string) => {
    markClick(target);
    navigate(id);
  };

  const runShell = () => {
    const cmd = shellCmd.trim();
    if (!cmd) return;
    const state = useAccountStore.getState();
    let reply = "";
    const lower = cmd.toLowerCase();
    if (lower === "help") {
      reply =
        "Commands: help, clear, aws iam list-users, aws s3 ls, aws ec2 describe-instances, aws vpc describe-vpcs";
    } else if (lower === "clear") {
      setShellOut("");
      setShellCmd("");
      return;
    } else if (lower.includes("iam list-users")) {
      reply = state.users.map((u) => u.username).join("\n") || "(none)";
    } else if (lower.includes("s3 ls")) {
      reply = state.buckets.map((b) => b.name).join("\n") || "(none)";
    } else if (lower.includes("ec2 describe-instances")) {
      reply =
        state.instances
          .map((i) => `${i.id}\t${i.state}\t${i.name}`)
          .join("\n") || "(none)";
    } else if (lower.includes("describe-vpcs") || lower.includes("vpc")) {
      reply = state.vpcs.map((v) => `${v.id}\t${v.cidr}\t${v.name}`).join("\n") || "(none)";
    } else {
      reply = `aws: Simulated CloudShell — unknown command.\nTry: help`;
    }
    setShellOut((prev) => `${prev}$ ${cmd}\n${reply}\n`);
    setShellCmd("");
    markClick("cloudshell-run");
  };

  return (
    <header id="aws-console-header" className="aws-topnav">
      <button
        type="button"
        className="aws-topnav-logo"
        data-console-target="aws-logo"
        aria-label="AWS Console Home"
        disabled={!interactive}
        onClick={() => {
          markClick("aws-logo");
          navigate("home");
        }}
      >
        <AwsWordmark />
      </button>

      <button
        type="button"
        className={`aws-topnav-btn ${services_open ? "is-open" : ""}`}
        data-console-target="services-menu"
        disabled={!interactive}
        onClick={() => {
          markClick("services-menu");
          setOverlay({
            services_open: !services_open,
            search_open: false,
            region_open: false,
            account_open: false,
            notifications_open: false,
            settings_open: false,
            support_open: false,
          });
        }}
      >
        Services <span className="aws-topnav-caret">▾</span>
      </button>

      <div className="aws-topnav-search" data-console-target="search-bar">
        <IconSearch />
        <input
          data-console-target="search-bar-input"
          placeholder="Search"
          value={search_query}
          disabled={!interactive}
          onChange={(e) => {
            setSearch(e.target.value);
            markClick("search-bar");
          }}
          onFocus={() =>
            setOverlay({
              search_open: true,
              services_open: false,
              region_open: false,
              account_open: false,
              notifications_open: false,
              settings_open: false,
              support_open: false,
            })
          }
          aria-label="Search"
        />
        <span className="aws-topnav-search-hint">Alt+S</span>
      </div>

      <div className="aws-topnav-spacer" />

      <button
        type="button"
        className={`aws-topnav-btn ${region_open ? "is-open" : ""}`}
        data-console-target="region-selector"
        disabled={!interactive}
        onClick={() => {
          markClick("region-selector");
          setOverlay({
            region_open: !region_open,
            services_open: false,
            search_open: false,
            account_open: false,
            notifications_open: false,
            settings_open: false,
            support_open: false,
          });
        }}
      >
        {identity.region} <span className="aws-topnav-caret">▾</span>
      </button>

      <button
        type="button"
        className={`aws-topnav-btn ${account_open ? "is-open" : ""}`}
        data-console-target="account-badge"
        disabled={!interactive}
        onClick={() => {
          markClick("account-badge");
          markClick("account-switcher");
          setOverlay({
            account_open: !account_open,
            services_open: false,
            search_open: false,
            region_open: false,
            notifications_open: false,
            settings_open: false,
            support_open: false,
          });
        }}
      >
        {identity.account_name} <span className="aws-topnav-caret">▾</span>
      </button>

      <button
        type="button"
        className="aws-topnav-iconbtn"
        aria-label="Support"
        title="Support"
        data-console-target="support"
        disabled={!interactive}
        onClick={() => {
          markClick("support");
          openUtility("support_open");
        }}
      >
        <IconSupport />
      </button>
      <button
        type="button"
        className="aws-topnav-iconbtn"
        aria-label="Notifications"
        title="Notifications"
        data-console-target="notifications"
        disabled={!interactive}
        onClick={() => {
          markClick("notifications");
          openUtility("notifications_open");
        }}
      >
        <IconBell />
        {alarms.some((a) => a.state === "ALARM") && (
          <span className="aws-topnav-badge" />
        )}
      </button>
      <button
        type="button"
        className="aws-topnav-iconbtn"
        aria-label="CloudShell"
        title="CloudShell"
        data-console-target="cloudshell"
        disabled={!interactive}
        style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 13, fontWeight: 600 }}
        onClick={() => {
          markClick("cloudshell");
          setOverlay({
            cloudshell_open: !cloudshell_open,
            services_open: false,
            search_open: false,
            region_open: false,
            account_open: false,
            notifications_open: false,
            settings_open: false,
            support_open: false,
          });
        }}
      >
        &gt;_
      </button>
      <button
        type="button"
        className="aws-topnav-iconbtn"
        aria-label="Settings"
        title="Settings"
        data-console-target="settings"
        disabled={!interactive}
        onClick={() => {
          markClick("settings");
          openUtility("settings_open");
        }}
      >
        <IconGear />
      </button>

      {services_open && (
        <div className="aws-topnav-panel services">
          <h3>Recently visited</h3>
          <div className="aws-svc-grid" style={{ marginBottom: 14 }}>
            {recentlyVisited.map((id) => {
              const svc = SERVICES.find((s) => s.id === id);
              if (!svc) return null;
              return (
                <button
                  key={svc.id}
                  type="button"
                  className="aws-topnav-row"
                  data-console-target={svc.target}
                  onClick={() => go(svc.id, svc.target)}
                >
                  <strong>{svc.name}</strong>
                  <span>{svc.blurb}</span>
                </button>
              );
            })}
          </div>
          <h3>All services</h3>
          <div className="aws-svc-grid">
            {SERVICES.map((svc) => (
              <button
                key={svc.id}
                type="button"
                className="aws-topnav-row"
                data-console-target={svc.target}
                onClick={() => go(svc.id, svc.target)}
              >
                <strong>{svc.name}</strong>
                <span>{svc.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {search_open && (
        <div className="aws-topnav-panel search">
          {SERVICES.filter(
            (s) =>
              !search_query ||
              s.name.toLowerCase().includes(search_query.toLowerCase()) ||
              s.blurb.toLowerCase().includes(search_query.toLowerCase())
          ).map((svc) => (
            <button
              key={svc.id}
              type="button"
              className="aws-topnav-row"
              data-console-target={
                svc.id === "iam" ? "search-result-iam" : `search-result-${svc.id}`
              }
              onClick={() =>
                go(svc.id, svc.id === "iam" ? "search-result-iam" : svc.target)
              }
            >
              <strong>{svc.name}</strong>
              <span>Service · {svc.category}</span>
            </button>
          ))}
        </div>
      )}

      {region_open && (
        <div className="aws-topnav-panel region" data-console-target="region-dropdown">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`aws-topnav-row ${identity.region === r.id ? "is-active" : ""}`}
              data-console-target={`region-${r.id}`}
              onClick={() => {
                markClick(`region-${r.id}`);
                setRegion(r.id);
              }}
            >
              <strong>
                {r.id}
                {identity.region === r.id ? "  ✓" : ""}
              </strong>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}

      {account_open && (
        <div className="aws-topnav-panel account">
          <div className="aws-topnav-row" style={{ cursor: "default" }}>
            <strong>{identity.iam_username}</strong>
            <span>IAM user</span>
          </div>
          <div
            className="aws-topnav-row"
            style={{ cursor: "default" }}
            data-console-target="account-id-display"
          >
            <strong>{identity.account_name}</strong>
            <span>Account ID {identity.account_id}</span>
          </div>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              hydrate({
                accountId: identity.account_id,
                accountName: identity.account_name,
                region: identity.region,
                initialService: "home",
              });
              closeAll();
            }}
          >
            <strong>Sign out</strong>
            <span>Return to Console Home</span>
          </button>
        </div>
      )}

      {support_open && (
        <div className="aws-topnav-panel utility">
          <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Support</h3>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              navigate("billing", "budgets");
              closeAll();
            }}
          >
            <strong>Support Center</strong>
            <span>Open a case (simulated → Budgets)</span>
          </button>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              navigate("cloudwatch", "alarms");
              closeAll();
            }}
          >
            <strong>Health Dashboard</strong>
            <span>Service health via CloudWatch alarms</span>
          </button>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              navigate("home");
              closeAll();
            }}
          >
            <strong>Documentation</strong>
            <span>Return to Console Home</span>
          </button>
        </div>
      )}

      {notifications_open && (
        <div className="aws-topnav-panel utility">
          <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Notifications</h3>
          {alarms.length === 0 ? (
            <div className="aws-topnav-row" style={{ cursor: "default" }}>
              <strong>No notifications</strong>
            </div>
          ) : (
            alarms.map((a) => (
              <button
                key={a.name}
                type="button"
                className="aws-topnav-row"
                onClick={() => {
                  navigate("cloudwatch", "alarms");
                  closeAll();
                }}
              >
                <strong>
                  [{a.state}] {a.name}
                </strong>
                <span>{a.condition}</span>
              </button>
            ))
          )}
        </div>
      )}

      {settings_open && (
        <div className="aws-topnav-panel utility" data-console-target="settings-panel">
          <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Settings</h3>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              setOverlay({
                settings_open: false,
                region_open: true,
              });
            }}
          >
            <strong>Region</strong>
            <span>Current: {identity.region}</span>
          </button>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              navigate("iam", "account-settings");
              closeAll();
            }}
          >
            <strong>Account settings</strong>
            <span>IAM account preferences</span>
          </button>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              navigate("billing", "cost-explorer");
              closeAll();
            }}
          >
            <strong>Billing preferences</strong>
            <span>Cost Explorer & budgets</span>
          </button>
          <div className="aws-topnav-row" style={{ cursor: "default" }}>
            <strong>Display</strong>
            <span>Light · Compact density (Cloudscape)</span>
          </div>
        </div>
      )}

      {cloudshell_open && (
        <div className="aws-cloudshell" data-console-target="cloudshell-panel">
          <div className="aws-cloudshell-bar">
            <span>CloudShell · {identity.region}</span>
            <button
              type="button"
              className="aws-topnav-iconbtn"
              aria-label="Close CloudShell"
              onClick={() => setOverlay({ cloudshell_open: false })}
            >
              ✕
            </button>
          </div>
          <div className="aws-cloudshell-out">{shellOut}</div>
          <form
            className="aws-cloudshell-form"
            onSubmit={(e) => {
              e.preventDefault();
              runShell();
            }}
          >
            <input
              value={shellCmd}
              onChange={(e) => setShellCmd(e.target.value)}
              placeholder="aws ..."
              aria-label="CloudShell command"
              autoFocus
            />
            <button type="submit">Run</button>
          </form>
        </div>
      )}
    </header>
  );
}
