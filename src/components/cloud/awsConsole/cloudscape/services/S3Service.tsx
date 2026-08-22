import { useMemo, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Checkbox from "@cloudscape-design/components/checkbox";
import Toggle from "@cloudscape-design/components/toggle";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import Textarea from "@cloudscape-design/components/textarea";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import { useAccountStore } from "../store";
import { REGIONS } from "../ui";
import type { S3Bucket } from "../types";

const NAME_RE = /^(?!xn--)(?!.*\.\.)[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

export function S3Service() {
  const page = useAccountStore((s) => s.route.page);
  if (page === "create-bucket") return <CreateBucket />;
  if (page === "bucket-detail") return <BucketDetail />;
  return <BucketsList />;
}

function BucketsList() {
  const buckets = useAccountStore((s) => s.buckets);
  const navigate = useAccountStore((s) => s.navigate);
  const deleteBucket = useAccountStore((s) => s.deleteBucket);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [selected, setSelected] = useState<S3Bucket[]>([]);

  return (
    <Table
      variant="full-page"
      stickyHeader
      selectionType="single"
      selectedItems={selected}
      onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
      header={
        <Header
          variant="awsui-h1-sticky"
          counter={`(${buckets.length})`}
          description="A bucket is a container for objects. Bucket names are globally unique."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                disabled={!interactive || selected.length !== 1}
                onClick={() => {
                  if (selected[0]) {
                    deleteBucket(selected[0].name);
                    setSelected([]);
                  }
                }}
              >
                Delete
              </Button>
              <span data-console-target="create-bucket">
                <Button
                  variant="primary"
                  disabled={!interactive}
                  onClick={() => {
                    markClick("create-bucket");
                    navigate("s3", "create-bucket");
                  }}
                >
                  Create bucket
                </Button>
              </span>
            </SpaceBetween>
          }
        >
          General purpose buckets
        </Header>
      }
      columnDefinitions={[
        {
          id: "name",
          header: "Name",
          cell: (b) => (
            <span data-console-target={`bucket-${b.name}`}>
              <Button
                variant="inline-link"
                disabled={!interactive}
                onClick={() => navigate("s3", "bucket-detail", b.name)}
              >
                {b.name}
              </Button>
            </span>
          ),
        },
        { id: "region", header: "AWS Region", cell: (b) => b.region },
        {
          id: "access",
          header: "Access",
          cell: (b) =>
            b.public ? (
              <StatusIndicator type="error">Public</StatusIndicator>
            ) : (
              <StatusIndicator type="success">
                Bucket and objects not public
              </StatusIndicator>
            ),
        },
        { id: "objects", header: "Objects", cell: (b) => String(b.objects) },
        { id: "created", header: "Date created", cell: (b) => b.created },
        { id: "enc", header: "Encryption", cell: (b) => b.encryption },
        { id: "ver", header: "Versioning", cell: (b) => b.versioning },
      ]}
      items={buckets}
    />
  );
}

function CreateBucket() {
  const navigate = useAccountStore((s) => s.navigate);
  const createBucket = useAccountStore((s) => s.createBucket);
  const buckets = useAccountStore((s) => s.buckets);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const defaultRegion = useAccountStore((s) => s.identity.region);

  const [name, setName] = useState("");
  const [region, setRegion] = useState(defaultRegion);
  const [ownership, setOwnership] = useState("bucket-owner-enforced");
  const [bpa, setBpa] = useState({
    block_acls: true,
    ignore_acls: true,
    block_policy: true,
    restrict_buckets: true,
  });
  const [versioning, setVersioning] = useState(false);

  const error = useMemo(() => {
    if (!name) return "";
    if (buckets.some((b) => b.name === name)) return "A bucket with this name already exists.";
    if (!NAME_RE.test(name))
      return "Bucket names must be 3–63 characters, lowercase, and cannot look like IP addresses.";
    return "";
  }, [name, buckets]);

  return (
    <SpaceBetween size="l">
      <Header variant="h1">Create bucket</Header>
      <Container header={<Header variant="h2">General configuration</Header>}>
        <SpaceBetween size="m">
          <FormField label="Bucket name" errorText={error || undefined}>
            <span data-console-target="bucket-name-input">
              <Input
                value={name}
                disabled={!interactive}
                onChange={({ detail }) => setName(detail.value.toLowerCase())}
                placeholder="my-unique-bucket-name"
              />
            </span>
          </FormField>
          <FormField label="AWS Region">
            <Select
              selectedOption={{
                label: REGIONS.find((r) => r.id === region)?.label || region,
                value: region,
              }}
              options={REGIONS.map((r) => ({ label: `${r.label} · ${r.id}`, value: r.id }))}
              onChange={({ detail }) => setRegion(detail.selectedOption.value || region)}
            />
          </FormField>
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h2">Object Ownership</Header>}>
        <RadioGroup
          value={ownership}
          onChange={({ detail }) => setOwnership(detail.value)}
          items={[
            {
              value: "bucket-owner-enforced",
              label: "ACLs disabled (recommended)",
              description: "Bucket owner enforced",
            },
            {
              value: "bucket-owner-preferred",
              label: "ACLs enabled",
              description: "Bucket owner preferred",
            },
          ]}
        />
      </Container>
      <Container header={<Header variant="h2">Block Public Access settings for this bucket</Header>}>
        <SpaceBetween size="s">
          <Checkbox
            checked={bpa.block_acls}
            onChange={({ detail }) => setBpa({ ...bpa, block_acls: detail.checked })}
          >
            Block public access to buckets and objects granted through new access control lists (ACLs)
          </Checkbox>
          <Checkbox
            checked={bpa.ignore_acls}
            onChange={({ detail }) => setBpa({ ...bpa, ignore_acls: detail.checked })}
          >
            Block public access to buckets and objects granted through any access control lists (ACLs)
          </Checkbox>
          <Checkbox
            checked={bpa.block_policy}
            onChange={({ detail }) => setBpa({ ...bpa, block_policy: detail.checked })}
          >
            Block public access to buckets and objects granted through new public bucket or access point policies
          </Checkbox>
          <Checkbox
            checked={bpa.restrict_buckets}
            onChange={({ detail }) => setBpa({ ...bpa, restrict_buckets: detail.checked })}
          >
            Block public and cross-account access to buckets and objects through any public bucket or access point policies
          </Checkbox>
        </SpaceBetween>
      </Container>
      <Container header={<Header variant="h2">Bucket Versioning</Header>}>
        <Toggle checked={versioning} onChange={({ detail }) => setVersioning(detail.checked)}>
          Enable versioning
        </Toggle>
      </Container>
      <Container header={<Header variant="h2">Default encryption</Header>}>
        <Box>Server-side encryption with Amazon S3 managed keys (SSE-S3)</Box>
      </Container>
      <span data-console-target="create-bucket-submit">
        <Button
          variant="primary"
          disabled={!interactive || !name || !!error}
          onClick={() => {
            markClick("create-bucket-submit");
            createBucket({
              name,
              region,
              versioning,
              block_public_access: Object.values(bpa).every(Boolean),
            });
          }}
        >
          Create bucket
        </Button>
      </span>
      <Button onClick={() => navigate("s3", "buckets")}>Cancel</Button>
    </SpaceBetween>
  );
}

function BucketDetail() {
  const name = useAccountStore((s) => s.route.selectedId);
  const bucket = useAccountStore((s) => s.buckets.find((b) => b.name === name));
  const toggleBucketBpa = useAccountStore((s) => s.toggleBucketBpa);
  const uploadObject = useAccountStore((s) => s.uploadObject);
  const saveBucketPolicy = useAccountStore((s) => s.saveBucketPolicy);
  const addLifecycleRule = useAccountStore((s) => s.addLifecycleRule);
  const deleteBucket = useAccountStore((s) => s.deleteBucket);
  const interactive = useAccountStore((s) => s.interactive);
  const markClick = useAccountStore((s) => s.markClick);
  const [policy, setPolicy] = useState(bucket?.policy || "");
  const [showUpload, setShowUpload] = useState(false);
  const [objectKey, setObjectKey] = useState("");
  const [showLifecycle, setShowLifecycle] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [rulePrefix, setRulePrefix] = useState("");

  if (!bucket) return <Alert type="error">Bucket not found.</Alert>;

  const allOn = Object.values(bucket.block_public_access).every(Boolean);
  const objectKeys = bucket.object_keys || [];
  const lifecycleRules = bucket.lifecycle_rules || [];

  return (
    <SpaceBetween size="l">
      <Header
        variant="h1"
        actions={
          <Button
            disabled={!interactive}
            onClick={() => deleteBucket(bucket.name)}
          >
            Delete
          </Button>
        }
      >
        {bucket.name}
      </Header>
      <Tabs
        tabs={[
          {
            id: "objects",
            label: "Objects",
            content: (
              <SpaceBetween size="m">
                {showUpload && (
                  <SpaceBetween direction="horizontal" size="xs">
                    <FormField label="Object key">
                      <Input
                        value={objectKey}
                        disabled={!interactive}
                        onChange={({ detail }) => setObjectKey(detail.value)}
                        placeholder="e.g. uploads/file.txt"
                      />
                    </FormField>
                    <Button
                      variant="primary"
                      disabled={!interactive || !objectKey.trim()}
                      onClick={() => {
                        uploadObject(bucket.name, objectKey.trim());
                        setObjectKey("");
                        setShowUpload(false);
                      }}
                    >
                      Upload
                    </Button>
                    <Button onClick={() => setShowUpload(false)}>Cancel</Button>
                  </SpaceBetween>
                )}
                <Table
                  header={
                    <Header
                      actions={
                        <Button
                          disabled={!interactive}
                          onClick={() => setShowUpload(true)}
                        >
                          Upload
                        </Button>
                      }
                    >
                      Objects
                    </Header>
                  }
                  columnDefinitions={[
                    { id: "key", header: "Name", cell: (r) => r },
                  ]}
                  items={objectKeys}
                  empty="No objects in this bucket (simulated)."
                />
              </SpaceBetween>
            ),
          },
          {
            id: "properties",
            label: "Properties",
            content: (
              <SpaceBetween size="l">
                <Container header={<Header variant="h2">Bucket Versioning</Header>}>
                  {bucket.versioning}
                </Container>
                <Container
                  header={
                    <Header
                      variant="h2"
                      actions={
                        <Button
                          disabled={!interactive}
                          onClick={() => setShowLifecycle(true)}
                        >
                          Create lifecycle rule
                        </Button>
                      }
                    >
                      Lifecycle rules
                    </Header>
                  }
                >
                  {showLifecycle && (
                    <SpaceBetween size="s">
                      <FormField label="Rule name">
                        <Input
                          value={ruleName}
                          disabled={!interactive}
                          onChange={({ detail }) => setRuleName(detail.value)}
                          placeholder="e.g. expire-logs"
                        />
                      </FormField>
                      <FormField label="Prefix">
                        <Input
                          value={rulePrefix}
                          disabled={!interactive}
                          onChange={({ detail }) => setRulePrefix(detail.value)}
                          placeholder="e.g. logs/"
                        />
                      </FormField>
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          variant="primary"
                          disabled={!interactive || !ruleName.trim()}
                          onClick={() => {
                            addLifecycleRule(
                              bucket.name,
                              ruleName.trim(),
                              rulePrefix.trim()
                            );
                            setRuleName("");
                            setRulePrefix("");
                            setShowLifecycle(false);
                          }}
                        >
                          Create rule
                        </Button>
                        <Button onClick={() => setShowLifecycle(false)}>Cancel</Button>
                      </SpaceBetween>
                    </SpaceBetween>
                  )}
                  <Table
                    columnDefinitions={[
                      { id: "name", header: "Name", cell: (r) => r.name },
                      { id: "st", header: "Status", cell: (r) => r.status },
                      { id: "prefix", header: "Prefix", cell: (r) => r.prefix },
                      { id: "act", header: "Actions", cell: (r) => r.actions },
                    ]}
                    items={lifecycleRules}
                    empty="No lifecycle rules."
                  />
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "permissions",
            label: "Permissions",
            content: (
              <SpaceBetween size="l">
                <Container
                  header={<Header variant="h2">Block Public Access</Header>}
                >
                  <SpaceBetween size="s">
                    <Box>
                      {allOn ? "All four settings are on." : "At least one Block Public Access setting is off."}
                    </Box>
                    <span data-console-target={`bpa-${bucket.name}`}>
                      <Button
                        disabled={!interactive}
                        onClick={() => {
                          markClick(`bpa-${bucket.name}`);
                          toggleBucketBpa(bucket.name, !allOn);
                        }}
                      >
                        {allOn ? "Edit (turn Block Public Access off)" : "Turn Block Public Access on"}
                      </Button>
                    </span>
                  </SpaceBetween>
                </Container>
                <Container
                  header={
                    <Header
                      variant="h2"
                      actions={
                        <Button
                          variant="primary"
                          disabled={!interactive}
                          onClick={() => saveBucketPolicy(bucket.name, policy)}
                        >
                          Save
                        </Button>
                      }
                    >
                      Bucket policy
                    </Header>
                  }
                >
                  <Textarea
                    value={policy}
                    disabled={!interactive}
                    onChange={({ detail }) => setPolicy(detail.value)}
                    rows={8}
                    placeholder="{ }"
                  />
                </Container>
                <Container header={<Header variant="h2">Access control list (ACL)</Header>}>
                  <Box color="text-body-secondary">
                    ACLs are disabled (bucket owner enforced).
                  </Box>
                </Container>
              </SpaceBetween>
            ),
          },
          {
            id: "metrics",
            label: "Metrics",
            content: <Box color="text-body-secondary">Request metrics are not enabled.</Box>,
          },
          {
            id: "replication",
            label: "Management",
            content: <Box color="text-body-secondary">No replication rules.</Box>,
          },
        ]}
      />
    </SpaceBetween>
  );
}
