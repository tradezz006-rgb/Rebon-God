import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { CloudWorkspaceTask } from "@/types/cloudLesson";
import {
  OpsConsoleHost,
  useOpsUnlockForTask,
  type AccountUnlockState,
  criteriaMet,
  type IamConsoleAction,
} from "@/components/cloud/awsConsole";
import {
  CloudDeskShell,
  CloudLessonRow,
  CloudPhaseBlock,
} from "@/components/cloud/CloudDeskShell";
import practiceT1 from "@/data/cloud/professional_mode/iam_practice_t1.json";

const PROBLEMS: Array<{
  id: string;
  title: string;
  blurb: string;
  task: CloudWorkspaceTask;
}> = [
  {
    id: "PRO-IAM-T1",
    title: "Priya cannot list S3 buckets",
    blurb: "IAM console · attach AmazonS3ReadOnlyAccess",
    task: practiceT1 as CloudWorkspaceTask,
  },
];

function ProfessionalConsoleTicket({
  task,
  onBack,
}: {
  task: CloudWorkspaceTask;
  onBack: () => void;
}) {
  const taskKey = String(
    (task as CloudWorkspaceTask & { task_id?: string }).task_id ||
      task.id ||
      "pro-task"
  );
  const [opsUnlock, setOpsUnlock] = useOpsUnlockForTask(taskKey);
  const [iamActions, setIamActions] = useState<IamConsoleAction[]>([]);
  const required =
    (task.success_criteria as { required_actions?: string[] } | undefined)
      ?.required_actions || ["attach_policy"];
  const attach = (
    task.success_criteria as
      | {
          attach_policy?: { user_name?: string; policy_name?: string };
        }
      | undefined
  )?.attach_policy;
  const done = criteriaMet(iamActions, required, {
    target_user: attach?.user_name,
    target_policy: attach?.policy_name,
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3.5 py-2 text-[12px] font-semibold text-muted-foreground transition hover:border-[#7C3AED]/50 hover:text-violet-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Problems
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-violet-brand">
            Work · Professional
          </p>
          <p className="truncate text-sm font-medium">
            {task.title || "IAM practice"}
          </p>
        </div>
        {done && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-violet-brand">
            Criteria met
          </span>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-2 md:p-3">
        <OpsConsoleHost
          task={task}
          unlockState={opsUnlock}
          onAccountUnlock={(s: AccountUnlockState) => setOpsUnlock(s)}
          onActionsChange={setIamActions}
        />
      </div>
    </div>
  );
}

/** Professional Work — violet Work theme, expandable list like Learn. */
export function ProfessionalWorkCatalog() {
  const [activeId, setActiveId] = useState<string | null>(PROBLEMS[0]?.id ?? null);
  const [solvingId, setSolvingId] = useState<string | null>(null);
  const solving = PROBLEMS.find((p) => p.id === solvingId);

  if (solving) {
    return (
      <ProfessionalConsoleTicket
        task={solving.task}
        onBack={() => setSolvingId(null)}
      />
    );
  }

  return (
    <CloudDeskShell
      section="work"
      title="Console problems"
      subtitle="Simulated AWS tickets. Always available — not locked behind Student Mode."
      progress={{ done: 0, total: PROBLEMS.length }}
    >
      <CloudPhaseBlock
        section="work"
        index={1}
        title="Identity & access"
        description="IAM console tickets — attach policies, fix access."
        meta={`${PROBLEMS.length} tickets`}
        open={activeId === "iam"}
        onToggle={() => setActiveId(activeId === "iam" ? null : "iam")}
      >
        {PROBLEMS.map((p) => (
          <CloudLessonRow
            key={p.id}
            section="work"
            title={p.title}
            description={p.blurb}
            meta={p.id}
            onClick={() => setSolvingId(p.id)}
          />
        ))}
      </CloudPhaseBlock>
    </CloudDeskShell>
  );
}
