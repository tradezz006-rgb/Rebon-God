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
import Checkbox from "@cloudscape-design/components/checkbox";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Select from "@cloudscape-design/components/select";
import Tabs from "@cloudscape-design/components/tabs";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import Tiles from "@cloudscape-design/components/tiles";
import Modal from "@cloudscape-design/components/modal";
import { useAccountStore } from "../store";
import { WIZARD_I18N } from "../ui";
import type { IamRole, IamUser } from "../types";
import { IamPolicyPickerTable, trustPolicyJson } from "./iamShared";

export function IamService() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "dashboard") return <IamDashboard />;
  if (page === "create-user") return <CreateUserWizard />;
  if (page === "create-user-success") return <CreateUserSuccess />;
  if (page === "user-detail") return <UserDetail />;
  if (page === "groups") return <GroupsPage />;
  if (page === "roles") return <RolesPage />;
  if (page === "create-role") return <CreateRoleWizard />;
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
          <span data-console-target="iam-create-user-btn" data-action-id="HIGHLIGHT:btn-create-user">
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
  const groups = useAccountStore((s) => s.groups);
  const navigate = useAccountStore((s) => s.navigate);
  const markClick = useAccountStore((s) => s.markClick);
  const deleteUsers = useAccountStore((s) => s.deleteUsers);
  const addUserToGroup = useAccountStore((s) => s.addUserToGroup);
  const interactive = useAccountStore((s) => s.interactive);
  const [selected, setSelected] = useState<IamUser[]>([]);
  const [filter, setFilter] = useState("");
  const [groupModal, setGroupModal] = useState(false);
  const [groupPick, setGroupPick] = useState<string | null>(null);

  const items = users.filter(
    (u) =>
      !filter ||
      u.username.toLowerCase().includes(filter.toLowerCase()) ||
      u.groups.some((g) => g.toLowerCase().includes(filter.toLowerCase())) ||
      u.last_activity.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div data-console-target="iam-users-table">
      <Modal
        visible={groupModal}
        onDismiss={() => setGroupModal(false)}
        header="Add users to group"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setGroupModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!groupPick || selected.length === 0}
                onClick={() => {
                  if (!groupPick) return;
                  selected.forEach((u) => addUserToGroup(u.username, groupPick));
                  setGroupModal(false);
                  setGroupPick(null);
                  setSelected([]);
                }}
              >
                Add to group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label="User group">
          <Select
            selectedOption={groupPick ? { label: groupPick, value: groupPick } : null}
            options={groups.map((g) => ({ label: g.name, value: g.name }))}
            onChange={({ detail }) => setGroupPick(detail.selectedOption.value || null)}
            placeholder="Choose a group"
          />
        </FormField>
        <Box padding={{ top: "s" }} color="text-body-secondary">
          {selected.length} user(s) selected
        </Box>
      </Modal>

      <Table
        variant="full-page"
        stickyHeader
        selectionType="multi"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        filter={
          <TextFilter
            filteringText={filter}
            filteringPlaceholder="Filter users by name or property"
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
                <Button
                  disabled={!interactive || selected.length === 0 || groups.length === 0}
                  onClick={() => setGroupModal(true)}
                >
                  Add users to group
                </Button>
                <span data-console-target="iam-create-user-btn" data-action-id="HIGHLIGHT:btn-create-user">
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
            cell: (u) => String(u.groups.length),
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
                <StatusIndicator type="stopped">Not enabled</StatusIndicator>
              ),
          },
          {
            id: "password_age",
            header: "Password age",
            cell: (u) => u.password_age || "None",
          },
        ]}
        items={items}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No users</b>
            <Box variant="p" color="inherit" padding={{ top: "xxs" }}>
              Create an IAM user to get started.
            </Box>
          </Box>
        }
      />
    </div>
  );
}

function CreateUserSuccess() {
  const username = useAccountStore((s) => s.route.selectedId);
  const user = useAccountStore((s) => s.users.find((u) => u.username === username));
  const navigate = useAccountStore((s) => s.navigate);
  const identity = useAccountStore((s) => s.identity);
  const [showPassword, setShowPassword] = useState(false);

  if (!user) {
    return (
      <Alert
        type="error"
        action={<Button onClick={() => navigate("iam", "users")}>Return to users list</Button>}
      >
        User not found.
      </Alert>
    );
  }

  const signInUrl = `https://${identity.account_id}.signin.aws.amazon.com/console`;
  const csv = [
    "User name,Console sign-in URL,Password",
    `${user.username},${signInUrl},${user.password || ""}`,
  ].join("\n");

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user.username}_credentials.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SpaceBetween size="l">
      <Alert type="success" header="IAM user Account Created Successfully">
        Save these credentials. The password is shown only once.
      </Alert>
      <Header variant="h1">Create user — Success</Header>
      <Container>
        <Table
          columnDefinitions={[
            { id: "u", header: "User name", cell: () => user.username },
            {
              id: "url",
              header: "Console sign-in URL",
              cell: () => (
                <Button variant="inline-link" href={signInUrl} target="_blank">
                  {signInUrl}
                </Button>
              ),
            },
            {
              id: "pw",
              header: "Password",
              cell: () =>
                user.password ? (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Box fontFamily="monospace-body">
                      {showPassword ? user.password : "••••••••••••"}
                    </Box>
                    <Button variant="inline-link" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </SpaceBetween>
                ) : (
                  "— (no console password)"
                ),
            },
          ]}
          items={[{ id: "1" }]}
        />
      </Container>
      <SpaceBetween direction="horizontal" size="xs">
        <Button
          data-action-id="CLICK:btn-download-credentials"
          onClick={downloadCsv}
          disabled={!user.password}
        >
          Download .csv file
        </Button>
        <Button
          variant="primary"
          data-action-id="NAV:iam-users"
          onClick={() => navigate("iam", "users")}
        >
          Return to users list
        </Button>
      </SpaceBetween>
    </SpaceBetween>
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
  const [consoleAccess, setConsoleAccess] = useState(false);
  const [identityType, setIdentityType] = useState("iam-user");
  const [customPassword, setCustomPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [mustReset, setMustReset] = useState(true);
  const [programmatic, setProgrammatic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [permMode, setPermMode] = useState("attach");
  const [group, setGroup] = useState<string | null>(null);
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [policyFilter, setPolicyFilter] = useState("");
  const [pickedPolicies, setPickedPolicies] = useState<string[]>([]);
  const [error, setError] = useState("");

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
      submitButtonText={creating ? "Creating user…" : "Create user"}
      onNavigate={({ detail }) => {
        if (detail.requestedStepIndex > 0 && !username.trim()) {
          setError("User name is required.");
          return;
        }
        if (
          detail.requestedStepIndex > 0 &&
          !/^[A-Za-z0-9+=,.@_-]{1,64}$/.test(username.trim())
        ) {
          setError(
            "Provide up to 64 characters. Valid characters: A-Z, a-z, 0-9, and +=,.@-_."
          );
          return;
        }
        setError("");
        markClick(detail.requestedStepIndex > step ? "create-user-next" : "create-user-back");
        setStep(detail.requestedStepIndex);
      }}
      onCancel={() => navigate("iam", "users")}
      onSubmit={() => {
        if (!username.trim() || creating) return;
        markClick("create-user-submit");
        setCreating(true);
        void createUser({
          username: username.trim(),
          console_access: consoleAccess,
          policies: permMode === "attach" ? pickedPolicies : resolvedPolicies,
          groups: permMode === "group" && group ? [group] : [],
          ...(customPassword && password ? { password } : {}),
        })
          .then(() => {
            if (programmatic) {
              useAccountStore.getState().createAccessKey(username.trim());
            }
          })
          .finally(() => setCreating(false));
      }}
      isLoadingNextStep={creating}
      steps={[
        {
          title: "Specify user details",
          description: "Specify a user name and optional AWS Management Console access.",
          content: (
            <SpaceBetween size="l">
              {error && <Alert type="error">{error}</Alert>}
              <Container header={<Header variant="h2">User details</Header>}>
                <FormField
                  label="User name"
                  description="Provide up to 64 characters. Valid characters: A-Z, a-z, 0-9, and +=,.@-_."
                >
                  <span data-console-target="iam-username-input" data-action-id="FILL:iam-user-name">
                    <Input
                      value={username}
                      disabled={!interactive}
                      onChange={({ detail }) => {
                        setUsername(detail.value);
                        useAccountStore.getState().setActionDraft({
                          "iam-user-name": detail.value,
                        });
                      }}
                      placeholder="e.g. jane.doe"
                    />
                  </span>
                </FormField>
              </Container>

              <Container header={<Header variant="h2">Console access — optional</Header>}>
                <SpaceBetween size="m">
                  <Checkbox
                    checked={consoleAccess}
                    disabled={!interactive}
                    onChange={({ detail }) => {
                      setConsoleAccess(detail.checked);
                      useAccountStore.getState().setActionDraft({
                        "iam-console-access": detail.checked,
                      });
                    }}
                  >
                    Provide user access to the AWS Management Console - optional
                  </Checkbox>

                  {consoleAccess && (
                    <SpaceBetween size="m">
                      <FormField label="User type">
                        <RadioGroup
                          value={identityType}
                          onChange={({ detail }) => setIdentityType(detail.value)}
                          items={[
                            {
                              value: "iam-user",
                              label: "I want to create an IAM user",
                            },
                            {
                              value: "identity-center",
                              label:
                                "Specify user identity in IAM Identity Center (Recommended)",
                              disabled: true,
                              description: "Identity Center is not simulated in this lab.",
                            },
                          ]}
                        />
                      </FormField>
                      <FormField label="Console password">
                        <RadioGroup
                          value={customPassword ? "custom" : "auto"}
                          onChange={({ detail }) =>
                            setCustomPassword(detail.value === "custom")
                          }
                          items={[
                            { value: "auto", label: "Autogenerated password" },
                            { value: "custom", label: "Custom password" },
                          ]}
                        />
                        {customPassword && (
                          <Box padding={{ top: "s" }}>
                            <Input
                              type="password"
                              value={password}
                              onChange={({ detail }) => setPassword(detail.value)}
                              placeholder="Custom password"
                            />
                          </Box>
                        )}
                      </FormField>
                      <Checkbox
                        checked={mustReset}
                        onChange={({ detail }) => setMustReset(detail.checked)}
                      >
                        Users must create a new password at next sign-in - recommended
                      </Checkbox>
                    </SpaceBetween>
                  )}

                  <Checkbox
                    checked={programmatic}
                    disabled={!interactive}
                    onChange={({ detail }) => setProgrammatic(detail.checked)}
                  >
                    Create access key for programmatic access (CLI / SDK) — optional
                  </Checkbox>
                </SpaceBetween>
              </Container>
            </SpaceBetween>
          ),
        },
        {
          title: "Set permissions",
          description:
            "Add the user to a group, copy permissions, or attach policies directly.",
          content: (
            <SpaceBetween size="l">
              <Container header={<Header variant="h2">Permissions options</Header>}>
                <Tiles
                  value={permMode}
                  onChange={({ detail }) => setPermMode(detail.value)}
                  items={[
                    {
                      value: "group",
                      label: "Add user to group",
                      description: "Best practice — manage permissions with groups.",
                    },
                    {
                      value: "copy",
                      label: "Copy permissions",
                      description: "Copy from an existing IAM user.",
                    },
                    {
                      value: "attach",
                      label: "Attach policies directly",
                      description: "Attach managed policies to this user.",
                    },
                  ]}
                />
              </Container>

              {permMode === "group" && (
                <Container header={<Header variant="h2">User groups</Header>}>
                  <FormField label="User group">
                    <Select
                      selectedOption={group ? { label: group, value: group } : null}
                      options={groups.map((g) => ({ label: g.name, value: g.name }))}
                      onChange={({ detail }) => setGroup(detail.selectedOption.value || null)}
                      placeholder="Choose a group"
                      empty="No groups yet — create one under User groups."
                    />
                  </FormField>
                </Container>
              )}
              {permMode === "copy" && (
                <Container header={<Header variant="h2">Copy permissions</Header>}>
                  <FormField label="Copy permissions from">
                    <Select
                      selectedOption={copyFrom ? { label: copyFrom, value: copyFrom } : null}
                      options={users.map((u) => ({ label: u.username, value: u.username }))}
                      onChange={({ detail }) =>
                        setCopyFrom(detail.selectedOption.value || null)
                      }
                      placeholder="Choose a user"
                    />
                  </FormField>
                </Container>
              )}
              {permMode === "attach" && (
                <Container header={<Header variant="h2">Permissions policies</Header>}>
                  <IamPolicyPickerTable
                    available={available}
                    selected={pickedPolicies}
                    onChange={setPickedPolicies}
                    filter={policyFilter}
                    onFilterChange={setPolicyFilter}
                    interactive={interactive}
                  />
                </Container>
              )}
            </SpaceBetween>
          ),
        },
        {
          title: "Review and create",
          content: (
            <SpaceBetween size="l">
              <Container header={<Header variant="h2">Step 1: User details</Header>}>
                <ColumnLayout columns={2} variant="text-grid">
                  <div>
                    <Box variant="awsui-key-label">User name</Box>
                    <Box>{username || "—"}</Box>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Console access</Box>
                    <Box>{consoleAccess ? "Enabled" : "Disabled"}</Box>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Programmatic access</Box>
                    <Box>{programmatic ? "Access key after create" : "None"}</Box>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Password reset required</Box>
                    <Box>{consoleAccess && mustReset ? "Yes" : "—"}</Box>
                  </div>
                </ColumnLayout>
              </Container>
              <Container header={<Header variant="h2">Step 2: Permissions</Header>}>
                <Box variant="awsui-key-label">Method</Box>
                <Box>
                  {permMode === "attach"
                    ? "Attach policies directly"
                    : permMode === "group"
                      ? `Add to group: ${group || "—"}`
                      : `Copy from: ${copyFrom || "—"}`}
                </Box>
                <Box padding={{ top: "s" }} variant="awsui-key-label">
                  Policies
                </Box>
                <Box>{resolvedPolicies.join(", ") || "None"}</Box>
              </Container>
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
  const navigate = useAccountStore((s) => s.navigate);
  const deleteRoles = useAccountStore((s) => s.deleteRoles);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<IamRole[]>([]);
  const [filter, setFilter] = useState("");

  const items = roles.filter(
    (r) =>
      !filter ||
      r.name.toLowerCase().includes(filter.toLowerCase()) ||
      r.trusted.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div data-console-target="iam-roles-table">
      <Table
        variant="full-page"
        stickyHeader
        selectionType="multi"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        filter={
          <TextFilter
            filteringText={filter}
            filteringPlaceholder="Filter roles by name or trusted entity"
            onChange={({ detail }) => setFilter(detail.filteringText)}
          />
        }
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${roles.length})`}
            description="An IAM role is an identity you can assume to gain temporary permissions."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={!interactive || selected.length === 0}
                  onClick={() => {
                    deleteRoles(selected.map((r) => r.name));
                    setSelected([]);
                  }}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  disabled={!interactive}
                  onClick={() => {
                    markClick("create-role");
                    navigate("iam", "create-role");
                  }}
                >
                  Create role
                </Button>
              </SpaceBetween>
            }
          >
            Roles
          </Header>
        }
        columnDefinitions={[
          {
            id: "name",
            header: "Role name",
            cell: (r) => (
              <Button variant="inline-link" disabled={!interactive}>
                {r.name}
              </Button>
            ),
          },
          {
            id: "trusted",
            header: "Trusted entities",
            cell: (r) => r.trusted,
          },
          {
            id: "activity",
            header: "Last activity",
            cell: (r) => r.last_activity,
          },
          {
            id: "session",
            header: "Maximum session duration",
            cell: (r) => r.max_session_duration || "1 hour",
          },
        ]}
        items={items}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No roles</b>
            <Box variant="p" color="inherit" padding={{ top: "xxs" }}>
              Create a role so an AWS service can assume permissions.
            </Box>
          </Box>
        }
      />
    </div>
  );
}

function CreateRoleWizard() {
  const navigate = useAccountStore((s) => s.navigate);
  const createRole = useAccountStore((s) => s.createRole);
  const available = useAccountStore((s) => s.available_policies);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);

  const [step, setStep] = useState(0);
  const [entityType, setEntityType] = useState("aws-service");
  const [useCase, setUseCase] = useState("ec2.amazonaws.com");
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [policyFilter, setPolicyFilter] = useState("");
  const [pickedPolicies, setPickedPolicies] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const servicePrincipal =
    entityType === "aws-service" ? useCase : "ec2.amazonaws.com";

  return (
    <Wizard
      i18nStrings={WIZARD_I18N}
      activeStepIndex={step}
      submitButtonText={creating ? "Creating role…" : "Create role"}
      isLoadingNextStep={creating}
      onCancel={() => navigate("iam", "roles")}
      onNavigate={({ detail }) => {
        setError("");
        markClick(detail.requestedStepIndex > step ? "create-role-next" : "create-role-back");
        setStep(detail.requestedStepIndex);
      }}
      onSubmit={() => {
        if (!roleName.trim() || creating) return;
        if (!/^[A-Za-z0-9+=,.@_-]{1,64}$/.test(roleName.trim())) {
          setError(
            "Provide up to 64 characters. Valid characters: A-Z, a-z, 0-9, and +=,.@-_."
          );
          return;
        }
        markClick("create-role-submit");
        setCreating(true);
        void createRole(roleName.trim(), servicePrincipal, pickedPolicies, {
          description: description.trim(),
          max_session_duration: "1 hour",
        }).finally(() => setCreating(false));
      }}
      steps={[
        {
          title: "Select trusted entity",
          description: "Choose who can assume this role.",
          content: (
            <SpaceBetween size="l">
              <Container header={<Header variant="h2">Trusted entity type</Header>}>
                <Tiles
                  value={entityType}
                  columns={2}
                  onChange={({ detail }) => setEntityType(detail.value)}
                  items={[
                    {
                      value: "aws-service",
                      label: "AWS service",
                      description: "Allow an AWS service to perform actions in this account.",
                    },
                    {
                      value: "aws-account",
                      label: "AWS account",
                      description: "Allow entities in another AWS account (coming soon).",
                      disabled: true,
                    },
                    {
                      value: "web-identity",
                      label: "Web identity",
                      description: "OIDC providers (coming soon).",
                      disabled: true,
                    },
                    {
                      value: "saml",
                      label: "SAML 2.0 federation",
                      description: "Enterprise IdP federation (coming soon).",
                      disabled: true,
                    },
                    {
                      value: "custom",
                      label: "Custom trust policy",
                      description: "Paste a custom JSON trust policy (coming soon).",
                      disabled: true,
                    },
                  ]}
                />
              </Container>

              {entityType === "aws-service" && (
                <Container header={<Header variant="h2">Use case</Header>}>
                  <FormField
                    label="Service or use case"
                    description="Common daily choices for instance and serverless workloads."
                  >
                    <RadioGroup
                      value={useCase}
                      onChange={({ detail }) => setUseCase(detail.value)}
                      items={[
                        {
                          value: "ec2.amazonaws.com",
                          label: "EC2",
                          description: "Allows EC2 instances to call AWS services on your behalf.",
                        },
                        {
                          value: "lambda.amazonaws.com",
                          label: "Lambda",
                          description: "Allows Lambda functions to access AWS services.",
                        },
                        {
                          value: "ecs-tasks.amazonaws.com",
                          label: "Elastic Container Service — Task",
                          description: "Allows ECS tasks to call AWS services.",
                        },
                        {
                          value: "rds.amazonaws.com",
                          label: "RDS",
                          description: "Allows RDS to access other AWS services.",
                        },
                      ]}
                    />
                  </FormField>
                </Container>
              )}
            </SpaceBetween>
          ),
        },
        {
          title: "Add permissions",
          description: "Attach managed policies that define what this role can do.",
          content: (
            <Container header={<Header variant="h2">Add permissions</Header>}>
              <IamPolicyPickerTable
                available={available}
                selected={pickedPolicies}
                onChange={setPickedPolicies}
                filter={policyFilter}
                onFilterChange={setPolicyFilter}
                interactive={interactive}
              />
            </Container>
          ),
        },
        {
          title: "Name, review, and create",
          content: (
            <SpaceBetween size="l">
              {error && <Alert type="error">{error}</Alert>}
              <Container header={<Header variant="h2">Role details</Header>}>
                <SpaceBetween size="m">
                  <FormField
                    label="Role name"
                    description="Maximum 64 characters. Valid: A-Z, a-z, 0-9, and +=,.@-_."
                  >
                    <Input
                      value={roleName}
                      disabled={!interactive}
                      onChange={({ detail }) => setRoleName(detail.value)}
                      placeholder="e.g. EC2-S3-ReadOnly"
                    />
                  </FormField>
                  <FormField label="Description - optional">
                    <Input
                      value={description}
                      disabled={!interactive}
                      onChange={({ detail }) => setDescription(detail.value)}
                      placeholder="Allows EC2 to read from S3"
                    />
                  </FormField>
                </SpaceBetween>
              </Container>

              <Container header={<Header variant="h2">Step 1: Select trusted entities</Header>}>
                <Box variant="awsui-key-label">Trust policy</Box>
                <Box
                  margin={{ top: "xs" }}
                  padding="s"
                  fontFamily="monospace-body"
                  fontSize="body-s"
                  color="text-body-secondary"
                >
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {trustPolicyJson(servicePrincipal)}
                  </pre>
                </Box>
              </Container>

              <Container header={<Header variant="h2">Step 2: Add permissions</Header>}>
                <Box>
                  {pickedPolicies.length
                    ? pickedPolicies.join(", ")
                    : "No policies selected — you can attach later."}
                </Box>
              </Container>
            </SpaceBetween>
          ),
        },
      ]}
    />
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
              flash: { type: "success", content: "Password policy saved." },
            })
          }
        >
          Save changes
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
