/**
 * Shell contract for Building Basics+ ops workspaces.
 *
 * Every interactive console ticket MUST follow:
 *   1. Ticket opens (queue / ServiceNow-style)
 *   2. Student TYPES Account ID — wrong ID blocks console
 *   3. Simulated AWS service console unlocks for that account
 *   4. Student navigates + executes the requested operation
 *   5. Resolve ticket grades action log vs success_criteria
 *
 * Backend is simulated. Surface must look like real AWS.
 * Reuse this contract for VPC / EC2 / S3 / CloudWatch consoles later.
 */
export const OPS_SHELL_CONTRACT = {
  version: 1,
  steps: [
    "ticket",
    "account_id_gate",
    "aws_service_console",
    "execute_operation",
    "resolve_ticket",
  ] as const,
  environmentIds: {
    iam: "aws_iam_console",
    // Future: vpc: "aws_vpc_console", ec2: "aws_ec2_console", …
  },
} as const;

export function normalizeAccountId(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

export function formatAccountIdDisplay(id12: string): string {
  const d = normalizeAccountId(id12);
  if (d.length !== 12) return d;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}`;
}

export function accountIdsMatch(input: string, expected: string): boolean {
  return normalizeAccountId(input) === normalizeAccountId(expected);
}
