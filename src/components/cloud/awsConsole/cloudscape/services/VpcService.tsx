import { useMemo, useState } from "react";
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
import { useAccountStore } from "../store";

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
  return <VpcsPage />;
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
          <span data-console-target="create-vpc">
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
  return (
    <Table
      variant="full-page"
      header={
        <Header
          variant="awsui-h1-sticky"
          counter={`(${vpcs.length})`}
          actions={
            <span data-console-target="create-vpc">
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
          Your VPCs
        </Header>
      }
      columnDefinitions={[
        { id: "id", header: "VPC ID", cell: (v) => v.id },
        { id: "name", header: "Name", cell: (v) => v.name },
        {
          id: "state",
          header: "State",
          cell: (v) => <StatusIndicator type="success">{v.state}</StatusIndicator>,
        },
        { id: "cidr", header: "IPv4 CIDR", cell: (v) => v.cidr },
        { id: "ipv6", header: "IPv6 CIDR", cell: (v) => v.ipv6 || "—" },
        { id: "dhcp", header: "DHCP options set", cell: (v) => v.dhcp },
        { id: "rt", header: "Main route table", cell: (v) => v.main_route_table },
      ]}
      items={vpcs}
    />
  );
}

/** Real AWS Create VPC — VPC and more + live Preview pane. */
function CreateVpcWizard() {
  const navigate = useAccountStore((s) => s.navigate);
  const createVpc = useAccountStore((s) => s.createVpc);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const region = useAccountStore((s) => s.identity.region);

  const [mode, setMode] = useState<"more" | "only">("more");
  const [autoName, setAutoName] = useState(true);
  const [name, setName] = useState("project-vpc");
  const [cidr, setCidr] = useState("10.0.0.0/16");
  const [tenancy, setTenancy] = useState<"default" | "dedicated">("default");
  const [azCount, setAzCount] = useState<1 | 2 | 3>(2);
  const [publicPerAz, setPublicPerAz] = useState(1);
  const [privatePerAz, setPrivatePerAz] = useState(1);
  const [nat, setNat] = useState<"none" | "one" | "per-az">("none");
  const [dnsHostnames, setDnsHostnames] = useState(true);
  const [dnsSupport, setDnsSupport] = useState(true);

  const preview = useMemo(() => {
    const azs = ["a", "b", "c"].slice(0, azCount).map((l) => `${region}${l}`);
    return {
      azs,
      publicCount: azCount * publicPerAz,
      privateCount: azCount * privatePerAz,
      hasIgw: mode === "more",
      natCount:
        mode !== "more" || nat === "none" ? 0 : nat === "one" ? 1 : azCount,
    };
  }, [azCount, publicPerAz, privatePerAz, nat, mode, region]);

  const submit = () => {
    if (!interactive || !name.trim() || !cidr.trim()) return;
    markClick("create-vpc-submit");
    if (mode === "only") {
      createVpc({
        name: name.trim(),
        cidr: cidr.trim(),
        tenancy,
        azCount: 1,
        publicPerAz: 0,
        privatePerAz: 0,
        nat: "none",
        dnsHostnames,
        dnsSupport,
      });
      return;
    }
    createVpc({
      name: name.trim(),
      cidr: cidr.trim(),
      tenancy,
      azCount,
      publicPerAz,
      privatePerAz,
      nat,
      dnsHostnames,
      dnsSupport,
    });
  };

  return (
    <div data-console-target="create-vpc-form">
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Create a VPC with optional subnets, Internet gateway, NAT gateways, and DNS options."
        >
          Create VPC
        </Header>

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
                  label="Name tag"
                  description="Creates a Name tag on the VPC and related resources."
                >
                  <Input
                    value={name}
                    disabled={!interactive}
                    onChange={({ detail }) => setName(detail.value)}
                    placeholder="project-vpc"
                  />
                </FormField>
                <FormField
                  label="IPv4 CIDR block"
                  description="A VPC must have an IPv4 address range (for example 10.0.0.0/16)."
                >
                  <Input
                    value={cidr}
                    disabled={!interactive}
                    onChange={({ detail }) => setCidr(detail.value)}
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
                      { value: "1", label: "1" },
                      { value: "2", label: "2" },
                      { value: "3", label: "3" },
                    ]}
                  />
                  <Box color="text-body-secondary" padding={{ top: "s" }}>
                    AZs: {preview.azs.join(", ")}
                  </Box>
                </Container>

                <Container
                  header={
                    <Header variant="h2" description="Public and private subnets per AZ">
                      3 · Subnets per AZ
                    </Header>
                  }
                >
                  <ColumnLayout columns={2}>
                    <FormField label="Number of public subnets">
                      <Select
                        selectedOption={{
                          label: String(publicPerAz),
                          value: String(publicPerAz),
                        }}
                        options={[0, 1, 2].map((n) => ({
                          label: String(n),
                          value: String(n),
                        }))}
                        onChange={({ detail }) =>
                          setPublicPerAz(Number(detail.selectedOption.value || 1))
                        }
                      />
                    </FormField>
                    <FormField label="Number of private subnets">
                      <Select
                        selectedOption={{
                          label: String(privatePerAz),
                          value: String(privatePerAz),
                        }}
                        options={[0, 1, 2].map((n) => ({
                          label: String(n),
                          value: String(n),
                        }))}
                        onChange={({ detail }) =>
                          setPrivatePerAz(Number(detail.selectedOption.value || 1))
                        }
                      />
                    </FormField>
                  </ColumnLayout>
                  <Box color="text-body-secondary" padding={{ top: "s" }}>
                    Total: {preview.publicCount} public · {preview.privateCount} private
                  </Box>
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
                </Container>

                <Container header={<Header variant="h2">5 · DNS options</Header>}>
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
              <span data-console-target="create-vpc-submit">
                <Button
                  variant="primary"
                  disabled={!interactive || !name.trim() || !cidr.trim()}
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
            <VpcPreviewMap
              name={name || "VPC"}
              cidr={cidr}
              azs={preview.azs}
              publicPerAz={mode === "more" ? publicPerAz : 0}
              privatePerAz={mode === "more" ? privatePerAz : 0}
              hasIgw={preview.hasIgw}
              natCount={preview.natCount}
            />
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
}: {
  name: string;
  cidr: string;
  azs: string[];
  publicPerAz: number;
  privatePerAz: number;
  hasIgw: boolean;
  natCount: number;
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
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const region = useAccountStore((s) => s.identity.region);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [vpc, setVpc] = useState(vpcs[0]?.id || "");
  const [cidr, setCidr] = useState("10.0.10.0/24");
  const [az, setAz] = useState(`${region}a`);
  const [publicIp, setPublicIp] = useState(false);

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

  return (
    <SpaceBetween size="l">
      <Table
        variant="full-page"
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${subnets.length})`}
            actions={
              <Button
                variant="primary"
                disabled={!interactive}
                onClick={() => setShowForm((v) => !v)}
              >
                Create subnet
              </Button>
            }
          >
            Subnets
          </Header>
        }
        columnDefinitions={[
          { id: "id", header: "Subnet ID", cell: (s) => s.id },
          { id: "name", header: "Name", cell: (s) => s.name },
          {
            id: "state",
            header: "State",
            cell: (s) =>
              s.public_ip_on_launch ? (
                <Badge color="green">Available</Badge>
              ) : (
                <StatusIndicator type="success">{s.state}</StatusIndicator>
              ),
          },
          { id: "vpc", header: "VPC", cell: (s) => s.vpc },
          { id: "cidr", header: "IPv4 CIDR", cell: (s) => s.cidr },
          { id: "az", header: "Availability Zone", cell: (s) => s.az },
          {
            id: "auto",
            header: "Auto-assign public IPv4",
            cell: (s) => (s.public_ip_on_launch ? "Yes" : "No"),
          },
        ]}
        items={subnets}
      />
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
  return (
    <Table
      variant="full-page"
      header={<Header variant="awsui-h1-sticky">Route tables</Header>}
      columnDefinitions={[
        {
          id: "id",
          header: "Route table ID",
          cell: (r) => (
            <Button variant="inline-link" onClick={() => navigate("vpc", "rt-detail", r.id)}>
              {r.id}
            </Button>
          ),
        },
        { id: "name", header: "Name", cell: (r) => r.name },
        { id: "vpc", header: "VPC", cell: (r) => r.vpc },
        { id: "main", header: "Main", cell: (r) => (r.main ? "Yes" : "No") },
      ]}
      items={tables}
    />
  );
}

function RtDetail() {
  const id = useAccountStore((s) => s.route.selectedId);
  const rt = useAccountStore((s) => s.route_tables.find((t) => t.id === id));
  const addRoute = useAccountStore((s) => s.addRoute);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [destination, setDestination] = useState("0.0.0.0/0");
  const [target, setTarget] = useState("igw-");

  if (!rt) return <Alert type="error">Route table not found.</Alert>;

  const submit = () => {
    if (!interactive || !destination.trim() || !target.trim()) return;
    markClick("add-route");
    addRoute(rt.id, destination.trim(), target.trim());
    setDestination("0.0.0.0/0");
    setTarget("igw-");
  };

  return (
    <SpaceBetween size="l">
      <Header variant="h1">{rt.name}</Header>
      <Tabs
        tabs={[
          {
            id: "routes",
            label: "Routes",
            content: (
              <SpaceBetween size="m">
                <Header
                  actions={
                    <Button
                      disabled={!interactive || !destination.trim() || !target.trim()}
                      onClick={submit}
                    >
                      Add route
                    </Button>
                  }
                >
                  Routes
                </Header>
                <SpaceBetween direction="horizontal" size="s">
                  <FormField label="Destination">
                    <Input
                      value={destination}
                      disabled={!interactive}
                      onChange={({ detail }) => setDestination(detail.value)}
                    />
                  </FormField>
                  <FormField label="Target">
                    <Input
                      value={target}
                      disabled={!interactive}
                      onChange={({ detail }) => setTarget(detail.value)}
                      placeholder="igw-xxxxxxxx"
                    />
                  </FormField>
                </SpaceBetween>
                <Table
                  columnDefinitions={[
                    { id: "dest", header: "Destination", cell: (r) => r.destination },
                    { id: "tgt", header: "Target", cell: (r) => r.target },
                    { id: "st", header: "Status", cell: (r) => r.status },
                  ]}
                  items={rt.routes}
                />
              </SpaceBetween>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
}
