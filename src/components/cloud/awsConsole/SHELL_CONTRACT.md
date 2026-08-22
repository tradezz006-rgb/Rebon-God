# Ops shell contract (CS2+)

**Principle:** 100% looking, simulated working. Ticket → Account ID → AWS service console → execute → resolve.

## Mandatory flow

1. **Ticket** — ServiceNow/Jira-style request with requester, subject, body, `request_kind`.
2. **Account ID gate** — Student *types* the 12-digit ID. Wrong ID blocks the console. Never MCQ the account.
3. **AWS service console** — Visual fidelity first (layout, labels, nav path). State is in-memory.
4. **Execute** — Perform the exact op named in the ticket (attach policy, reset key, …).
5. **Resolve ticket** — Grade `success_criteria` against the console **action log**, not `correct_index`.

## Task JSON shape

```json
{
  "type": "ops_console",
  "environment": "aws_iam_console",
  "ticket": { "from": "", "subject": "", "body": "", "request_kind": "attach_policy" },
  "account_gate": {
    "expected_account_id": "482917364051",
    "hint": "…",
    "account_directory": [{ "account_id": "", "name": "FoodQuick-Prod", "environment": "prod" }]
  },
  "iam_state": { "users": [], "available_policies": [] },
  "success_criteria": {
    "required_actions": ["attach_policy"],
    "target_user": "priya.sharma",
    "target_policy": "AmazonS3ReadOnlyAccess"
  }
}
```

## Environment IDs

| Service | `environment` value     | Status   |
|---------|-------------------------|----------|
| IAM     | `aws_iam_console`       | Shipped (Cloudscape) |
| VPC     | `aws_vpc_console`       | Shipped (Cloudscape) |
| EC2     | `aws_ec2_console`       | Shipped (Cloudscape) |
| S3      | `aws_s3_console`        | Shipped (Cloudscape) |
| CW      | `aws_cloudwatch_console`| Shipped (Cloudscape) |
| Billing | `aws_billing_console`   | Shipped (Cloudscape) |

One shared Cloudscape console (`TeachableAwsConsole` / `AwsConsole`). Learn and Work use the same tree.

## Code anchors

- Contract constants: `src/components/cloud/awsConsole/shellContract.ts`
- Host: `OpsConsoleHost` → gate + Cloudscape `TeachableAwsConsole` (IAM + EC2 + S3 + VPC + CloudWatch + Billing)
- Router: `WorkspaceEnvironmentHost` (`aws_iam_console`)
- Chrome Account ID: `AwsConsoleChrome` `accountLabel` after unlock
- Types: `ticket`, `account_gate`, `iam_state`, `success_criteria` on `CloudWorkspaceTask`

## Non-goals

Real AWS accounts, live IAM API, full ServiceNow clone, rewriting Fresher consoles.
