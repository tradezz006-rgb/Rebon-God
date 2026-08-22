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
import Box from "@cloudscape-design/components/box";
import { useAccountStore } from "../store";
import { WIZARD_I18N } from "../ui";

export function BillingService() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "budgets") return <Budgets />;
  if (page === "create-budget") return <CreateBudget />;
  return <CostExplorer />;
}

function budgetStatus(current: number, budgeted: number, threshold: number) {
  const pct = (current / budgeted) * 100;
  if (pct >= 100) return <StatusIndicator type="error">EXCEEDED</StatusIndicator>;
  if (pct >= threshold) return <StatusIndicator type="warning">WARNING</StatusIndicator>;
  return <StatusIndicator type="success">OK</StatusIndicator>;
}

function CostExplorer() {
  const rows = useAccountStore((s) => s.cost_rows);
  const [group, setGroup] = useState("Service");
  const [dateRange, setDateRange] = useState({ label: "Last 6 months", value: "6m" });

  const displayRows = useMemo(() => {
    if (group !== "Region") {
      return rows.map((r) => ({
        key: r.service,
        this_month: r.this_month,
        last_month: r.last_month,
      }));
    }
    const regions = ["ap-south-1", "us-east-1", "eu-west-1"];
    const totalThis = rows.reduce((s, r) => s + r.this_month, 0);
    const totalLast = rows.reduce((s, r) => s + r.last_month, 0);
    const shares = [0.55, 0.3, 0.15];
    return regions.map((region, i) => ({
      key: region,
      this_month: Math.round(totalThis * shares[i] * 100) / 100,
      last_month: Math.round(totalLast * shares[i] * 100) / 100,
    }));
  }, [rows, group]);

  const dimHeader = group === "Region" ? "Region" : group === "Linked account" ? "Linked account" : "Service";
  const rangeLabel = dateRange.label.toLowerCase();

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description={`${dateRange.label} · grouped by ${group.toLowerCase()}`}>
        Cost Explorer
      </Header>
      <SpaceBetween direction="horizontal" size="s">
        <FormField label="Date range">
          <Select
            selectedOption={dateRange}
            options={[
              { label: "Last 6 months", value: "6m" },
              { label: "Last 12 months", value: "12m" },
            ]}
            onChange={({ detail }) =>
              setDateRange({
                label: detail.selectedOption.label || dateRange.label,
                value: detail.selectedOption.value || dateRange.value,
              })
            }
          />
        </FormField>
        <FormField label="Group by">
          <Select
            selectedOption={{ label: group, value: group }}
            options={["Service", "Region", "Linked account"].map((g) => ({ label: g, value: g }))}
            onChange={({ detail }) => setGroup(detail.selectedOption.value || group)}
          />
        </FormField>
      </SpaceBetween>
      <BarChart
        series={[
          {
            title: "This month",
            type: "bar",
            data: displayRows.map((r) => ({ x: r.key, y: r.this_month })),
          },
          {
            title: "Last month",
            type: "bar",
            data: displayRows.map((r) => ({ x: r.key, y: r.last_month })),
          },
        ]}
        xDomain={displayRows.map((r) => r.key)}
        xScaleType="categorical"
        xTitle={dimHeader}
        yTitle="USD"
        height={280}
        ariaLabel={`Cost by ${dimHeader.toLowerCase()} · ${rangeLabel}`}
        i18nStrings={{
          yTickFormatter: (n) => `$${n}`,
        }}
      />
      <Table
        columnDefinitions={[
          { id: "dim", header: dimHeader, cell: (r) => r.key },
          {
            id: "tm",
            header: "This month",
            cell: (r) => `$${r.this_month.toFixed(2)}`,
          },
          {
            id: "lm",
            header: "Last month",
            cell: (r) => `$${r.last_month.toFixed(2)}`,
          },
          {
            id: "chg",
            header: "Change",
            cell: (r) => {
              const d = r.this_month - r.last_month;
              const pct = r.last_month ? ((d / r.last_month) * 100).toFixed(1) : "—";
              return `${d >= 0 ? "+" : ""}$${d.toFixed(2)} (${pct}%)`;
            },
          },
        ]}
        items={displayRows}
      />
    </SpaceBetween>
  );
}

function Budgets() {
  const budgets = useAccountStore((s) => s.budgets);
  const navigate = useAccountStore((s) => s.navigate);
  const deleteBudget = useAccountStore((s) => s.deleteBudget);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<(typeof budgets)[0][]>([]);

  const removeSelected = () => {
    selected.forEach((b) => {
      markClick("delete-budget");
      deleteBudget(b.name);
    });
    setSelected([]);
  };

  return (
    <Table
      variant="full-page"
      selectionType="multi"
      selectedItems={selected}
      onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
      header={
        <Header
          variant="awsui-h1-sticky"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <ButtonDropdown
                disabled={!interactive || selected.length === 0}
                items={[{ id: "delete", text: "Delete" }]}
                onItemClick={({ detail }) => {
                  if (detail.id === "delete") removeSelected();
                }}
              >
                Actions
              </ButtonDropdown>
              <Button
                variant="primary"
                disabled={!interactive}
                onClick={() => navigate("billing", "create-budget")}
              >
                Create budget
              </Button>
            </SpaceBetween>
          }
        >
          Budgets
        </Header>
      }
      columnDefinitions={[
        { id: "name", header: "Budget name", cell: (b) => b.name },
        { id: "b", header: "Budgeted", cell: (b) => `$${b.budgeted.toFixed(0)}` },
        { id: "c", header: "Current", cell: (b) => `$${b.current.toFixed(2)}` },
        { id: "f", header: "Forecasted", cell: (b) => `$${b.forecasted.toFixed(2)}` },
        {
          id: "pct",
          header: "% used",
          cell: (b) => `${((b.current / b.budgeted) * 100).toFixed(0)}%`,
        },
        { id: "th", header: "Alert threshold", cell: (b) => `${b.alert_threshold}%` },
        {
          id: "st",
          header: "Status",
          cell: (b) => budgetStatus(b.current, b.budgeted, b.alert_threshold),
        },
      ]}
      items={budgets}
    />
  );
}

function CreateBudget() {
  const navigate = useAccountStore((s) => s.navigate);
  const createBudget = useAccountStore((s) => s.createBudget);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState("Cost");
  const [name, setName] = useState("freshbite-monthly");
  const [amount, setAmount] = useState("2000");
  const [threshold, setThreshold] = useState("80");
  const [email, setEmail] = useState("finops@freshbite.example");

  return (
    <Wizard
      i18nStrings={WIZARD_I18N}
      activeStepIndex={step}
      submitButtonText="Create budget"
      onNavigate={({ detail }) => setStep(detail.requestedStepIndex)}
      onCancel={() => navigate("billing", "budgets")}
      onSubmit={() =>
        createBudget(name, Number(amount) || 0, Number(threshold) || 80, email)
      }
      steps={[
        {
          title: "Choose budget type",
          content: (
            <RadioGroup
              value={kind}
              onChange={({ detail }) => setKind(detail.value)}
              items={[
                { value: "Cost", label: "Cost budget" },
                { value: "Usage", label: "Usage budget" },
                { value: "Savings Plans", label: "Savings Plans budget" },
                { value: "Reservation", label: "Reservation budget" },
              ]}
            />
          ),
        },
        {
          title: "Set budget amount",
          content: (
            <SpaceBetween size="m">
              <FormField label="Period">
                <Box>Monthly</Box>
              </FormField>
              <FormField label="Budget name">
                <Input value={name} onChange={({ detail }) => setName(detail.value)} />
              </FormField>
              <FormField label="Enter your budgeted amount (USD)">
                <Input value={amount} onChange={({ detail }) => setAmount(detail.value)} />
              </FormField>
            </SpaceBetween>
          ),
        },
        {
          title: "Configure alerts",
          content: (
            <SpaceBetween size="m">
              <FormField label="Alert threshold (% of budgeted)">
                <Input value={threshold} onChange={({ detail }) => setThreshold(detail.value)} />
              </FormField>
              <FormField label="Email recipients">
                <Input value={email} onChange={({ detail }) => setEmail(detail.value)} />
              </FormField>
            </SpaceBetween>
          ),
        },
        {
          title: "Review",
          content: (
            <Box>
              {kind} · {name} · ${amount}/month · alert at {threshold}% → {email}
            </Box>
          ),
        },
      ]}
    />
  );
}
