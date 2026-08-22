import { useState, useCallback, useEffect } from "react";
import type { CloudWorkspaceTask } from "@/types/cloudLesson";
import type { IamConsoleAction } from "./iamActions";
import { AccountIdGate } from "./AccountIdGate";
import { TeachableAwsConsole } from "@/components/cloud/professionalMode/TeachableAwsConsole";

export interface AccountUnlockState {
  unlocked: boolean;
  accountId: string;
  accountName: string;
}

interface OpsConsoleHostProps {
  task: CloudWorkspaceTask;
  onAccountUnlock: (state: AccountUnlockState) => void;
  onActionsChange: (actions: IamConsoleAction[]) => void;
  unlockState: AccountUnlockState;
}

/** Work tickets: Account ID gate → shared Cloudscape console. */
export function OpsConsoleHost({
  task,
  onAccountUnlock,
  onActionsChange,
  unlockState,
}: OpsConsoleHostProps) {
  const gate = task.account_gate;
  const ticket = task.ticket;
  const iam = task.iam_state;

  const handleUnlock = useCallback(
    (accountId: string, accountName: string) => {
      onAccountUnlock({ unlocked: true, accountId, accountName });
    },
    [onAccountUnlock]
  );

  if (!gate || !iam) {
    return (
      <p className="text-sm text-rose-300">
        Ops ticket misconfigured — missing account_gate or iam_state.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!unlockState.unlocked ? (
        <AccountIdGate gate={gate} onUnlocked={handleUnlock} />
      ) : (
        <div className="h-[min(78vh,820px)] min-h-[640px] overflow-hidden rounded-lg border border-[#d5dbdb] bg-white">
          <TeachableAwsConsole
            key={`${unlockState.accountId}-${task.task_id || task.id}`}
            accountId={unlockState.accountId}
            accountName={unlockState.accountName}
            region="ap-south-1"
            studentControl
            mode="work"
            iamSeed={iam}
            initialView="iam"
            onActionsChange={onActionsChange}
            ticket={
              ticket
                ? {
                    from: ticket.from,
                    subject: ticket.subject,
                    body: ticket.body,
                    priority: ticket.priority,
                  }
                : null
            }
          />
        </div>
      )}
    </div>
  );
}

export function useOpsUnlockForTask(taskId: string) {
  const [state, setState] = useState<AccountUnlockState>({
    unlocked: false,
    accountId: "",
    accountName: "",
  });
  useEffect(() => {
    setState({ unlocked: false, accountId: "", accountName: "" });
  }, [taskId]);
  return [state, setState] as const;
}
