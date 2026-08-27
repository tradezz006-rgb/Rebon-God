import { useMemo, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Select from "@cloudscape-design/components/select";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Wizard from "@cloudscape-design/components/wizard";
import RadioGroup from "@cloudscape-design/components/radio-group";
import BarChart from "@cloudscape-design/components/bar-chart";
import LineChart from "@cloudscape-design/components/line-chart";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Checkbox from "@cloudscape-design/components/checkbox";
import ProgressBar from "@cloudscape-design/components/progress-bar";
import { useAccountStore } from "../store";
import { WIZARD_I18N } from "../ui";
import type { Budget } from "../types";

export function BillingService() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "budgets") return <Budgets />;
  if (page === "create-budget") return <CreateBudget />;
  if (page === "cost-explorer") return <CostExplorer />;
  if (
    page === "bills" ||
    page === "cost-allocation-tags" ||
    page === "savings-plans" ||
    page === "billing-preferences" ||
    page === "payment-methods"
  ) {
    return <BillingStub title={String(page).replace(/-/g, " ")} />;
  }
  return <BillingDashboard />;
}

function BillingStub({ title }: { title: string }) {
  return (
    <Box padding="l">
      <Header variant="h1" description="Daily-use focus is Cost Explorer and Budgets.">
        {title}
      </Header>
      <Box color="text-body-secondary" padding={{ top: "m" }}>
        This console entry is reserved for a later pass.
      </Box>
    </Box>
  );
}

function BillingDashboard() {
  const budgets = useAccountStore((s) => s.budgets);
  const rows = useAccountStore((s) => s.cost_rows);
  const navigate = useAccountStore((s) => s.navigate);
  const total = rows.reduce((s, r) => s + r.this_month, 0);
  const inAlert = budgets.filter(
    (b) => b.forecasted / b.budgeted >= b.alert_threshold / 100 || b.current >= b.budgeted
  ).length;

  return (
    <div data-action-id="NAV:billing-dashboard">
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description="Month-to-date cost overview for this account."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => navigate("billing", "cost-explorer")}>
                Cost Explorer
              </Button>
              <Button variant="primary" onClick={() => navigate("billing", "budgets")}>
                Budgets
              </Button>
            </SpaceBetween>
          }
        >
          Billing dashboard
        </Header>
        <ColumnLayout columns={3}>
          <Container>
            <Box variant="awsui-key-label">Month-to-date cost</Box>
            <Box fontSize="display-l">${total.toFixed(2)}</Box>
          </Container>
          <Container>
            <Box variant="awsui-key-label">Budgets in alert</Box>
            <Box fontSize="display-l" color="text-status-error">
              {inAlert}
            </Box>
          </Container>
          <Container>
            <Box variant="awsui-key-label">Services tracked</Box>
            <Box fontSize="display-l">{rows.length}</Box>
          </Container>
        </ColumnLayout>
      </SpaceBetween>
    </div>
  );
}

function budgetStatus(b: Budget) {
  if (b.current >= b.budgeted || b.forecasted >= b.budgeted) {
    return <StatusIndicator type="error">Exceeded</StatusIndicator>;
  }
  const pct =
    b.threshold_type === "Forecasted"
      ? (b.forecasted / b.budgeted) * 100
      : (b.current / b.budgeted) * 100;
  if (pct >= b.alert_threshold) {
    return <StatusIndicator type="warning">Alert</StatusIndicator>;
  }
  return <StatusIndicator type="success">OK</StatusIndicator>;
}

function CostExplorer() {
  const getCostExplorerData = useAccountStore((s) => s.getCostExplorerData);
  const costRows = useAccountStore((s) => s.cost_rows);
  const [dateRange, setDateRange] = useState({
    label: "Last 3 months",
    value: "3m",
  });
  const [granularity, setGranularity] = useState("Monthly");
  const [chartType, setChartType] = useState<"stack" | "line">("stack");
  const [groupBy, setGroupBy] = useState("Service");
  const [serviceFilter, setServiceFilter] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(costRows.map((r) => [r.service, true]))
  );

  const monthly = useMemo(
    () => getCostExplorerData(granularity, dateRange.value),
    [getCostExplorerData, granularity, dateRange.value]
  );

  const services = useMemo(() => {
    const keys = Object.keys(monthly[0]?.services || {});
    return keys.filter((k) => serviceFilter[k] !== false);
  }, [monthly, serviceFilter]);

  const series = services.map((svc) => ({
    title: svc,
    type: (chartType === "line" ? "line" : "bar") as "line" | "bar",
    data: monthly.map((m) => ({
      x: m.month,
      y: m.services[svc] || 0,
    })),
  }));

  const yMax =
    Math.max(
      ...monthly.map((m) =>
        services.reduce((sum, svc) => sum + (m.services[svc] || 0), 0)
      ),
      1
    ) * 1.15;

  const tableItems = services.map((svc) => {
    const row: Record<string, string | number> = { service: svc };
    let total = 0;
    for (const m of monthly) {
      const v = m.services[svc] || 0;
      row[m.month] = v;
      total += v;
    }
    row.total = Math.round(total * 100) / 100;
    return row;
  });

  const totalRow: Record<string, string | number> = { service: "Total costs" };
  let grand = 0;
  for (const m of monthly) {
    const v = services.reduce((s, svc) => s + (m.services[svc] || 0), 0);
    totalRow[m.month] = Math.round(v * 100) / 100;
    grand += v;
  }
  totalRow.total = Math.round(grand * 100) / 100;

  return (
    <div data-action-id="NAV:cost-explorer">
      <SpaceBetween size="l">
        <Header
          variant="h1"
          description={`${dateRange.label} · ${granularity} · grouped by ${groupBy}`}
        >
          Cost Explorer
        </Header>
        <div
          className="aws-cost-explorer-layout"
          data-console-target="cost-explorer-view"
          data-action-id="NAV:cost-explorer-view"
        >
          <div className="aws-cost-explorer-main">
            <div data-action-id="HIGHLIGHT:ce-chart-canvas">
              {chartType === "line" ? (
                <LineChart
                  series={series}
                  xDomain={monthly.map((m) => m.month)}
                  yDomain={[0, yMax]}
                  height={320}
                  hideFilter
                  ariaLabel="Cost Explorer line chart"
                />
              ) : (
                <BarChart
                  series={series}
                  xDomain={monthly.map((m) => m.month)}
                  yDomain={[0, yMax]}
                  stackedBars
                  height={320}
                  hideFilter
                  ariaLabel="Cost Explorer stacked bar chart"
                />
              )}
            </div>
            <Table
              header={<Header>Costs by {groupBy.toLowerCase()}</Header>}
              columnDefinitions={[
                { id: "service", header: "Service", cell: (r) => String(r.service) },
                ...monthly.map((m) => ({
                  id: m.month,
                  header: m.month,
                  cell: (r: Record<string, string | number>) =>
                    `$${Number(r[m.month] || 0).toFixed(2)}`,
                })),
                {
                  id: "total",
                  header: "Total",
                  cell: (r: Record<string, string | number>) =>
                    `$${Number(r.total || 0).toFixed(2)}`,
                },
              ]}
              items={[...tableItems, totalRow]}
            />
          </div>
          <aside className="aws-cost-explorer-filters">
            <Header variant="h2">Report parameters</Header>
            <SpaceBetween size="m">
              <FormField label="Date range">
                <Select
                  selectedOption={dateRange}
                  options={[
                    { label: "Month-to-date", value: "mtd" },
                    { label: "Last 3 months", value: "3m" },
                    { label: "Last 6 months", value: "6m" },
                    { label: "Custom range", value: "custom" },
                  ]}
                  onChange={({ detail }) =>
                    setDateRange({
                      label: detail.selectedOption.label || dateRange.label,
                      value: detail.selectedOption.value || dateRange.value,
                    })
                  }
                />
              </FormField>
              <FormField label="Granularity">
                <span data-action-id="SELECT:ce-granularity-monthly">
                  <RadioGroup
                    value={granularity === "Daily" ? "Daily" : "Monthly"}
                    onChange={({ detail }) => setGranularity(detail.value)}
                    items={[
                      { value: "Daily", label: "Daily" },
                      { value: "Monthly", label: "Monthly" },
                    ]}
                  />
                </span>
              </FormField>
              <FormField label="Chart style">
                <RadioGroup
                  value={chartType}
                  onChange={({ detail }) =>
                    setChartType(detail.value as "stack" | "line")
                  }
                  items={[
                    { value: "stack", label: "Bar (Stacked)" },
                    { value: "line", label: "Line" },
                  ]}
                />
              </FormField>
              <FormField label="Group by">
                <span
                  data-action-id="HIGHLIGHT:ce-group-by-dropdown"
                >
                  <span data-action-id="SELECT:ce-group-by-service">
                    <Select
                      selectedOption={{ label: groupBy, value: groupBy }}
                      options={[
                        "Service",
                        "Linked Account",
                        "Region",
                        "Instance Type",
                        "Usage Type",
                      ].map((g) => ({ label: g, value: g }))}
                      onChange={({ detail }) =>
                        setGroupBy(detail.selectedOption.value || groupBy)
                      }
                    />
                  </span>
                </span>
              </FormField>
              <ExpandableSection headerText="Service" defaultExpanded>
                <SpaceBetween size="xs">
                  {costRows.map((r) => (
                    <Checkbox
                      key={r.service}
                      checked={serviceFilter[r.service] !== false}
                      onChange={({ detail }) =>
                        setServiceFilter((prev) => ({
                          ...prev,
                          [r.service]: detail.checked,
                        }))
                      }
                    >
                      {r.service}
                    </Checkbox>
                  ))}
                </SpaceBetween>
              </ExpandableSection>
              <ExpandableSection headerText="Region">
                <Box color="text-body-secondary">ap-south-1 · us-east-1</Box>
              </ExpandableSection>
              <ExpandableSection headerText="Tag">
                <Box color="text-body-secondary">No cost allocation tags applied.</Box>
              </ExpandableSection>
            </SpaceBetween>
          </aside>
        </div>
      </SpaceBetween>
    </div>
  );
}

function Budgets() {
  const budgets = useAccountStore((s) => s.budgets);
  const navigate = useAccountStore((s) => s.navigate);
  const deleteBudget = useAccountStore((s) => s.deleteBudget);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<Budget[]>([]);

  const inAlert = budgets.filter((b) => {
    const pct =
      b.threshold_type === "Forecasted"
        ? (b.forecasted / b.budgeted) * 100
        : (b.current / b.budgeted) * 100;
    return pct >= b.alert_threshold || b.current >= b.budgeted;
  }).length;
  const ok = budgets.length - inAlert;

  return (
    <div data-action-id="NAV:budgets-list">
      <SpaceBetween size="l">
        <ColumnLayout columns={2}>
          <Container>
            <Box variant="awsui-key-label">Budgets in alert</Box>
            <Box fontSize="display-l" color="text-status-error">
              {inAlert}
            </Box>
          </Container>
          <Container>
            <Box variant="awsui-key-label">Budgets ok</Box>
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
          header={
            <Header
              variant="awsui-h1-sticky"
              counter={`(${budgets.length})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <ButtonDropdown
                    disabled={!interactive || selected.length === 0}
                    items={[{ id: "delete", text: "Delete" }]}
                    onItemClick={({ detail }) => {
                      if (detail.id !== "delete") return;
                      selected.forEach((b) => {
                        markClick("delete-budget");
                        deleteBudget(b.id || b.name);
                      });
                      setSelected([]);
                    }}
                  >
                    Actions
                  </ButtonDropdown>
                  <span data-action-id="HIGHLIGHT:btn-create-budget">
                    <Button
                      variant="primary"
                      disabled={!interactive}
                      onClick={() => {
                        markClick("create-budget");
                        navigate("billing", "create-budget");
                      }}
                    >
                      Create budget
                    </Button>
                  </span>
                </SpaceBetween>
              }
            >
              Budgets
            </Header>
          }
          columnDefinitions={[
            {
              id: "name",
              header: "Budget name",
              cell: (b) => (
                <Button variant="inline-link" disabled={!interactive}>
                  {b.name}
                </Button>
              ),
            },
            {
              id: "amt",
              header: "Amount",
              cell: (b) => `$${b.budgeted.toFixed(2)}`,
            },
            {
              id: "cur",
              header: "Current vs Budgeted",
              cell: (b) => (
                <div className="aws-budget-progress">
                  <ProgressBar
                    value={Math.min(100, (b.current / b.budgeted) * 100)}
                    description={`$${b.current.toFixed(2)} / $${b.budgeted.toFixed(2)}`}
                  />
                </div>
              ),
            },
            {
              id: "fc",
              header: "Forecasted vs Budgeted",
              cell: (b) => `${Math.round((b.forecasted / b.budgeted) * 100)}%`,
            },
            {
              id: "st",
              header: "Status",
              cell: (b) => budgetStatus(b),
            },
          ]}
          items={budgets}
        />
      </SpaceBetween>
    </div>
  );
}

function CreateBudget() {
  const navigate = useAccountStore((s) => s.navigate);
  const createBudget = useAccountStore((s) => s.createBudget);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const costRows = useAccountStore((s) => s.cost_rows);

  const [step, setStep] = useState(0);
  const [budgetType, setBudgetType] = useState("cost");
  const [name, setName] = useState("Monthly-Lab-Limit");
  const [period, setPeriod] = useState<Budget["period"]>("Monthly");
  const [amountMode, setAmountMode] = useState("fixed");
  const [amount, setAmount] = useState("50.00");
  const [showAlert, setShowAlert] = useState(true);
  const [thresholdType, setThresholdType] =
    useState<Budget["threshold_type"]>("Forecasted");
  const [threshold, setThreshold] = useState("80");
  const [email, setEmail] = useState("admin@rebon.io");
  const [creating, setCreating] = useState(false);

  const amountNum = Number(amount) || 50;
  const thresholdNum = Number(threshold) || 80;
  const notifyAt = Math.round(amountNum * (thresholdNum / 100) * 100) / 100;
  const histAvg =
    costRows.reduce((s, r) => s + r.last_month, 0) / Math.max(costRows.length, 1);

  const submit = () => {
    if (!interactive || !name.trim() || creating) return;
    markClick("create-budget-submit");
    setCreating(true);
    void createBudget({
      name: name.trim(),
      amount: amountNum,
      period,
      threshold: thresholdNum,
      thresholdType,
      email,
    }).finally(() => setCreating(false));
  };

  return (
    <div data-action-id="NAV:budgets-create">
      <Wizard
        i18nStrings={WIZARD_I18N}
        activeStepIndex={step}
        submitButtonText="Create budget"
        isLoadingNextStep={creating}
        onNavigate={({ detail }) => setStep(detail.requestedStepIndex)}
        onCancel={() => navigate("billing", "budgets")}
        onSubmit={submit}
        steps={[
          {
            title: "Choose budget type",
            content: (
              <span data-action-id="SELECT:budget-type-cost">
                <RadioGroup
                  value={budgetType}
                  onChange={({ detail }) => setBudgetType(detail.value)}
                  items={[
                    {
                      value: "cost",
                      label: "Cost budget - Recommended",
                      description:
                        "Monitor costs against a specified dollar amount and receive alerts",
                    },
                    {
                      value: "usage",
                      label: "Usage budget",
                      description:
                        "Monitor usage of one or more specified resource types",
                    },
                    {
                      value: "sp",
                      label: "Savings Plans budget",
                      description: "Track Savings Plans utilization or coverage",
                    },
                    {
                      value: "ri",
                      label: "Reservation budget",
                      description: "Track reservation utilization or coverage",
                    },
                  ]}
                />
              </span>
            ),
          },
          {
            title: "Set your budget",
            content: (
              <SpaceBetween size="l">
                <Container header={<Header variant="h2">Budget details</Header>}>
                  <SpaceBetween size="m">
                    <FormField label="Budget name">
                      <span data-action-id="FILL:budget-name">
                        <Input
                          value={name}
                          disabled={!interactive}
                          onChange={({ detail }) => setName(detail.value)}
                        />
                      </span>
                    </FormField>
                    <FormField label="Period">
                      <Select
                        selectedOption={{ label: period, value: period }}
                        options={["Daily", "Monthly", "Quarterly", "Annually"].map(
                          (p) => ({ label: p, value: p })
                        )}
                        onChange={({ detail }) =>
                          setPeriod(
                            (detail.selectedOption.value || period) as Budget["period"]
                          )
                        }
                      />
                    </FormField>
                  </SpaceBetween>
                </Container>
                <Container header={<Header variant="h2">Budget amount</Header>}>
                  <SpaceBetween size="m">
                    <RadioGroup
                      value={amountMode}
                      onChange={({ detail }) => setAmountMode(detail.value)}
                      items={[
                        { value: "fixed", label: "Fixed" },
                        { value: "planned", label: "Planned" },
                      ]}
                    />
                    <FormField label="Budgeted amount ($)">
                      <span data-action-id="HIGHLIGHT:budget-amount-input">
                        <span data-action-id="FILL:budget-amount">
                          <Input
                            value={amount}
                            disabled={!interactive}
                            type="number"
                            onChange={({ detail }) => setAmount(detail.value)}
                          />
                        </span>
                      </span>
                    </FormField>
                    <LineChart
                      series={[
                        {
                          title: "Historical spend",
                          type: "line",
                          data: [
                            { x: 0, y: histAvg * 0.9 },
                            { x: 1, y: histAvg },
                            { x: 2, y: histAvg * 1.05 },
                          ],
                        },
                        {
                          title: `Budget ($${amountNum})`,
                          type: "threshold",
                          y: amountNum,
                        },
                      ]}
                      xDomain={[0, 1, 2]}
                      yDomain={[0, Math.max(amountNum, histAvg) * 1.3]}
                      height={180}
                      hideFilter
                      ariaLabel="Budget vs historical spend"
                    />
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ),
          },
          {
            title: "Configure budget alerts",
            content: (
              <Container header={<Header variant="h2">Alert 1</Header>}>
                <SpaceBetween size="m">
                  {!showAlert && (
                    <span data-action-id="CLICK:btn-add-alert-threshold">
                      <Button onClick={() => setShowAlert(true)}>
                        Add an alert threshold
                      </Button>
                    </span>
                  )}
                  {showAlert && (
                    <>
                      <FormField label="Threshold type">
                        <span data-action-id="SELECT:alert-type-forecasted">
                          <Select
                            selectedOption={{
                              label: thresholdType,
                              value: thresholdType,
                            }}
                            options={[
                              { label: "Actual", value: "Actual" },
                              { label: "Forecasted", value: "Forecasted" },
                            ]}
                            onChange={({ detail }) =>
                              setThresholdType(
                                (detail.selectedOption.value ||
                                  thresholdType) as Budget["threshold_type"]
                              )
                            }
                          />
                        </span>
                      </FormField>
                      <FormField label="Alert threshold (% of budgeted amount)">
                        <span data-action-id="HIGHLIGHT:alert-threshold-input">
                          <span data-action-id="FILL:alert-threshold-percent">
                            <Input
                              value={threshold}
                              disabled={!interactive}
                              type="number"
                              onChange={({ detail }) => setThreshold(detail.value)}
                            />
                          </span>
                        </span>
                      </FormField>
                      <Box color="text-body-secondary">
                        You will be notified when your{" "}
                        {thresholdType.toLowerCase()} cost is greater than{" "}
                        {thresholdNum.toFixed(2)}% (${notifyAt.toFixed(2)}) of your
                        budgeted amount (${amountNum.toFixed(2)}).
                      </Box>
                      <FormField label="Email contacts">
                        <span data-action-id="FILL:alert-email">
                          <Input
                            value={email}
                            disabled={!interactive}
                            onChange={({ detail }) => setEmail(detail.value)}
                          />
                        </span>
                      </FormField>
                    </>
                  )}
                </SpaceBetween>
              </Container>
            ),
          },
          {
            title: "Confirm budget and create",
            content: (
              <SpaceBetween size="m">
                <Container header={<Header variant="h2">Budget summary</Header>}>
                  <SpaceBetween size="s">
                    <Box>
                      <b>Type:</b> Cost budget
                    </Box>
                    <Box>
                      <b>Name:</b> {name}
                    </Box>
                    <Box>
                      <b>Period:</b> {period}
                    </Box>
                    <Box>
                      <b>Amount:</b> ${amountNum.toFixed(2)} ({amountMode})
                    </Box>
                    <Box>
                      <b>Alert:</b> {thresholdType} ≥ {thresholdNum}% → {email}
                    </Box>
                  </SpaceBetween>
                </Container>
                <span
                  data-action-id="CLICK:btn-create-budget-submit"
                  className="aws-billing-ren-hooks"
                >
                  <button type="button" onClick={submit} disabled={!interactive || creating} />
                </span>
              </SpaceBetween>
            ),
          },
        ]}
      />
    </div>
  );
}
