import { useState, useMemo, useCallback } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Container from "@cloudscape-design/components/container";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Tabs from "@cloudscape-design/components/tabs";
import Box from "@cloudscape-design/components/box";
import Badge from "@cloudscape-design/components/badge";
import Modal from "@cloudscape-design/components/modal";
import Alert from "@cloudscape-design/components/alert";
import { useAccountStore } from "../store";
import type { Ec2Instance } from "../types";

function stateIndicator(state: Ec2Instance["state"]) {
  if (state === "running") return <StatusIndicator type="success">running</StatusIndicator>;
  if (state === "stopped") return <StatusIndicator type="error">stopped</StatusIndicator>;
  if (state === "pending") return <StatusIndicator type="pending">pending</StatusIndicator>;
  return <StatusIndicator type="stopped">terminated</StatusIndicator>;
}

export function Ec2Service() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "dashboard") return <Ec2Dashboard />;
  if (page === "launch") return <LaunchInstance />;
  if (page === "asg") return <AsgList />;
  if (page === "load-balancers") return <LbList />;
  return <InstancesList />;
}

/** Lightweight EC2 list for Ren screen-share — avoids Cloudscape Table update loops. */
function LearnInstancesList() {
  const region = useAccountStore((s) => s.identity.region);
  const allInstances = useAccountStore((s) => s.instances);
  const instances = useMemo(
    () => allInstances.filter((i) => i.region === region),
    [allInstances, region]
  );
  const total = allInstances.length;

  return (
    <div data-console-target="ec2-instances-list" className="ec2-instances-shell">
      <div className="aws-learn-ec2-header">
        <h1 className="aws-learn-ec2-title">Instances ({instances.length})</h1>
        <p className="aws-learn-ec2-desc">
          Instances · {region}. Changing Region hides instances in other Regions — they
          are not deleted.
        </p>
      </div>
      {instances.length === 0 ? (
        <div data-console-target="ec2-instances-empty" className="aws-learn-ec2-empty">
          <strong>No instances found</strong>
          <p>
            You are viewing <b>{region}</b>. {total} instance(s) exist in other Regions
            and may still be billing — they are not visible here.
          </p>
        </div>
      ) : (
        <div className="aws-learn-ec2-table-wrap">
          <table className="aws-learn-ec2-table">
            <thead>
              <tr>
                <th>Instance ID</th>
                <th>Name</th>
                <th>Instance state</th>
                <th>Instance type</th>
                <th>Availability Zone</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => (
                <tr key={inst.id}>
                  <td>{inst.id}</td>
                  <td>{inst.name}</td>
                  <td>{inst.state}</td>
                  <td>{inst.type}</td>
                  <td>{inst.az}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <span data-console-target="launch-instance" className="sr-only" aria-hidden />
    </div>
  );
}

function InstancesList() {
  const interactive = useAccountStore((s) => s.interactive);
  if (!interactive) return <LearnInstancesList />;
  return <InteractiveInstancesList />;
}

function InteractiveInstancesList() {
  const region = useAccountStore((s) => s.identity.region);
  const all = useAccountStore((s) => s.instances);
  const instances = useMemo(
    () => all.filter((i) => i.region === region),
    [all, region]
  );
  const navigate = useAccountStore((s) => s.navigate);
  const setInstanceState = useAccountStore((s) => s.setInstanceState);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<Ec2Instance[]>([]);
  const [connectTarget, setConnectTarget] = useState<Ec2Instance | null>(null);

  const onSelectionChange = useCallback(
    ({ detail }: { detail: { selectedItems: Ec2Instance[] } }) => {
      setSelected((prev) => {
        const next = detail.selectedItems;
        if (
          prev.length === next.length &&
          prev.every((row, i) => row.id === next[i]?.id)
        ) {
          return prev;
        }
        return next;
      });
    },
    []
  );

  const emptySlot = useMemo(
    () => (
      <div data-console-target="ec2-instances-empty">
        <Box textAlign="center" padding="l">
          <Box variant="strong">No instances found</Box>
          <Box color="text-body-secondary" padding={{ top: "s" }}>
            You are viewing <b>{region}</b>. {all.length} instance(s) exist in other
            Regions and may still be billing — they are not visible here.
          </Box>
        </Box>
      </div>
    ),
    [region, all.length]
  );

  return (
    <div data-console-target="ec2-instances-list" className="ec2-instances-shell">
      <Table
        variant="embedded"
        stickyHeader={false}
        selectionType="multi"
        selectedItems={selected}
        onSelectionChange={onSelectionChange}
        header={
          <Header
            variant="h1"
            counter={`(${instances.length})`}
            description={`Instances · ${region}. Changing Region hides instances in other Regions — they are not deleted.`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <ButtonDropdown
                  disabled={!interactive || selected.length !== 1}
                  items={[
                    { id: "start", text: "Start instance" },
                    { id: "stop", text: "Stop instance" },
                    { id: "terminate", text: "Terminate instance" },
                    { id: "connect", text: "Connect" },
                  ]}
                  onItemClick={({ detail }) => {
                    const inst = selected[0];
                    if (!inst) return;
                    if (detail.id === "start") setInstanceState(inst.id, "running");
                    if (detail.id === "stop") setInstanceState(inst.id, "stopped");
                    if (detail.id === "terminate") setInstanceState(inst.id, "terminated");
                    if (detail.id === "connect") setConnectTarget(inst);
                  }}
                >
                  Instance state
                </ButtonDropdown>
                <span data-console-target="launch-instance">
                  <Button
                    variant="primary"
                    disabled={!interactive}
                    onClick={() => {
                      markClick("launch-instance");
                      navigate("ec2", "launch");
                    }}
                  >
                    Launch instances
                  </Button>
                </span>
              </SpaceBetween>
            }
          >
            Instances
          </Header>
        }
        columnDefinitions={[
          { id: "id", header: "Instance ID", cell: (i) => i.id },
          { id: "name", header: "Name", cell: (i) => i.name },
          { id: "state", header: "Instance state", cell: (i) => stateIndicator(i.state) },
          { id: "type", header: "Instance type", cell: (i) => i.type },
          {
            id: "check",
            header: "Status check",
            cell: (i) =>
              i.status_check === "ok" ? (
                <StatusIndicator type="success">2/2 checks passed</StatusIndicator>
              ) : (
                <StatusIndicator type="pending">Initializing</StatusIndicator>
              ),
          },
          { id: "az", header: "Availability Zone", cell: (i) => i.az },
          { id: "pub", header: "Public IPv4", cell: (i) => i.public_ip || "—" },
          { id: "priv", header: "Private IPv4", cell: (i) => i.private_ip },
        ]}
        items={instances}
        empty={emptySlot}
      />
      <Modal
        visible={!!connectTarget}
        onDismiss={() => setConnectTarget(null)}
        header={`Connect to instance ${connectTarget?.id || ""}`}
        footer={
          <Box float="right">
            <Button variant="primary" onClick={() => setConnectTarget(null)}>
              Close
            </Button>
          </Box>
        }
      >
        {connectTarget && (
          <SpaceBetween size="m">
            <Alert type="info">
              Simulated connection instructions for {connectTarget.name} (
              {connectTarget.id}).
            </Alert>
            <Box variant="h3">EC2 Instance Connect / SSH</Box>
            <Box>
              <code>
                ssh -i &quot;freshbite-prod-key.pem&quot; ec2-user@
                {connectTarget.public_ip || connectTarget.private_ip}
              </code>
            </Box>
            <Box variant="h3">Session Manager</Box>
            <Box color="text-body-secondary">
              Open AWS Systems Manager → Session Manager → Start session, then select{" "}
              {connectTarget.id}. Ensure the instance profile allows{" "}
              <code>ssm:StartSession</code>.
            </Box>
          </SpaceBetween>
        )}
      </Modal>
    </div>
  );
}

function Ec2Dashboard() {
  const region = useAccountStore((s) => s.identity.region);
  const allInstances = useAccountStore((s) => s.instances);
  const instances = useMemo(
    () => allInstances.filter((i) => i.region === region),
    [allInstances, region]
  );
  const running = instances.filter((i) => i.state === "running").length;
  const stopped = instances.filter((i) => i.state === "stopped").length;
  const navigate = useAccountStore((s) => s.navigate);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description={`Resources in ${region}`}>
        EC2 Dashboard
      </Header>
      <ColumnLayout columns={2}>
        <Container
          header={<Header variant="h2">Resources</Header>}
        >
          <SpaceBetween size="s">
            <Box>
              Running instances{" "}
              <Button variant="inline-link" onClick={() => navigate("ec2", "instances")}>
                {running}
              </Button>
            </Box>
            <Box>Stopped instances {stopped}</Box>
            <Box>
              Auto Scaling groups{" "}
              <Button variant="inline-link" onClick={() => navigate("ec2", "asg")}>
                {useAccountStore.getState().asgs.length}
              </Button>
            </Box>
          </SpaceBetween>
        </Container>
        <Container header={<Header variant="h2">Launch instance</Header>}>
          <Box padding={{ bottom: "s" }} color="text-body-secondary">
            Launch a virtual server. A key pair and security group are required to connect.
          </Box>
          <span data-console-target="launch-instance">
            <Button
              variant="primary"
              disabled={!interactive}
              onClick={() => {
                markClick("launch-instance");
                navigate("ec2", "launch");
              }}
            >
              Launch instance
            </Button>
          </span>
        </Container>
      </ColumnLayout>
    </SpaceBetween>
  );
}

function LaunchInstance() {
  const navigate = useAccountStore((s) => s.navigate);
  const launchInstance = useAccountStore((s) => s.launchInstance);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const vpcs = useAccountStore((s) => s.vpcs);
  const subnets = useAccountStore((s) => s.subnets);
  const sgs = useAccountStore((s) => s.security_groups);
  const region = useAccountStore((s) => s.identity.region);

  const [name, setName] = useState("");
  const [ami, setAmi] = useState("Amazon Linux");
  const [type, setType] = useState("t2.micro");
  const [key, setKey] = useState("freshbite-prod-key");
  const [vpc, setVpc] = useState(vpcs[0]?.id || "");
  const [subnet, setSubnet] = useState(subnets[0]?.id || "");
  const [sg, setSg] = useState(sgs[0]?.id || "");
  const [storage, setStorage] = useState("8");

  return (
    <ColumnLayout columns={2} variant="text-grid">
      <SpaceBetween size="l">
        <Header variant="h1">Launch an instance</Header>
        <Container header={<Header variant="h2">Name and tags</Header>}>
          <FormField label="Name">
            <span data-console-target="instance-name-input">
              <Input
                value={name}
                disabled={!interactive}
                onChange={({ detail }) => setName(detail.value)}
                placeholder="freshbite-prod-api-02"
              />
            </span>
          </FormField>
        </Container>
        <Container header={<Header variant="h2">Application and OS Images (Amazon Machine Image)</Header>}>
          <Tabs
            activeTabId={ami}
            onChange={({ detail }) => setAmi(detail.activeTabId)}
            tabs={["Amazon Linux", "macOS", "Ubuntu", "Windows", "RHEL"].map((t) => ({
              id: t,
              label: t,
              content: (
                <Box>
                  Quick Start · {t} {t === "Amazon Linux" ? "2023 AMI · 64-bit (x86)" : "AMI"}
                </Box>
              ),
            }))}
          />
        </Container>
        <Container header={<Header variant="h2">Instance type</Header>}>
          <Select
            selectedOption={{ label: type, value: type }}
            options={["t2.micro", "t3.micro", "t3.small", "t3.medium"].map((t) => ({
              label: t,
              value: t,
            }))}
            onChange={({ detail }) => setType(detail.selectedOption.value || "t2.micro")}
          />
        </Container>
        <Container header={<Header variant="h2">Key pair (login)</Header>}>
          <Select
            selectedOption={{ label: key, value: key }}
            options={[
              { label: "freshbite-prod-key", value: "freshbite-prod-key" },
              { label: "Proceed without a key pair", value: "none" },
            ]}
            onChange={({ detail }) => setKey(detail.selectedOption.value || key)}
          />
        </Container>
        <Container header={<Header variant="h2">Network settings</Header>}>
          <SpaceBetween size="m">
            <FormField label="VPC">
              <Select
                selectedOption={{ label: vpc, value: vpc }}
                options={vpcs.map((v) => ({ label: `${v.name} (${v.id})`, value: v.id }))}
                onChange={({ detail }) => setVpc(detail.selectedOption.value || vpc)}
              />
            </FormField>
            <FormField label="Subnet">
              <Select
                selectedOption={{ label: subnet, value: subnet }}
                options={subnets.map((s) => ({ label: `${s.name} (${s.az})`, value: s.id }))}
                onChange={({ detail }) => setSubnet(detail.selectedOption.value || subnet)}
              />
            </FormField>
            <FormField label="Security group">
              <Select
                selectedOption={{ label: sg, value: sg }}
                options={sgs.map((g) => ({ label: `${g.name} (${g.id})`, value: g.id }))}
                onChange={({ detail }) => setSg(detail.selectedOption.value || sg)}
              />
            </FormField>
          </SpaceBetween>
        </Container>
        <Container header={<Header variant="h2">Configure storage</Header>}>
          <FormField label="Root volume (gp3) GiB">
            <Input value={storage} onChange={({ detail }) => setStorage(detail.value)} />
          </FormField>
        </Container>
        <span data-console-target="launch-instance-submit">
          <Button
            variant="primary"
            disabled={!interactive || !name.trim()}
            onClick={() => {
              markClick("launch-instance-submit");
              launchInstance(name.trim(), type, subnet);
            }}
          >
            Launch instance
          </Button>
        </span>
        <Button onClick={() => navigate("ec2", "instances")}>Cancel</Button>
      </SpaceBetween>
      <Container header={<Header variant="h2">Summary</Header>}>
        <SpaceBetween size="s">
          <Box>Number of instances: 1</Box>
          <Box>AMI: {ami}</Box>
          <Box>Instance type: {type}</Box>
          <Box>Region: {region}</Box>
          <Box>Storage: {storage} GiB gp3</Box>
          <Box variant="strong">Estimated cost: ~$0.012 / hour (On-Demand)</Box>
        </SpaceBetween>
      </Container>
    </ColumnLayout>
  );
}

function AsgList() {
  const asgs = useAccountStore((s) => s.asgs);
  const createAsg = useAccountStore((s) => s.createAsg);
  const updateAsgDesired = useAccountStore((s) => s.updateAsgDesired);
  const interactive = useAccountStore((s) => s.interactive);
  const [selected, setSelected] = useState<(typeof asgs)[0][]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desired, setDesired] = useState("2");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("4");
  const [editDesired, setEditDesired] = useState("");

  return (
    <SpaceBetween size="l">
      {showCreate && (
        <SpaceBetween size="s">
          <FormField label="Name">
            <Input
              value={name}
              disabled={!interactive}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="e.g. web-asg"
            />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <FormField label="Desired">
              <Input
                value={desired}
                disabled={!interactive}
                onChange={({ detail }) => setDesired(detail.value)}
              />
            </FormField>
            <FormField label="Min">
              <Input
                value={min}
                disabled={!interactive}
                onChange={({ detail }) => setMin(detail.value)}
              />
            </FormField>
            <FormField label="Max">
              <Input
                value={max}
                disabled={!interactive}
                onChange={({ detail }) => setMax(detail.value)}
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              disabled={!interactive || !name.trim()}
              onClick={() => {
                createAsg(
                  name.trim(),
                  Number(desired) || 1,
                  Number(min) || 0,
                  Number(max) || 1
                );
                setName("");
                setShowCreate(false);
              }}
            >
              Create Auto Scaling group
            </Button>
            <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          </SpaceBetween>
        </SpaceBetween>
      )}
      {selected.length === 1 && (
        <SpaceBetween direction="horizontal" size="xs">
          <FormField label={`Edit desired capacity (${selected[0].name})`}>
            <Input
              value={editDesired}
              disabled={!interactive}
              onChange={({ detail }) => setEditDesired(detail.value)}
              placeholder={String(selected[0].desired)}
            />
          </FormField>
          <Button
            disabled={!interactive || editDesired === ""}
            onClick={() => {
              updateAsgDesired(selected[0].name, Number(editDesired) || 0);
              setEditDesired("");
            }}
          >
            Update desired
          </Button>
        </SpaceBetween>
      )}
      <Table
        variant="full-page"
        selectionType="single"
        selectedItems={selected}
        onSelectionChange={({ detail }) => {
          setSelected(detail.selectedItems);
          setEditDesired(
            detail.selectedItems[0]
              ? String(detail.selectedItems[0].desired)
              : ""
          );
        }}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${asgs.length})`}
            actions={
              <Button
                variant="primary"
                disabled={!interactive}
                onClick={() => setShowCreate(true)}
              >
                Create Auto Scaling group
              </Button>
            }
          >
            Auto Scaling groups
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Name", cell: (a) => a.name },
          { id: "n", header: "Instances", cell: (a) => String(a.instances) },
          { id: "min", header: "Min", cell: (a) => String(a.min) },
          { id: "max", header: "Max", cell: (a) => String(a.max) },
          { id: "des", header: "Desired", cell: (a) => String(a.desired) },
          { id: "st", header: "Status", cell: (a) => a.status },
          { id: "hc", header: "Health check", cell: (a) => a.health_check },
        ]}
        items={asgs}
      />
    </SpaceBetween>
  );
}

function LbList() {
  const lbs = useAccountStore((s) => s.load_balancers);
  const createLoadBalancer = useAccountStore((s) => s.createLoadBalancer);
  const interactive = useAccountStore((s) => s.interactive);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"application" | "network">("application");

  return (
    <SpaceBetween size="l">
      {showCreate && (
        <SpaceBetween size="s">
          <FormField label="Load balancer name">
            <Input
              value={name}
              disabled={!interactive}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="e.g. freshbite-alb"
            />
          </FormField>
          <FormField label="Type">
            <Select
              selectedOption={{
                label: type === "application" ? "Application" : "Network",
                value: type,
              }}
              options={[
                { label: "Application", value: "application" },
                { label: "Network", value: "network" },
              ]}
              onChange={({ detail }) =>
                setType(
                  (detail.selectedOption.value as "application" | "network") ||
                    "application"
                )
              }
            />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              disabled={!interactive || !name.trim()}
              onClick={() => {
                createLoadBalancer(name.trim(), type);
                setName("");
                setShowCreate(false);
              }}
            >
              Create load balancer
            </Button>
            <Button onClick={() => setShowCreate(false)}>Cancel</Button>
          </SpaceBetween>
        </SpaceBetween>
      )}
      <Table
        variant="full-page"
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${lbs.length})`}
            actions={
              <Button
                variant="primary"
                disabled={!interactive}
                onClick={() => setShowCreate(true)}
              >
                Create load balancer
              </Button>
            }
          >
            Load balancers
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Name", cell: (l) => l.name },
          { id: "dns", header: "DNS name", cell: (l) => l.dns },
          { id: "state", header: "State", cell: (l) => l.state },
          {
            id: "type",
            header: "Type",
            cell: (l) => (
              <Badge color={l.type === "application" ? "blue" : "grey"}>
                {l.type === "application" ? "ALB" : "NLB"}
              </Badge>
            ),
          },
          { id: "vpc", header: "VPC", cell: (l) => l.vpc },
        ]}
        items={lbs}
      />
    </SpaceBetween>
  );
}
