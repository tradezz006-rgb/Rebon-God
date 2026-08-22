import { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Cards from "@cloudscape-design/components/cards";
import Container from "@cloudscape-design/components/container";
import Wizard from "@cloudscape-design/components/wizard";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Textarea from "@cloudscape-design/components/textarea";
import Box from "@cloudscape-design/components/box";
import LineChart from "@cloudscape-design/components/line-chart";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { useAccountStore } from "../store";
import { WIZARD_I18N } from "../ui";

export function CloudWatchService() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "overview" || page === "home") return <CwOverview />;
  if (page === "dashboards") return <Dashboards />;
  if (page === "dashboard-view") return <DashboardView />;
  if (page === "create-alarm") return <CreateAlarm />;
  if (page === "log-groups") return <LogGroups />;
  if (page === "logs-insights") return <LogsInsights />;
  return <Alarms />;
}

function CwOverview() {
  const alarms = useAccountStore((s) => s.alarms);
  const navigate = useAccountStore((s) => s.navigate);
  const byState = {
    ALARM: alarms.filter((a) => a.state === "ALARM").length,
    OK: alarms.filter((a) => a.state === "OK").length,
    INSUFFICIENT_DATA: alarms.filter((a) => a.state === "INSUFFICIENT_DATA").length,
  };
  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="Automatic overview of alarms and metrics in this Region.">
        CloudWatch
      </Header>
      <ColumnLayout columns={3} variant="text-grid">
        <Container header={<Header variant="h2">Alarms by state</Header>}>
          <SpaceBetween size="s">
            <StatusIndicator type="error">ALARM {byState.ALARM}</StatusIndicator>
            <StatusIndicator type="success">OK {byState.OK}</StatusIndicator>
            <StatusIndicator type="stopped">INSUFFICIENT DATA {byState.INSUFFICIENT_DATA}</StatusIndicator>
            <Button onClick={() => navigate("cloudwatch", "alarms")}>View all alarms</Button>
          </SpaceBetween>
        </Container>
        <Container header={<Header variant="h2">Alarms that recently changed state</Header>}>
          {alarms.map((a) => (
            <Box key={a.name} padding={{ bottom: "s" }}>
              {alarmState(a.state)} {a.name}
            </Box>
          ))}
        </Container>
        <Container header={<Header variant="h2">CPUUtilization</Header>}>
          <LineChart
            series={[
              {
                title: "CPU %",
                type: "line",
                data: [
                  { x: new Date("2026-08-18T00:00:00Z"), y: 22 },
                  { x: new Date("2026-08-18T01:00:00Z"), y: 31 },
                  { x: new Date("2026-08-18T02:00:00Z"), y: 28 },
                  { x: new Date("2026-08-18T03:00:00Z"), y: 44 },
                  { x: new Date("2026-08-18T04:00:00Z"), y: 39 },
                ],
              },
            ]}
            xScaleType="time"
            height={180}
            hideFilter
            hideLegend
            ariaLabel="CPU chart"
          />
        </Container>
      </ColumnLayout>
    </SpaceBetween>
  );
}

function alarmState(state: string) {
  if (state === "OK") return <StatusIndicator type="success">OK</StatusIndicator>;
  if (state === "ALARM") return <StatusIndicator type="error">ALARM</StatusIndicator>;
  return <StatusIndicator type="stopped">INSUFFICIENT DATA</StatusIndicator>;
}

function Dashboards() {
  const dashboards = useAccountStore((s) => s.dashboards);
  const navigate = useAccountStore((s) => s.navigate);
  const createDashboard = useAccountStore((s) => s.createDashboard);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);

  return (
    <Cards
      header={
        <Header
          variant="h1"
          actions={
            <Button
              variant="primary"
              disabled={!interactive}
              onClick={() => {
                const name = window.prompt("Dashboard name");
                if (!name?.trim()) return;
                markClick("create-dashboard");
                createDashboard(name.trim());
              }}
            >
              Create dashboard
            </Button>
          }
        >
          Dashboards
        </Header>
      }
      cardDefinition={{
        header: (d) => (
          <Button
            variant="inline-link"
            disabled={!interactive}
            onClick={() => navigate("cloudwatch", "dashboard-view", d.name)}
          >
            {d.name}
          </Button>
        ),
        sections: [{ id: "w", header: "Widgets", content: (d) => String(d.widgets) }],
      }}
      items={dashboards}
      cardsPerRow={[{ cards: 2 }]}
      empty="No dashboards"
    />
  );
}

function DashboardView() {
  const name = useAccountStore((s) => s.route.selectedId) || "FreshBite-Prod-API";
  const addDashboardWidget = useAccountStore((s) => s.addDashboardWidget);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          <Button
            disabled={!interactive}
            onClick={() => {
              markClick("add-widget");
              addDashboardWidget(name);
            }}
          >
            Add widget
          </Button>
        }
      >
        {name}
      </Header>
      <Container header={<Header variant="h2">CPUUtilization</Header>}>
        <LineChart
          series={[
            {
              title: "CPU %",
              type: "line",
              data: [
                { x: new Date("2026-08-18T00:00:00Z"), y: 22 },
                { x: new Date("2026-08-18T01:00:00Z"), y: 31 },
                { x: new Date("2026-08-18T02:00:00Z"), y: 28 },
                { x: new Date("2026-08-18T03:00:00Z"), y: 44 },
                { x: new Date("2026-08-18T04:00:00Z"), y: 39 },
              ],
            },
          ]}
          xScaleType="time"
          xTitle="Time"
          yTitle="Percent"
          height={220}
          hideFilter
          hideLegend
          ariaLabel="CPU chart"
        />
      </Container>
      <Container header={<Header variant="h2">5XX count</Header>}>
        <Box fontSize="display-l" fontWeight="bold">
          14
        </Box>
      </Container>
    </SpaceBetween>
  );
}

function Alarms() {
  const alarms = useAccountStore((s) => s.alarms);
  const navigate = useAccountStore((s) => s.navigate);
  const deleteAlarm = useAccountStore((s) => s.deleteAlarm);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<(typeof alarms)[0][]>([]);

  return (
    <Table
      variant="full-page"
      selectionType="multi"
      selectedItems={selected}
      onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
      header={
        <Header
          variant="awsui-h1-sticky"
          counter={`(${alarms.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                disabled={!interactive || selected.length === 0}
                onClick={() => {
                  selected.forEach((a) => {
                    markClick("delete-alarm");
                    deleteAlarm(a.name);
                  });
                  setSelected([]);
                }}
              >
                Delete
              </Button>
              <Button
                variant="primary"
                disabled={!interactive}
                onClick={() => navigate("cloudwatch", "create-alarm")}
              >
                Create alarm
              </Button>
            </SpaceBetween>
          }
        >
          Alarms
        </Header>
      }
      columnDefinitions={[
        { id: "name", header: "Name", cell: (a) => a.name },
        { id: "state", header: "State", cell: (a) => alarmState(a.state) },
        { id: "cond", header: "Condition", cell: (a) => a.condition },
        { id: "act", header: "Actions", cell: (a) => String(a.actions) },
        { id: "period", header: "Period", cell: (a) => a.period },
        {
          id: "del",
          header: "",
          cell: (a) => (
            <Button
              disabled={!interactive}
              onClick={() => {
                markClick("delete-alarm");
                deleteAlarm(a.name);
                setSelected((prev) => prev.filter((x) => x.name !== a.name));
              }}
            >
              Delete
            </Button>
          ),
        },
      ]}
      items={alarms}
    />
  );
}

function CreateAlarm() {
  const navigate = useAccountStore((s) => s.navigate);
  const createAlarm = useAccountStore((s) => s.createAlarm);
  const [step, setStep] = useState(0);
  const [service, setService] = useState("EC2");
  const [metric, setMetric] = useState("CPUUtilization");
  const [thresholdType, setThresholdType] = useState("static");
  const [cmp, setCmp] = useState("Greater than");
  const [threshold, setThreshold] = useState("80");
  const [datapoints, setDatapoints] = useState("2 of 3");
  const [sns, setSns] = useState("freshbite-ops-alerts");
  const [name, setName] = useState("freshbite-cpu-custom");
  const [desc, setDesc] = useState("");

  return (
    <Wizard
      i18nStrings={WIZARD_I18N}
      activeStepIndex={step}
      submitButtonText="Create alarm"
      onNavigate={({ detail }) => setStep(detail.requestedStepIndex)}
      onCancel={() => navigate("cloudwatch", "alarms")}
      onSubmit={() =>
        createAlarm(name, `${metric} ${cmp} ${threshold} (${datapoints})`)
      }
      steps={[
        {
          title: "Specify metric and conditions",
          content: (
            <SpaceBetween size="m">
              <FormField label="Service">
                <Select
                  selectedOption={{ label: service, value: service }}
                  options={["EC2", "S3", "RDS", "ApplicationELB"].map((s) => ({
                    label: s,
                    value: s,
                  }))}
                  onChange={({ detail }) => setService(detail.selectedOption.value || service)}
                />
              </FormField>
              <FormField label="Namespace">
                <Input value={`AWS/${service}`} disabled />
              </FormField>
              <FormField label="Metric name">
                <Select
                  selectedOption={{ label: metric, value: metric }}
                  options={["CPUUtilization", "NetworkIn", "StatusCheckFailed"].map((m) => ({
                    label: m,
                    value: m,
                  }))}
                  onChange={({ detail }) => setMetric(detail.selectedOption.value || metric)}
                />
              </FormField>
            </SpaceBetween>
          ),
        },
        {
          title: "Conditions",
          content: (
            <SpaceBetween size="m">
              <FormField label="Threshold type">
                <RadioGroup
                  value={thresholdType}
                  items={[
                    { value: "static", label: "Static" },
                    { value: "anomaly", label: "Anomaly detection" },
                  ]}
                  onChange={({ detail }) => setThresholdType(detail.value)}
                />
              </FormField>
              <FormField label="Whenever metric is">
                <Select
                  selectedOption={{ label: cmp, value: cmp }}
                  options={["Greater than", "Less than"].map((c) => ({ label: c, value: c }))}
                  onChange={({ detail }) => setCmp(detail.selectedOption.value || cmp)}
                />
              </FormField>
              <FormField label="than">
                <Input value={threshold} onChange={({ detail }) => setThreshold(detail.value)} />
              </FormField>
              <FormField label="Datapoints to alarm">
                <Input value={datapoints} onChange={({ detail }) => setDatapoints(detail.value)} />
              </FormField>
            </SpaceBetween>
          ),
        },
        {
          title: "Notification",
          content: (
            <FormField label="Send a notification to SNS topic">
              <Input value={sns} onChange={({ detail }) => setSns(detail.value)} />
            </FormField>
          ),
        },
        {
          title: "Name and description",
          content: (
            <SpaceBetween size="m">
              <FormField label="Alarm name">
                <Input value={name} onChange={({ detail }) => setName(detail.value)} />
              </FormField>
              <FormField label="Description">
                <Textarea value={desc} onChange={({ detail }) => setDesc(detail.value)} />
              </FormField>
            </SpaceBetween>
          ),
        },
        {
          title: "Preview and create",
          content: (
            <Box>
              {name}: {metric} {cmp} {threshold} — notify {sns}
            </Box>
          ),
        },
      ]}
    />
  );
}

function LogGroups() {
  const groups = useAccountStore((s) => s.log_groups);
  const createLogGroup = useAccountStore((s) => s.createLogGroup);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);

  return (
    <Table
      variant="full-page"
      header={
        <Header
          variant="awsui-h1-sticky"
          actions={
            <Button
              variant="primary"
              disabled={!interactive}
              onClick={() => {
                const name = window.prompt("Log group name", "/aws/lambda/");
                if (!name?.trim()) return;
                markClick("create-log-group");
                createLogGroup(name.trim());
              }}
            >
              Create log group
            </Button>
          }
        >
          Log groups
        </Header>
      }
      columnDefinitions={[
        { id: "name", header: "Log group", cell: (g) => g.name },
        { id: "ret", header: "Retention", cell: (g) => g.retention },
        { id: "mf", header: "Metric filters", cell: (g) => String(g.metric_filters) },
        { id: "sub", header: "Subscriptions", cell: (g) => String(g.subscriptions) },
      ]}
      items={groups}
    />
  );
}

function LogsInsights() {
  const addLogInsightQuery = useAccountStore((s) => s.addLogInsightQuery);
  const [query, setQuery] = useState(
    "fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20"
  );
  const [ran, setRan] = useState(false);
  const [timeRange, setTimeRange] = useState({ label: "Last 1 hour", value: "1h" });
  return (
    <SpaceBetween size="l">
      <Header variant="h1">Logs Insights</Header>
      <FormField label="Query">
        <Textarea value={query} onChange={({ detail }) => setQuery(detail.value)} rows={8} />
      </FormField>
      <FormField label="Time range">
        <Select
          selectedOption={timeRange}
          options={[
            { label: "Last 1 hour", value: "1h" },
            { label: "Last 3 hours", value: "3h" },
          ]}
          onChange={({ detail }) =>
            setTimeRange({
              label: detail.selectedOption.label || timeRange.label,
              value: detail.selectedOption.value || timeRange.value,
            })
          }
        />
      </FormField>
      <Button
        variant="primary"
        onClick={() => {
          addLogInsightQuery(query);
          setRan(true);
        }}
      >
        Run query
      </Button>
      {ran && (
        <Table
          header={<Header>Results (3) · {timeRange.label}</Header>}
          columnDefinitions={[
            { id: "ts", header: "@timestamp", cell: (r) => r.ts },
            { id: "msg", header: "@message", cell: (r) => r.msg },
          ]}
          items={[
            { ts: "2026-08-18T03:11:02Z", msg: "ERROR upstream 5xx from target i-0a8f31c2e91b44d17" },
            { ts: "2026-08-18T03:10:44Z", msg: "ERROR payment timeout merchant=4421" },
            { ts: "2026-08-18T03:09:18Z", msg: "ERROR redis connection reset" },
          ]}
        />
      )}
    </SpaceBetween>
  );
}
