import type { ReactNode } from "react";

/** Hit target for Ren's cursor. Avoid display:contents — getBoundingClientRect must work. */
export function Target({
  id,
  children,
  block,
}: {
  id: string;
  children: ReactNode;
  block?: boolean;
}) {
  return (
    <span
      data-console-target={id}
      style={{ display: block ? "block" : "inline-block" }}
    >
      {children}
    </span>
  );
}

export const WIZARD_I18N = {
  stepNumberLabel: (n: number) => `Step ${n}`,
  collapsedStepsLabel: (n: number, t: number) => `Step ${n} of ${t}`,
  navigationAriaLabel: "Steps",
  cancelButton: "Cancel",
  previousButton: "Previous",
  nextButton: "Next",
  optional: "optional",
  nextButtonLoadingAnnouncement: "Loading next step",
  submitButtonLoadingAnnouncement: "Submitting",
};

export const REGIONS: { id: string; label: string }[] = [
  { id: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { id: "ap-south-2", label: "Asia Pacific (Hyderabad)" },
  { id: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { id: "us-east-1", label: "US East (N. Virginia)" },
  { id: "eu-west-1", label: "Europe (Ireland)" },
];

export const SERVICES: {
  id: "iam" | "ec2" | "s3" | "vpc" | "cloudwatch" | "billing";
  name: string;
  blurb: string;
  target: string;
  category: string;
  color: string;
}[] = [
  {
    id: "iam",
    name: "IAM",
    blurb: "Manage users, groups, roles, and permissions",
    target: "service-iam",
    category: "Security, Identity, & Compliance",
    color: "#dd344c",
  },
  {
    id: "ec2",
    name: "EC2",
    blurb: "Virtual servers in the cloud",
    target: "service-ec2",
    category: "Compute",
    color: "#ed7100",
  },
  {
    id: "s3",
    name: "S3",
    blurb: "Scalable storage in the cloud",
    target: "service-s3",
    category: "Storage",
    color: "#3f8624",
  },
  {
    id: "vpc",
    name: "VPC",
    blurb: "Isolated cloud resources",
    target: "service-vpc",
    category: "Networking & Content Delivery",
    color: "#8c4fff",
  },
  {
    id: "cloudwatch",
    name: "CloudWatch",
    blurb: "Monitoring and observability",
    target: "service-cloudwatch",
    category: "Management & Governance",
    color: "#e7157b",
  },
  {
    id: "billing",
    name: "Billing and Cost Management",
    blurb: "Cost Explorer and Budgets",
    target: "service-billing",
    category: "Cloud Financial Management",
    color: "#ff9900",
  },
];
