import { create } from "zustand";
import type { IamSimState } from "@/types/cloudLesson";
import { createFreshBiteSeed } from "./seed";
import type {
  AccountSnapshot,
  ActionLogEntry,
  ConsoleRoute,
  GradingAction,
  IamUser,
  OverlayState,
  ServiceId,
} from "./types";

function now() {
  return Date.now();
}

function idSuffix() {
  return Math.random().toString(16).slice(2, 10);
}

function usersFromIamSeed(iam: IamSimState): IamUser[] {
  return (iam.users || []).map((u) => ({
    username: u.user_name,
    created: u.create_date || "2024-01-01",
    mfa: false,
    console_access: u.console_access !== false,
    policies: [...(u.attached_policies || [])],
    groups: [...(u.groups || [])],
    last_activity: "—",
    access_keys: Array.from({ length: u.access_keys ?? 0 }).map((_, i) => ({
      id: `AKIA${idSuffix().toUpperCase()}${i}`,
      status: "Active" as const,
      created: u.create_date || "2024-01-01",
    })),
    password: null,
  }));
}

function toGrading(entry: ActionLogEntry): GradingAction | null {
  const p = entry.params;
  switch (entry.action_type) {
    case "navigate":
      return { type: "navigate", path: String(p.path || entry.resource_id) };
    case "search_user":
      return { type: "search_user", query: String(p.query || "") };
    case "open_user":
      return { type: "open_user", user_name: entry.resource_id };
    case "attach_policy":
      return {
        type: "attach_policy",
        user_name: entry.resource_id,
        policy: String(p.policy || ""),
      };
    case "add_to_group":
      return {
        type: "add_to_group",
        user_name: entry.resource_id,
        group: String(p.group || ""),
      };
    case "delete_access_key":
      return { type: "delete_access_key", user_name: entry.resource_id };
    case "create_access_key":
      return { type: "create_access_key", user_name: entry.resource_id };
    default:
      return null;
  }
}

export type AccountStore = AccountSnapshot &
  OverlayState & {
    route: ConsoleRoute;
    actionLog: ActionLogEntry[];
    gradingLog: GradingAction[];
    clickedTrail: string[];
    flash: string | null;
    interactive: boolean;
    hydrate: (opts: {
      accountId: string;
      accountName: string;
      region?: string;
      iamSeed?: IamSimState | null;
      initialService?: ServiceId;
      initialPage?: string;
    }) => void;
    log: (
      action_type: string,
      resource_type: string,
      resource_id: string,
      params?: ActionLogEntry["params"]
    ) => void;
    markClick: (targetId: string) => void;
    clearTrail: () => void;
    navigate: (service: ServiceId, page?: string, selectedId?: string | null) => void;
    setOverlay: (patch: Partial<OverlayState>) => void;
    setRegion: (region: string) => void;
    setSearch: (q: string) => void;
    attachPolicy: (username: string, policy: string) => void;
    createUser: (user: {
      username: string;
      console_access: boolean;
      policies: string[];
      groups: string[];
      password?: string | null;
    }) => void;
    deleteUsers: (usernames: string[]) => void;
    createAccessKey: (username: string) => void;
    deleteAccessKey: (username: string, keyId: string) => void;
    setUserMfa: (username: string, enabled: boolean) => void;
    addUserToGroup: (username: string, group: string) => void;
    detachPolicy: (username: string, policy: string) => void;
    createGroup: (name: string, policies?: string[]) => void;
    createRole: (name: string, trusted: string) => void;
    createPolicy: (name: string) => void;
    setInstanceState: (
      id: string,
      state: "running" | "stopped" | "terminated"
    ) => void;
    launchInstance: (name: string, type: string, subnet?: string) => void;
    updateAsgDesired: (name: string, desired: number) => void;
    createAsg: (name: string, desired: number, min: number, max: number) => void;
    createLoadBalancer: (name: string, type: "application" | "network") => void;
    createBucket: (bucket: {
      name: string;
      region: string;
      versioning: boolean;
      block_public_access: boolean;
    }) => void;
    toggleBucketBpa: (name: string, allOn: boolean) => void;
    uploadObject: (bucket: string, key: string) => void;
    saveBucketPolicy: (bucket: string, policy: string) => void;
    addLifecycleRule: (bucket: string, name: string, prefix: string) => void;
    deleteBucket: (name: string) => void;
    addSgRule: (
      sgId: string,
      direction: "inbound" | "outbound",
      rule: AccountSnapshot["security_groups"][0]["inbound"][0]
    ) => void;
    createVpc: (opts: {
      name: string;
      cidr: string;
      tenancy: "default" | "dedicated";
      azCount: 1 | 2 | 3;
      publicPerAz: number;
      privatePerAz: number;
      nat: "none" | "one" | "per-az";
      dnsHostnames: boolean;
      dnsSupport: boolean;
    }) => void;
    createSubnet: (opts: {
      name: string;
      vpc: string;
      cidr: string;
      az: string;
      public_ip_on_launch: boolean;
    }) => void;
    createSecurityGroup: (name: string, vpc: string, description: string) => void;
    createIgw: (name: string, vpc?: string | null) => void;
    attachIgw: (igwId: string, vpcId: string) => void;
    addRoute: (rtId: string, destination: string, target: string) => void;
    createAlarm: (name: string, condition: string) => void;
    deleteAlarm: (name: string) => void;
    createDashboard: (name: string) => void;
    addDashboardWidget: (name: string) => void;
    createLogGroup: (name: string) => void;
    createBudget: (name: string, amount: number, threshold: number, email: string) => void;
    deleteBudget: (name: string) => void;
    addLogInsightQuery: (query: string) => void;
  };

const emptyOverlay: OverlayState = {
  services_open: false,
  search_open: false,
  search_query: "",
  region_open: false,
  account_open: false,
  notifications_open: false,
  settings_open: false,
  support_open: false,
  cloudshell_open: false,
  recentlyVisited: ["iam", "ec2", "s3"],
};

export const useAccountStore = create<AccountStore>((set, get) => ({
  ...createFreshBiteSeed(),
  ...emptyOverlay,
  route: { service: "home", page: "home", selectedId: null },
  actionLog: [],
  gradingLog: [],
  clickedTrail: [],
  flash: null,
  interactive: true,

  hydrate: ({ accountId, accountName, region, iamSeed, initialService, initialPage }) => {
    const base = createFreshBiteSeed(accountId, accountName);
    if (region) base.identity.region = region;
    if (iamSeed?.users?.length) {
      base.users = usersFromIamSeed(iamSeed);
      if (iamSeed.groups?.length) {
        base.groups = iamSeed.groups.map((g) => ({
          name: g.name,
          policies: [...(g.policies || [])],
          members: [],
        }));
      }
      if (iamSeed.available_policies?.length) {
        base.available_policies = iamSeed.available_policies;
      }
    }
    const service = initialService || "home";
    const page =
      initialPage ||
      (service === "iam"
        ? "users"
        : service === "ec2"
          ? "instances"
          : service === "s3"
            ? "buckets"
            : "home");
    set({
      ...base,
      ...emptyOverlay,
      route: { service, page, selectedId: null },
      actionLog: [],
      gradingLog: [],
      clickedTrail: [],
      flash: null,
    });
  },

  log: (action_type, resource_type, resource_id, params = {}) => {
    const entry: ActionLogEntry = {
      timestamp: now(),
      action_type,
      resource_type,
      resource_id,
      params,
      result: "success",
    };
    const grade = toGrading(entry);
    set((s) => ({
      actionLog: [...s.actionLog, entry],
      gradingLog: grade ? [...s.gradingLog, grade] : s.gradingLog,
    }));
  },

  markClick: (targetId) =>
    set((s) => ({ clickedTrail: [...s.clickedTrail, targetId] })),

  clearTrail: () => set({ clickedTrail: [] }),

  navigate: (service, page, selectedId = null) => {
    const resolved =
      page ||
      (service === "home"
        ? "home"
        : service === "iam"
          ? "dashboard"
          : service === "ec2"
            ? "dashboard"
            : service === "s3"
              ? "buckets"
              : service === "vpc"
                ? "dashboard"
                : service === "cloudwatch"
                  ? "overview"
                  : "cost-explorer");
    const current = get().route;
    if (
      current.service === service &&
      current.page === resolved &&
      (current.selectedId ?? null) === selectedId
    ) {
      return;
    }
    get().log("navigate", "console", `${service}/${resolved}`, {
      path: `/${service}/${resolved}`,
    });
    set((s) => ({
      route: { service, page: resolved, selectedId },
      services_open: false,
      search_open: false,
      region_open: false,
      account_open: false,
      search_query: "",
      flash: null,
      recentlyVisited:
        service === "home"
          ? s.recentlyVisited
          : [service, ...s.recentlyVisited.filter((x) => x !== service)].slice(0, 6),
    }));
  },

  setOverlay: (patch) => {
    const s = get();
    const keys = Object.keys(patch) as (keyof typeof patch)[];
    if (keys.every((k) => s[k as keyof typeof s] === patch[k])) return;
    set(patch);
  },

  setRegion: (region) => {
    const current = get().identity.region;
    if (current === region) {
      if (get().region_open) set({ region_open: false });
      return;
    }
    get().log("set_region", "account", region, { region });
    set({ region_open: false, identity: { ...get().identity, region } });
  },

  setSearch: (q) => set({ search_query: q, search_open: true, services_open: false }),

  attachPolicy: (username, policy) => {
    set((s) => ({
      users: s.users.map((u) =>
        u.username === username && !u.policies.includes(policy)
          ? { ...u, policies: [...u.policies, policy] }
          : u
      ),
      flash: `Policy ${policy} attached to ${username}.`,
    }));
    get().log("attach_policy", "iam_user", username, { policy });
  },

  createUser: (user) => {
    const created: IamUser = {
      username: user.username,
      created: new Date().toISOString().slice(0, 10),
      mfa: false,
      console_access: user.console_access,
      policies: user.policies,
      groups: user.groups,
      last_activity: "Just now",
      access_keys: [],
      password: user.console_access
        ? user.password || "Temp-Passw0rd!"
        : null,
    };
    set((s) => ({
      users: [...s.users, created],
      groups: s.groups.map((g) =>
        user.groups.includes(g.name)
          ? { ...g, members: [...new Set([...g.members, user.username])] }
          : g
      ),
      route: { service: "iam", page: "users", selectedId: null },
      flash: `User ${user.username} created.`,
    }));
    get().log("create_user", "iam_user", user.username, {
      console_access: user.console_access,
    });
    for (const policy of user.policies) {
      get().log("attach_policy", "iam_user", user.username, { policy });
    }
    for (const group of user.groups) {
      get().log("add_to_group", "iam_user", user.username, { group });
    }
  },

  deleteUsers: (usernames) => {
    set((s) => ({
      users: s.users.filter((u) => !usernames.includes(u.username)),
      groups: s.groups.map((g) => ({
        ...g,
        members: g.members.filter((m) => !usernames.includes(m)),
      })),
      flash: `Deleted ${usernames.length} user(s).`,
    }));
    usernames.forEach((u) => get().log("delete_user", "iam_user", u, {}));
  },

  createAccessKey: (username) => {
    const key = {
      id: `AKIA${idSuffix().toUpperCase()}`.slice(0, 20),
      status: "Active" as const,
      created: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({
      users: s.users.map((u) =>
        u.username === username
          ? { ...u, access_keys: [...u.access_keys, key] }
          : u
      ),
      flash: `Access key ${key.id} created. Secret shown once: ${idSuffix()}${idSuffix()}`,
    }));
    get().log("create_access_key", "iam_user", username, { key_id: key.id });
  },

  deleteAccessKey: (username, keyId) => {
    set((s) => ({
      users: s.users.map((u) =>
        u.username === username
          ? { ...u, access_keys: u.access_keys.filter((k) => k.id !== keyId) }
          : u
      ),
      flash: `Access key ${keyId} deleted.`,
    }));
    get().log("delete_access_key", "iam_user", username, { key_id: keyId });
  },

  setUserMfa: (username, enabled) => {
    set((s) => ({
      users: s.users.map((u) => (u.username === username ? { ...u, mfa: enabled } : u)),
      flash: enabled
        ? `MFA device assigned to ${username}.`
        : `MFA removed from ${username}.`,
    }));
    get().log(enabled ? "enable_mfa" : "disable_mfa", "iam_user", username, {});
  },

  addUserToGroup: (username, group) => {
    set((s) => ({
      users: s.users.map((u) =>
        u.username === username && !u.groups.includes(group)
          ? { ...u, groups: [...u.groups, group] }
          : u
      ),
      groups: s.groups.map((g) =>
        g.name === group && !g.members.includes(username)
          ? { ...g, members: [...g.members, username] }
          : g
      ),
      flash: `Added ${username} to ${group}.`,
    }));
    get().log("add_to_group", "iam_user", username, { group });
  },

  detachPolicy: (username, policy) => {
    set((s) => ({
      users: s.users.map((u) =>
        u.username === username
          ? { ...u, policies: u.policies.filter((p) => p !== policy) }
          : u
      ),
      flash: `Detached ${policy} from ${username}.`,
    }));
    get().log("detach_policy", "iam_user", username, { policy });
  },

  createGroup: (name, policies = []) => {
    set((s) => ({
      groups: [...s.groups, { name, policies, members: [] }],
      flash: `Group ${name} created.`,
    }));
    get().log("create_group", "iam", name, {});
  },

  createRole: (name, trusted) => {
    set((s) => ({
      roles: [
        ...s.roles,
        { name, trusted, last_activity: "Never", policies: [] },
      ],
      flash: `Role ${name} created.`,
    }));
    get().log("create_role", "iam", name, { trusted });
  },

  createPolicy: (name) => {
    set((s) => ({
      policies: [
        ...s.policies,
        {
          name,
          type: "Customer managed" as const,
          attached: 0,
          created: new Date().toISOString().slice(0, 10),
        },
      ],
      available_policies: s.available_policies.includes(name)
        ? s.available_policies
        : [...s.available_policies, name],
      flash: `Policy ${name} created.`,
    }));
    get().log("create_policy", "iam", name, {});
  },

  setInstanceState: (id, state) => {
    set((s) => ({
      instances:
        state === "terminated"
          ? s.instances.filter((i) => i.id !== id)
          : s.instances.map((i) => (i.id === id ? { ...i, state } : i)),
    }));
    get().log(
      state === "running"
        ? "start_instance"
        : state === "stopped"
          ? "stop_instance"
          : "terminate_instance",
      "ec2",
      id,
      { state }
    );
  },

  launchInstance: (name, type, subnet) => {
    const region = get().identity.region;
    const inst = {
      id: `i-${idSuffix()}${idSuffix()}`.slice(0, 19),
      name,
      state: "pending" as const,
      type,
      status_check: "initializing" as const,
      az: `${region}a`,
      region,
      public_ip: null as string | null,
      private_ip: "10.0.1." + Math.floor(20 + Math.random() * 200),
    };
    set((s) => ({
      instances: [...s.instances, inst],
      route: { service: "ec2", page: "instances", selectedId: null },
      flash: `Successfully initiated launch of instance ${inst.id}`,
    }));
    get().log("launch_instance", "ec2", inst.id, { name, type, subnet: subnet || "" });
    window.setTimeout(() => {
      set((s) => ({
        instances: s.instances.map((i) =>
          i.id === inst.id ? { ...i, state: "running", status_check: "ok" } : i
        ),
      }));
    }, 1200);
  },

  createBucket: ({ name, region, versioning, block_public_access }) => {
    set((s) => ({
      buckets: [
        ...s.buckets,
        {
          name,
          region,
          public: !block_public_access,
          objects: 0,
          created: new Date().toISOString().slice(0, 10),
          encryption: "SSE-S3",
          versioning: versioning ? "Enabled" : "Disabled",
          block_public_access: {
            block_acls: block_public_access,
            ignore_acls: block_public_access,
            block_policy: block_public_access,
            restrict_buckets: block_public_access,
          },
          policy: "",
          object_keys: [],
          lifecycle_rules: [],
        },
      ],
      route: { service: "s3", page: "buckets", selectedId: null },
      flash: `Successfully created bucket ${name}`,
    }));
    get().log("create_bucket", "s3", name, { region, versioning, block_public_access });
  },

  toggleBucketBpa: (name, allOn) => {
    set((s) => ({
      buckets: s.buckets.map((b) =>
        b.name === name
          ? {
              ...b,
              public: !allOn,
              block_public_access: {
                block_acls: allOn,
                ignore_acls: allOn,
                block_policy: allOn,
                restrict_buckets: allOn,
              },
            }
          : b
      ),
      flash: allOn
        ? `Block Public Access enabled on ${name}.`
        : `Block Public Access edited on ${name}.`,
    }));
    get().log("set_block_public_access", "s3", name, { allOn });
  },

  uploadObject: (bucket, key) => {
    set((s) => ({
      buckets: s.buckets.map((b) =>
        b.name === bucket
          ? {
              ...b,
              object_keys: [...(b.object_keys || []), key],
              objects: (b.objects || 0) + 1,
            }
          : b
      ),
      flash: `Uploaded ${key} to ${bucket}.`,
    }));
    get().log("upload_object", "s3", bucket, { key });
  },

  saveBucketPolicy: (bucket, policy) => {
    set((s) => ({
      buckets: s.buckets.map((b) => (b.name === bucket ? { ...b, policy } : b)),
      flash: `Bucket policy saved for ${bucket}.`,
    }));
    get().log("put_bucket_policy", "s3", bucket, {});
  },

  addLifecycleRule: (bucket, name, prefix) => {
    set((s) => ({
      buckets: s.buckets.map((b) =>
        b.name === bucket
          ? {
              ...b,
              lifecycle_rules: [
                ...(b.lifecycle_rules || []),
                {
                  name,
                  status: "Enabled",
                  prefix: prefix || "/",
                  actions: "Expire current versions after 365 days",
                },
              ],
            }
          : b
      ),
      flash: `Lifecycle rule ${name} created.`,
    }));
    get().log("create_lifecycle_rule", "s3", bucket, { name, prefix });
  },

  deleteBucket: (name) => {
    set((s) => ({
      buckets: s.buckets.filter((b) => b.name !== name),
      flash: `Deleted bucket ${name}.`,
      route: { service: "s3", page: "buckets", selectedId: null },
    }));
    get().log("delete_bucket", "s3", name, {});
  },

  updateAsgDesired: (name, desired) => {
    set((s) => ({
      asgs: s.asgs.map((a) =>
        a.name === name
          ? {
              ...a,
              desired,
              instances: Math.min(Math.max(desired, a.min), a.max),
            }
          : a
      ),
      flash: `Updated desired capacity for ${name} to ${desired}.`,
    }));
    get().log("update_asg", "ec2", name, { desired });
  },

  createAsg: (name, desired, min, max) => {
    set((s) => ({
      asgs: [
        ...s.asgs,
        {
          name,
          instances: desired,
          min,
          max,
          desired,
          status: "Healthy",
          health_check: "EC2" as const,
        },
      ],
      flash: `Auto Scaling group ${name} created.`,
    }));
    get().log("create_asg", "ec2", name, { desired, min, max });
  },

  createLoadBalancer: (name, type) => {
    const region = get().identity.region;
    set((s) => ({
      load_balancers: [
        ...s.load_balancers,
        {
          name,
          dns: `${name}-${idSuffix()}.${region}.elb.amazonaws.com`,
          state: "active" as const,
          type,
          vpc: s.vpcs[0]?.id || "vpc-default",
        },
      ],
      flash: `Load balancer ${name} created.`,
    }));
    get().log("create_lb", "ec2", name, { type });
  },

  addSgRule: (sgId, direction, rule) => {
    set((s) => ({
      security_groups: s.security_groups.map((g) =>
        g.id === sgId
          ? {
              ...g,
              inbound: direction === "inbound" ? [...g.inbound, rule] : g.inbound,
              outbound: direction === "outbound" ? [...g.outbound, rule] : g.outbound,
            }
          : g
      ),
    }));
    get().log("add_sg_rule", "vpc", sgId, { direction, port: rule.port });
  },

  createVpc: (opts) => {
    const region = get().identity.region;
    const azLetters = ["a", "b", "c"].slice(0, opts.azCount);
    const vpcId = `vpc-${idSuffix()}${idSuffix()}`.slice(0, 21);
    const mainRtId = `rtb-${idSuffix()}${idSuffix()}`.slice(0, 21);
    const dhcp = `dopt-${idSuffix()}`;
    const withMore =
      opts.publicPerAz > 0 || opts.privatePerAz > 0 || opts.nat !== "none";

    const [baseA, baseB] = opts.cidr.split("/")[0].split(".").map(Number);
    let octet = 0;
    const newSubnets: AccountSnapshot["subnets"] = [];
    for (let az = 0; az < opts.azCount; az++) {
      for (let p = 0; p < opts.publicPerAz; p++) {
        octet += 1;
        newSubnets.push({
          id: `subnet-${idSuffix()}${idSuffix()}`.slice(0, 24),
          name: `${opts.name}-public-${azLetters[az]}${opts.publicPerAz > 1 ? `-${p + 1}` : ""}`,
          state: "available",
          vpc: vpcId,
          cidr: `${baseA}.${baseB}.${octet}.0/24`,
          az: `${region}${azLetters[az]}`,
          public_ip_on_launch: true,
        });
      }
      for (let p = 0; p < opts.privatePerAz; p++) {
        octet += 1;
        newSubnets.push({
          id: `subnet-${idSuffix()}${idSuffix()}`.slice(0, 24),
          name: `${opts.name}-private-${azLetters[az]}${opts.privatePerAz > 1 ? `-${p + 1}` : ""}`,
          state: "available",
          vpc: vpcId,
          cidr: `${baseA}.${baseB}.${octet}.0/24`,
          az: `${region}${azLetters[az]}`,
          public_ip_on_launch: false,
        });
      }
    }

    const igwId = withMore ? `igw-${idSuffix()}${idSuffix()}`.slice(0, 21) : null;
    const privateRtId = withMore
      ? `rtb-${idSuffix()}${idSuffix()}`.slice(0, 21)
      : null;

    const mainRoutes = [
      { destination: opts.cidr, target: "local", status: "active" },
      ...(igwId
        ? [{ destination: "0.0.0.0/0", target: igwId, status: "active" }]
        : []),
    ];
    const privateRoutes = [
      { destination: opts.cidr, target: "local", status: "active" },
      ...(opts.nat !== "none"
        ? [
            {
              destination: "0.0.0.0/0",
              target: `nat-${idSuffix()}`,
              status: "active",
            },
          ]
        : []),
    ];

    set((s) => ({
      vpcs: [
        ...s.vpcs,
        {
          id: vpcId,
          name: opts.name,
          state: "available",
          cidr: opts.cidr,
          ipv6: null,
          dhcp,
          main_route_table: mainRtId,
        },
      ],
      subnets: [...s.subnets, ...newSubnets],
      igws: igwId
        ? [
            ...s.igws,
            {
              id: igwId,
              name: `${opts.name}-igw`,
              state: "attached",
              vpc: vpcId,
            },
          ]
        : s.igws,
      route_tables: [
        ...s.route_tables,
        {
          id: mainRtId,
          name: withMore ? `${opts.name}-public-rt` : `${opts.name}-main-rt`,
          vpc: vpcId,
          main: true,
          routes: mainRoutes,
        },
        ...(privateRtId
          ? [
              {
                id: privateRtId,
                name: `${opts.name}-private-rt`,
                vpc: vpcId,
                main: false,
                routes: privateRoutes,
              },
            ]
          : []),
      ],
      route: { service: "vpc", page: "vpcs", selectedId: null },
      flash: withMore
        ? `Successfully created VPC ${vpcId} with ${newSubnets.length} subnet(s).`
        : `Successfully created VPC ${vpcId}.`,
    }));
    get().log("create_vpc", "vpc", vpcId, {
      name: opts.name,
      cidr: opts.cidr,
      azCount: opts.azCount,
      nat: opts.nat,
      tenancy: opts.tenancy,
    });
  },

  createAlarm: (name, condition) => {
    set((s) => ({
      alarms: [
        ...s.alarms,
        {
          name,
          state: "INSUFFICIENT_DATA" as const,
          condition,
          actions: 1,
          period: "5 minutes",
        },
      ],
      route: { service: "cloudwatch", page: "alarms", selectedId: null },
      flash: `Alarm ${name} created.`,
    }));
    get().log("create_alarm", "cloudwatch", name, { condition });
  },

  deleteAlarm: (name) => {
    set((s) => ({
      alarms: s.alarms.filter((a) => a.name !== name),
      flash: `Alarm ${name} deleted.`,
    }));
    get().log("delete_alarm", "cloudwatch", name, {});
  },

  createDashboard: (name) => {
    set((s) => ({
      dashboards: [...s.dashboards, { name, widgets: 0 }],
      flash: `Dashboard ${name} created.`,
    }));
    get().log("create_dashboard", "cloudwatch", name, {});
  },

  addDashboardWidget: (name) => {
    set((s) => ({
      dashboards: s.dashboards.map((d) =>
        d.name === name ? { ...d, widgets: d.widgets + 1 } : d
      ),
      flash: `Widget added to ${name}.`,
    }));
    get().log("add_widget", "cloudwatch", name, {});
  },

  createLogGroup: (name) => {
    set((s) => ({
      log_groups: [
        ...s.log_groups,
        { name, retention: "Never expire", metric_filters: 0, subscriptions: 0 },
      ],
      flash: `Log group ${name} created.`,
    }));
    get().log("create_log_group", "cloudwatch", name, {});
  },

  createBudget: (name, amount, threshold, email) => {
    set((s) => ({
      budgets: [
        ...s.budgets,
        {
          name,
          budgeted: amount,
          current: 0,
          forecasted: 0,
          alert_threshold: threshold,
          email,
        },
      ],
      route: { service: "billing", page: "budgets", selectedId: null },
      flash: `Budget ${name} created.`,
    }));
    get().log("create_budget", "billing", name, { amount, threshold, email });
  },

  deleteBudget: (name) => {
    set((s) => ({
      budgets: s.budgets.filter((b) => b.name !== name),
      flash: `Budget ${name} deleted.`,
    }));
    get().log("delete_budget", "billing", name, {});
  },

  createSubnet: (opts) => {
    const id = `subnet-${idSuffix()}${idSuffix()}`.slice(0, 24);
    set((s) => ({
      subnets: [
        ...s.subnets,
        {
          id,
          name: opts.name,
          state: "available",
          vpc: opts.vpc,
          cidr: opts.cidr,
          az: opts.az,
          public_ip_on_launch: opts.public_ip_on_launch,
        },
      ],
      flash: `Subnet ${id} created.`,
    }));
    get().log("create_subnet", "vpc", id, { ...opts });
  },

  createSecurityGroup: (name, vpc, description) => {
    const id = `sg-${idSuffix()}${idSuffix()}`.slice(0, 20);
    set((s) => ({
      security_groups: [
        ...s.security_groups,
        {
          id,
          name,
          vpc,
          description,
          inbound: [],
          outbound: [
            {
              type: "All traffic",
              protocol: "All",
              port: "All",
              source: "0.0.0.0/0",
              description: "Allow all outbound",
            },
          ],
        },
      ],
      route: { service: "vpc", page: "sg-detail", selectedId: id },
      flash: `Security group ${name} created.`,
    }));
    get().log("create_sg", "vpc", id, { name, vpc });
  },

  createIgw: (name, vpc = null) => {
    const id = `igw-${idSuffix()}${idSuffix()}`.slice(0, 21);
    set((s) => ({
      igws: [
        ...s.igws,
        {
          id,
          name,
          state: vpc ? ("attached" as const) : ("detached" as const),
          vpc,
        },
      ],
      flash: `Internet gateway ${id} created.`,
    }));
    get().log("create_igw", "vpc", id, { name, vpc: vpc || "" });
  },

  attachIgw: (igwId, vpcId) => {
    set((s) => ({
      igws: s.igws.map((g) =>
        g.id === igwId ? { ...g, state: "attached" as const, vpc: vpcId } : g
      ),
      flash: `Attached ${igwId} to ${vpcId}.`,
    }));
    get().log("attach_igw", "vpc", igwId, { vpc: vpcId });
  },

  addRoute: (rtId, destination, target) => {
    set((s) => ({
      route_tables: s.route_tables.map((rt) =>
        rt.id === rtId
          ? {
              ...rt,
              routes: [
                ...rt.routes,
                { destination, target, status: "active" },
              ],
            }
          : rt
      ),
      flash: `Route ${destination} → ${target} added.`,
    }));
    get().log("add_route", "vpc", rtId, { destination, target });
  },

  addLogInsightQuery: (query) => {
    get().log("run_logs_insights", "cloudwatch", "query", { query });
  },
}));
