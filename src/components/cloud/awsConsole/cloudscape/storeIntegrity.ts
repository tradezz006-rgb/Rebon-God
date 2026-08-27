/**
 * AWS console Zustand integrity: validate resource graphs and repair
 * corrupted slices without crashing the app.
 */
import type {
  AccountSnapshot,
  AutoScalingGroup,
  Budget,
  CwAlarm,
  CwDashboard,
  Ec2Instance,
  Ec2InstanceState,
  HomeLayoutState,
  HomeWidgetId,
  IamGroup,
  IamPolicy,
  IamRole,
  IamUser,
  InternetGateway,
  LoadBalancer,
  LogGroup,
  RouteTable,
  S3Bucket,
  SecurityGroup,
  ServiceId,
  Subnet,
  Vpc,
} from "./types";

const VALID_SERVICES: ServiceId[] = [
  "home",
  "iam",
  "ec2",
  "s3",
  "vpc",
  "cloudwatch",
  "billing",
];

const VALID_WIDGETS: HomeWidgetId[] = [
  "welcome",
  "cost",
  "recent",
  "health",
  "favorites",
  "trusted",
  "explore",
];

const VALID_EC2_STATES: Ec2InstanceState[] = [
  "pending",
  "running",
  "stopping",
  "stopped",
  "shutting-down",
  "terminated",
];

export type AccountResourceSlice = Pick<
  AccountSnapshot,
  | "users"
  | "groups"
  | "roles"
  | "policies"
  | "instances"
  | "asgs"
  | "load_balancers"
  | "buckets"
  | "vpcs"
  | "subnets"
  | "security_groups"
  | "igws"
  | "route_tables"
  | "dashboards"
  | "alarms"
  | "log_groups"
  | "budgets"
>;

export type IntegrityIssue = {
  slice: keyof AccountResourceSlice | "favorites" | "homeLayout" | "identity";
  message: string;
};

/** Last known good resource lists — used if repair cannot fully fix a slice. */
let lastGoodResources: AccountResourceSlice | null = null;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function logIntegrity(issues: IntegrityIssue[]): void {
  if (!issues.length || !import.meta.env.DEV) return;
  console.warn(
    "[aws-console-store] integrity repair:",
    issues.map((i) => `${i.slice}: ${i.message}`).join("; ")
  );
}

export function validateIamUsername(username: unknown): string | null {
  if (!isNonEmptyString(username)) return null;
  const cleaned = username.trim();
  if (!/^[a-zA-Z0-9+=,.@_-]{1,64}$/.test(cleaned)) return null;
  return cleaned;
}

export function validateEc2LaunchInput(
  name: unknown,
  type: unknown
): { name: string; type: string } | null {
  if (!isNonEmptyString(name) || !isNonEmptyString(type)) return null;
  return { name: name.trim().slice(0, 128), type: type.trim().slice(0, 64) };
}

export function validateBucketName(name: unknown): string | null {
  if (!isNonEmptyString(name)) return null;
  const n = name.trim().toLowerCase();
  if (n.length < 3 || n.length > 63) return null;
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(n)) return null;
  return n;
}

/**
 * Validate + repair resource references. Returns a partial patch if anything
 * changed, or null if state is already consistent.
 */
export function repairAccountResources(
  state: AccountResourceSlice & {
    favorites?: ServiceId[];
    homeLayout?: HomeLayoutState;
    identity?: AccountSnapshot["identity"];
  }
): Partial<
  AccountResourceSlice & {
    favorites: ServiceId[];
    homeLayout: HomeLayoutState;
  }
> | null {
  const issues: IntegrityIssue[] = [];
  const patch: Partial<
    AccountResourceSlice & {
      favorites: ServiceId[];
      homeLayout: HomeLayoutState;
    }
  > = {};

  const users = asArray<IamUser>(state.users).filter(
    (u) => u && isNonEmptyString(u.username)
  );
  if (users.length !== asArray(state.users).length) {
    issues.push({ slice: "users", message: "removed invalid user entries" });
    patch.users = users;
  }

  const userNames = new Set(users.map((u) => u.username));
  const groups = asArray<IamGroup>(state.groups)
    .filter((g) => g && isNonEmptyString(g.name))
    .map((g) => {
      const members = asArray<string>(g.members).filter((m) => userNames.has(m));
      if (members.length !== asArray<string>(g.members).length) {
        issues.push({
          slice: "groups",
          message: `group ${g.name}: dropped members missing from users`,
        });
      }
      return { ...g, members };
    });
  if (
    groups.length !== asArray<IamGroup>(state.groups).length ||
    issues.some((i) => i.slice === "groups")
  ) {
    patch.groups = groups;
  }

  const repairedUsers = users.map((u) => {
    const groupNames = new Set(groups.map((g) => g.name));
    const nextGroups = asArray<string>(u.groups).filter((g) => groupNames.has(g));
    if (nextGroups.length !== asArray<string>(u.groups).length) {
      issues.push({
        slice: "users",
        message: `user ${u.username}: dropped unknown group refs`,
      });
      return { ...u, groups: nextGroups };
    }
    return u;
  });
  if (issues.some((i) => i.slice === "users" && i.message.includes("group"))) {
    patch.users = repairedUsers;
  }

  const vpcs = asArray<Vpc>(state.vpcs).filter((v) => v && isNonEmptyString(v.id));
  const vpcIds = new Set(vpcs.map((v) => v.id));
  if (vpcs.length !== asArray<Vpc>(state.vpcs).length) {
    issues.push({ slice: "vpcs", message: "removed invalid VPC entries" });
    patch.vpcs = vpcs;
  }

  const subnets = asArray<Subnet>(state.subnets).filter((s) => {
    if (!s || !isNonEmptyString(s.id)) return false;
    if (!vpcIds.has(s.vpc)) {
      issues.push({
        slice: "subnets",
        message: `subnet ${s.id} referenced missing VPC ${s.vpc}`,
      });
      return false;
    }
    return true;
  });
  if (subnets.length !== asArray<Subnet>(state.subnets).length) {
    patch.subnets = subnets;
  }

  const security_groups = asArray<SecurityGroup>(state.security_groups).filter((sg) => {
    if (!sg || !isNonEmptyString(sg.id)) return false;
    if (sg.vpc && !vpcIds.has(sg.vpc)) {
      issues.push({
        slice: "security_groups",
        message: `SG ${sg.id} referenced missing VPC ${sg.vpc}`,
      });
      return false;
    }
    return true;
  });
  if (security_groups.length !== asArray<SecurityGroup>(state.security_groups).length) {
    patch.security_groups = security_groups;
  }

  const route_tables = asArray<RouteTable>(state.route_tables).filter((rt) => {
    if (!rt || !isNonEmptyString(rt.id)) return false;
    if (rt.vpc && !vpcIds.has(rt.vpc)) {
      issues.push({
        slice: "route_tables",
        message: `RT ${rt.id} referenced missing VPC ${rt.vpc}`,
      });
      return false;
    }
    return true;
  });
  if (route_tables.length !== asArray<RouteTable>(state.route_tables).length) {
    patch.route_tables = route_tables;
  }

  const igws = asArray<InternetGateway>(state.igws)
    .filter((igw) => igw && isNonEmptyString(igw.id))
    .map((igw) => {
      if (igw.vpc && !vpcIds.has(igw.vpc)) {
        issues.push({
          slice: "igws",
          message: `IGW ${igw.id} detached from missing VPC`,
        });
        return { ...igw, vpc: null, state: "detached" as const };
      }
      return igw;
    });
  if (
    igws.length !== asArray<InternetGateway>(state.igws).length ||
    issues.some((i) => i.slice === "igws")
  ) {
    patch.igws = igws;
  }

  const load_balancers = asArray<LoadBalancer>(state.load_balancers).filter((lb) => {
    if (!lb || !isNonEmptyString(lb.name)) return false;
    if (lb.vpc && !vpcIds.has(lb.vpc)) {
      issues.push({
        slice: "load_balancers",
        message: `LB ${lb.name} referenced missing VPC`,
      });
      return false;
    }
    return true;
  });
  if (load_balancers.length !== asArray<LoadBalancer>(state.load_balancers).length) {
    patch.load_balancers = load_balancers;
  }

  const instances = asArray<Ec2Instance>(state.instances)
    .filter((i) => i && isNonEmptyString(i.id))
    .map((i) => {
      if (!VALID_EC2_STATES.includes(i.state)) {
        issues.push({
          slice: "instances",
          message: `instance ${i.id} had invalid state; reset to stopped`,
        });
        return { ...i, state: "stopped" as Ec2InstanceState };
      }
      return i;
    });
  if (
    instances.length !== asArray<Ec2Instance>(state.instances).length ||
    issues.some((i) => i.slice === "instances")
  ) {
    patch.instances = instances;
  }

  const buckets = asArray<S3Bucket>(state.buckets).filter(
    (b) => b && isNonEmptyString(b.name)
  );
  if (buckets.length !== asArray<S3Bucket>(state.buckets).length) {
    issues.push({ slice: "buckets", message: "removed invalid bucket entries" });
    patch.buckets = buckets;
  }

  if (state.favorites) {
    const favorites = state.favorites.filter((id): id is ServiceId =>
      VALID_SERVICES.includes(id)
    );
    if (favorites.length !== state.favorites.length) {
      issues.push({ slice: "favorites", message: "removed invalid favorite ids" });
      patch.favorites = favorites;
    }
  }

  if (state.homeLayout?.widgets) {
    const widgets = state.homeLayout.widgets.filter((id): id is HomeWidgetId =>
      VALID_WIDGETS.includes(id)
    );
    if (widgets.length !== state.homeLayout.widgets.length) {
      issues.push({
        slice: "homeLayout",
        message: "removed invalid home widgets",
      });
      patch.homeLayout = { ...state.homeLayout, widgets };
    }
  }

  // If a slice is empty after repair but lastGood had data and we detected
  // catastrophic wipe (0 vs many), restore lastGood for that slice only.
  if (lastGoodResources) {
    const restoreIfWiped = <K extends keyof AccountResourceSlice>(key: K) => {
      const current = (patch[key] ?? state[key]) as unknown[];
      const good = lastGoodResources![key] as unknown[];
      if (
        Array.isArray(current) &&
        Array.isArray(good) &&
        current.length === 0 &&
        good.length > 3 &&
        issues.some((i) => i.slice === key)
      ) {
        issues.push({
          slice: key,
          message: `restored last known good ${key} after wipe`,
        });
        (patch as Record<string, unknown>)[key] = good;
      }
    };
    restoreIfWiped("vpcs");
    restoreIfWiped("instances");
    restoreIfWiped("users");
    restoreIfWiped("buckets");
  }

  if (!Object.keys(patch).length) {
    lastGoodResources = {
      users: repairedUsers.length ? repairedUsers : users,
      groups,
      roles: asArray<IamRole>(state.roles),
      policies: asArray<IamPolicy>(state.policies),
      instances,
      asgs: asArray<AutoScalingGroup>(state.asgs),
      load_balancers,
      buckets,
      vpcs,
      subnets,
      security_groups,
      igws,
      route_tables,
      dashboards: asArray<CwDashboard>(state.dashboards),
      alarms: asArray<CwAlarm>(state.alarms),
      log_groups: asArray<LogGroup>(state.log_groups),
      budgets: asArray<Budget>(state.budgets),
    };
    return null;
  }

  logIntegrity(issues);

  const nextUsers = patch.users ?? repairedUsers;
  lastGoodResources = {
    users: nextUsers,
    groups: patch.groups ?? groups,
    roles: asArray<IamRole>(state.roles),
    policies: asArray<IamPolicy>(state.policies),
    instances: patch.instances ?? instances,
    asgs: asArray<AutoScalingGroup>(state.asgs),
    load_balancers: patch.load_balancers ?? load_balancers,
    buckets: patch.buckets ?? buckets,
    vpcs: patch.vpcs ?? vpcs,
    subnets: patch.subnets ?? subnets,
    security_groups: patch.security_groups ?? security_groups,
    igws: patch.igws ?? igws,
    route_tables: patch.route_tables ?? route_tables,
    dashboards: asArray<CwDashboard>(state.dashboards),
    alarms: asArray<CwAlarm>(state.alarms),
    log_groups: asArray<LogGroup>(state.log_groups),
    budgets: asArray<Budget>(state.budgets),
  };

  return patch;
}

/** Snapshot current resources as last-known-good (call after successful hydrate). */
export function rememberGoodResources(state: AccountResourceSlice): void {
  lastGoodResources = {
    users: [...state.users],
    groups: state.groups.map((g) => ({ ...g, members: [...g.members] })),
    roles: [...state.roles],
    policies: [...state.policies],
    instances: [...state.instances],
    asgs: [...state.asgs],
    load_balancers: [...state.load_balancers],
    buckets: [...state.buckets],
    vpcs: [...state.vpcs],
    subnets: [...state.subnets],
    security_groups: [...state.security_groups],
    igws: [...state.igws],
    route_tables: [...state.route_tables],
    dashboards: [...state.dashboards],
    alarms: [...state.alarms],
    log_groups: [...state.log_groups],
    budgets: [...state.budgets],
  };
}
