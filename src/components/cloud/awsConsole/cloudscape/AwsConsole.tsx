import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Flashbar from "@cloudscape-design/components/flashbar";
import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";
import { applyDensity, applyMode, Density, Mode } from "@cloudscape-design/global-styles";
import "@cloudscape-design/global-styles/index.css";
import "@/aws-console.css";
import { AwsTopNav } from "./AwsTopNav";
import { ConsoleHome } from "./ConsoleHome";
import { IamService } from "./services/IamService";
import { Ec2Service } from "./services/Ec2Service";
import { S3Service } from "./services/S3Service";
import { VpcService } from "./services/VpcService";
import { CloudWatchService } from "./services/CloudWatchService";
import { BillingService } from "./services/BillingService";
import { useAccountStore } from "./store";
import type { ConsoleMode, ServiceId } from "./types";
import { ActionMapDevPanel } from "../actionMap/ActionMapDevPanel";

type NavItem = {
  text: string;
  href: string;
  page: string;
  target?: string;
};

type NavConfig = {
  header: string;
  items: NavItem[];
  /** Cloudscape section groups (EC2 2026 layout). */
  sections?: Array<{ text: string; items: NavItem[] }>;
};

const NAV: Record<Exclude<ServiceId, "home">, NavConfig> = {
  iam: {
    header: "Identity and Access Management (IAM)",
    items: [
      { text: "Dashboard", href: "#nav-dashboard", page: "dashboard", target: "nav-dashboard" },
      { text: "User groups", href: "#nav-groups", page: "groups", target: "nav-groups" },
      { text: "Users", href: "#nav-users", page: "users", target: "nav-users" },
      { text: "Roles", href: "#nav-roles", page: "roles", target: "nav-roles" },
      { text: "Policies", href: "#nav-policies", page: "policies", target: "nav-policies" },
      { text: "Identity providers", href: "#iam-idp", page: "identity-providers" },
      { text: "Account settings", href: "#iam-account", page: "account-settings" },
    ],
  },
  ec2: {
    header: "EC2 Dashboard",
    items: [
      { text: "Dashboard", href: "#ec2-dash", page: "dashboard" },
      { text: "Instances", href: "#ec2-instances", page: "instances" },
      { text: "Launch templates", href: "#ec2-lt", page: "launch-templates" },
      { text: "Spot Requests", href: "#ec2-spot", page: "spot-requests" },
      { text: "Reserved Instances", href: "#ec2-ri", page: "reserved-instances" },
      { text: "Security Groups", href: "#ec2-sg", page: "security-groups", target: "ec2-security-groups" },
      { text: "Elastic IPs", href: "#ec2-eip", page: "elastic-ips" },
      { text: "Placement Groups", href: "#ec2-pg", page: "placement-groups" },
      { text: "Key Pairs", href: "#ec2-keys", page: "key-pairs" },
      { text: "Network Interfaces", href: "#ec2-eni", page: "network-interfaces" },
      { text: "Load Balancers", href: "#ec2-elb", page: "load-balancers" },
      { text: "Target Groups", href: "#ec2-tg", page: "target-groups" },
      { text: "Launch Configurations", href: "#ec2-lc", page: "launch-configurations" },
      { text: "Auto Scaling Groups", href: "#ec2-asg", page: "asg" },
      { text: "Launch instances", href: "#launch-instance", page: "launch", target: "launch-instance" },
    ],
    sections: [
      {
        text: "Instances",
        items: [
          { text: "Instances", href: "#ec2-instances", page: "instances" },
          { text: "Launch templates", href: "#ec2-lt", page: "launch-templates" },
          { text: "Spot Requests", href: "#ec2-spot", page: "spot-requests" },
          { text: "Reserved Instances", href: "#ec2-ri", page: "reserved-instances" },
        ],
      },
      {
        text: "Network & Security",
        items: [
          { text: "Security Groups", href: "#ec2-sg", page: "security-groups", target: "ec2-security-groups" },
          { text: "Elastic IPs", href: "#ec2-eip", page: "elastic-ips" },
          { text: "Placement Groups", href: "#ec2-pg", page: "placement-groups" },
          { text: "Key Pairs", href: "#ec2-keys", page: "key-pairs" },
          { text: "Network Interfaces", href: "#ec2-eni", page: "network-interfaces" },
        ],
      },
      {
        text: "Load Balancing",
        items: [
          { text: "Load Balancers", href: "#ec2-elb", page: "load-balancers" },
          { text: "Target Groups", href: "#ec2-tg", page: "target-groups" },
        ],
      },
      {
        text: "Auto Scaling",
        items: [
          { text: "Launch Configurations", href: "#ec2-lc", page: "launch-configurations" },
          { text: "Auto Scaling Groups", href: "#ec2-asg", page: "asg" },
        ],
      },
    ],
  },
  s3: {
    header: "Amazon S3",
    items: [
      { text: "Buckets", href: "#s3-buckets", page: "buckets", target: "nav-s3-buckets" },
      { text: "Create bucket", href: "#create-bucket", page: "create-bucket", target: "create-bucket" },
      { text: "Access Points", href: "#s3-ap", page: "access-points" },
      { text: "Object Lambda Access Points", href: "#s3-olap", page: "object-lambda" },
      { text: "Multi-Region Access Points", href: "#s3-mrap", page: "mrap" },
      { text: "Batch Operations", href: "#s3-batch", page: "batch" },
      { text: "Access analyzer for S3", href: "#s3-analyzer", page: "access-analyzer" },
      {
        text: "Block Public Access settings for this account",
        href: "#s3-account-bpa",
        page: "account-bpa",
      },
    ],
  },
  vpc: {
    header: "Virtual Private Cloud",
    items: [
      { text: "Dashboard", href: "#vpc-dash", page: "dashboard" },
      { text: "Your VPCs", href: "#vpc-vpcs", page: "vpcs", target: "nav-vpc-list" },
      { text: "Create VPC", href: "#create-vpc", page: "create-vpc", target: "create-vpc" },
      { text: "Subnets", href: "#vpc-subnets", page: "subnets" },
      { text: "Route tables", href: "#vpc-rt", page: "route-tables" },
      { text: "Internet gateways", href: "#vpc-igw", page: "igws" },
      { text: "Egress-only internet gateways", href: "#vpc-eigw", page: "egress-igws" },
      { text: "Carrier gateways", href: "#vpc-cgw", page: "carrier-gateways" },
      { text: "DHCP option sets", href: "#vpc-dhcp", page: "dhcp-options" },
      { text: "Elastic IPs", href: "#vpc-eip", page: "elastic-ips" },
      { text: "NAT gateways", href: "#vpc-nat", page: "nat-gateways" },
      { text: "Network ACLs", href: "#vpc-nacl", page: "network-acls" },
      { text: "Security groups", href: "#vpc-sg", page: "security-groups" },
      { text: "Resource Access Manager", href: "#vpc-ram", page: "ram" },
      { text: "IPAM", href: "#vpc-ipam", page: "ipam" },
    ],
    sections: [
      {
        text: "Virtual private cloud",
        items: [
          { text: "Your VPCs", href: "#vpc-vpcs", page: "vpcs", target: "nav-vpc-list" },
          { text: "Subnets", href: "#vpc-subnets", page: "subnets" },
          { text: "Route tables", href: "#vpc-rt", page: "route-tables" },
          { text: "Internet gateways", href: "#vpc-igw", page: "igws" },
          { text: "Egress-only internet gateways", href: "#vpc-eigw", page: "egress-igws" },
          { text: "Carrier gateways", href: "#vpc-cgw", page: "carrier-gateways" },
          { text: "DHCP option sets", href: "#vpc-dhcp", page: "dhcp-options" },
          { text: "Elastic IPs", href: "#vpc-eip", page: "elastic-ips" },
          { text: "NAT gateways", href: "#vpc-nat", page: "nat-gateways" },
        ],
      },
      {
        text: "Security",
        items: [
          { text: "Network ACLs", href: "#vpc-nacl", page: "network-acls" },
          { text: "Security groups", href: "#vpc-sg", page: "security-groups" },
        ],
      },
      {
        text: "DNS and IP management",
        items: [
          { text: "Resource Access Manager", href: "#vpc-ram", page: "ram" },
          { text: "IPAM", href: "#vpc-ipam", page: "ipam" },
        ],
      },
    ],
  },
  cloudwatch: {
    header: "CloudWatch",
    items: [
      { text: "Dashboards", href: "#cw-dash", page: "dashboards", target: "nav-cw-dashboards" },
      { text: "All alarms", href: "#cw-alarms", page: "alarms", target: "nav-cw-alarms" },
      { text: "In alarm", href: "#cw-alarms-in", page: "alarms-in-alarm" },
      { text: "Billing", href: "#cw-alarms-billing", page: "alarms-billing" },
      { text: "Create alarm", href: "#cw-create-alarm", page: "create-alarm", target: "create-alarm" },
      { text: "Log groups", href: "#cw-logs", page: "log-groups" },
      { text: "Log Insights", href: "#cw-insights", page: "logs-insights" },
      { text: "All metrics", href: "#cw-metrics", page: "metrics-all" },
      { text: "Explorer", href: "#cw-explorer", page: "metrics-explorer" },
      { text: "Rules", href: "#cw-rules", page: "events-rules" },
    ],
    sections: [
      {
        text: "Dashboards",
        items: [
          { text: "Dashboards", href: "#cw-dash", page: "dashboards", target: "nav-cw-dashboards" },
        ],
      },
      {
        text: "Alarms",
        items: [
          { text: "All alarms", href: "#cw-alarms", page: "alarms", target: "nav-cw-alarms" },
          { text: "In alarm", href: "#cw-alarms-in", page: "alarms-in-alarm" },
          { text: "Billing", href: "#cw-alarms-billing", page: "alarms-billing" },
        ],
      },
      {
        text: "Logs",
        items: [
          { text: "Log groups", href: "#cw-logs", page: "log-groups" },
          { text: "Log Insights", href: "#cw-insights", page: "logs-insights" },
        ],
      },
      {
        text: "Metrics",
        items: [
          { text: "All metrics", href: "#cw-metrics", page: "metrics-all" },
          { text: "Explorer", href: "#cw-explorer", page: "metrics-explorer" },
        ],
      },
      {
        text: "Events",
        items: [{ text: "Rules", href: "#cw-rules", page: "events-rules" }],
      },
    ],
  },
  billing: {
    header: "Billing and Cost Management",
    items: [
      { text: "Billing dashboard", href: "#bill-home", page: "dashboard", target: "nav-billing-dashboard" },
      { text: "Bills", href: "#bill-bills", page: "bills" },
      { text: "Cost Explorer", href: "#bill-ce", page: "cost-explorer", target: "nav-cost-explorer" },
      { text: "Budgets", href: "#bill-budgets", page: "budgets", target: "nav-budgets" },
      { text: "Create budget", href: "#bill-create-budget", page: "create-budget" },
      { text: "Cost allocation tags", href: "#bill-tags", page: "cost-allocation-tags" },
      { text: "Savings Plans", href: "#bill-sp", page: "savings-plans" },
      { text: "Billing preferences", href: "#bill-prefs", page: "billing-preferences" },
      { text: "Payment methods", href: "#bill-pay", page: "payment-methods" },
    ],
    sections: [
      {
        text: "Billing",
        items: [
          { text: "Billing dashboard", href: "#bill-home", page: "dashboard", target: "nav-billing-dashboard" },
          { text: "Bills", href: "#bill-bills", page: "bills" },
        ],
      },
      {
        text: "Cost Management",
        items: [
          { text: "Cost Explorer", href: "#bill-ce", page: "cost-explorer", target: "nav-cost-explorer" },
          { text: "Budgets", href: "#bill-budgets", page: "budgets", target: "nav-budgets" },
          { text: "Cost allocation tags", href: "#bill-tags", page: "cost-allocation-tags" },
          { text: "Savings Plans", href: "#bill-sp", page: "savings-plans" },
        ],
      },
      {
        text: "Preferences",
        items: [
          { text: "Billing preferences", href: "#bill-prefs", page: "billing-preferences" },
          { text: "Payment methods", href: "#bill-pay", page: "payment-methods" },
        ],
      },
    ],
  },
};

function crumbs(service: ServiceId, page: string, selectedId: string | null) {
  const home = { text: "AWS Console Home", href: "#home" };
  if (service === "home") return [home];
  const header = NAV[service].header;
  const out = [home, { text: header, href: `#${service}` }];
  if (page === "create-user") {
    out.push({ text: "Users", href: "#nav-users" });
    out.push({ text: "Create user", href: "#create-user" });
    return out;
  }
  if (page === "create-user-success") {
    out.push({ text: "Users", href: "#nav-users" });
    out.push({ text: "Create user", href: "#create-user" });
    if (selectedId) out.push({ text: selectedId, href: "#sel" });
    return out;
  }
  if (page === "create-role") {
    out.push({ text: "Roles", href: "#nav-roles" });
    out.push({ text: "Create role", href: "#create-role" });
    return out;
  }
  if (service === "ec2" && page === "launch") {
    out.push({ text: "Instances", href: "#ec2-instances" });
    out.push({ text: "Launch an instance", href: "#launch-instance" });
    return out;
  }
  if (page === "user-detail" && selectedId) {
    out.push({ text: "Users", href: "#nav-users" });
    out.push({ text: selectedId, href: "#sel" });
    return out;
  }
  if (service === "s3" && page === "create-bucket") {
    out.push({ text: "Buckets", href: "#s3-buckets" });
    out.push({ text: "Create bucket", href: "#create-bucket" });
    return out;
  }
  if (service === "s3" && page === "bucket-detail" && selectedId) {
    out.push({ text: "Buckets", href: "#s3-buckets" });
    out.push({ text: selectedId, href: "#sel" });
    return out;
  }
  if (service === "cloudwatch" && page === "create-alarm") {
    out.push({ text: "Alarms", href: "#cw-alarms" });
    out.push({ text: "Create alarm", href: "#cw-create-alarm" });
    return out;
  }
  if (service === "cloudwatch" && page === "dashboard-view" && selectedId) {
    out.push({ text: "Dashboards", href: "#cw-dash" });
    out.push({ text: selectedId, href: "#sel" });
    return out;
  }
  if (service === "billing" && page === "create-budget") {
    out.push({ text: "Budgets", href: "#bill-budgets" });
    out.push({ text: "Create budget", href: "#bill-create-budget" });
    return out;
  }
  const item = NAV[service].items.find((i) => i.page === page);
  if (item) out.push({ text: item.text, href: item.href });
  if (selectedId) out.push({ text: selectedId, href: `#sel` });
  return out;
}

type TicketPanel = {
  from?: string;
  subject?: string;
  body?: string;
  priority?: string;
} | null;

export function AwsConsole({
  mode,
  ticket,
  onExitToWorkspace,
}: {
  mode: ConsoleMode;
  ticket?: TicketPanel;
  onExitToWorkspace?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const route = useAccountStore((s) => s.route);
  const flash = useAccountStore((s) => s.flash);
  const visualMode = useAccountStore((s) => s.visualMode);
  const navigate = useAccountStore((s) => s.navigate);
  const markClick = useAccountStore((s) => s.markClick);

  const [navOpen, setNavOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(mode === "work" && !!ticket);

  useEffect(() => {
    setToolsOpen(mode === "work" && !!ticket);
  }, [mode, ticket]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const resolve = () => {
      if (visualMode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? Mode.Dark : Mode.Light;
      }
      return visualMode === "dark" ? Mode.Dark : Mode.Light;
    };
    applyMode(resolve(), el);
    applyDensity(Density.Compact, el);
    el.setAttribute("data-theme", visualMode === "system" ? (resolve() === Mode.Dark ? "dark" : "light") : visualMode);

    if (visualMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyMode(resolve(), el);
      el.setAttribute("data-theme", resolve() === Mode.Dark ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [visualMode]);

  useEffect(() => {
    const nav = route.service === "home" ? [] : NAV[route.service].items;
    for (const item of nav) {
      const target = item.target || item.href.replace("#", "");
      const a = rootRef.current?.querySelector(`a[href="${item.href}"]`);
      if (a) a.setAttribute("data-console-target", target);
    }
    const dash = rootRef.current?.querySelector('a[href="#nav-dashboard"]');
    if (dash) dash.setAttribute("data-console-target", "nav-dashboard");
  }, [route.service, route.page]);

  const content = useMemo(() => {
    switch (route.service) {
      case "iam":
        return <IamService />;
      case "ec2":
        return <Ec2Service />;
      case "s3":
        return <S3Service />;
      case "vpc":
        return <VpcService />;
      case "cloudwatch":
        return <CloudWatchService />;
      case "billing":
        return <BillingService />;
      default:
        return <ConsoleHome />;
    }
  }, [route.service, route.page, route.selectedId]);

  const navConfig = route.service === "home" ? null : NAV[route.service];

  const breadcrumbItems = useMemo(
    () => crumbs(route.service, route.page, route.selectedId),
    [route.service, route.page, route.selectedId]
  );

  const sideNavItems = useMemo(() => {
    if (!navConfig) return [];
    if (navConfig.sections?.length) {
      const dashHref =
        route.service === "ec2"
          ? "#ec2-dash"
          : route.service === "vpc"
            ? "#vpc-dash"
            : route.service === "cloudwatch"
              ? "#cw-dash"
              : route.service === "billing"
                ? "#bill-home"
                : `#${route.service}`;
      const items = [
        ...navConfig.sections.map((sec) => ({
          type: "section" as const,
          text: sec.text,
          defaultExpanded: true,
          items: sec.items.map((i) => ({
            type: "link" as const,
            text: i.text,
            href: i.href,
          })),
        })),
      ];
      if (route.service === "ec2" || route.service === "vpc") {
        return [
          {
            type: "link" as const,
            text: "Dashboard",
            href: dashHref,
          },
          ...items,
        ];
      }
      return items;
    }
    return navConfig.items.map((i) => ({
      type: "link" as const,
      text: i.text,
      href: i.href,
    }));
  }, [navConfig, route.service]);

  const sideNavActiveHref = useMemo(() => {
    if (!navConfig) return undefined;
    return (
      navConfig.items.find((i) => i.page === route.page)?.href ||
      navConfig.items[0]?.href
    );
  }, [navConfig, route.page]);

  const findNavItem = (href: string) => {
    if (!navConfig) return undefined;
    return (
      navConfig.items.find((i) => i.href === href) ||
      navConfig.sections?.flatMap((s) => s.items).find((i) => i.href === href)
    );
  };

  const flashItems = useMemo(
    () =>
      flash
        ? [
            {
              type: flash.type,
              content: flash.content,
              dismissible: true,
              onDismiss: () => useAccountStore.setState({ flash: null }),
              id: "flash",
            },
          ]
        : [],
    [flash]
  );

  const flashStrip =
    flashItems.length > 0 ? (
      <div className="aws-flash-strip" data-console-target="flash-banner">
        <Flashbar items={flashItems} />
      </div>
    ) : null;

  /** Learn mode: skip AppLayout — Cloudscape layout + breadcrumbs caused update loops. */
  if (mode === "learn") {
    return (
      <div ref={rootRef} className="aws-console-root aws-console-learn-root">
        <AwsTopNav onExitToWorkspace={onExitToWorkspace} />
        {flashStrip}
        <div className="aws-console-body aws-console-learn-body">{content}</div>
        <ActionMapDevPanel />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="aws-console-root">
      <AwsTopNav onExitToWorkspace={onExitToWorkspace} />
      <div className="aws-console-body">
      <AppLayout
        stickyNotifications
        navigationHide={route.service === "home"}
        toolsHide={mode !== "work" || !ticket}
        toolsOpen={toolsOpen}
        onToolsChange={({ detail }) =>
          setToolsOpen((prev) => (prev === detail.open ? prev : detail.open))
        }
        navigationOpen={navOpen}
        onNavigationChange={({ detail }) =>
          setNavOpen((prev) => (prev === detail.open ? prev : detail.open))
        }
        contentType={route.service === "home" ? "default" : "table"}
        disableContentPaddings={route.service === "home"}
        notifications={
          flashItems.length ? (
            <div data-console-target="flash-banner">
              <Flashbar items={flashItems} />
            </div>
          ) : undefined
        }
        breadcrumbs={
          route.service === "home" ? undefined : (
            <BreadcrumbGroup
              items={breadcrumbItems}
              onFollow={(e) => {
                e.preventDefault();
                const href = e.detail.href;
                if (href === "#home") {
                  navigate("home");
                  return;
                }
                if (href === `#${route.service}`) {
                  navigate(route.service);
                  return;
                }
                const item = findNavItem(href);
                if (item) navigate(route.service, item.page);
              }}
              ariaLabel="Breadcrumbs"
            />
          )
        }
        navigation={
          navConfig ? (
            <SideNavigation
              header={{ text: navConfig.header, href: `#${route.service}` }}
              activeHref={sideNavActiveHref}
              items={sideNavItems}
              onFollow={(e) => {
                e.preventDefault();
                const href = e.detail.href;
                const item = findNavItem(href);
                if (item) {
                  if (item.target) markClick(item.target);
                  navigate(route.service, item.page);
                }
              }}
            />
          ) : undefined
        }
        tools={
          mode === "work" && ticket ? (
            <Box padding="m">
              <Header variant="h2">Ticket</Header>
              <Box variant="awsui-key-label" padding={{ top: "s" }}>
                {ticket.priority || "P2"} · {ticket.from}
              </Box>
              <Box variant="h3" padding={{ top: "s" }}>
                {ticket.subject}
              </Box>
              <Box padding={{ top: "s" }} color="text-body-secondary">
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                  {ticket.body}
                </pre>
              </Box>
            </Box>
          ) : undefined
        }
        content={content}
      />
      </div>
      <footer className="aws-console-footer">
        <div className="aws-console-footer-left">
          <button
            type="button"
            onClick={() =>
              useAccountStore.getState().setOverlay({ cloudshell_open: true })
            }
          >
            CloudShell
          </button>
          <span>Agent Toolkit for AWS</span>
          <span>Feedback</span>
          <span>Console Mobile App</span>
        </div>
        <div className="aws-console-footer-right">
          <span>© 2026, Amazon Web Services, Inc. or its affiliates.</span>
          <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noreferrer">
            Privacy
          </a>
          <a href="https://aws.amazon.com/terms/" target="_blank" rel="noreferrer">
            Terms
          </a>
          <span>Cookie preferences</span>
        </div>
        <button
          type="button"
          className="aws-console-q-fab"
          aria-label="Amazon Q"
          title="Amazon Q"
          onClick={() =>
            document.querySelector<HTMLButtonElement>('.aws-topnav-askq')?.click()
          }
        >
          Q
        </button>
      </footer>
      <ActionMapDevPanel />
    </div>
  );
}
