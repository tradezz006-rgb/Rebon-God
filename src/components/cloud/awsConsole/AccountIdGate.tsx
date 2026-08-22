import { useState } from "react";
import { KeyRound, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountGateMeta } from "@/types/cloudLesson";
import {
  accountIdsMatch,
  formatAccountIdDisplay,
  normalizeAccountId,
} from "./shellContract";

interface AccountIdGateProps {
  gate: AccountGateMeta;
  companyLabel?: string;
  onUnlocked: (accountId: string, accountName: string) => void;
}

export function AccountIdGate({
  gate,
  companyLabel = "FoodQuick",
  onUnlocked,
}: AccountIdGateProps) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const digits = normalizeAccountId(value);
  const canSubmit = digits.length === 12;

  const submit = () => {
    if (!canSubmit) {
      setError("Account ID must be exactly 12 digits.");
      return;
    }
    if (!accountIdsMatch(digits, gate.expected_account_id)) {
      const next = attempts + 1;
      setAttempts(next);
      setError(
        next >= 2 && gate.hint
          ? `Wrong Account ID. Hint: ${gate.hint}`
          : "That Account ID is not in scope for this ticket. Ask the requester — never guess across accounts."
      );
      return;
    }
    const entry =
      gate.account_directory.find(
        (a) => normalizeAccountId(a.account_id) === digits
      ) || {
        account_id: digits,
        name: `${companyLabel}-Prod`,
        environment: "prod",
      };
    onUnlocked(digits, entry.name);
  };

  return (
    <div className="rounded-lg border border-slate-600 bg-[#0b1220] overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 bg-[#232f3e] flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[#ff9900]" />
        <span className="text-sm font-medium text-slate-100">
          Account access required
        </span>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          You cannot open the console until you know which AWS account this
          ticket belongs to. Type the <strong className="text-white">12-digit Account ID</strong>{" "}
          from the ticket (or ask the requester). You do not browse{" "}
          {companyLabel}&rsquo;s accounts — you ask.
        </p>

        {gate.account_directory.length > 0 && (
          <div className="rounded border border-slate-700 bg-[#161b22] p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              Known {companyLabel} accounts (directory — not a picker)
            </p>
            <ul className="space-y-1.5">
              {gate.account_directory.map((a) => (
                <li
                  key={a.account_id}
                  className="text-xs font-mono text-slate-400 flex justify-between gap-2"
                >
                  <span>{a.name}</span>
                  <span className="text-slate-600">{a.environment}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">
              IDs are intentionally not listed here. Get them from the ticket.
            </p>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
            AWS Account ID
          </label>
          <Input
            value={value}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d-]/g, "").slice(0, 14);
              setValue(next);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="1234-5678-9012"
            className="font-mono text-base bg-[#0f1115] border-slate-600 text-white h-11 tracking-wider"
            autoComplete="off"
            inputMode="numeric"
            aria-label="AWS Account ID"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            {digits.length}/12 digits
            {digits.length === 12
              ? ` · ${formatAccountIdDisplay(digits)}`
              : ""}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={submit}
          disabled={!canSubmit}
          className="bg-[#ff9900] hover:bg-[#ec7211] text-[#16191f] font-semibold"
        >
          Open console for this account
        </Button>
      </div>
    </div>
  );
}
