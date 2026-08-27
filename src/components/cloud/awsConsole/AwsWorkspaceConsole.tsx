import { useCallback, useState } from "react";
import { TeachableAwsConsole } from "@/components/cloud/professionalMode/TeachableAwsConsole";
import { useAccountStore } from "@/components/cloud/awsConsole/cloudscape/store";
import { AwsAccountSignup, iamUsernameFromEmail } from "./AwsAccountSignup";
import { loadAwsAccount, type SavedAwsAccount } from "./awsAccountStorage";

type Props = {
  onBack: () => void;
};

/** Work workspace: create/sign in to your own AWS sandbox, then open Console Home. */
export function AwsWorkspaceConsole({ onBack }: Props) {
  const [account, setAccount] = useState<SavedAwsAccount | null>(() =>
    loadAwsAccount()
  );
  const [consoleKey, setConsoleKey] = useState(0);
  const visualMode = useAccountStore((s) => s.visualMode);

  const handleComplete = useCallback((saved: SavedAwsAccount) => {
    setAccount(saved);
    setConsoleKey((k) => k + 1);
  }, []);

  if (!account) {
    return <AwsAccountSignup onComplete={handleComplete} onBack={onBack} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: visualMode === "dark" ? "#0f1419" : "#f2f3f3" }}
    >
      <div className="min-h-0 flex-1">
        <TeachableAwsConsole
          key={`${account.accountId}-${consoleKey}`}
          accountId={account.accountId}
          accountName={account.accountName}
          region={account.region}
          studentControl
          mode="work"
          fresh
          initialView="home"
          iamUsername={iamUsernameFromEmail(account.email)}
          onExitToWorkspace={onBack}
        />
      </div>
    </div>
  );
}
