import { useMemo, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Wizard from "@cloudscape-design/components/wizard";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Toggle from "@cloudscape-design/components/toggle";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Select from "@cloudscape-design/components/select";
import Tabs from "@cloudscape-design/components/tabs";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { useAccountStore } from "../store";
import { WIZARD_I18N } from "../ui";
import type { IamUser } from "../types";

export function IamService() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "dashboard") return <IamDashboard />;
  if (page === "create-user") return <CreateUserWizard />;
  if (page === "user-detail") return <UserDetail />;
  if (page === "groups") return <GroupsPage />;
  if (page === "roles") return <RolesPage />;
  if (page === "policies") return <PoliciesPage />;
  if (page === "identity-providers") return <Stub title="Identity providers" />;
  if (page === "account-settings") return <AccountSettingsPage />;
  return <UsersList />;
}

function IamDashboard() {
  const users = useAccountStore((s) => s.users);
  const groups = useAccountStore((s) => s.groups);
  const roles = useAccountStore((s) => s.roles);
  const navigate = useAccountStore((s) => s.navigate);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const mfaOff = users.filter((u) => !u.mfa).length;

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="IAM is a global service — not Region-scoped.">
        IAM Dashboard
      </Header>
      <Alert type={mfaOff ? "warning" : "success"}>
        {mfaOff
          ? `${mfaOff} IAM user(s) do not have MFA enabled.`
          : "All IAM users have MFA enabled."}
      </Alert>
      <ColumnLayout columns={4} variant="text-grid">
        {[
          { label: "Users", n: users.length, page: "users", target: "nav-users" },
          { label: "User groups", n: groups.length, page: "groups", target: "nav-groups" },
          { label: "Roles", n: roles.length, page: "roles", target: "nav-roles" },
          { label: "Customer managed policies", n: 1, page: "policies", target: "nav-policies" },
        ].map((c) => (
          <Box key={c.label}>
            <Box variant="awsui-key-label">{c.label}</Box>
            <Button
              variant="inline-link"
              disabled={!interactive}
              onClick={() => {
                markClick(c.target);
                navigate("iam", c.page);
              }}
            >
              <Box fontSize="display-l" fontWeight="light">
                {c.n}
              </Box>
            </Button>
          </Box>
        ))}
      </ColumnLayout>
      <Header
        variant="h2"
        actions={
          <span data-console-target="iam-create-user-btn">
            <Button
              variant="primary"
              disabled={!interactive}
              onClick={() => {
                markClick("create-user");
                navigate("iam", "create-user");
              }}
            >
              Create user
            </Button>
          </span>
        }
      >
        IAM resources
      </Header>
    </SpaceBetween>
  );
}

function Stub({ title }: { title: string }) {
  return (
    <Box padding="l">
      <Header variant="h1">{title}</Header>
      <Box color="text-body-secondary" padding={{ top: "m" }}>
        No {title.toLowerCase()} configured in this simulated account.
      </Box>
    </Box>
  );
}

function UsersList() {
  const users = useAccountStore((s) => s.users);
  const navigate = useAccountStore((s) => s.navigate);
  const markClick = useAccountStore((s) => s.markClick);
  const deleteUsers = useAccountStore((s) => s.deleteUsers);
  const interactive = useAccountStore((s) => s.interactive);
  const [selected, setSelected] = useState<IamUser[]>([]);
  const [filter, setFilter] = useState("");

  const items = users.filter((u) =>
    u.username.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div data-console-target="iam-users-table">
      <Table
        variant="full-page"
        stickyHeader
        selectionType="multi"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        filter={
          <TextFilter
            filteringText={filter}
            filteringPlaceholder="Find users"
            onChange={({ detail }) => setFilter(detail.filteringText)}
          />
        }
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${users.length})`}
            description="An IAM user is an identity with long-term credentials in this AWS account."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={!interactive || selected.length === 0}
                  onClick={() => {
                    deleteUsers(selected.map((s) => s.username));
                    setSelected([]);
                  }}
                >
                  Delete
                </Button>
                <span data-console-target="iam-create-user-btn">
                  <Button
                    variant="primary"
                    disabled={!interactive}
                    nativeButtonAttributes={{
                      "data-console-target": "create-user",
                    }}
                    onClick={() => {
                      markClick("iam-create-user-btn");
                      markClick("create-user");
                      navigate("iam", "create-user");
                    }}
                  >
                    Create user
                  </Button>
                </span>
              </SpaceBetween>
            }
          >
            Users
          </Header>
        }
        columnDefinitions={[
          {
            id: "name",
            header: "User name",
            cell: (u) => (
              <span data-console-target={`user-${u.username}`}>
                <Button
                  variant="inline-link"
                  disabled={!interactive}
                  onClick={() => {
                    markClick(`user-${u.username}`);
                    useAccountStore.getState().log("open_user", "iam_user", u.username, {});
                    navigate("iam", "user-detail", u.username);
                  }}
                >
                  {u.username}
                </Button>
              </span>
            ),
            sortingField: "username",
          },
          {
            id: "groups",
            header: "Groups",
            cell: (u) => u.groups.join(", ") || "—",
          },
          {
            id: "activity",
            header: "Last activity",
            cell: (u) => u.last_activity,
          },
          {
            id: "mfa",
            header: "MFA",
            cell: (u) =>
              u.mfa ? (
                <StatusIndicator type="success">Enabled</StatusIndicator>
              ) : (
                <StatusIndicator type="warning">Not enabled</StatusIndicator>
              ),
          },
          {
            id: "console",
            header: "Console access",
            cell: (u) => (u.console_access ? "Enabled" : "Disabled"),
          },
          { id: "created", header: "Created", cell: (u) => u.created },
          {
            id: "actions",
            header: "Actions",
            cell: (u) => (
              <Button
                variant="inline-link"
                disabled={!interactive}
                onClick={() => navigate("iam", "user-detail", u.username)}
              >
                View
              </Button>
            ),
          },
        ]}
        items={items}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No users</b>
          </Box>
        }
      />
    </div>
  );
}

function CreateUserWizard() {
  const navigate = useAccountStore((s) => s.navigate);
  const createUser = useAccountStore((s) => s.createUser);
  const markClick = useAccountStore((s) => s.markClick);
  const interactive = useAccountStore((s) => s.interactive);
  const available = useAccountStore((s) => s.available_policies);
  const groups = useAccountStore((s) => s.groups);
  const users = useAccountStore((s) => s.users);

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [consoleAccess, setConsoleAccess] = useState(true);
  const [customPassword, setCustomPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [permMode, setPermMode] = useState("attach");
  const [group, setGroup] = useState<string | null>(null);
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [policyFilter, setPolicyFilter] = useState("");
  const [pickedPolicies, setPickedPolicies] = useState<string[]>([]);
  const [error, setError] = useState("");

  const policyItems = available
    .filter((p) => p.toLowerCase().includes(policyFilter.toLowerCase()))
    .map((p) => ({ name: p }));

  const resolvedPolicies = useMemo(() => {
    if (permMode === "attach") return pickedPolicies;
    if (permMode === "copy" && copyFrom) {
      return users.find((u) => u.username === copyFrom)?.policies || [];
    }
    if (permMode === "group" && group) {
      return groups.find((g) => g.name === group)?.policies || [];
    }
    return [];
  }, [permMode, pickedPolicies, copyFrom, group, users, groups]);

  return (
    <Wizard
      i18nStrings={WIZARD_I18N}
      activeStepIndex={step}
      submitButtonText="Create user"
      onNavigate={({ detail }) => {
        if (detail.requestedStepIndex > 0 && !username.trim()) {
          setError("User name is required.");
          return;
        }
        setError("");
        markClick(detail.requestedStepIndex > step ? "create-user-next" : "create-user-back");
        setStep(detail.requestedStepIndex);
      }}
      onCancel={() => navigate("iam", "users")}
      onSubmit={() => {
        if (!username.trim()) return;
        markClick("create-user-submit");
        createUser({
          username: username.trim(),
          console_access: consoleAccess,
          policies: permMode === "attach" ? pickedPolicies : resolvedPolicies,
          groups: permMode === "group" && group ? [group] : [],
          ...(customPassword && password ? { password } : {}),
        });
      }}
      steps={[
        {
          title: "User details",
          description: "Specify a user name and AWS Management Console access.",
          content: (
            <SpaceBetween size="l">
              {error && <Alert type="error">{error}</Alert>}
              <FormField
                label="User name"
                description="Maximum 64 characters. Use letters, numbers, and + = , . @ - _"
              >
                <span data-console-target="iam-username-input">
                  <Input
                    value={username}
                    disabled={!interactive}
                    onChange={({ detail }) => setUsername(detail.value)}
                    placeholder="e.g. priya.dev"
                  />
                </span>
              </FormField>
              <FormField label="Provide user access to the AWS Management Console">
                <Toggle
                  checked={consoleAccess}
                  disabled={!interactive}
                  onChange={({ detail }) => setConsoleAccess(detail.checked)}
                >
                  Enable console access — optional
                </Toggle>
              </FormField>
              {consoleAccess && (
                <FormField label="Console password">
                  <RadioGroup
                    value={customPassword ? "custom" : "auto"}
                    onChange={({ detail }) => setCustomPassword(detail.value === "custom")}
                    items={[
                      { value: "auto", label: "Autogenerated password" },
                      { value: "custom", label: "Custom password" },
                    ]}
                  />
                  {customPassword && (
                    <Input
                      type="password"
                      value={password}
                      onChange={({ detail }) => setPassword(detail.value)}
                      placeholder="Custom password"
                    />
                  )}
                </FormField>
              )}
            </SpaceBetween>
          ),
        },
        {
          title: "Set permissions",
          description: "Add the user to a group, copy permissions, or attach policies directly.",
          content: (
            <SpaceBetween size="l">
              <RadioGroup
                value={permMode}
                onChange={({ detail }) => setPermMode(detail.value)}
                items={[
                  { value: "group", label: "Add user to group" },
                  { value: "copy", label: "Copy permissions" },
                  { value: "attach", label: "Attach policies directly" },
                ]}
              />
              {permMode === "group" && (
                <FormField label="User group">
                  <Select
                    selectedOption={group ? { label: group, value: group } : null}
                    options={groups.map((g) => ({ label: g.name, value: g.name }))}
                    onChange={({ detail }) => setGroup(detail.selectedOption.value || null)}
                    placeholder="Choose a group"
                  />
                </FormField>
              )}
              {permMode === "copy" && (
                <FormField label="Copy permissions from">
                  <Select
                    selectedOption={copyFrom ? { label: copyFrom, value: copyFrom } : null}
                    options={users.map((u) => ({ label: u.username, value: u.username }))}
                    onChange={({ detail }) => setCopyFrom(detail.selectedOption.value || null)}
                    placeholder="Choose a user"
                  />
                </FormField>
              )}
              {permMode === "attach" && (
                <div data-console-target="attach-policy-select">
                  <Table
                    header={<Header>Permissions policies ({pickedPolicies.length} selected)</Header>}
                    filter={
                      <TextFilter
                        filteringText={policyFilter}
                        filteringPlaceholder="Search policies"
                        onChange={({ detail }) => setPolicyFilter(detail.filteringText)}
                      />
                    }
                    selectionType="multi"
                    selectedItems={pickedPolicies.map((name) => ({ name }))}
                    onSelectionChange={({ detail }) =>
                      setPickedPolicies(detail.selectedItems.map((i) => i.name))
                    }
                    columnDefinitions={[
                      { id: "name", header: "Policy name", cell: (p) => p.name },
                      { id: "type", header: "Type", cell: () => "AWS managed" },
                    ]}
                    items={policyItems}
                  />
                </div>
              )}
            </SpaceBetween>
          ),
        },
        {
          title: "Tags",
          isOptional: true,
          content: (
            <Box color="text-body-secondary">
              You can add tags later. Tags are key-value pairs used to organize users.
            </Box>
          ),
        },
        {
          title: "Review and create",
          content: (
            <SpaceBetween size="m">
              <Box>
                <b>User name:</b> {username || "—"}
              </Box>
              <Box>
                <b>Console access:</b> {consoleAccess ? "Enabled" : "Disabled"}
              </Box>
              <Box>
                <b>Permissions:</b> {resolvedPolicies.join(", ") || "None"}
              </Box>
            </SpaceBetween>
          ),
        },
      ]}
    />
  );
}

function UserDetail() {
  const username = useAccountStore((s) => s.route.selectedId);
  const user = useAccountStore((s) => s.users.find((u) => u.username === username));
  const groups = useAccountStore((s) => s.groups);
  const navigate = useAccountStore((s) => s.navigate);
  const attachPolicy = useAccountStore((s) => s.attachPolicy);
  const detachPolicy = useAccountStore((s) => s.detachPolicy);
  const addUserToGroup = useAccountStore((s) => s.addUserToGroup);
  const setUserMfa = useAccountStore((s) => s.setUserMfa);
  const createAccessKey = useAccountStore((s) => s.createAccessKey);
  const deleteAccessKey = useAccountStore((s) => s.deleteAccessKey);
  const available = useAccountStore((s) => s.available_policies);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [policy, setPolicy] = useState<string | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [groupToAdd, setGroupToAdd] = useState<string | null>(null);

  if (!user) {
    return (
      <Alert type="error">
        User not found.{" "}
        <Button onClick={() => navigate("iam", "users")}>Back to users</Button>
      </Alert>
    );
  }

  const joinableGroups = groups.filter((g) => !user.groups.includes(g.name));

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        description={`arn:aws:iam::${useAccountStore.getState().identity.account_id}:user/${user.username}`}
      >
        {user.username}
      </Header>
      <Tabs
        tabs={[
          {
            id: "permissions",
            label: "Permissions",
            content: (
              <SpaceBetween size="m">
                <Header
                  variant="h2"
                  actions={
                    <span data-console-target="add-permissions">
                      <Button
                        disabled={!interactive}
                        onClick={() => {
                          markClick("add-permissions");
                          setShowAttach(true);
                        }}
                      >
                        Add permissions
                      </Button>
                    </span>
                  }
                >
                  Permissions policies ({user.policies.length})
                </Header>
                {showAttach && (
                  <SpaceBetween size="s">
                    <FormField label="Attach AWS managed policy">
                      <span data-console-target="attach-policy-select">
                        <Select
                          selectedOption={
                            policy ? { label: policy, value: policy } : null
                          }
                          options={available.map((p) => ({ label: p, value: p }))}
                          onChange={({ detail }) =>
                            setPolicy(detail.selectedOption.value || null)
                          }
                          filteringType="auto"
                          placeholder="Select a policy"
                        />
                      </span>
                    </FormField>
                    <span data-console-target="attach-policy-submit">
                      <Button
                        variant="primary"
                        disabled={!interactive || !policy}
                        onClick={() => {
                          if (!policy) return;
                          markClick("attach-policy-submit");
                          attachPolicy(user.username, policy);
                          setShowAttach(false);
                          setPolicy(null);
                        }}
                      >
                        Attach policy
                      </Button>
                    </span>
                  </SpaceBetween>
                )}
                <Table
                  columnDefinitions={[
                    { id: "name", header: "Policy name", cell: (p) => p },
                    { id: "type", header: "Type", cell: () => "Managed policy" },
                    {
                      id: "actions",
                      header: "Actions",
                      cell: (p) => (
                        <Button
                          variant="inline-link"
                          disabled={!interactive}
                          onClick={() => detachPolicy(user.username, p)}
                        >
                          Detach
                        </Button>
                      ),
                    },
                  ]}
                  items={user.policies}
                  empty="No permissions policies attached."
                />
              </SpaceBetween>
            ),
          },
          {
            id: "groups",
            label: "Groups",
            content: (
              <SpaceBetween size="m">
                <Header
                  variant="h2"
                  actions={
                    <SpaceBetween direction="horizontal" size="xs">
                      <Select
                        selectedOption={
                          groupToAdd
                            ? { label: groupToAdd, value: groupToAdd }
                            : null
                        }
                        options={joinableGroups.map((g) => ({
                          label: g.name,
                          value: g.name,
                        }))}
                        onChange={({ detail }) =>
                          setGroupToAdd(detail.selectedOption.value || null)
                        }
                        placeholder="Select a group"
                        disabled={!interactive || joinableGroups.length === 0}
                      />
                      <Button
                        disabled={!interactive || !groupToAdd}
                        onClick={() => {
                          if (!groupToAdd) return;
                          addUserToGroup(user.username, groupToAdd);
                          setGroupToAdd(null);
                        }}
                      >
                        Add to group
                      </Button>
                    </SpaceBetween>
                  }
                >
                  Groups ({user.groups.length})
                </Header>
                <Table
                  columnDefinitions={[
                    { id: "name", header: "Group name", cell: (g) => g },
                  ]}
                  items={user.groups}
                  empty="This user does not belong to any groups."
                />
              </SpaceBetween>
            ),
          },
          {
            id: "security",
            label: "Security credentials",
            content: (
              <SpaceBetween size="l">
                <Header variant="h2">
                  Console password — {user.console_access ? "Enabled" : "Disabled"}
                </Header>
                <Header
                  variant="h2"
                  actions={
                    <Button
                      disabled={!interactive}
                      onClick={() => setUserMfa(user.username, !user.mfa)}
                    >
                      {user.mfa ? "Disable MFA" : "Enable MFA"}
                    </Button>
                  }
                >
                  Multi-factor authentication (MFA) —{" "}
                  {user.mfa ? "Assigned" : "Not assigned"}
                </Header>
                <Table
                  header={
                    <Header
                      actions={
                        <Button
                          disabled={!interactive}
                          onClick={() => createAccessKey(user.username)}
                        >
                          Create access key
                        </Button>
                      }
                    >
                      Access keys ({user.access_keys.length})
                    </Header>
                  }
                  columnDefinitions={[
                    { id: "id", header: "Access key ID", cell: (k) => k.id },
                    { id: "status", header: "Status", cell: (k) => k.status },
                    { id: "created", header: "Created", cell: (k) => k.created },
                    {
                      id: "actions",
                      header: "Actions",
                      cell: (k) => (
                        <Button
                          variant="inline-link"
                          disabled={!interactive}
                          onClick={() => deleteAccessKey(user.username, k.id)}
                        >
                          Delete
                        </Button>
                      ),
                    },
                  ]}
                  items={user.access_keys}
                  empty="No access keys."
                />
              </SpaceBetween>
            ),
          },
          {
            id: "advisor",
            label: "Access Advisor",
            content: (
              <Box color="text-body-secondary">
                Service last accessed data is not generated in this simulated account.
              </Box>
            ),
          },
          {
            id: "tags",
            label: "Tags",
            content: <Box color="text-body-secondary">No tags.</Box>,
          },
        ]}
      />
    </SpaceBetween>
  );
}

function GroupsPage() {
  const groups = useAccountStore((s) => s.groups);
  const createGroup = useAccountStore((s) => s.createGroup);
  const interactive = useAccountStore((s) => s.interactive);
  const [name, setName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  return (
    <SpaceBetween size="l">
      {showCreate && (
        <SpaceBetween direction="horizontal" size="xs">
          <FormField label="Group name">
            <Input
              value={name}
              disabled={!interactive}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="e.g. Developers"
            />
          </FormField>
          <Button
            variant="primary"
            disabled={!interactive || !name.trim()}
            onClick={() => {
              createGroup(name.trim());
              setName("");
              setShowCreate(false);
            }}
          >
            Create group
          </Button>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
        </SpaceBetween>
      )}
      <Table
        variant="full-page"
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${groups.length})`}
            actions={
              <Button
                disabled={!interactive}
                onClick={() => setShowCreate(true)}
              >
                Create group
              </Button>
            }
          >
            User groups
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Group name", cell: (g) => g.name },
          { id: "users", header: "Users", cell: (g) => String(g.members.length) },
          { id: "policies", header: "Attached policies", cell: (g) => g.policies.join(", ") || "—" },
        ]}
        items={groups}
      />
    </SpaceBetween>
  );
}

function RolesPage() {
  const roles = useAccountStore((s) => s.roles);
  const createRole = useAccountStore((s) => s.createRole);
  const interactive = useAccountStore((s) => s.interactive);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [trusted, setTrusted] = useState("ec2.amazonaws.com");

  return (
    <SpaceBetween size="l">
      {showCreate && (
        <SpaceBetween size="s">
          <FormField label="Role name">
            <Input
              value={name}
              disabled={!interactive}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="e.g. EC2-S3-Access"
            />
          </FormField>
          <FormField label="Trusted entity">
            <Input
              value={trusted}
              disabled={!interactive}
              onChange={({ detail }) => setTrusted(detail.value)}
              placeholder="ec2.amazonaws.com"
            />
          </FormField>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              disabled={!interactive || !name.trim() || !trusted.trim()}
              onClick={() => {
                createRole(name.trim(), trusted.trim());
                setName("");
                setTrusted("ec2.amazonaws.com");
                setShowCreate(false);
              }}
            >
              Create role
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
            counter={`(${roles.length})`}
            actions={
              <Button
                disabled={!interactive}
                onClick={() => setShowCreate(true)}
              >
                Create role
              </Button>
            }
          >
            Roles
          </Header>
        }
        columnDefinitions={[
          { id: "name", header: "Role name", cell: (r) => r.name },
          { id: "trusted", header: "Trusted entities", cell: (r) => r.trusted },
          { id: "activity", header: "Last activity", cell: (r) => r.last_activity },
        ]}
        items={roles}
      />
    </SpaceBetween>
  );
}

function PoliciesPage() {
  const policies = useAccountStore((s) => s.policies);
  const createPolicy = useAccountStore((s) => s.createPolicy);
  const interactive = useAccountStore((s) => s.interactive);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const items =
    filter === "all"
      ? policies
      : policies.filter((p) =>
          filter === "aws"
            ? p.type === "AWS managed"
            : filter === "customer"
              ? p.type === "Customer managed"
              : p.type === "Job function"
        );
  return (
    <SpaceBetween size="l">
      {showCreate && (
        <SpaceBetween direction="horizontal" size="xs">
          <FormField label="Policy name">
            <Input
              value={name}
              disabled={!interactive}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="e.g. CustomS3ReadOnly"
            />
          </FormField>
          <Button
            variant="primary"
            disabled={!interactive || !name.trim()}
            onClick={() => {
              createPolicy(name.trim());
              setName("");
              setShowCreate(false);
            }}
          >
            Create policy
          </Button>
          <Button onClick={() => setShowCreate(false)}>Cancel</Button>
        </SpaceBetween>
      )}
      <Table
        variant="full-page"
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${items.length})`}
            actions={
              <Button
                disabled={!interactive}
                onClick={() => setShowCreate(true)}
              >
                Create policy
              </Button>
            }
          >
            Policies
          </Header>
        }
        filter={
          <Select
            selectedOption={{
              label:
                filter === "aws"
                  ? "AWS managed"
                  : filter === "customer"
                    ? "Customer managed"
                    : filter === "job"
                      ? "Job function"
                      : "All types",
              value: filter,
            }}
            options={[
              { label: "All types", value: "all" },
              { label: "AWS managed", value: "aws" },
              { label: "Customer managed", value: "customer" },
              { label: "Job function", value: "job" },
            ]}
            onChange={({ detail }) => setFilter(detail.selectedOption.value || "all")}
          />
        }
        columnDefinitions={[
          { id: "name", header: "Policy name", cell: (p) => p.name },
          { id: "type", header: "Type", cell: (p) => p.type },
          { id: "attached", header: "Attached entities", cell: (p) => String(p.attached) },
          { id: "created", header: "Created", cell: (p) => p.created },
        ]}
        items={items}
      />
    </SpaceBetween>
  );
}

function AccountSettingsPage() {
  const interactive = useAccountStore((s) => s.interactive);
  const [minLength, setMinLength] = useState(true);
  const [requireUpper, setRequireUpper] = useState(true);
  const [requireLower, setRequireLower] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSymbol, setRequireSymbol] = useState(false);
  const [expirePasswords, setExpirePasswords] = useState(false);

  return (
    <SpaceBetween size="l">
      <Header variant="h1" description="Password policy for IAM users in this account.">
        Account settings
      </Header>
      <SpaceBetween size="m">
        <Toggle
          checked={minLength}
          disabled={!interactive}
          onChange={({ detail }) => setMinLength(detail.checked)}
        >
          Require a minimum password length of 8 characters
        </Toggle>
        <Toggle
          checked={requireUpper}
          disabled={!interactive}
          onChange={({ detail }) => setRequireUpper(detail.checked)}
        >
          Require at least one uppercase letter
        </Toggle>
        <Toggle
          checked={requireLower}
          disabled={!interactive}
          onChange={({ detail }) => setRequireLower(detail.checked)}
        >
          Require at least one lowercase letter
        </Toggle>
        <Toggle
          checked={requireNumber}
          disabled={!interactive}
          onChange={({ detail }) => setRequireNumber(detail.checked)}
        >
          Require at least one number
        </Toggle>
        <Toggle
          checked={requireSymbol}
          disabled={!interactive}
          onChange={({ detail }) => setRequireSymbol(detail.checked)}
        >
          Require at least one non-alphanumeric character
        </Toggle>
        <Toggle
          checked={expirePasswords}
          disabled={!interactive}
          onChange={({ detail }) => setExpirePasswords(detail.checked)}
        >
          Enable password expiration
        </Toggle>
        <Button
          variant="primary"
          disabled={!interactive}
          onClick={() =>
            useAccountStore.setState({
              flash: "Password policy saved.",
            })
          }
        >
          Save changes
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
