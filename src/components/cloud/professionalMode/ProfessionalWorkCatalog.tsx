import { useState } from "react";
import { AwsWorkspaceConsole } from "@/components/cloud/awsConsole/AwsWorkspaceConsole";
import {
  CloudDeskShell,
  CloudLessonRow,
  CloudPhaseBlock,
} from "@/components/cloud/CloudDeskShell";

/** Professional Work — open the AWS Management Console directly (no scenario tickets yet). */
export function ProfessionalWorkCatalog() {
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>("aws");

  if (consoleOpen) {
    return <AwsWorkspaceConsole onBack={() => setConsoleOpen(false)} />;
  }

  return (
    <CloudDeskShell
      section="work"
      title="AWS Console"
      subtitle="Create your account and use the full AWS Management Console."
      progress={{ done: 0, total: 1 }}
    >
      <CloudPhaseBlock
        section="work"
        index={1}
        title="Management Console"
        description="Sign up or sign in, then explore services from Console Home."
        meta="1 entry"
        open={activeId === "aws"}
        onToggle={() => setActiveId(activeId === "aws" ? null : "aws")}
      >
        <CloudLessonRow
          section="work"
          title="AWS Management Console"
          description="Create your AWS account · Console Home · IAM · EC2 · S3 · VPC"
          meta="Open"
          onClick={() => setConsoleOpen(true)}
        />
      </CloudPhaseBlock>
    </CloudDeskShell>
  );
}
