import type { IamConsoleAction } from "../iamActions";

export type ServiceId =
  | "home"
  | "iam"
  | "ec2"
  | "s3"
  | "vpc"
  | "cloudwatch"
  | "billing";

export type ConsoleMode = "learn" | "work";

export type IamPage =
  | "dashboard"
  | "users"
  | "create-user"
  | "user-detail"
  | "groups"
  | "roles"
  | "policies"
  | "identity-providers"
  | "account-settings";

export type Ec2Page =
  | "dashboard"
  | "instances"
  | "launch"
  | "asg"
  | "load-balancers";

export type S3Page = "buckets" | "create-bucket" | "bucket-detail";

export type VpcPage =
  | "dashboard"
  | "vpcs"
  | "create-vpc"
  | "subnets"
  | "security-groups"
  | "sg-detail"
  | "igws"
  | "route-tables"
  | "rt-detail";

export type CwPage =
  | "overview"
  | "dashboards"
  | "dashboard-view"
  | "alarms"
  | "create-alarm"
  | "log-groups"
  | "logs-insights";

export type BillingPage = "cost-explorer" | "budgets" | "create-budget";

export type IamUser = {
  username: string;
  created: string;
  mfa: boolean;
  console_access: boolean;
  policies: string[];
  groups: string[];
  last_activity: string;
  access_keys: { id: string; status: "Active" | "Inactive"; created: string }[];
  password: string | null;
};

export type IamGroup = {
  name: string;
  policies: string[];
  members: string[];
};

export type IamRole = {
  name: string;
  trusted: string;
  last_activity: string;
  policies: string[];
};

export type IamPolicy = {
  name: string;
  type: "AWS managed" | "Customer managed" | "Job function";
  attached: number;
  created: string;
};

export type Ec2Instance = {
  id: string;
  name: string;
  state: "running" | "stopped" | "pending" | "terminated";
  type: string;
  status_check: "ok" | "impaired" | "initializing";
  az: string;
  region: string;
  public_ip: string | null;
  private_ip: string;
};

export type AutoScalingGroup = {
  name: string;
  instances: number;
  min: number;
  max: number;
  desired: number;
  status: string;
  health_check: "EC2" | "ELB";
};

export type LoadBalancer = {
  name: string;
  dns: string;
  state: "active" | "provisioning";
  type: "application" | "network";
  vpc: string;
};

export type S3Bucket = {
  name: string;
  region: string;
  public: boolean;
  objects: number;
  object_keys: string[];
  created: string;
  encryption: string;
  versioning: "Enabled" | "Suspended" | "Disabled";
  block_public_access: {
    block_acls: boolean;
    ignore_acls: boolean;
    block_policy: boolean;
    restrict_buckets: boolean;
  };
  policy: string;
  lifecycle_rules: { name: string; status: string; prefix: string; actions: string }[];
};

export type Vpc = {
  id: string;
  name: string;
  state: "available";
  cidr: string;
  ipv6: string | null;
  dhcp: string;
  main_route_table: string;
};

export type Subnet = {
  id: string;
  name: string;
  state: "available";
  vpc: string;
  cidr: string;
  az: string;
  public_ip_on_launch: boolean;
};

export type SecurityGroup = {
  id: string;
  name: string;
  vpc: string;
  description: string;
  inbound: SgRule[];
  outbound: SgRule[];
};

export type SgRule = {
  type: string;
  protocol: string;
  port: string;
  source: string;
  description: string;
};

export type InternetGateway = {
  id: string;
  name: string;
  state: "attached" | "detached";
  vpc: string | null;
};

export type RouteTable = {
  id: string;
  name: string;
  vpc: string;
  main: boolean;
  routes: { destination: string; target: string; status: string }[];
};

export type CwDashboard = {
  name: string;
  widgets: number;
};

export type CwAlarm = {
  name: string;
  state: "OK" | "ALARM" | "INSUFFICIENT_DATA";
  condition: string;
  actions: number;
  period: string;
};

export type LogGroup = {
  name: string;
  retention: string;
  metric_filters: number;
  subscriptions: number;
};

export type Budget = {
  name: string;
  budgeted: number;
  current: number;
  forecasted: number;
  alert_threshold: number;
  email: string;
};

export type CostRow = {
  service: string;
  this_month: number;
  last_month: number;
};

export type ActionLogEntry = {
  timestamp: number;
  action_type: string;
  resource_type: string;
  resource_id: string;
  params: Record<string, string | number | boolean | null>;
  result: "success" | "denied" | "error";
};

export type AccountIdentity = {
  account_id: string;
  account_name: string;
  iam_username: string;
  region: string;
};

export type ConsoleRoute = {
  service: ServiceId;
  page: string;
  selectedId: string | null;
};

export type AccountSnapshot = {
  identity: AccountIdentity;
  users: IamUser[];
  groups: IamGroup[];
  roles: IamRole[];
  policies: IamPolicy[];
  available_policies: string[];
  instances: Ec2Instance[];
  asgs: AutoScalingGroup[];
  load_balancers: LoadBalancer[];
  buckets: S3Bucket[];
  vpcs: Vpc[];
  subnets: Subnet[];
  security_groups: SecurityGroup[];
  igws: InternetGateway[];
  route_tables: RouteTable[];
  dashboards: CwDashboard[];
  alarms: CwAlarm[];
  log_groups: LogGroup[];
  budgets: Budget[];
  cost_rows: CostRow[];
};

export type OverlayState = {
  services_open: boolean;
  search_open: boolean;
  search_query: string;
  region_open: boolean;
  account_open: boolean;
  notifications_open: boolean;
  settings_open: boolean;
  support_open: boolean;
  cloudshell_open: boolean;
  recentlyVisited: ServiceId[];
};

export type GradingAction = IamConsoleAction;
