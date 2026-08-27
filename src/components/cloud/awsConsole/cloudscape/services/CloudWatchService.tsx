import { useMemo, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
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
import Modal from "@cloudscape-design/components/modal";
import Tabs from "@cloudscape-design/components/tabs";
import Checkbox from "@cloudscape-design/components/checkbox";
import Alert from "@cloudscape-design/components/alert";
import { useAccountStore } from "../store";
import { WIZARD_I18N } from "../ui";
import type { CwAlarm, CwWidget } from "../types";

const CPU_SERIES = [
  { x: new Date(Date.now() - 50 * 60_000), y: 42 },
  { x: new Date(Date.now() - 40 * 60_000), y: 55 },
  { x: new Date(Date.now() - 30 * 60_000), y: 61 },
  { x: new Date(Date.now() - 20 * 60_000), y: 73 },
  { x: new Date(Date.now() - 10 * 60_000), y: 68 },
  { x: new Date(), y: 71 },
];

const SNS_TOPICS = [
  {
    label: "rebon-dev-alerts",
    value: "rebon-dev-alerts",
    email: "admin@rebon.io",
  },
  {
    label: "rebon-alerts",
    value: "rebon-alerts",
    email: "ops@rebon.io",
  },
];

function alarmState(state: string) {
  if (state === "OK") return <StatusIndicator type="success">OK</StatusIndicator>;
  if (state === "ALARM") return <StatusIndicator type="error">In alarm</StatusIndicator>;
  return <StatusIndicator type="stopped">Insufficient data</StatusIndicator>;
}

function MetricPreview({
  metric,
  threshold,
}: {
  metric: string;
  threshold: number;
}) {
  return (
    <div data-action-id="HIGHLIGHT:graph-preview-line">
      <LineChart
        series={[
          { title: metric, type: "line", data: CPU_SERIES },
          {
            title: `Threshold (${threshold})`,
            type: "threshold",
            y: threshold,
          },
        ]}
        xDomain={[new Date(Date.now() - 55 * 60_000), new Date(Date.now() + 5 * 60_000)]}
        yDomain={[0, Math.max(100, threshold + 10)]}
        height={220}
        hideFilter
        ariaLabel="Metric preview"
      />
    </div>
  );
}

export function CloudWatchService() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "overview" || page === "home") return <Alarms filterMode="all" />;
  if (page === "dashboards") return <Dashboards />;
  if (page === "dashboard-view") return <DashboardView />;
  if (page === "create-alarm") return <CreateAlarm />;
  if (page === "log-groups") return <LogGroups />;
  if (page === "logs-insights") return <LogsInsights />;
  if (page === "alarms-in-alarm") return <Alarms filterMode="ALARM" />;
  if (page === "alarms-billing") return <CwStub title="Billing alarms" />;
  if (page === "metrics-all" || page === "metrics-explorer")
    return <CwStub title={page === "metrics-explorer" ? "Metrics Explorer" : "All metrics"} />;
  if (page === "events-rules") return <CwStub title="EventBridge Rules" />;
  return <Alarms filterMode="all" />;
}

function CwStub({ title }: { title: string }) {
  return (
    <Box padding="l">
      <Header variant="h1" description="Daily-use focus is Alarms and Dashboards.">
        {title}
      </Header>
      <Box color="text-body-secondary" padding={{ top: "m" }}>
        This console entry is reserved for a later pass.
      </Box>
    </Box>
  );
}

function Dashboards() {
  const dashboards = useAccountStore((s) => s.dashboards);
  const navigate = useAccountStore((s) => s.navigate);
  const createDashboard = useAccountStore((s) => s.createDashboard);
  const deleteDashboard = useAccountStore((s) => s.deleteDashboard);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [showCreate, setShowCreate] = useState(false);
  const [dashName, setDashName] = useState("Rebon-Main");
  const [selected, setSelected] = useState<(typeof dashboards)[0][]>([]);

  return (
    <div data-action-id="NAV:cw-dashboards">
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create dashboard"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!interactive || !dashName.trim()}
                onClick={() => {
                  markClick("create-dashboard");
                  createDashboard(dashName.trim());
                  setDashName("Rebon-Main");
                  setShowCreate(false);
                }}
              >
                Create dashboard
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="Dashboard name">
          <Input
            value={dashName}
            onChange={({ detail }) => setDashName(detail.value)}
            placeholder="Rebon-Main"
          />
        </FormField>
      </Modal>
      <Table
        variant="full-page"
        stickyHeader
        selectionType="single"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${dashboards.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={!interactive || selected.length !== 1}
                  onClick={() => {
                    if (selected[0]) deleteDashboard(selected[0].name);
                    setSelected([]);
                  }}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  disabled={!interactive}
                  onClick={() => setShowCreate(true)}
                >
                  Create dashboard
                </Button>
              </SpaceBetween>
            }
          >
            Dashboards
          </Header>
        }
        columnDefinitions={[
          {
            id: "name",
            header: "Dashboard name",
            cell: (d) => (
              <Button
                variant="inline-link"
                disabled={!interactive}
                onClick={() => navigate("cloudwatch", "dashboard-view", d.name)}
              >
                {d.name}
              </Button>
            ),
          },
          {
            id: "modified",
            header: "Last modified",
            cell: (d) => d.lastModified || "—",
          },
        ]}
        items={dashboards}
        empty={
          <Box textAlign="center" padding="l">
            <b>No dashboards</b>
          </Box>
        }
      />
    </div>
  );
}

function DashboardView() {
  const name = useAccountStore((s) => s.route.selectedId) || "";
  const dash = useAccountStore((s) => s.dashboards.find((d) => d.name === name));
  const navigate = useAccountStore((s) => s.navigate);
  const addDashboardWidget = useAccountStore((s) => s.addDashboardWidget);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [showWidgetType, setShowWidgetType] = useState(false);
  const [showMetric, setShowMetric] = useState(false);
  const [widgetType, setWidgetType] = useState<CwWidget["type"]>("line");
  const [metricPicked, setMetricPicked] = useState(false);

  const widgets = Array.isArray(dash?.widgets) ? dash!.widgets : [];

  if (!dash) return <Alert type="error">Dashboard not found.</Alert>;

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => navigate("cloudwatch", "dashboards")}>Cancel</Button>
            <span data-action-id="CLICK:btn-add-widget">
              <Button
                disabled={!interactive}
                onClick={() => {
                  markClick("add-widget");
                  setShowWidgetType(true);
                }}
              >
                Add widget
              </Button>
            </span>
            <Button variant="primary" disabled={!interactive}>
              Save
            </Button>
          </SpaceBetween>
        }
      >
        {dash.name}
      </Header>

      <div className="aws-cw-canvas">
        {widgets.length === 0 && (
          <Box textAlign="center" color="text-body-secondary" padding="xxl">
            Add a widget to start building this dashboard.
          </Box>
        )}
        <div className="aws-cw-canvas-grid">
          {widgets.map((w) => (
            <div key={w.id} className="aws-cw-widget" style={{ gridColumn: `span ${Math.min(w.width, 12)}` }}>
              <Header variant="h3">{w.title || w.metricName || "Widget"}</Header>
              {w.type === "number" ? (
                <Box fontSize="display-l" fontWeight="bold">
                  14
                </Box>
              ) : w.type === "text" ? (
                <Box>Custom text widget</Box>
              ) : (
                <LineChart
                  series={[
                    {
                      title: w.metricName || "CPU %",
                      type: "line",
                      data: CPU_SERIES,
                    },
                  ]}
                  xScaleType="time"
                  height={180}
                  hideFilter
                  hideLegend
                  ariaLabel={w.title || "Widget chart"}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        visible={showWidgetType}
        onDismiss={() => setShowWidgetType(false)}
        header="Add widget"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowWidgetType(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowWidgetType(false);
                  setShowMetric(true);
                  setMetricPicked(false);
                }}
              >
                Next
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <div className="aws-cw-widget-types">
          {(
            [
              ["line", "Line"],
              ["number", "Number"],
              ["stacked", "Stacked area"],
              ["bar", "Bar"],
              ["pie", "Pie"],
              ["text", "Text"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`aws-cw-widget-type${widgetType === id ? " is-selected" : ""}`}
              onClick={() => setWidgetType(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        visible={showMetric}
        onDismiss={() => setShowMetric(false)}
        header="Select metric"
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowMetric(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!metricPicked && widgetType !== "text"}
                onClick={() => {
                  addDashboardWidget(dash.name, {
                    type: widgetType,
                    metricName: widgetType === "text" ? undefined : "CPUUtilization",
                    title: widgetType === "text" ? "Notes" : "CPUUtilization",
                  });
                  setShowMetric(false);
                }}
              >
                Add widget
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        {widgetType === "text" ? (
          <Box>Text widgets do not require a metric.</Box>
        ) : (
          <SpaceBetween size="m">
            <Box>Browse · EC2 · Per-Instance Metrics</Box>
            <span data-action-id="SELECT:cw-metric-ec2-cpu">
              <Checkbox
                checked={metricPicked}
                onChange={({ detail }) => setMetricPicked(detail.checked)}
              >
                CPUUtilization · i-0abcd1234ef567890
              </Checkbox>
            </span>
          </SpaceBetween>
        )}
      </Modal>
    </SpaceBetween>
  );
}

function Alarms({ filterMode }: { filterMode: "all" | "ALARM" }) {
  const alarms = useAccountStore((s) => s.alarms);
  const navigate = useAccountStore((s) => s.navigate);
  const deleteAlarm = useAccountStore((s) => s.deleteAlarm);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<CwAlarm[]>([]);
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    let list = alarms;
    if (filterMode === "ALARM") list = list.filter((a) => a.state === "ALARM");
    if (!filter) return list;
    const q = filter.toLowerCase();
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.condition.toLowerCase().includes(q) ||
        (a.metric || "").toLowerCase().includes(q) ||
        (a.id || "").toLowerCase().includes(q)
    );
  }, [alarms, filter, filterMode]);

  const inAlarm = alarms.filter((a) => a.state === "ALARM").length;
  const insufficient = alarms.filter((a) => a.state === "INSUFFICIENT_DATA").length;
  const ok = alarms.filter((a) => a.state === "OK").length;

  return (
    <div data-action-id="NAV:cw-alarms">
      <SpaceBetween size="l">
        <ColumnLayout columns={3}>
          <Container>
            <Box variant="awsui-key-label">In alarm</Box>
            <Box fontSize="display-l" color="text-status-error">
              {inAlarm}
            </Box>
          </Container>
          <Container>
            <Box variant="awsui-key-label">Insufficient data</Box>
            <Box fontSize="display-l" color="text-status-inactive">
              {insufficient}
            </Box>
          </Container>
          <Container>
            <Box variant="awsui-key-label">OK</Box>
            <Box fontSize="display-l" color="text-status-success">
              {ok}
            </Box>
          </Container>
        </ColumnLayout>

        <Table
          variant="full-page"
          stickyHeader
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          filter={
            <Input
              value={filter}
              onChange={({ detail }) => setFilter(detail.value)}
              placeholder="Search by alarm name, ARN, or metric"
              type="search"
            />
          }
          header={
            <Header
              variant="awsui-h1-sticky"
              counter={`(${visible.length})`}
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
                    Actions
                  </Button>
                  <span data-action-id="HIGHLIGHT:btn-create-alarm">
                    <Button
                      variant="primary"
                      disabled={!interactive}
                      onClick={() => {
                        markClick("create-alarm");
                        navigate("cloudwatch", "create-alarm");
                      }}
                    >
                      Create alarm
                    </Button>
                  </span>
                </SpaceBetween>
              }
            >
              Alarms
            </Header>
          }
          columnDefinitions={[
            {
              id: "state",
              header: "State",
              cell: (a) => alarmState(a.state),
            },
            {
              id: "name",
              header: "Name",
              cell: (a) => (
                <Button variant="inline-link" disabled={!interactive}>
                  {a.name}
                </Button>
              ),
            },
            { id: "cond", header: "Condition", cell: (a) => a.condition },
            {
              id: "metric",
              header: "Metric name",
              cell: (a) => a.metric || a.condition.split(" ")[0] || "—",
            },
            {
              id: "act",
              header: "Actions",
              cell: (a) => a.actionTarget || (a.actions ? "SNS: rebon-alerts" : "—"),
            },
          ]}
          items={visible}
        />
      </SpaceBetween>
    </div>
  );
}

function CreateAlarm() {
  const navigate = useAccountStore((s) => s.navigate);
  const createAlarm = useAccountStore((s) => s.createAlarm);
  const instances = useAccountStore((s) => s.instances);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);

  const [step, setStep] = useState(0);
  const [metric, setMetric] = useState("CPUUtilization");
  const [instanceId, setInstanceId] = useState(
    instances[0]?.id || "i-0abcd1234ef567890"
  );
  const [metricSelected, setMetricSelected] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [modalPick, setModalPick] = useState(false);
  const [statistic, setStatistic] = useState("Average");
  const [period, setPeriod] = useState("5 minutes");
  const [thresholdType, setThresholdType] = useState("static");
  const [cmp, setCmp] =
    useState<NonNullable<CwAlarm["comparisonOperator"]>>("GreaterThanOrEqualToThreshold");
  const [threshold, setThreshold] = useState("80");
  const [snsMode, setSnsMode] = useState("existing");
  const [sns, setSns] = useState("rebon-dev-alerts");
  const [name, setName] = useState("Production-DB-CPU-High");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const thresholdNum = Number(threshold) || 80;
  const cmpLabel =
    cmp === "GreaterThanOrEqualToThreshold"
      ? ">="
      : cmp === "GreaterThanThreshold"
        ? ">"
        : cmp === "LessThanOrEqualToThreshold"
          ? "<="
          : "<";
  const condition = `${metric} ${cmpLabel} ${threshold} for 1 datapoints within ${period}`;
  const snsEmail = SNS_TOPICS.find((t) => t.value === sns)?.email || "admin@rebon.io";

  const submit = () => {
    if (!interactive || !name.trim() || creating) return;
    markClick("create-alarm-submit");
    setCreating(true);
    void createAlarm({
      name: name.trim(),
      description: desc,
      condition,
      metric,
      namespace: "AWS/EC2",
      statistic: statistic as CwAlarm["statistic"],
      period,
      threshold: thresholdNum,
      comparisonOperator: cmp,
      actionTarget: `SNS: ${sns}`,
    }).finally(() => setCreating(false));
  };

  return (
    <div data-action-id="NAV:cw-create-alarm">
      <Wizard
        i18nStrings={WIZARD_I18N}
        activeStepIndex={step}
        submitButtonText="Create alarm"
        isLoadingNextStep={creating}
        onNavigate={({ detail }) => setStep(detail.requestedStepIndex)}
        onCancel={() => navigate("cloudwatch", "alarms")}
        onSubmit={submit}
        steps={[
          {
            title: "Specify metric and conditions",
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">Metric</Header>}>
                  <SpaceBetween size="s">
                    <span data-action-id="HIGHLIGHT:btn-select-metric">
                      <Button onClick={() => setShowMetricModal(true)}>Select metric</Button>
                    </span>
                    {metricSelected && (
                      <>
                        <Box>
                          EC2 · {instanceId} · {metric}
                        </Box>
                        <MetricPreview metric={metric} threshold={thresholdNum} />
                        <FormField label="Statistic">
                          <Select
                            selectedOption={{ label: statistic, value: statistic }}
                            options={[
                              { label: "Average", value: "Average" },
                              { label: "Sum", value: "Sum" },
                              { label: "Minimum", value: "Minimum" },
                              { label: "Maximum", value: "Maximum" },
                            ]}
                            onChange={({ detail }) =>
                              setStatistic(detail.selectedOption.value || statistic)
                            }
                          />
                        </FormField>
                        <FormField label="Period">
                          <Select
                            selectedOption={{ label: period, value: period }}
                            options={[
                              { label: "1 minute", value: "1 minute" },
                              { label: "5 minutes", value: "5 minutes" },
                              { label: "15 minutes", value: "15 minutes" },
                              { label: "1 hour", value: "1 hour" },
                            ]}
                            onChange={({ detail }) =>
                              setPeriod(detail.selectedOption.value || period)
                            }
                          />
                        </FormField>
                      </>
                    )}
                  </SpaceBetween>
                </Container>
                <Container header={<Header variant="h2">Conditions</Header>}>
                  <SpaceBetween size="m">
                    <FormField label="Threshold type">
                      <RadioGroup
                        value={thresholdType}
                        onChange={({ detail }) => setThresholdType(detail.value)}
                        items={[
                          { value: "static", label: "Static" },
                          { value: "anomaly", label: "Anomaly detection" },
                        ]}
                      />
                    </FormField>
                    <FormField label={`Whenever ${metric} is…`}>
                      <span data-action-id="SELECT:cw-condition-greater-equal">
                        <RadioGroup
                          value={cmp}
                          onChange={({ detail }) =>
                            setCmp(
                              detail.value as NonNullable<CwAlarm["comparisonOperator"]>
                            )
                          }
                          items={[
                            {
                              value: "GreaterThanOrEqualToThreshold",
                              label: "Greater/Equal (>=)",
                            },
                            { value: "GreaterThanThreshold", label: "Greater (>)" },
                            {
                              value: "LessThanOrEqualToThreshold",
                              label: "Lower/Equal (<=)",
                            },
                            { value: "LessThanThreshold", label: "Lower (<)" },
                          ]}
                        />
                      </span>
                    </FormField>
                    <FormField label="than…">
                      <span data-action-id="HIGHLIGHT:input-threshold">
                        <span data-action-id="FILL:cw-alarm-threshold">
                          <Input
                            value={threshold}
                            disabled={!interactive}
                            onChange={({ detail }) => {
                              setThreshold(detail.value);
                              useAccountStore.getState().setActionDraft({
                                "cw-threshold-value": detail.value,
                              });
                            }}
                            type="number"
                          />
                        </span>
                      </span>
                    </FormField>
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
          {
            title: "Configure actions",
            content: (
              <Container header={<Header variant="h2">Notification</Header>}>
                <SpaceBetween size="m">
                  <FormField label="Alarm state trigger">
                    <RadioGroup
                      value="ALARM"
                      items={[
                        { value: "ALARM", label: "In alarm" },
                        { value: "OK", label: "OK" },
                        { value: "INSUFFICIENT_DATA", label: "Insufficient data" },
                      ]}
                    />
                  </FormField>
                  <FormField label="Send a notification to the following SNS topic">
                    <RadioGroup
                      value={snsMode}
                      onChange={({ detail }) => setSnsMode(detail.value)}
                      items={[
                        { value: "existing", label: "Select an existing SNS topic" },
                        { value: "new", label: "Create new topic" },
                      ]}
                    />
                  </FormField>
                  {snsMode === "existing" ? (
                    <>
                      <FormField label="SNS topic">
                        <span data-action-id="SELECT:cw-sns-topic-dev-alerts">
                          <Select
                            selectedOption={{ label: sns, value: sns }}
                            options={SNS_TOPICS.map((t) => ({
                              label: t.label,
                              value: t.value,
                            }))}
                            onChange={({ detail }) =>
                              setSns(detail.selectedOption.value || sns)
                            }
                            filteringType="auto"
                          />
                        </span>
                      </FormField>
                      <Box color="text-body-secondary">
                        This topic will send an email to: {snsEmail}
                      </Box>
                    </>
                  ) : (
                    <FormField label="New topic name">
                      <Input value={sns} onChange={({ detail }) => setSns(detail.value)} />
                    </FormField>
                  )}
                </SpaceBetween>
              </Container>
            ),
          },
          {
            title: "Add name and description",
            content: (
              <Container header={<Header variant="h2">Name and description</Header>}>
                <SpaceBetween size="m">
                  <FormField label="Alarm name">
                    <span data-action-id="FILL:cw-alarm-name">
                      <Input
                        value={name}
                        disabled={!interactive}
                        onChange={({ detail }) => setName(detail.value)}
                      />
                    </span>
                  </FormField>
                  <FormField label="Alarm description - optional">
                    <Textarea
                      value={desc}
                      disabled={!interactive}
                      onChange={({ detail }) => setDesc(detail.value)}
                    />
                  </FormField>
                </SpaceBetween>
              </Container>
            ),
          },
          {
            title: "Preview and create",
            content: (
              <SpaceBetween size="l">
                <MetricPreview metric={metric} threshold={thresholdNum} />
                <Container header={<Header variant="h2">Summary</Header>}>
                  <SpaceBetween size="s">
                    <Box>
                      <b>Name:</b> {name}
                    </Box>
                    <Box>
                      <b>Condition:</b> {condition}
                    </Box>
                    <Box>
                      <b>Statistic / Period:</b> {statistic} · {period}
                    </Box>
                    <Box>
                      <b>Actions:</b> SNS: {sns} ({snsEmail})
                    </Box>
                  </SpaceBetween>
                </Container>
                <span data-action-id="CLICK:btn-create-alarm-submit" className="aws-cw-ren-hooks">
                  <button type="button" onClick={submit} disabled={!interactive || creating} />
                </span>
              </SpaceBetween>
            ),
          },
        ]}
      />

      <Modal
        visible={showMetricModal}
        onDismiss={() => setShowMetricModal(false)}
        header="Select metric"
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowMetricModal(false)}>Cancel</Button>
              <span data-action-id="CLICK:btn-select-metric-submit">
                <Button
                  variant="primary"
                  disabled={!modalPick}
                  onClick={() => {
                    setMetric("CPUUtilization");
                    setMetricSelected(true);
                    setShowMetricModal(false);
                  }}
                >
                  Select metric
                </Button>
              </span>
            </SpaceBetween>
          </Box>
        }
      >
        <Tabs
          tabs={[
            {
              id: "browse",
              label: "Browse",
              content: (
                <SpaceBetween size="m">
                  <Box variant="h3">EC2 &gt; Per-Instance Metrics</Box>
                  <span data-action-id="SELECT:cw-metric-ec2-cpu">
                    <Checkbox
                      checked={modalPick}
                      onChange={({ detail }) => {
                        setModalPick(detail.checked);
                        if (detail.checked) {
                          setInstanceId(instances[0]?.id || "i-0abcd1234ef567890");
                        }
                      }}
                    >
                      CPUUtilization · {instances[0]?.id || "i-0abcd1234ef567890"}
                      {instances[0]?.name ? ` (${instances[0].name})` : ""}
                    </Checkbox>
                  </span>
                </SpaceBetween>
              ),
            },
            {
              id: "graphed",
              label: "Graphed metrics",
              content: (
                <Box color="text-body-secondary">No graphed metrics in this session.</Box>
              ),
            },
            {
              id: "query",
              label: "Query",
              content: (
                <Box color="text-body-secondary">Metric Insights query is not simulated.</Box>
              ),
            },
          ]}
        />
      </Modal>
    </div>
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
            {
              ts: "2026-08-18T03:11:02Z",
              msg: "ERROR upstream 5xx from target i-0a8f31c2e91b44d17",
            },
            { ts: "2026-08-18T03:10:44Z", msg: "ERROR payment timeout merchant=4421" },
            { ts: "2026-08-18T03:09:18Z", msg: "ERROR redis connection reset" },
          ]}
        />
      )}
    </SpaceBetween>
  );
}
