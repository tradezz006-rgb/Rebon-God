import type { AccountSnapshot, S3Bucket } from "./types";

const bpaOn = {
  block_acls: true,
  ignore_acls: true,
  block_policy: true,
  restrict_buckets: true,
};

function bucket(
  name: string,
  extra?: Partial<S3Bucket>
): S3Bucket {
  return {
    name,
    region: "ap-south-1",
    public: false,
    objects: 128,
    object_keys: ["index.html", "assets/logo.png", "data/menu.json"],
    created: "2024-06-12",
    encryption: "SSE-S3",
    versioning: "Enabled",
    block_public_access: { ...bpaOn },
    policy: "",
    lifecycle_rules: [],
    ...extra,
  };
}

export const AWS_MANAGED_POLICIES = [
  "AdministratorAccess",
  "AmazonS3ReadOnlyAccess",
  "AmazonS3FullAccess",
  "AmazonEC2FullAccess",
  "AmazonEC2ReadOnlyAccess",
  "CloudWatchReadOnlyAccess",
  "CloudWatchFullAccess",
  "IAMUserChangePassword",
  "ReadOnlyAccess",
  "AmazonVPCFullAccess",
  "AWSBillingReadOnlyAccess",
];

export function createFreshBiteSeed(
  accountId = "847291635028",
  accountName = "FreshBite-Prod"
): AccountSnapshot {
  return {
    identity: {
      account_id: accountId,
      account_name: accountName,
      iam_username: "arjun.mehta",
      region: "ap-south-1",
    },
    users: [
      {
        username: "priya.dev",
        created: "2024-01-15",
        mfa: true,
        console_access: true,
        policies: ["AmazonS3ReadOnlyAccess"],
        groups: ["developers"],
        last_activity: "2 hours ago",
        access_keys: [
          { id: "AKIAIOSFODNN7EXAMPLE", status: "Active", created: "2024-01-16" },
        ],
        password: null,
      },
      {
        username: "karthik.ops",
        created: "2024-02-03",
        mfa: false,
        console_access: true,
        policies: ["AmazonEC2FullAccess"],
        groups: ["ops"],
        last_activity: "Yesterday",
        access_keys: [],
        password: null,
      },
      {
        username: "ananya.data",
        created: "2024-03-20",
        mfa: true,
        console_access: false,
        policies: ["AmazonS3ReadOnlyAccess", "CloudWatchReadOnlyAccess"],
        groups: ["data"],
        last_activity: "5 days ago",
        access_keys: [
          { id: "AKIAI44QH8DHBEXAMPLE", status: "Active", created: "2024-03-21" },
          { id: "AKIAIOSFODEX2AMPLE", status: "Inactive", created: "2024-11-02" },
        ],
        password: null,
      },
    ],
    groups: [
      { name: "developers", policies: ["AmazonS3ReadOnlyAccess"], members: ["priya.dev"] },
      { name: "ops", policies: ["AmazonEC2FullAccess"], members: ["karthik.ops"] },
      { name: "data", policies: ["CloudWatchReadOnlyAccess"], members: ["ananya.data"] },
    ],
    roles: [
      {
        name: "FreshBiteEc2AppRole",
        trusted: "ec2.amazonaws.com",
        last_activity: "18 minutes ago",
        policies: ["AmazonS3ReadOnlyAccess", "CloudWatchAgentServerPolicy"],
      },
      {
        name: "FreshBiteLambdaIngest",
        trusted: "lambda.amazonaws.com",
        last_activity: "3 hours ago",
        policies: ["AWSLambdaBasicExecutionRole"],
      },
    ],
    policies: AWS_MANAGED_POLICIES.map((name) => ({
      name,
      type: "AWS managed" as const,
      attached: name.includes("S3") ? 2 : name.includes("EC2") ? 1 : 0,
      created: "2015-02-06",
    })).concat([
      {
        name: "FreshBiteMenuRead",
        type: "Customer managed",
        attached: 1,
        created: "2024-08-11",
      },
    ]),
    available_policies: [...AWS_MANAGED_POLICIES, "FreshBiteMenuRead"],
    instances: [
      {
        id: "i-0a8f31c2e91b44d17",
        name: "freshbite-prod-api-01",
        state: "running",
        type: "t3.medium",
        status_check: "ok",
        az: "ap-south-1a",
        region: "ap-south-1",
        public_ip: "13.232.41.90",
        private_ip: "10.0.1.24",
      },
      {
        id: "i-0c22ab91d7e10f882",
        name: "freshbite-prod-worker-01",
        state: "running",
        type: "t3.small",
        status_check: "ok",
        az: "ap-south-1b",
        region: "ap-south-1",
        public_ip: null,
        private_ip: "10.0.2.18",
      },
      {
        id: "i-09bb7710aa0012c3f",
        name: "freshbite-prod-bastion",
        state: "stopped",
        type: "t3.micro",
        status_check: "ok",
        az: "ap-south-1a",
        region: "ap-south-1",
        public_ip: null,
        private_ip: "10.0.1.10",
      },
    ],
    asgs: [
      {
        name: "freshbite-prod-api-asg",
        instances: 2,
        min: 2,
        max: 6,
        desired: 2,
        status: "Healthy",
        health_check: "ELB",
      },
    ],
    load_balancers: [
      {
        name: "freshbite-prod-alb",
        dns: "freshbite-prod-alb-1840291.ap-south-1.elb.amazonaws.com",
        state: "active",
        type: "application",
        vpc: "vpc-0f1a2b3c4d5e6f789",
      },
    ],
    buckets: [
      bucket("freshbite-prod-menu-assets", { objects: 1842, created: "2024-01-20" }),
      bucket("freshbite-prod-app-logs", {
        objects: 90211,
        created: "2024-02-04",
        versioning: "Disabled",
      }),
      bucket("freshbite-prod-backups", {
        objects: 64,
        created: "2024-03-01",
        encryption: "SSE-KMS",
      }),
    ],
    vpcs: [
      {
        id: "vpc-0f1a2b3c4d5e6f789",
        name: "freshbite-prod-vpc",
        state: "available",
        cidr: "10.0.0.0/16",
        ipv6: null,
        dhcp: "dopt-0aa11bb22cc33dd44",
        main_route_table: "rtb-0aa11bb22cc33dd01",
      },
    ],
    subnets: [
      {
        id: "subnet-0a11b22c33d44e55f",
        name: "freshbite-prod-public-1a",
        state: "available",
        vpc: "vpc-0f1a2b3c4d5e6f789",
        cidr: "10.0.1.0/24",
        az: "ap-south-1a",
        public_ip_on_launch: true,
      },
      {
        id: "subnet-0b22c33d44e55f66a",
        name: "freshbite-prod-private-1b",
        state: "available",
        vpc: "vpc-0f1a2b3c4d5e6f789",
        cidr: "10.0.2.0/24",
        az: "ap-south-1b",
        public_ip_on_launch: false,
      },
    ],
    security_groups: [
      {
        id: "sg-0aa11bb22cc33dd44",
        name: "freshbite-prod-alb-sg",
        vpc: "vpc-0f1a2b3c4d5e6f789",
        description: "ALB ingress 80/443",
        inbound: [
          { type: "HTTP", protocol: "TCP", port: "80", source: "0.0.0.0/0", description: "web" },
          { type: "HTTPS", protocol: "TCP", port: "443", source: "0.0.0.0/0", description: "web tls" },
        ],
        outbound: [
          { type: "All traffic", protocol: "All", port: "All", source: "0.0.0.0/0", description: "" },
        ],
      },
      {
        id: "sg-0bb22cc33dd44ee55",
        name: "freshbite-prod-api-sg",
        vpc: "vpc-0f1a2b3c4d5e6f789",
        description: "API instances from ALB only",
        inbound: [
          {
            type: "Custom TCP",
            protocol: "TCP",
            port: "8080",
            source: "sg-0aa11bb22cc33dd44",
            description: "from alb",
          },
        ],
        outbound: [
          { type: "All traffic", protocol: "All", port: "All", source: "0.0.0.0/0", description: "" },
        ],
      },
    ],
    igws: [
      {
        id: "igw-0cc33dd44ee55ff66",
        name: "freshbite-prod-igw",
        state: "attached",
        vpc: "vpc-0f1a2b3c4d5e6f789",
      },
    ],
    route_tables: [
      {
        id: "rtb-0aa11bb22cc33dd01",
        name: "freshbite-prod-public-rt",
        vpc: "vpc-0f1a2b3c4d5e6f789",
        main: true,
        routes: [
          { destination: "10.0.0.0/16", target: "local", status: "active" },
          { destination: "0.0.0.0/0", target: "igw-0cc33dd44ee55ff66", status: "active" },
        ],
      },
      {
        id: "rtb-0bb22cc33dd44ee02",
        name: "freshbite-prod-private-rt",
        vpc: "vpc-0f1a2b3c4d5e6f789",
        main: false,
        routes: [{ destination: "10.0.0.0/16", target: "local", status: "active" }],
      },
    ],
    dashboards: [
      { name: "FreshBite-Prod-API", widgets: 6 },
      { name: "FreshBite-Infra", widgets: 4 },
    ],
    alarms: [
      {
        name: "freshbite-api-5xx",
        state: "ALARM",
        condition: "HTTPCode_Target_5XX_Count >= 10 for 1 datapoints within 5 minutes",
        actions: 1,
        period: "5 minutes",
      },
      {
        name: "freshbite-cpu-high",
        state: "OK",
        condition: "CPUUtilization > 80 for 2 datapoints within 10 minutes",
        actions: 1,
        period: "5 minutes",
      },
    ],
    log_groups: [
      { name: "/aws/ec2/freshbite-prod-api", retention: "14 days", metric_filters: 2, subscriptions: 0 },
      { name: "/aws/lambda/freshbite-ingest", retention: "7 days", metric_filters: 0, subscriptions: 1 },
    ],
    budgets: [
      {
        name: "freshbite-monthly-prod",
        budgeted: 2400,
        current: 1875.4,
        forecasted: 2510,
        alert_threshold: 80,
        email: "finops@freshbite.example",
      },
      {
        name: "freshbite-s3-monthly",
        budgeted: 180,
        current: 92.1,
        forecasted: 110,
        alert_threshold: 90,
        email: "finops@freshbite.example",
      },
    ],
    cost_rows: [
      { service: "EC2-Instances", this_month: 842.1, last_month: 791.4 },
      { service: "Amazon S3", this_month: 96.2, last_month: 88.0 },
      { service: "Amazon RDS", this_month: 410.0, last_month: 402.5 },
      { service: "AmazonCloudWatch", this_month: 38.4, last_month: 31.2 },
      { service: "VPC", this_month: 22.0, last_month: 22.0 },
      { service: "AWS Data Transfer", this_month: 64.8, last_month: 58.1 },
    ],
  };
}
