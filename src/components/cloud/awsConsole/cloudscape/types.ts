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
  | "create-user-success"
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

export type S3Page =
  | "buckets"
  | "create-bucket"
  | "bucket-detail"
  | "access-points"
  | "object-lambda"
  | "mrap"
  | "batch"
  | "access-analyzer"
  | "account-bpa";

export type S3ObjectItem = {
  key: string;
  size: number;
  type: string;
  lastModified: string;
  storageClass: string;
};

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
  | "alarms-in-alarm"
  | "alarms-billing"
  | "create-alarm"
  | "log-groups"
  | "logs-insights"
  | "metrics-all"
  | "metrics-explorer"
  | "events-rules";

export type BillingPage =
  | "dashboard"
  | "bills"
  | "cost-explorer"
  | "budgets"
  | "create-budget"
  | "cost-allocation-tags"
  | "savings-plans"
  | "billing-preferences"
  | "payment-methods";

export type MonthlyCostData = {
  month: string;
  services: Record<string, number>;
  total: number;
};

export type IamUser = {
  username: string;
  created: string;
  mfa: boolean;
  console_access: boolean;
  policies: string[];
  groups: string[];
  last_activity: string;
  password_age: string;
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
  description?: string;
  max_session_duration?: string;
};

export type IamPolicy = {
  name: string;
  type: "AWS managed" | "Customer managed" | "Job function";
  attached: number;
  created: string;
};

export type Ec2InstanceState =
  | "pending"
  | "running"
  | "stopping"
  | "stopped"
  | "shutting-down"
  | "terminated";

export type Ec2Instance = {
  id: string;
  name: string;
  state: Ec2InstanceState;
  type: string;
  status_check: "ok" | "impaired" | "initializing";
  alarm_status: "No alarms" | "In alarm" | "Insufficient data";
  az: string;
  region: string;
  public_ip: string | null;
  private_ip: string;
  public_dns?: string | null;
  security_groups?: string[];
};

export type FlashMessage = {
  type: "success" | "error" | "info" | "warning";
  content: string;
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
  /** Legacy key list; prefer object_items when present. */
  object_keys: string[];
  object_items?: S3ObjectItem[];
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
  main_network_acl?: string;
};

export type Subnet = {
  id: string;
  name: string;
  state: "available";
  vpc: string;
  cidr: string;
  az: string;
  public_ip_on_launch: boolean;
  available_ips?: number;
  subnet_type?: "public" | "private";
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
  routes: { destination: string; target: string; status: string; propagated?: boolean }[];
  associated_subnet_ids?: string[];
};

export type CwWidget = {
  id: string;
  type: "line" | "number" | "stacked" | "bar" | "pie" | "text";
  metricName?: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CwDashboard = {
  name: string;
  widgets: CwWidget[];
  lastModified: string;
};

export type CwAlarm = {
  id: string;
  name: string;
  description?: string;
  state: "OK" | "ALARM" | "INSUFFICIENT_DATA";
  condition: string;
  metric?: string;
  namespace?: string;
  statistic?: "Average" | "Sum" | "Minimum" | "Maximum";
  threshold?: number;
  comparisonOperator?:
    | "GreaterThanOrEqualToThreshold"
    | "GreaterThanThreshold"
    | "LessThanOrEqualToThreshold"
    | "LessThanThreshold";
  actions: number;
  actionTarget?: string;
  period: string;
};

export type LogGroup = {
  name: string;
  retention: string;
  metric_filters: number;
  subscriptions: number;
};

export type Budget = {
  id: string;
  name: string;
  period: "Daily" | "Monthly" | "Quarterly" | "Annually";
  budgeted: number;
  current: number;
  forecasted: number;
  alert_threshold: number;
  threshold_type: "Actual" | "Forecasted";
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

export type VisualMode = "light" | "dark" | "system";

export type HomeWidgetId =
  | "welcome"
  | "cost"
  | "recent"
  | "health"
  | "favorites"
  | "trusted"
  | "explore";

export type HomeLayoutState = {
  widgets: HomeWidgetId[];
  showFavIcon: boolean;
  showFavName: boolean;
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
  favorites: ServiceId[];
  homeLayout: HomeLayoutState;
};

export type GradingAction = IamConsoleAction;
