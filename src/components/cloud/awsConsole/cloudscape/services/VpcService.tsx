import { useMemo, useState, useEffect } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Badge from "@cloudscape-design/components/badge";
import Tabs from "@cloudscape-design/components/tabs";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Toggle from "@cloudscape-design/components/toggle";
import Modal from "@cloudscape-design/components/modal";
import { useAccountStore } from "../store";
import type { RouteTable as RtType } from "../types";

export function VpcService() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "dashboard") return <VpcDashboard />;
  if (page === "create-vpc") return <CreateVpcWizard />;
  if (page === "subnets") return <SubnetsPage />;
  if (page === "security-groups") return <SgList />;
  if (page === "sg-detail") return <SgDetail />;
  if (page === "igws") return <IgwPage />;
  if (page === "route-tables") return <RtList />;
  if (page === "rt-detail") return <RtDetail />;
  if (page === "rt-edit") return <RtEditRoutes />;
  if (
    page === "egress-igws" ||
    page === "carrier-gateways" ||
    page === "dhcp-options" ||
    page === "elastic-ips" ||
    page === "nat-gateways" ||
    page === "network-acls" ||
    page === "ram" ||
    page === "ipam"
  ) {
    return <VpcStub title={page.replace(/-/g, " ")} />;
  }
  return <VpcsPage />;
}

function VpcStub({ title }: { title: string }) {
  return (
    <Box padding="l">
      <Header variant="h1" description="Daily-use focus is Your VPCs, Subnets, and Route tables.">
        {title}
      </Header>
      <Box color="text-body-secondary" padding={{ top: "m" }}>
        This console entry is reserved for a later pass.
      </Box>
    </Box>
  );
}

function VpcDashboard() {
  const vpcs = useAccountStore((s) => s.vpcs);
  const subnets = useAccountStore((s) => s.subnets);
  const sgs = useAccountStore((s) => s.security_groups);
  const igws = useAccountStore((s) => s.igws);
  const rts = useAccountStore((s) => s.route_tables);
  const navigate = useAccountStore((s) => s.navigate);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description="Create a VPC plus subnets, route tables, and gateways — or start from Your VPCs."
        actions={
          <span data-console-target="create-vpc" data-action-id="HIGHLIGHT:btn-create-vpc">
            <Button
              variant="primary"
              disabled={!interactive}
              onClick={() => {
                markClick("create-vpc");
                navigate("vpc", "create-vpc");
              }}
            >
              Create VPC
            </Button>
          </span>
        }
      >
        VPC dashboard
      </Header>
      <ColumnLayout columns={4} variant="text-grid">
        {[
          { label: "VPCs", n: vpcs.length, page: "vpcs" },
          { label: "Subnets", n: subnets.length, page: "subnets" },
          { label: "Route tables", n: rts.length, page: "route-tables" },
          { label: "Internet gateways", n: igws.length, page: "igws" },
          { label: "Security groups", n: sgs.length, page: "security-groups" },
        ].map((c) => (
          <Box key={c.label}>
            <Box variant="awsui-key-label">{c.label}</Box>
            <Button variant="inline-link" onClick={() => navigate("vpc", c.page)}>
              <Box fontSize="display-l" fontWeight="light">
                {c.n}
              </Box>
            </Button>
          </Box>
        ))}
      </ColumnLayout>
    </SpaceBetween>
  );
}

function VpcsPage() {
  const vpcs = useAccountStore((s) => s.vpcs);
  const navigate = useAccountStore((s) => s.navigate);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<(typeof vpcs)[0][]>([]);
  const [filter, setFilter] = useState("");
  const [tick, setTick] = useState(0);

  const items = useMemo(
    () =>
      vpcs.filter(
        (v) =>
          !filter ||
          v.name.toLowerCase().includes(filter.toLowerCase()) ||
          v.id.toLowerCase().includes(filter.toLowerCase()) ||
          v.cidr.includes(filter)
      ),
    [vpcs, filter, tick]
  );

  return (
    <div data-action-id="NAV:vpc-list">
      <Table
        variant="full-page"
        stickyHeader
        selectionType="multi"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        filter={
          <SpaceBetween direction="horizontal" size="xs">
            <Input
              value={filter}
              onChange={({ detail }) => setFilter(detail.value)}
              placeholder="Filter VPCs by name or property"
              type="search"
            />
            <Button
              iconName="refresh"
              ariaLabel="Refresh"
              onClick={() => setTick((n) => n + 1)}
            />
          </SpaceBetween>
        }
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${vpcs.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button disabled={!interactive || selected.length === 0}>Actions</Button>
                <span
                  data-console-target="create-vpc"
                  data-action-id="HIGHLIGHT:btn-create-vpc"
                >
                  <Button
                    variant="primary"
                    disabled={!interactive}
                    onClick={() => {
                      markClick("create-vpc");
                      navigate("vpc", "create-vpc");
                    }}
                  >
                    Create VPC
                  </Button>
                </span>
              </SpaceBetween>
            }
          >
            Your VPCs
          </Header>
        }
        columnDefinitions={[
          {
            id: "name",
            header: "Name",
            cell: (v) => (
              <Button variant="inline-link" disabled={!interactive}>
                {v.name}
              </Button>
            ),
          },
          {
            id: "id",
            header: "VPC ID",
            cell: (v) => (
              <Button variant="inline-link" disabled={!interactive}>
                {v.id}
              </Button>
            ),
          },
          {
            id: "state",
            header: "State",
            cell: (v) => (
              <StatusIndicator type="success">
                {v.state === "available" ? "Available" : v.state}
              </StatusIndicator>
            ),
          },
          { id: "cidr", header: "IPv4 CIDR", cell: (v) => v.cidr },
          { id: "ipv6", header: "IPv6 CIDR", cell: (v) => v.ipv6 || "—" },
          { id: "dhcp", header: "DHCP options set", cell: (v) => v.dhcp },
          {
            id: "rt",
            header: "Route table",
            cell: (v) => (
              <Button
                variant="inline-link"
                onClick={() => navigate("vpc", "rt-detail", v.main_route_table)}
              >
                {v.main_route_table}
              </Button>
            ),
          },
          {
            id: "nacl",
            header: "Main Network ACL",
            cell: (v) => v.main_network_acl || "—",
          },
        ]}
        items={items}
        empty={
          <Box textAlign="center" padding="l">
            <b>No VPCs</b>
          </Box>
        }
      />
    </div>
  );
}

/** Real AWS Create VPC — VPC and more + live Preview pane. */
function CreateVpcWizard() {
  const navigate = useAccountStore((s) => s.navigate);
  const createVpc = useAccountStore((s) => s.createVpc);
  const clearVpcProvision = useAccountStore((s) => s.clearVpcProvision);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const region = useAccountStore((s) => s.identity.region);
  const vpcProvision = useAccountStore((s) => s.vpcProvision);

  const [mode, setMode] = useState<"more" | "only">("more");
  const [autoName, setAutoName] = useState(true);
  const [name, setName] = useState("rebon-lab");
  const [cidr, setCidr] = useState("10.0.0.0/16");
  const [ipv6, setIpv6] = useState("none");
  const [tenancy, setTenancy] = useState<"default" | "dedicated">("default");
  const [azCount, setAzCount] = useState<1 | 2 | 3>(2);
  const [publicTotal, setPublicTotal] = useState(2);
  const [privateTotal, setPrivateTotal] = useState(2);
  const [nat, setNat] = useState<"none" | "one" | "per-az">("none");
  const [s3Endpoint, setS3Endpoint] = useState(true);
  const [dnsHostnames, setDnsHostnames] = useState(true);
  const [dnsSupport, setDnsSupport] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cidrOpen, setCidrOpen] = useState(false);

  const publicPerAz = publicTotal === 0 ? 0 : Math.max(1, Math.ceil(publicTotal / azCount));
  const privatePerAz =
    privateTotal === 0 ? 0 : Math.max(1, Math.ceil(privateTotal / azCount));

  const preview = useMemo(() => {
    const azs = ["a", "b", "c"].slice(0, azCount).map((l) => `${region}${l}`);
    return {
      azs,
      publicCount: mode === "more" ? publicTotal : 0,
      privateCount: mode === "more" ? privateTotal : 0,
      hasIgw: mode === "more",
      natCount:
        mode !== "more" || nat === "none" ? 0 : nat === "one" ? 1 : azCount,
    };
  }, [azCount, publicTotal, privateTotal, nat, mode, region]);

  const submit = () => {
    if (!interactive || !name.trim() || !cidr.trim() || submitting) return;
    markClick("create-vpc-submit");
    setSubmitting(true);
    useAccountStore.getState().setActionDraft({ "vpc-cidr-block": cidr.trim() });
    const opts =
      mode === "only"
        ? {
            name: name.trim(),
            cidr: cidr.trim(),
            tenancy,
            azCount: 1 as const,
            publicPerAz: 0,
            privatePerAz: 0,
            nat: "none" as const,
            dnsHostnames,
            dnsSupport,
            s3Endpoint: false,
          }
        : {
            name: name.trim(),
            cidr: cidr.trim(),
            tenancy,
            azCount,
            publicPerAz,
            privatePerAz,
            publicSubnets: publicTotal,
            privateSubnets: privateTotal,
            nat,
            dnsHostnames,
            dnsSupport,
            s3Endpoint,
          };
    void createVpc(opts).finally(() => setSubmitting(false));
  };

  if (vpcProvision) {
    const allDone = vpcProvision.every((s) => s.done);
    return (
      <div className="aws-vpc-provision" data-console-target="vpc-provision-progress">
        <Header variant="h1" description="Creating resources. This can take up to a minute.">
          Creating VPC
        </Header>
        <ul className="aws-vpc-provision-list">
          {vpcProvision.map((step) => (
            <li key={step.id} className={step.done ? "is-done" : ""}>
              <span className="aws-vpc-provision-tick">{step.done ? "✓" : "…"}</span>
              {step.label}
            </li>
          ))}
        </ul>
        {allDone && (
          <SpaceBetween size="m">
            <Alert type="success" header="VPC workflow completed successfully" />
            <Button
              variant="primary"
              onClick={() => clearVpcProvision()}
            >
              <span data-action-id="CLICK:btn-view-created-vpc">View VPC</span>
            </Button>
          </SpaceBetween>
        )}
      </div>
    );
  }

  return (
    <div data-console-target="create-vpc-form">
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Create a VPC with optional subnets, Internet gateway, NAT gateways, and DNS options."
        >
          Create VPC
        </Header>

        <div data-action-id="HIGHLIGHT:toggle-vpc-and-more" data-action-id-nav="NAV:vpc-create">
          <FormField label="Resources to create">
            <RadioGroup
              value={mode}
              onChange={({ detail }) => setMode(detail.value as "more" | "only")}
              items={[
                {
                  value: "more",
                  label: "VPC and more",
                  description:
                    "Create a VPC plus subnets, route tables, Internet gateway, and optional NAT gateways.",
                },
                {
                  value: "only",
                  label: "VPC only",
                  description: "Create a VPC with no additional resources.",
                },
              ]}
            />
          </FormField>
        </div>

        <div className="aws-vpc-create-layout">
          <SpaceBetween size="l">
            <Container
              header={
                <Header variant="h2" description="Name, IPv4 CIDR, and tenancy">
                  1 · VPC settings
                </Header>
              }
            >
              <SpaceBetween size="m">
                {mode === "more" && (
                  <Toggle
                    checked={autoName}
                    onChange={({ detail }) => setAutoName(detail.checked)}
                  >
                    Name tag auto-generation
                  </Toggle>
                )}
                <FormField
                  label="Name tag / Name tag auto-generation prefix"
                  description="Creates a Name tag on the VPC and related resources."
                >
                  <span data-action-id="FILL:vpc-name-prefix">
                    <Input
                      value={name}
                      disabled={!interactive}
                      onChange={({ detail }) => setName(detail.value)}
                      placeholder="rebon-lab"
                    />
                  </span>
                </FormField>
                <FormField
                  label="IPv4 CIDR block"
                  description="A VPC must have an IPv4 address range (for example 10.0.0.0/16)."
                >
                  <span data-action-id="FILL:vpc-cidr-block">
                    <Input
                      value={cidr}
                      disabled={!interactive}
                      onChange={({ detail }) => setCidr(detail.value)}
                    />
                  </span>
                </FormField>
                <FormField label="IPv6 CIDR block">
                  <RadioGroup
                    value={ipv6}
                    onChange={({ detail }) => setIpv6(detail.value)}
                    items={[
                      { value: "none", label: "No IPv6 CIDR block" },
                      {
                        value: "amazon",
                        label: "Amazon-provided IPv6 CIDR block",
                        disabled: true,
                        description: "Not simulated in this lab.",
                      },
                    ]}
                  />
                </FormField>
                <FormField label="Tenancy">
                  <Select
                    selectedOption={{
                      label: tenancy === "default" ? "Default" : "Dedicated",
                      value: tenancy,
                    }}
                    options={[
                      { label: "Default", value: "default" },
                      { label: "Dedicated", value: "dedicated" },
                    ]}
                    onChange={({ detail }) =>
                      setTenancy(
                        (detail.selectedOption.value as "default" | "dedicated") ||
                          "default"
                      )
                    }
                  />
                </FormField>
              </SpaceBetween>
            </Container>

            {mode === "more" && (
              <>
                <Container
                  header={
                    <Header
                      variant="h2"
                      description="Provision subnets in at least two AZs for production."
                    >
                      2 · Number of Availability Zones
                    </Header>
                  }
                >
                  <RadioGroup
                    value={String(azCount)}
                    onChange={({ detail }) =>
                      setAzCount(Number(detail.value) as 1 | 2 | 3)
                    }
                    items={[
                      { value: "1", label: "1", description: undefined },
                      { value: "2", label: "2" },
                      { value: "3", label: "3" },
                    ]}
                  />
                  <Box color="text-body-secondary" padding={{ top: "s" }}>
                    <span data-action-id={`SELECT:vpc-az-count-${azCount}`}>
                      Customize AZs: {preview.azs.join(", ")}
                    </span>
                  </Box>
                </Container>

                <Container
                  header={
                    <Header variant="h2" description="Public and private subnets (distributed across AZs)">
                      3 · Subnets
                    </Header>
                  }
                >
                  <ColumnLayout columns={2}>
                    <FormField label="Number of public subnets">
                      <RadioGroup
                        value={String(publicTotal)}
                        onChange={({ detail }) => setPublicTotal(Number(detail.value))}
                        items={[
                          { value: "0", label: "0" },
                          { value: "1", label: "1" },
                          { value: "2", label: "2" },
                        ]}
                      />
                      <span data-action-id={`SELECT:vpc-public-subnets-${publicTotal}`} />
                    </FormField>
                    <FormField label="Number of private subnets">
                      <RadioGroup
                        value={String(privateTotal)}
                        onChange={({ detail }) => setPrivateTotal(Number(detail.value))}
                        items={[
                          { value: "0", label: "0" },
                          { value: "1", label: "1" },
                          { value: "2", label: "2" },
                        ]}
                      />
                    </FormField>
                  </ColumnLayout>
                  <Box color="text-body-secondary" padding={{ top: "s" }}>
                    Total: {preview.publicCount} public · {preview.privateCount} private
                  </Box>
                  <Button
                    variant="inline-link"
                    onClick={() => setCidrOpen((v) => !v)}
                  >
                    {cidrOpen ? "Hide" : "Customize"} subnet CIDR blocks
                  </Button>
                  {cidrOpen && (
                    <div data-action-id="HIGHLIGHT:subnet-cidr-table">
                      <Box fontSize="body-s" padding={{ top: "s" }}>
                        <div>Public subnet AZ 1: 10.0.0.0/20</div>
                        {azCount > 1 && <div>Public subnet AZ 2: 10.0.16.0/20</div>}
                        <div>Private subnet AZ 1: 10.0.128.0/20</div>
                        {azCount > 1 && <div>Private subnet AZ 2: 10.0.144.0/20</div>}
                      </Box>
                    </div>
                  )}
                </Container>

                <Container
                  header={
                    <Header
                      variant="h2"
                      description="NAT gateways enable private subnets to reach the internet (costs apply)."
                    >
                      4 · NAT gateways
                    </Header>
                  }
                >
                  <RadioGroup
                    value={nat}
                    onChange={({ detail }) =>
                      setNat(detail.value as "none" | "one" | "per-az")
                    }
                    items={[
                      { value: "none", label: "None" },
                      {
                        value: "one",
                        label: "In 1 AZ",
                        description:
                          "Lower cost; single AZ failure impacts private egress.",
                      },
                      {
                        value: "per-az",
                        label: "1 per AZ",
                        description: "Recommended for production.",
                      },
                    ]}
                  />
                  <span data-action-id={`SELECT:vpc-nat-gateway-${nat === "per-az" ? "per-az" : nat === "one" ? "single" : "none"}`} />
                </Container>

                <Container header={<Header variant="h2">5 · VPC endpoints</Header>}>
                  <FormField label="Gateway endpoints">
                    <Select
                      selectedOption={{
                        label: s3Endpoint ? "S3 Gateway" : "None",
                        value: s3Endpoint ? "s3" : "none",
                      }}
                      options={[
                        { label: "None", value: "none" },
                        { label: "S3 Gateway", value: "s3" },
                      ]}
                      onChange={({ detail }) =>
                        setS3Endpoint(detail.selectedOption.value === "s3")
                      }
                    />
                  </FormField>
                </Container>

                <Container header={<Header variant="h2">6 · DNS options</Header>}>
                  <SpaceBetween size="s">
                    <Toggle
                      checked={dnsHostnames}
                      onChange={({ detail }) => setDnsHostnames(detail.checked)}
                    >
                      Enable DNS hostnames
                    </Toggle>
                    <Toggle
                      checked={dnsSupport}
                      onChange={({ detail }) => setDnsSupport(detail.checked)}
                    >
                      Enable DNS resolution
                    </Toggle>
                  </SpaceBetween>
                </Container>
              </>
            )}

            <SpaceBetween direction="horizontal" size="xs">
              <span data-console-target="create-vpc-submit" data-action-id="CLICK:btn-create-vpc-submit">
                <Button
                  variant="primary"
                  loading={submitting}
                  disabled={!interactive || !name.trim() || !cidr.trim() || submitting}
                  onClick={submit}
                >
                  Create VPC
                </Button>
              </span>
              <Button onClick={() => navigate("vpc", "vpcs")}>Cancel</Button>
            </SpaceBetween>
          </SpaceBetween>

          <Container
            header={
              <Header variant="h2" description="Updates as you change settings">
                Preview
              </Header>
            }
          >
            <div data-action-id="HIGHLIGHT:vpc-architecture-preview" data-console-target="vpc-architecture-preview">
              <VpcPreviewMap
                name={name || "VPC"}
                cidr={cidr}
                azs={preview.azs}
                publicPerAz={mode === "more" ? publicPerAz : 0}
                privatePerAz={mode === "more" ? privatePerAz : 0}
                hasIgw={preview.hasIgw}
                natCount={preview.natCount}
                hasS3Endpoint={mode === "more" && s3Endpoint}
              />
            </div>
          </Container>
        </div>
      </SpaceBetween>
    </div>
  );
}

function VpcPreviewMap({
  name,
  cidr,
  azs,
  publicPerAz,
  privatePerAz,
  hasIgw,
  natCount,
  hasS3Endpoint = false,
}: {
  name: string;
  cidr: string;
  azs: string[];
  publicPerAz: number;
  privatePerAz: number;
  hasIgw: boolean;
  natCount: number;
  hasS3Endpoint?: boolean;
}) {
  return (
    <div className="aws-vpc-preview">
      <div className="aws-vpc-preview-vpc">
        <div className="aws-vpc-preview-vpc-label">
          <strong>{name}</strong>
          <span>{cidr}</span>
        </div>
        {hasIgw && (
          <div className="aws-vpc-preview-igw" title="Internet gateway">
            IGW
          </div>
        )}
        {hasS3Endpoint && (
          <div className="aws-vpc-preview-igw" title="S3 Gateway Endpoint">
            S3 Endpoint
          </div>
        )}
        <div className="aws-vpc-preview-azs">
          {azs.length === 0 ? (
            <Box color="text-body-secondary">No AZs selected</Box>
          ) : (
            azs.map((az, i) => (
              <div key={az} className="aws-vpc-preview-az">
                <div className="aws-vpc-preview-az-title">{az}</div>
                {Array.from({ length: publicPerAz }).map((_, p) => (
                  <div key={`pub-${p}`} className="aws-vpc-preview-subnet public">
                    Public subnet
                    {natCount > 0 && (natCount === 1 ? i === 0 : true) && p === 0 && (
                      <span className="aws-vpc-preview-nat">NAT</span>
                    )}
                  </div>
                ))}
                {Array.from({ length: privatePerAz }).map((_, p) => (
                  <div key={`priv-${p}`} className="aws-vpc-preview-subnet private">
                    Private subnet
                  </div>
                ))}
                {publicPerAz === 0 && privatePerAz === 0 && (
                  <div className="aws-vpc-preview-empty">No subnets</div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="aws-vpc-preview-legend">
          <span>
            <i className="dot public" /> Public
          </span>
          <span>
            <i className="dot private" /> Private
          </span>
          <span>Solid = relationship · Dotted = traffic path</span>
        </div>
      </div>
    </div>
  );
}

function SubnetsPage() {
  const subnets = useAccountStore((s) => s.subnets);
  const vpcs = useAccountStore((s) => s.vpcs);
  const createSubnet = useAccountStore((s) => s.createSubnet);
  const updateSubnetSettings = useAccountStore((s) => s.updateSubnetSettings);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const region = useAccountStore((s) => s.identity.region);
  const [selected, setSelected] = useState<(typeof subnets)[0][]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [vpc, setVpc] = useState(vpcs[0]?.id || "");
  const [cidr, setCidr] = useState("10.0.10.0/24");
  const [az, setAz] = useState(`${region}a`);
  const [publicIp, setPublicIp] = useState(false);
  const [editPublicIp, setEditPublicIp] = useState(false);

  const azOptions = [`${region}a`, `${region}b`, `${region}c`].map((z) => ({
    label: z,
    value: z,
  }));

  const submit = () => {
    if (!interactive || !name.trim() || !vpc || !cidr.trim()) return;
    markClick("create-subnet");
    createSubnet({
      name: name.trim(),
      vpc,
      cidr: cidr.trim(),
      az,
      public_ip_on_launch: publicIp,
    });
    setShowForm(false);
    setName("");
  };

  const active = selected[0];

  return (
    <div data-action-id="NAV:vpc-subnets">
      <SpaceBetween size="l">
        <Table
          variant="full-page"
          stickyHeader
          selectionType="single"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          header={
            <Header
              variant="awsui-h1-sticky"
              counter={`(${subnets.length})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    disabled={!interactive || !active}
                    onClick={() => {
                      if (!active) return;
                      setEditPublicIp(active.public_ip_on_launch);
                      setEditOpen(true);
                    }}
                  >
                    Edit subnet settings
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!interactive}
                    onClick={() => setShowForm((v) => !v)}
                  >
                    Create subnet
                  </Button>
                </SpaceBetween>
              }
            >
              Subnets
            </Header>
          }
          columnDefinitions={[
            {
              id: "id",
              header: "Subnet ID",
              cell: (s) => (
                <Button variant="inline-link" disabled={!interactive}>
                  {s.id}
                </Button>
              ),
            },
            { id: "name", header: "Name", cell: (s) => s.name },
            {
              id: "state",
              header: "State",
              cell: () => <StatusIndicator type="success">Available</StatusIndicator>,
            },
            { id: "vpc", header: "VPC", cell: (s) => s.vpc },
            { id: "cidr", header: "IPv4 CIDR", cell: (s) => s.cidr },
            {
              id: "ips",
              header: "Available IPv4 addresses",
              cell: (s) => String(s.available_ips ?? 251),
            },
            { id: "az", header: "Availability Zone", cell: (s) => s.az },
            {
              id: "auto",
              header: "Auto-assign public IPv4 address",
              cell: (s) => (s.public_ip_on_launch ? "Yes" : "No"),
            },
          ]}
          items={subnets}
        />

        <Modal
          visible={editOpen}
          onDismiss={() => setEditOpen(false)}
          header="Edit subnet settings"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  disabled={!active}
                  onClick={() => {
                    if (!active) return;
                    updateSubnetSettings(active.id, {
                      public_ip_on_launch: editPublicIp,
                    });
                    setEditOpen(false);
                  }}
                >
                  Save
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <Container header={<Header variant="h2">Auto-assign IP settings</Header>}>
            <Toggle
              checked={editPublicIp}
              onChange={({ detail }) => setEditPublicIp(detail.checked)}
            >
              Enable auto-assign public IPv4 address
            </Toggle>
          </Container>
        </Modal>

        {showForm && (
          <Container header={<Header variant="h2">Create subnet</Header>}>
            <SpaceBetween size="m">
              <FormField label="Name tag">
                <Input
                  value={name}
                  disabled={!interactive}
                  onChange={({ detail }) => setName(detail.value)}
                  placeholder="my-subnet"
                />
              </FormField>
              <FormField label="VPC">
                <Select
                  selectedOption={
                    vpc
                      ? {
                          label: vpcs.find((v) => v.id === vpc)?.name
                            ? `${vpcs.find((v) => v.id === vpc)!.name} (${vpc})`
                            : vpc,
                          value: vpc,
                        }
                      : null
                  }
                  options={vpcs.map((v) => ({
                    label: `${v.name} (${v.id})`,
                    value: v.id,
                  }))}
                  onChange={({ detail }) => setVpc(detail.selectedOption.value || "")}
                />
              </FormField>
              <FormField label="IPv4 CIDR block">
                <Input
                  value={cidr}
                  disabled={!interactive}
                  onChange={({ detail }) => setCidr(detail.value)}
                />
              </FormField>
              <FormField label="Availability Zone">
                <Select
                  selectedOption={{ label: az, value: az }}
                  options={azOptions}
                  onChange={({ detail }) => setAz(detail.selectedOption.value || az)}
                />
              </FormField>
              <Toggle
                checked={publicIp}
                onChange={({ detail }) => setPublicIp(detail.checked)}
              >
                Auto-assign public IPv4 address
              </Toggle>
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  disabled={!interactive || !name.trim() || !vpc || !cidr.trim()}
                  onClick={submit}
                >
                  Create subnet
                </Button>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
              </SpaceBetween>
            </SpaceBetween>
          </Container>
        )}
      </SpaceBetween>
    </div>
  );
}

function SgList() {
  const groups = useAccountStore((s) => s.security_groups);
  const vpcs = useAccountStore((s) => s.vpcs);
  const navigate = useAccountStore((s) => s.navigate);
  const createSecurityGroup = useAccountStore((s) => s.createSecurityGroup);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [vpc, setVpc] = useState(vpcs[0]?.id || "");
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!interactive || !name.trim() || !vpc) return;
    markClick("create-sg");
    createSecurityGroup(name.trim(), vpc, description.trim() || name.trim());
    setShowForm(false);
    setName("");
    setDescription("");
  };

  return (
    <SpaceBetween size="l">
      <Table
        variant="full-page"
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${groups.length})`}
            actions={
              <Button
                variant="primary"
                disabled={!interactive}
                onClick={() => setShowForm((v) => !v)}
              >
                Create security group
              </Button>
            }
          >
            Security groups
          </Header>
        }
        columnDefinitions={[
          {
            id: "id",
            header: "Security group ID",
            cell: (g) => (
              <Button
                variant="inline-link"
                disabled={!interactive}
                onClick={() => navigate("vpc", "sg-detail", g.id)}
              >
                {g.id}
              </Button>
            ),
          },
          { id: "name", header: "Name", cell: (g) => g.name },
          { id: "vpc", header: "VPC", cell: (g) => g.vpc },
          { id: "desc", header: "Description", cell: (g) => g.description },
        ]}
        items={groups}
      />
      {showForm && (
        <Container header={<Header variant="h2">Create security group</Header>}>
          <SpaceBetween size="m">
            <FormField label="Security group name">
              <Input
                value={name}
                disabled={!interactive}
                onChange={({ detail }) => setName(detail.value)}
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={description}
                disabled={!interactive}
                onChange={({ detail }) => setDescription(detail.value)}
              />
            </FormField>
            <FormField label="VPC">
              <Select
                selectedOption={
                  vpc
                    ? {
                        label: vpcs.find((v) => v.id === vpc)?.name
                          ? `${vpcs.find((v) => v.id === vpc)!.name} (${vpc})`
                          : vpc,
                        value: vpc,
                      }
                    : null
                }
                options={vpcs.map((v) => ({
                  label: `${v.name} (${v.id})`,
                  value: v.id,
                }))}
                onChange={({ detail }) => setVpc(detail.selectedOption.value || "")}
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                disabled={!interactive || !name.trim() || !vpc}
                onClick={submit}
              >
                Create security group
              </Button>
              <Button onClick={() => setShowForm(false)}>Cancel</Button>
            </SpaceBetween>
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}

function SgDetail() {
  const id = useAccountStore((s) => s.route.selectedId);
  const sg = useAccountStore((s) => s.security_groups.find((g) => g.id === id));
  const addSgRule = useAccountStore((s) => s.addSgRule);
  const interactive = useAccountStore((s) => s.interactive);
  const [tab, setTab] = useState("inbound");
  const [type, setType] = useState("HTTPS");
  const [port, setPort] = useState("443");
  const [source, setSource] = useState("0.0.0.0/0");

  if (!sg) return <Alert type="error">Security group not found.</Alert>;

  const items = tab === "outbound" ? sg.outbound : sg.inbound;

  const add = () => {
    addSgRule(sg.id, tab === "outbound" ? "outbound" : "inbound", {
      type,
      protocol: "TCP",
      port,
      source,
      description: "",
    });
  };

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description={sg.description}>
        {sg.name} ({sg.id})
      </Header>
      <Tabs
        activeTabId={tab}
        onChange={({ detail }) => setTab(detail.activeTabId)}
        tabs={[
          { id: "inbound", label: "Inbound rules", content: null },
          { id: "outbound", label: "Outbound rules", content: null },
        ]}
      />
      <SpaceBetween size="m">
        <Header
          actions={
            <Button disabled={!interactive} onClick={add}>
              Add rule
            </Button>
          }
        >
          {tab === "outbound" ? "Outbound rules" : "Inbound rules"}
        </Header>
        <SpaceBetween direction="horizontal" size="s">
          <FormField label="Type">
            <Select
              selectedOption={{ label: type, value: type }}
              options={["SSH", "HTTP", "HTTPS", "Custom TCP"].map((t) => ({
                label: t,
                value: t,
              }))}
              onChange={({ detail }) => {
                const v = detail.selectedOption.value || type;
                setType(v);
                if (v === "HTTP") setPort("80");
                if (v === "HTTPS") setPort("443");
                if (v === "SSH") setPort("22");
              }}
            />
          </FormField>
          <FormField label="Port">
            <Input value={port} onChange={({ detail }) => setPort(detail.value)} />
          </FormField>
          <FormField label="Source">
            <Input value={source} onChange={({ detail }) => setSource(detail.value)} />
          </FormField>
        </SpaceBetween>
        <Table
          columnDefinitions={[
            { id: "type", header: "Type", cell: (r) => r.type },
            { id: "proto", header: "Protocol", cell: (r) => r.protocol },
            { id: "port", header: "Port range", cell: (r) => r.port },
            { id: "src", header: "Source", cell: (r) => r.source },
          ]}
          items={items}
        />
      </SpaceBetween>
    </SpaceBetween>
  );
}

function IgwPage() {
  const igws = useAccountStore((s) => s.igws);
  const vpcs = useAccountStore((s) => s.vpcs);
  const createIgw = useAccountStore((s) => s.createIgw);
  const attachIgw = useAccountStore((s) => s.attachIgw);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<(typeof igws)[0][]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [name, setName] = useState("");
  const [attachVpc, setAttachVpc] = useState(vpcs[0]?.id || "");

  const create = () => {
    if (!interactive || !name.trim()) return;
    markClick("create-igw");
    createIgw(name.trim());
    setShowCreate(false);
    setName("");
  };

  const attach = () => {
    const igw = selected[0];
    if (!interactive || !igw || !attachVpc) return;
    markClick("attach-igw");
    attachIgw(igw.id, attachVpc);
    setShowAttach(false);
  };

  return (
    <SpaceBetween size="l">
      <Table
        variant="full-page"
        selectionType="single"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${igws.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={!interactive || selected.length !== 1 || !!selected[0]?.vpc}
                  onClick={() => setShowAttach(true)}
                >
                  Attach to VPC
                </Button>
                <Button
                  variant="primary"
                  disabled={!interactive}
                  onClick={() => setShowCreate((v) => !v)}
                >
                  Create internet gateway
                </Button>
              </SpaceBetween>
            }
          >
            Internet gateways
          </Header>
        }
        columnDefinitions={[
          { id: "id", header: "Internet gateway ID", cell: (g) => g.id },
          { id: "name", header: "Name", cell: (g) => g.name },
          { id: "state", header: "State", cell: (g) => g.state },
          { id: "vpc", header: "VPC", cell: (g) => g.vpc || "—" },
        ]}
        items={igws}
      />
      {showCreate && (
        <Container header={<Header variant="h2">Create internet gateway</Header>}>
          <SpaceBetween size="m">
            <FormField label="Name tag">
              <Input
                value={name}
                disabled={!interactive}
                onChange={({ detail }) => setName(detail.value)}
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                disabled={!interactive || !name.trim()}
                onClick={create}
              >
                Create internet gateway
              </Button>
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
            </SpaceBetween>
          </SpaceBetween>
        </Container>
      )}
      {showAttach && selected[0] && (
        <Container
          header={
            <Header variant="h2" description={selected[0].id}>
              Attach to VPC
            </Header>
          }
        >
          <SpaceBetween size="m">
            <FormField label="VPC">
              <Select
                selectedOption={
                  attachVpc
                    ? {
                        label: vpcs.find((v) => v.id === attachVpc)?.name
                          ? `${vpcs.find((v) => v.id === attachVpc)!.name} (${attachVpc})`
                          : attachVpc,
                        value: attachVpc,
                      }
                    : null
                }
                options={vpcs.map((v) => ({
                  label: `${v.name} (${v.id})`,
                  value: v.id,
                }))}
                onChange={({ detail }) =>
                  setAttachVpc(detail.selectedOption.value || "")
                }
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                disabled={!interactive || !attachVpc}
                onClick={attach}
              >
                Attach
              </Button>
              <Button onClick={() => setShowAttach(false)}>Cancel</Button>
            </SpaceBetween>
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}

function RtList() {
  const tables = useAccountStore((s) => s.route_tables);
  const navigate = useAccountStore((s) => s.navigate);
  const interactive = useAccountStore((s) => s.interactive);
  const [selected, setSelected] = useState<RtType[]>([]);

  const active = selected[0] || null;

  return (
    <div data-action-id="NAV:vpc-route-tables">
      <SpaceBetween size="l">
        <Table
          variant="full-page"
          stickyHeader
          selectionType="single"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          header={
            <Header variant="awsui-h1-sticky" counter={`(${tables.length})`}>
              Route tables
            </Header>
          }
          columnDefinitions={[
            { id: "name", header: "Name", cell: (r) => r.name },
            {
              id: "id",
              header: "Route table ID",
              cell: (r) => (
                <Button
                  variant="inline-link"
                  disabled={!interactive}
                  onClick={() => {
                    setSelected([r]);
                    navigate("vpc", "rt-detail", r.id);
                  }}
                >
                  {r.id}
                </Button>
              ),
            },
            { id: "vpc", header: "VPC", cell: (r) => r.vpc },
            { id: "main", header: "Main", cell: (r) => (r.main ? "Yes" : "No") },
            {
              id: "assoc",
              header: "Explicit subnet associations",
              cell: (r) =>
                `${r.associated_subnet_ids?.length ?? 0} subnet${
                  (r.associated_subnet_ids?.length ?? 0) === 1 ? "" : "s"
                }`,
            },
          ]}
          items={tables}
        />

        {active && (
          <Container
            header={
              <Header variant="h2" description={active.id}>
                {active.name}
              </Header>
            }
          >
            <Tabs
              tabs={[
                {
                  id: "routes",
                  label: "Routes",
                  content: (
                    <SpaceBetween size="s">
                      <div data-action-id="HIGHLIGHT:routes-table">
                        <Table
                          columnDefinitions={[
                            {
                              id: "dest",
                              header: "Destination",
                              cell: (r) => r.destination,
                            },
                            { id: "tgt", header: "Target", cell: (r) => r.target },
                            {
                              id: "st",
                              header: "Status",
                              cell: (r) => (
                                <StatusIndicator type="success">
                                  {r.status === "active" ? "Active" : r.status}
                                </StatusIndicator>
                              ),
                            },
                            {
                              id: "prop",
                              header: "Propagated",
                              cell: (r) => (r.propagated ? "Yes" : "No"),
                            },
                          ]}
                          items={active.routes}
                        />
                      </div>
                      <Button
                        disabled={!interactive}
                        onClick={() => navigate("vpc", "rt-edit", active.id)}
                      >
                        <span data-action-id="CLICK:btn-edit-routes">Edit routes</span>
                      </Button>
                    </SpaceBetween>
                  ),
                },
                {
                  id: "assoc",
                  label: "Subnet associations",
                  content: (
                    <Box>
                      {(active.associated_subnet_ids || []).length
                        ? active.associated_subnet_ids!.join(", ")
                        : "No explicit subnet associations"}
                    </Box>
                  ),
                },
                {
                  id: "prop",
                  label: "Route propagation",
                  content: (
                    <Box color="text-body-secondary">
                      No BGP / Virtual private gateway propagation configured.
                    </Box>
                  ),
                },
                {
                  id: "tags",
                  label: "Tags",
                  content: (
                    <Box color="text-body-secondary">No tags associated with this resource.</Box>
                  ),
                },
              ]}
            />
          </Container>
        )}
      </SpaceBetween>
    </div>
  );
}

function RtDetail() {
  const id = useAccountStore((s) => s.route.selectedId);
  const rt = useAccountStore((s) => s.route_tables.find((t) => t.id === id));
  const navigate = useAccountStore((s) => s.navigate);
  const interactive = useAccountStore((s) => s.interactive);

  if (!rt) return <Alert type="error">Route table not found.</Alert>;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description={rt.id}
        actions={
          <Button
            disabled={!interactive}
            onClick={() => navigate("vpc", "rt-edit", rt.id)}
          >
            <span data-action-id="CLICK:btn-edit-routes">Edit routes</span>
          </Button>
        }
      >
        {rt.name}
      </Header>
      <div data-action-id="HIGHLIGHT:routes-table">
        <Table
          columnDefinitions={[
            { id: "dest", header: "Destination", cell: (r) => r.destination },
            { id: "tgt", header: "Target", cell: (r) => r.target },
            {
              id: "st",
              header: "Status",
              cell: (r) => (
                <StatusIndicator type="success">
                  {r.status === "active" ? "Active" : r.status}
                </StatusIndicator>
              ),
            },
            {
              id: "prop",
              header: "Propagated",
              cell: (r) => (r.propagated ? "Yes" : "No"),
            },
          ]}
          items={rt.routes}
        />
      </div>
    </SpaceBetween>
  );
}

function RtEditRoutes() {
  const id = useAccountStore((s) => s.route.selectedId);
  const rt = useAccountStore((s) => s.route_tables.find((t) => t.id === id));
  const igws = useAccountStore((s) => s.igws);
  const setRoutes = useAccountStore((s) => s.setRoutes);
  const navigate = useAccountStore((s) => s.navigate);
  const interactive = useAccountStore((s) => s.interactive);
  const [draft, setDraft] = useState<
    { destination: string; target: string; status: string; propagated?: boolean }[]
  >([]);

  useEffect(() => {
    if (rt) {
      setDraft(rt.routes.map((r) => ({ ...r, propagated: r.propagated ?? false })));
    }
  }, [rt?.id]);

  if (!rt) return <Alert type="error">Route table not found.</Alert>;

  const targets = [
    { label: "local", value: "local" },
    ...igws.map((g) => ({ label: `Internet Gateway · ${g.id}`, value: g.id })),
    { label: "NAT Gateway (simulated)", value: "nat-0simulated" },
  ];

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description={rt.id}>
        Edit routes · {rt.name}
      </Header>
      {draft.map((rule, idx) => (
        <SpaceBetween key={idx} direction="horizontal" size="xs">
          <FormField label="Destination">
            <span data-action-id="FILL:route-destination">
              <Input
                value={rule.destination}
                disabled={!interactive}
                onChange={({ detail }) => {
                  const next = [...draft];
                  next[idx] = { ...rule, destination: detail.value };
                  setDraft(next);
                }}
              />
            </span>
          </FormField>
          <FormField label="Target">
            <Select
              selectedOption={{ label: rule.target, value: rule.target }}
              options={targets}
              onChange={({ detail }) => {
                const next = [...draft];
                next[idx] = {
                  ...rule,
                  target: detail.selectedOption.value || rule.target,
                };
                setDraft(next);
              }}
            />
          </FormField>
          <Button
            disabled={rule.target === "local"}
            onClick={() => setDraft((d) => d.filter((_, i) => i !== idx))}
          >
            Remove
          </Button>
        </SpaceBetween>
      ))}
      <Button
        onClick={() =>
          setDraft((d) => [
            ...d,
            {
              destination: "0.0.0.0/0",
              target: igws[0]?.id || "igw-",
              status: "active",
              propagated: false,
            },
          ])
        }
      >
        Add route
      </Button>
      <SpaceBetween direction="horizontal" size="xs">
        <Button onClick={() => navigate("vpc", "route-tables")}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!interactive}
          onClick={() => {
            setRoutes(rt.id, draft);
            navigate("vpc", "route-tables");
          }}
        >
          <span data-action-id="CLICK:btn-save-routes">Save changes</span>
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
