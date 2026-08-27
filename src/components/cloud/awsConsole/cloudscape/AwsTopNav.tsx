import { useEffect, useState } from "react";
import { useAccountStore } from "./store";
import {
  REGIONS,
  SERVICES,
  SERVICE_FEATURES,
  SERVICE_DOCS,
} from "./ui";
import type { ServiceId } from "./types";

function AwsWordmark() {
  return (
    <svg
      className="aws-wordmark"
      width="60"
      height="32"
      viewBox="0 0 80 40"
      aria-hidden
    >
      <text
        x="2"
        y="22"
        fill="currentColor"
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

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      {[2, 7, 12].flatMap((y) =>
        [2, 7, 12].map((x) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="2.5" height="2.5" fill="#fff" rx="0.4" />
        ))
      )}
    </svg>
  );
}

function IconQ() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="qgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        fill="url(#qgrad)"
        d="M12 2c4.4 0 8 3.1 8 7.2 0 2.6-1.4 4.9-3.6 6.2L18 20l-3.2-1.5c-.9.2-1.8.3-2.8.3-4.4 0-8-3.1-8-7.2S7.6 2 12 2z"
      />
    </svg>
  );
}

function IconCloudShell() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="#fff" strokeWidth="1.4" />
      <path d="M4.5 8.5L6.5 10.5L4.5 12.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12.5H11.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
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

export function AwsTopNav({
  onExitToWorkspace,
}: {
  onExitToWorkspace?: () => void;
} = {}) {
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
  const favorites = useAccountStore((s) => s.favorites);
  const homeLayout = useAccountStore((s) => s.homeLayout);
  const toggleFavorite = useAccountStore((s) => s.toggleFavorite);
  const setHomeLayout = useAccountStore((s) => s.setHomeLayout);
  const setFlash = useAccountStore((s) => s.setFlash);
  const alarms = useAccountStore((s) => s.alarms);
  const visualMode = useAccountStore((s) => s.visualMode);
  const route = useAccountStore((s) => s.route);
  const navigate = useAccountStore((s) => s.navigate);
  const setOverlay = useAccountStore((s) => s.setOverlay);
  const setRegion = useAccountStore((s) => s.setRegion);
  const setSearch = useAccountStore((s) => s.setSearch);
  const setVisualMode = useAccountStore((s) => s.setVisualMode);
  const markClick = useAccountStore((s) => s.markClick);
  const hydrate = useAccountStore((s) => s.hydrate);

  const [shellCmd, setShellCmd] = useState("");
  const [shellOut, setShellOut] = useState(
    "Welcome to AWS CloudShell (simulated).\nType: help | aws sts get-caller-identity | aws s3 ls | aws ec2 describe-instances | clear\n"
  );
  const [shellMax, setShellMax] = useState(false);
  const [shellMin, setShellMin] = useState(false);
  const [regionTab, setRegionTab] = useState<"regions" | "local">("regions");
  const [regionFilter, setRegionFilter] = useState("");
  const [searchCat, setSearchCat] = useState<"services" | "features" | "docs">(
    "services"
  );
  const [searchFocus, setSearchFocus] = useState(0);
  const [askQ, setAskQ] = useState(false);
  const [svcNav, setSvcNav] = useState<string>("All services");
  const [notifTab, setNotifTab] = useState<"open" | "scheduled" | "other">("other");
  const [settingsTab, setSettingsTab] = useState<"locale" | "display" | "favorites">(
    "display"
  );
  const [draftTheme, setDraftTheme] = useState(visualMode);
  const [draftRegion, setDraftRegion] = useState(identity.region);
  const [draftFavIcon, setDraftFavIcon] = useState(homeLayout.showFavIcon);
  const [draftFavName, setDraftFavName] = useState(homeLayout.showFavName);

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
      if ((e.altKey && (e.key === "s" || e.key === "S")) || ((e.metaKey || e.ctrlKey) && e.key === "k")) {
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
        setAskQ(false);
      }
      if (useAccountStore.getState().search_open) {
        const state = useAccountStore.getState();
        const q = state.search_query;
        const services = SERVICES.filter(
          (s) =>
            !q ||
            s.name.toLowerCase().includes(q.toLowerCase()) ||
            s.blurb.toLowerCase().includes(q.toLowerCase()) ||
            s.category.toLowerCase().includes(q.toLowerCase())
        );
        const features = SERVICE_FEATURES.filter(
          (f) =>
            !q ||
            f.name.toLowerCase().includes(q.toLowerCase()) ||
            f.blurb.toLowerCase().includes(q.toLowerCase())
        );
        const docs = SERVICE_DOCS.filter(
          (d) =>
            !q ||
            d.name.toLowerCase().includes(q.toLowerCase()) ||
            d.blurb.toLowerCase().includes(q.toLowerCase())
        );
        const len =
          searchCat === "services"
            ? services.length
            : searchCat === "features"
              ? features.length
              : docs.length;
        if (e.key === "ArrowDown" && len > 0) {
          e.preventDefault();
          setSearchFocus((i) => (i + 1) % len);
        }
        if (e.key === "ArrowUp" && len > 0) {
          e.preventDefault();
          setSearchFocus((i) => (i - 1 + len) % len);
        }
        if (e.key === "Enter" && len > 0) {
          e.preventDefault();
          if (searchCat === "services") {
            const svc = services[searchFocus];
            if (svc) go(svc.id, `search-result-${svc.id}`);
          } else if (searchCat === "features") {
            const f = features[searchFocus];
            if (f) go(f.service as ServiceId, `search-feature-${f.service}`);
          } else {
            const d = docs[searchFocus];
            if (d?.service) go(d.service as ServiceId, `search-doc-${d.service}`);
            else closeAll();
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setOverlay, searchCat, searchFocus]);

  const go = (id: ServiceId, target: string) => {
    markClick(target);
    closeAll();
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
        "Commands: help, clear, aws sts get-caller-identity, aws iam list-users, aws s3 ls, aws ec2 describe-instances, aws vpc describe-vpcs";
    } else if (lower === "clear") {
      setShellOut("");
      setShellCmd("");
      return;
    } else if (lower.includes("sts get-caller-identity") || lower.includes("get-caller-identity")) {
      reply = JSON.stringify(
        {
          UserId: "AIDAEXAMPLE",
          Account: state.identity.account_id,
          Arn: `arn:aws:iam::${state.identity.account_id}:user/${state.identity.iam_username}`,
        },
        null,
        2
      );
    } else if (lower.includes("iam list-users")) {
      reply = state.users.map((u) => u.username).join("\n") || "(none)";
    } else if (lower.includes("s3 ls")) {
      reply = state.buckets.map((b) => b.name).join("\n") || "(none)";
    } else if (lower.includes("ec2 describe-instances")) {
      reply =
        JSON.stringify(
          state.instances.map((i) => ({
            InstanceId: i.id,
            State: i.state,
            Name: i.name,
            Type: i.type,
          })),
          null,
          2
        ) || "(none)";
    } else if (lower.includes("describe-vpcs") || lower.includes("vpc describe")) {
      reply = state.vpcs.map((v) => `${v.id}\t${v.cidr}\t${v.name}`).join("\n") || "(none)";
    } else {
      reply = `aws: Simulated CloudShell — unknown command.\nTry: help`;
    }
    setShellOut((prev) => `${prev}[cloudshell-user@ip-10-0-12-44 ~]$ ${cmd}\n${reply}\n`);
    setShellCmd("");
    markClick("cloudshell-run");
  };

  const regionLabel =
    route.service === "iam" || route.service === "s3" || route.service === "billing"
      ? "Global"
      : REGIONS.find((r) => r.id === identity.region)?.label || identity.region;
  const regionLocked =
    route.service === "iam" || route.service === "s3" || route.service === "billing";
  const initials = (identity.iam_username || identity.account_name || "RG")
    .split(/[\s._-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const searchHits = SERVICES.filter(
    (s) =>
      !search_query ||
      s.name.toLowerCase().includes(search_query.toLowerCase()) ||
      s.blurb.toLowerCase().includes(search_query.toLowerCase()) ||
      s.category.toLowerCase().includes(search_query.toLowerCase())
  );

  const featureHits = SERVICE_FEATURES.filter(
    (f) =>
      !search_query ||
      f.name.toLowerCase().includes(search_query.toLowerCase()) ||
      f.blurb.toLowerCase().includes(search_query.toLowerCase())
  );

  const docHits = SERVICE_DOCS.filter(
    (d) =>
      !search_query ||
      d.name.toLowerCase().includes(search_query.toLowerCase()) ||
      d.blurb.toLowerCase().includes(search_query.toLowerCase())
  );

  const filteredRegions = REGIONS.filter(
    (r) =>
      !regionFilter ||
      r.id.toLowerCase().includes(regionFilter.toLowerCase()) ||
      r.label.toLowerCase().includes(regionFilter.toLowerCase())
  );

  const megaServices =
    svcNav === "Favorites"
      ? SERVICES.filter((s) => favorites.includes(s.id))
      : svcNav === "Recently visited"
        ? recentlyVisited
            .map((id) => SERVICES.find((s) => s.id === id))
            .filter((s): s is (typeof SERVICES)[number] => Boolean(s))
        : svcNav === "All services"
          ? SERVICES
          : svcNav === "Cost Management"
            ? SERVICES.filter((s) => s.category === "Cloud Financial Management")
            : SERVICES.filter((s) => s.category === svcNav);

  const accountIdPretty = identity.account_id.replace(
    /(\d{4})(\d{4})(\d{4})/,
    "$1-$2-$3"
  );

  return (
    <header id="aws-console-header" className="aws-topnav">
      <button
        type="button"
        className="aws-topnav-logo"
        data-console-target="aws-logo"
        data-action-id="NAV:console-home"
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
        className="aws-topnav-iconbtn"
        aria-label="Amazon Q"
        title="Amazon Q"
        disabled={!interactive}
        onClick={() => setAskQ(true)}
      >
        <IconQ />
      </button>

      <button
        type="button"
        className={`aws-topnav-iconbtn ${services_open ? "is-open" : ""}`}
        data-console-target="services-menu"
        data-action-id="CLICK:btn-services-mega-menu"
        aria-label="Services"
        title="Services"
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
        <IconGrid />
      </button>

      <div
        className="aws-topnav-search"
        data-console-target="search-bar"
        data-action-id="CLICK:btn-global-search"
      >
        <IconSearch />
        <input
          data-console-target="search-bar-input"
          data-action-id="FILL:global-search-input"
          placeholder="Search [Alt+S]"
          value={search_query}
          disabled={!interactive}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchFocus(0);
            markClick("search-bar");
            setOverlay({
              search_open: true,
              services_open: false,
              region_open: false,
              account_open: false,
              notifications_open: false,
              settings_open: false,
              support_open: false,
            });
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
          onKeyDown={(e) => {
            const list =
              searchCat === "services"
                ? searchHits
                : searchCat === "features"
                  ? featureHits
                  : docHits;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSearchFocus((n) => Math.min(n + 1, Math.max(list.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSearchFocus((n) => Math.max(n - 1, 0));
            } else if (e.key === "Enter" && list[searchFocus]) {
              e.preventDefault();
              const item = list[searchFocus];
              if ("id" in item) go(item.id, `search-result-${item.id}`);
              else if ("service" in item && item.service)
                go(item.service as ServiceId, `search-result-${item.service}`);
            }
          }}
          aria-label="Search"
        />
        <button
          type="button"
          className="aws-topnav-askq"
          disabled={!interactive}
          onClick={() => setAskQ(true)}
        >
          <IconQ />
          Ask Amazon Q
        </button>
      </div>

      <div className="aws-topnav-spacer" />

      <button
        type="button"
        className="aws-topnav-iconbtn"
        aria-label="CloudShell"
        title="CloudShell"
        data-console-target="cloudshell"
        data-action-id="NAV:open-cloudshell-drawer"
        disabled={!interactive}
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
        <IconCloudShell />
      </button>
      <button
        type="button"
        className="aws-topnav-iconbtn"
        aria-label="Notifications"
        title="Notifications"
        data-console-target="notifications"
        data-action-id="CLICK:btn-notifications-bell"
        disabled={!interactive}
        onClick={() => {
          markClick("notifications");
          openUtility("notifications_open");
        }}
      >
        <IconBell />
        <span className="aws-topnav-badge" />
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
        aria-label="Settings"
        title="Settings"
        data-console-target="settings"
        data-action-id="NAV:open-settings-modal"
        disabled={!interactive}
        onClick={() => {
          markClick("settings");
          setDraftTheme(visualMode);
          setDraftRegion(identity.region);
          setDraftFavIcon(homeLayout.showFavIcon);
          setDraftFavName(homeLayout.showFavName);
          openUtility("settings_open");
        }}
      >
        <IconGear />
      </button>
      <button
        type="button"
        className={`aws-topnav-btn ${region_open ? "is-open" : ""} ${regionLocked ? "is-locked" : ""}`}
        data-console-target="region-selector"
        data-action-id="CLICK:btn-region-selector"
        disabled={!interactive || regionLocked}
        title={regionLocked ? "This service is global" : "Choose a Region"}
        onClick={() => {
          if (regionLocked) return;
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
        {regionLabel} {!regionLocked && <span className="aws-topnav-caret">▾</span>}
      </button>

      <button
        type="button"
        className={`aws-topnav-btn aws-topnav-account ${account_open ? "is-open" : ""}`}
        data-console-target="account-badge"
        data-action-id="CLICK:btn-account-menu"
        disabled={!interactive}
        onClick={() => {
          markClick("account-badge");
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
        <span className="aws-topnav-avatar">{initials}</span>
        {identity.iam_username} <span className="aws-topnav-caret">▾</span>
      </button>

      {services_open && (
        <div className="aws-topnav-panel services aws-services-mega">
          <div className="aws-services-mega-left">
            {["Favorites", "All services", "Recently visited"].map((item) => (
              <button
                key={item}
                type="button"
                className={svcNav === item ? "is-active" : ""}
                onMouseEnter={() => setSvcNav(item)}
                onClick={() => setSvcNav(item)}
              >
                {item}
              </button>
            ))}
            <hr />
            {[
              "Compute",
              "Containers",
              "Storage",
              "Database",
              "Networking & Content Delivery",
              "Security, Identity, & Compliance",
              "Management & Governance",
              "Cost Management",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                className={svcNav === cat ? "is-active" : ""}
                onMouseEnter={() => setSvcNav(cat)}
                onClick={() => setSvcNav(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="aws-services-mega-right">
            <h3>{svcNav}</h3>
            <div className="aws-svc-grid">
              {(svcNav === "Recently visited"
                ? recentlyVisited
                    .map((id) => SERVICES.find((s) => s.id === id))
                    .filter(Boolean)
                : megaServices
              ).map((svc) =>
                svc ? (
                  <div key={svc.id} className="aws-svc-fav-row">
                    <button
                      type="button"
                      className="aws-topnav-row"
                      data-console-target={svc.target}
                      onClick={() => go(svc.id, svc.target)}
                    >
                      <span className="aws-svc-icon" style={{ background: svc.color }}>
                        {svc.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <strong>{svc.name}</strong>
                        <span>{svc.blurb}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`aws-fav-star ${favorites.includes(svc.id) ? "is-on" : ""}`}
                      aria-label="Toggle favorite"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(svc.id);
                      }}
                    >
                      ★
                    </button>
                  </div>
                ) : null
              )}
            </div>
          </div>
          <button type="button" className="aws-services-close" aria-label="Close" onClick={closeAll}>
            ×
          </button>
        </div>
      )}

      {search_open && (
        <div className="aws-search-spotlight-backdrop" onClick={closeAll}>
          <div className="aws-topnav-panel search aws-search-mega" onClick={(e) => e.stopPropagation()}>
            <aside className="aws-search-cats">
              {(
                [
                  ["services", "Services"],
                  ["features", "Features"],
                  ["docs", "Documentation & Blogs"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={searchCat === id ? "is-active" : ""}
                  onClick={() => {
                    setSearchCat(id);
                    setSearchFocus(0);
                  }}
                >
                  {label}
                </button>
              ))}
            </aside>
            <div className="aws-search-results">
              {searchCat === "services" &&
                searchHits.map((svc, i) => (
                  <button
                    key={svc.id}
                    type="button"
                    className={`aws-topnav-row ${searchFocus === i ? "is-active" : ""}`}
                    data-action-id={`SELECT:search-result-service-${svc.id}`}
                    onClick={() => go(svc.id, `search-result-${svc.id}`)}
                  >
                    <strong>{svc.name}</strong>
                    <span>{svc.blurb}</span>
                  </button>
                ))}
              {searchCat === "features" &&
                featureHits.map((f, i) => (
                  <button
                    key={f.name}
                    type="button"
                    className={`aws-topnav-row ${searchFocus === i ? "is-active" : ""}`}
                    onClick={() => go(f.service as ServiceId, `search-feature-${f.service}`)}
                  >
                    <strong>{f.name}</strong>
                    <span>{f.blurb}</span>
                  </button>
                ))}
              {searchCat === "docs" &&
                docHits.map((d, i) => (
                  <button
                    key={d.name}
                    type="button"
                    className={`aws-topnav-row ${searchFocus === i ? "is-active" : ""}`}
                    onClick={() =>
                      d.service ? go(d.service as ServiceId, `search-doc-${d.service}`) : closeAll()
                    }
                  >
                    <strong>{d.name}</strong>
                    <span>{d.blurb}</span>
                  </button>
                ))}
              <div className="aws-search-feedback">
                Were these results helpful?
                <button
                  type="button"
                  onClick={() => setFlash({ type: "success", content: "Thanks for your feedback." })}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFlash({ type: "info", content: "Thanks — we'll improve search." })}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {region_open && (
        <div className="aws-topnav-panel region" data-console-target="region-dropdown">
          <input
            className="aws-region-filter"
            placeholder="Filter regions"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          />
          {filteredRegions.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`aws-topnav-row ${identity.region === r.id ? "is-active" : ""}`}
              data-console-target={`region-${r.id}`}
              onClick={() => {
                markClick(`region-${r.id}`);
                setRegion(r.id);
                closeAll();
              }}
            >
              <strong>
                {r.label}
                {identity.region === r.id ? " ✓" : ""}
              </strong>
              <span>{r.id}</span>
            </button>
          ))}
        </div>
      )}

      {askQ && (
        <div className="aws-q-modal" role="dialog" aria-label="Ask Amazon Q">
          <div className="aws-q-modal-card">
            <header>
              <strong>Ask Amazon Q</strong>
              <button type="button" aria-label="Close" onClick={() => setAskQ(false)}>
                ×
              </button>
            </header>
            <div className="aws-q-suggestions">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setAskQ(false);
                    go(s.id, `askq-${s.id}`);
                  }}
                >
                  Open {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {account_open && (
        <div className="aws-topnav-panel account">
          <div className="aws-account-card">
            <div>
              <strong>Account ID</strong>
              <span>{accountIdPretty}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(identity.account_id);
                setFlash({ type: "success", content: "Account ID copied" });
              }}
            >
              Copy
            </button>
          </div>
          <div className="aws-topnav-row" style={{ cursor: "default" }}>
            <strong>User</strong>
            <span>{identity.iam_username}</span>
          </div>
          <hr className="aws-menu-hr" />
          <button type="button" className="aws-topnav-row" onClick={() => { navigate("billing", "dashboard"); closeAll(); }}>
            <strong>Account</strong>
            <span>Billing dashboard</span>
          </button>
          <button type="button" className="aws-topnav-row" onClick={() => { navigate("iam", "account-settings"); closeAll(); }}>
            <strong>Organization</strong>
            <span>Account settings</span>
          </button>
          <button type="button" className="aws-topnav-row" onClick={() => { navigate("billing", "cost-explorer"); closeAll(); }}>
            <strong>Billing Dashboard</strong>
            <span>Cost Explorer</span>
          </button>
          <button type="button" className="aws-topnav-row" onClick={() => { navigate("iam", "users"); closeAll(); }}>
            <strong>Security credentials</strong>
            <span>IAM users</span>
          </button>
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              setDraftTheme(visualMode);
              setDraftRegion(identity.region);
              setDraftFavIcon(homeLayout.showFavIcon);
              setDraftFavName(homeLayout.showFavName);
              setOverlay({ account_open: false, settings_open: true });
            }}
          >
            <strong>Settings</strong>
            <span>Display & region</span>
          </button>
          <hr className="aws-menu-hr" />
          <button
            type="button"
            className="aws-topnav-row"
            onClick={() => {
              hydrate({
                accountId: identity.account_id,
                accountName: identity.account_name,
                region: identity.region,
                initialService: "home",
                fresh: true,
              });
              closeAll();
            }}
          >
            <strong>Sign out</strong>
            <span>Reset session</span>
          </button>
          {onExitToWorkspace && (
            <button
              type="button"
              className="aws-topnav-row"
              data-console-target="exit-workspace"
              onClick={() => {
                closeAll();
                onExitToWorkspace();
              }}
            >
              <strong>Back to Workspace</strong>
              <span>Leave AWS Console</span>
            </button>
          )}
        </div>
      )}

      {support_open && (
        <div className="aws-topnav-panel utility">
          <button type="button" className="aws-topnav-row" onClick={() => { navigate("cloudwatch", "alarms"); closeAll(); }}>
            <strong>Health Dashboard</strong>
            <span>AWS Health via CloudWatch</span>
          </button>
          <button type="button" className="aws-topnav-row" onClick={() => { navigate("home"); closeAll(); }}>
            <strong>Documentation</strong>
            <span>Console Home</span>
          </button>
        </div>
      )}

      {notifications_open && (
        <div className="aws-topnav-panel utility aws-notif-panel">
          <div className="aws-notif-tabs">
            {(
              [
                ["open", `Open issues (${alarms.filter((a) => a.state === "ALARM").length})`],
                ["scheduled", "Scheduled changes (0)"],
                ["other", "Other notifications (1)"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={notifTab === id ? "is-active" : ""}
                onClick={() => setNotifTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {notifTab === "open" &&
            (alarms.filter((a) => a.state === "ALARM").length === 0 ? (
              <div className="aws-topnav-row" style={{ cursor: "default" }}>
                <strong>No open issues</strong>
              </div>
            ) : (
              alarms
                .filter((a) => a.state === "ALARM")
                .map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    className="aws-topnav-row"
                    onClick={() => {
                      navigate("cloudwatch", "alarms");
                      closeAll();
                    }}
                  >
                    <strong>{a.name}</strong>
                    <span>{a.condition}</span>
                  </button>
                ))
            ))}
          {notifTab === "scheduled" && (
            <div className="aws-topnav-row" style={{ cursor: "default" }}>
              <strong>No scheduled changes</strong>
            </div>
          )}
          {notifTab === "other" && (
            <button
              type="button"
              className="aws-topnav-row"
              onClick={() => {
                navigate("cloudwatch", "alarms");
                closeAll();
              }}
            >
              <strong>Amazon EC2 maintenance event scheduled for ap-south-1</strong>
              <span>2 hours ago</span>
            </button>
          )}
          <button
            type="button"
            className="aws-link-btn aws-notif-footer"
            onClick={() => {
              navigate("cloudwatch", "alarms");
              closeAll();
            }}
          >
            View all alerts in AWS Health Dashboard
          </button>
        </div>
      )}

      {settings_open && (
        <div className="aws-settings-modal" data-console-target="settings-panel">
          <div className="aws-settings-modal-card">
            <header>
              <strong>Settings</strong>
              <button type="button" aria-label="Close" onClick={closeAll}>
                ×
              </button>
            </header>
            <div className="aws-settings-body">
              <aside>
                {(
                  [
                    ["locale", "Localization & Default Region"],
                    ["display", "Display & Appearance"],
                    ["favorites", "Favorites Bar Settings"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={settingsTab === id ? "is-active" : ""}
                    onClick={() => setSettingsTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </aside>
              <section>
                {settingsTab === "locale" && (
                  <>
                    <label>
                      Language
                      <select defaultValue="en-US">
                        <option value="en-US">English (US)</option>
                      </select>
                    </label>
                    <label>
                      Default Region
                      <select value={draftRegion} onChange={(e) => setDraftRegion(e.target.value)}>
                        {REGIONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label} · {r.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                {settingsTab === "display" && (
                  <fieldset>
                    <legend>Theme mode</legend>
                    {(
                      [
                        ["system", "Default (System preference)"],
                        ["light", "Light mode"],
                        ["dark", "Dark mode"],
                      ] as const
                    ).map(([id, label]) => (
                      <label key={id} className="aws-settings-radio">
                        <input
                          type="radio"
                          name="theme"
                          checked={draftTheme === id}
                          onChange={() => setDraftTheme(id)}
                        />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                )}
                {settingsTab === "favorites" && (
                  <>
                    <label className="aws-settings-check">
                      <input
                        type="checkbox"
                        checked={draftFavIcon}
                        onChange={(e) => setDraftFavIcon(e.target.checked)}
                      />
                      Show service icon in favorites bar
                    </label>
                    <label className="aws-settings-check">
                      <input
                        type="checkbox"
                        checked={draftFavName}
                        onChange={(e) => setDraftFavName(e.target.checked)}
                      />
                      Show service name in favorites bar
                    </label>
                  </>
                )}
              </section>
            </div>
            <footer>
              <button type="button" onClick={closeAll}>
                Cancel
              </button>
              <button
                type="button"
                className="aws-btn-primary"
                onClick={() => {
                  setVisualMode(draftTheme);
                  setRegion(draftRegion);
                  setHomeLayout({ showFavIcon: draftFavIcon, showFavName: draftFavName });
                  setFlash({ type: "success", content: "Settings saved." });
                  closeAll();
                }}
              >
                Save settings
              </button>
            </footer>
          </div>
        </div>
      )}

      {cloudshell_open && (
        <div className={`aws-cloudshell ${shellMax ? "is-max" : ""}`} data-console-target="cloudshell-panel">
          <div className="aws-cloudshell-bar">
            <span className="aws-cloudshell-title">
              <IconCloudShell /> CloudShell ({identity.region})
            </span>
            <div className="aws-cloudshell-bar-actions">
              <button
                type="button"
                data-action-id="CLICK:cloudshell-minimize"
                aria-label="Minimize"
                onClick={() => setOverlay({ cloudshell_open: false })}
              >
                –
              </button>
              <button type="button" aria-label="Maximize" onClick={() => setShellMax((v) => !v)}>
                □
              </button>
              <button
                type="button"
                data-action-id="CLICK:cloudshell-close"
                aria-label="Close"
                onClick={() => {
                  setShellMax(false);
                  setOverlay({ cloudshell_open: false });
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="aws-cloudshell-out">{shellOut}</div>
          <form
            className="aws-cloudshell-form"
            onSubmit={(e) => {
              e.preventDefault();
              runShell();
            }}
          >
            <span className="aws-cloudshell-prompt">[cloudshell-user@ip-10-0-12-44 ~]$</span>
            <input
              data-action-id="FILL:cloudshell-command-input"
              value={shellCmd}
              onChange={(e) => setShellCmd(e.target.value)}
              placeholder="aws sts get-caller-identity"
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

