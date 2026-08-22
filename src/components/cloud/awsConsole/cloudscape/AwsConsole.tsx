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

const NAV: Record<
  Exclude<ServiceId, "home">,
  { header: string; items: { text: string; href: string; page: string; target?: string }[] }
> = {
  iam: {
    header: "IAM",
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
    header: "EC2",
    items: [
      { text: "EC2 Dashboard", href: "#ec2-dash", page: "dashboard" },
      { text: "Instances", href: "#ec2-instances", page: "instances" },
      { text: "Launch instances", href: "#launch-instance", page: "launch", target: "launch-instance" },
      { text: "Auto Scaling Groups", href: "#ec2-asg", page: "asg" },
      { text: "Load Balancers", href: "#ec2-elb", page: "load-balancers" },
    ],
  },
  s3: {
    header: "S3",
    items: [
      { text: "General purpose buckets", href: "#s3-buckets", page: "buckets" },
      { text: "Create bucket", href: "#create-bucket", page: "create-bucket", target: "create-bucket" },
    ],
  },
  vpc: {
    header: "VPC",
    items: [
      { text: "VPC dashboard", href: "#vpc-dash", page: "dashboard" },
      { text: "Your VPCs", href: "#vpc-vpcs", page: "vpcs" },
      {
        text: "Create VPC",
        href: "#create-vpc",
        page: "create-vpc",
        target: "create-vpc",
      },
      { text: "Subnets", href: "#vpc-subnets", page: "subnets" },
      { text: "Route tables", href: "#vpc-rt", page: "route-tables" },
      { text: "Internet gateways", href: "#vpc-igw", page: "igws" },
      { text: "Security groups", href: "#vpc-sg", page: "security-groups" },
    ],
  },
  cloudwatch: {
    header: "CloudWatch",
    items: [
      { text: "Overview", href: "#cw-home", page: "overview" },
      { text: "Dashboards", href: "#cw-dash", page: "dashboards" },
      { text: "Alarms", href: "#cw-alarms", page: "alarms" },
      { text: "Log groups", href: "#cw-logs", page: "log-groups" },
      { text: "Logs Insights", href: "#cw-insights", page: "logs-insights" },
    ],
  },
  billing: {
    header: "Billing and Cost Management",
    items: [
      { text: "Cost Explorer", href: "#bill-ce", page: "cost-explorer" },
      { text: "Budgets", href: "#bill-budgets", page: "budgets" },
    ],
  },
};

function crumbs(service: ServiceId, page: string, selectedId: string | null) {
  const home = { text: "AWS Console Home", href: "#home" };
  if (service === "home") return [home];
  const header = NAV[service].header;
  const item = NAV[service].items.find((i) => i.page === page);
  const out = [home, { text: header, href: `#${service}` }];
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
}: {
  mode: ConsoleMode;
  ticket?: TicketPanel;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const route = useAccountStore((s) => s.route);
  const flash = useAccountStore((s) => s.flash);
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
    applyMode(Mode.Light, el);
    applyDensity(Density.Compact, el);
  }, []);

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
    return navConfig.items.map((i) => ({
      type: "link" as const,
      text: i.text,
      href: i.href,
    }));
  }, [navConfig]);

  const sideNavActiveHref = useMemo(() => {
    if (!navConfig) return undefined;
    return (
      navConfig.items.find((i) => i.page === route.page)?.href ||
      navConfig.items[0]?.href
    );
  }, [navConfig, route.page]);

  const flashItems = useMemo(
    () =>
      flash
        ? [
            {
              type: "success" as const,
              content: flash,
              dismissible: true,
              onDismiss: () => useAccountStore.setState({ flash: null }),
              id: "flash",
            },
          ]
        : [],
    [flash]
  );

  /** Learn mode: skip AppLayout — Cloudscape layout + breadcrumbs caused update loops. */
  if (mode === "learn") {
    return (
      <div ref={rootRef} className="aws-console-root aws-console-learn-root">
        <AwsTopNav />
        <div className="aws-console-body aws-console-learn-body">{content}</div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="aws-console-root">
      <AwsTopNav />
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
          flashItems.length ? <Flashbar items={flashItems} /> : undefined
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
                const item = NAV[route.service]?.items.find((i) => i.href === href);
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
                const item = navConfig.items.find((i) => i.href === href);
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
    </div>
  );
}
