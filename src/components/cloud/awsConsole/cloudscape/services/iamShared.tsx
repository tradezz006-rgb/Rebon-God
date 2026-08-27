import Table from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import TextFilter from "@cloudscape-design/components/text-filter";
import Box from "@cloudscape-design/components/box";

/** Daily-use AWS managed policies shown in IAM attach flows. */
export const IAM_POLICY_CATALOG: Array<{
  name: string;
  type: string;
  description: string;
}> = [
  {
    name: "AdministratorAccess",
    type: "AWS managed",
    description: "Provides full access to AWS services and resources.",
  },
  {
    name: "AmazonS3ReadOnlyAccess",
    type: "AWS managed",
    description: "Provides read-only access to all buckets via the AWS Management Console.",
  },
  {
    name: "AmazonEC2ReadOnlyAccess",
    type: "AWS managed",
    description: "Provides read-only access to Amazon EC2 via the AWS Management Console.",
  },
  {
    name: "AmazonEC2FullAccess",
    type: "AWS managed",
    description: "Provides full access to Amazon EC2 via the AWS Management Console.",
  },
  {
    name: "AmazonS3FullAccess",
    type: "AWS managed",
    description: "Provides full access to all buckets via the AWS Management Console.",
  },
  {
    name: "CloudWatchReadOnlyAccess",
    type: "AWS managed",
    description: "Provides read-only access to CloudWatch.",
  },
  {
    name: "IAMUserChangePassword",
    type: "AWS managed",
    description: "Allows IAM users to change their own password.",
  },
  {
    name: "ReadOnlyAccess",
    type: "AWS managed",
    description: "Provides read-only access to all AWS services and resources.",
  },
];

type Props = {
  available: string[];
  selected: string[];
  onChange: (names: string[]) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  interactive?: boolean;
};

/** Shared permissions policy picker for Create user / Create role wizards. */
export function IamPolicyPickerTable({
  available,
  selected,
  onChange,
  filter,
  onFilterChange,
  interactive = true,
}: Props) {
  const catalog = IAM_POLICY_CATALOG.filter((p) => available.includes(p.name));
  const extras = available
    .filter((name) => !IAM_POLICY_CATALOG.some((p) => p.name === name))
    .map((name) => ({
      name,
      type: "AWS managed",
      description: "Managed policy available in this account.",
    }));
  const items = [...catalog, ...extras].filter(
    (p) =>
      !filter ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.description.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div data-console-target="attach-policy-select">
      <Table
        header={
          <Header counter={selected.length ? `(${selected.length} selected)` : undefined}>
            Permissions policies
          </Header>
        }
        filter={
          <TextFilter
            filteringText={filter}
            filteringPlaceholder="Filter policies..."
            onChange={({ detail }) => onFilterChange(detail.filteringText)}
          />
        }
        selectionType="multi"
        selectedItems={items.filter((i) => selected.includes(i.name))}
        onSelectionChange={({ detail }) => {
          if (!interactive) return;
          onChange(detail.selectedItems.map((i) => i.name));
        }}
        columnDefinitions={[
          { id: "name", header: "Policy name", cell: (p) => p.name },
          { id: "type", header: "Type", cell: (p) => p.type },
          {
            id: "desc",
            header: "Description",
            cell: (p) => (
              <Box color="text-body-secondary" fontSize="body-s">
                {p.description}
              </Box>
            ),
          },
        ]}
        items={items}
        empty={
          <Box textAlign="center" color="inherit" padding="m">
            No policies match your filter.
          </Box>
        }
      />
    </div>
  );
}

export function trustPolicyJson(servicePrincipal: string): string {
  return JSON.stringify(
    {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: servicePrincipal },
          Action: "sts:AssumeRole",
        },
      ],
    },
    null,
    2
  );
}
