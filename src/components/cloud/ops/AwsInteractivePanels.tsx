import { useState } from "react";
import { Check, ChevronDown, DollarSign, Globe, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const REGIONS = [
  { id: "us-east-1", label: "US East (N. Virginia)" },
  { id: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { id: "eu-central-1", label: "Europe (Frankfurt)" },
  { id: "eu-west-2", label: "Europe (London)" },
];

interface RegionPanelProps {
  correctRegion: string;
  onCorrect: () => void;
  onWrong: () => void;
}

export function RegionSelectorPanel({ correctRegion, onCorrect, onWrong }: RegionPanelProps) {
  const [selected, setSelected] = useState("us-east-1");
  const [open, setOpen] = useState(false);

  const apply = () => {
    if (selected === correctRegion) onCorrect();
    else onWrong();
  };

  return (
    <div className="mt-5 rounded-lg border border-slate-700 bg-[#232f3e] p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">AWS Console · Region selector</p>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border border-slate-600 rounded text-sm text-white"
        >
          <Globe className="w-4 h-4 text-[#ff9900]" />
          {REGIONS.find((r) => r.id === selected)?.label}
          <ChevronDown className="w-4 h-4" />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#161b22] border border-slate-600 rounded shadow-xl z-10">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setSelected(r.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#232f3e] ${selected === r.id ? "text-[#ff9900]" : "text-slate-300"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button onClick={apply} className="mt-4 bg-[#ff9900] hover:bg-[#e88b00] text-[#232f3e] font-bold text-xs">
        Apply region to deployment
      </Button>
    </div>
  );
}

export function AccountMenuPanel({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ["account", "billing"];

  return (
    <div className="mt-5 rounded-lg border border-slate-700 bg-[#232f3e] p-4">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">AWS Console · Account menu (top-right)</p>
      <div className="bg-[#161b22] rounded border border-slate-600 p-3 max-w-xs ml-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-700 mb-2">
          <User className="w-4 h-4" />
          <span className="text-sm">cloud-engineer@freshbite.in</span>
        </div>
        {step === 0 ? (
          <button type="button" onClick={() => setStep(1)} className="w-full text-left text-xs py-2 px-2 rounded hover:bg-[#232f3e] text-slate-300">
            Account ID: <span className="text-[#ff9900] font-mono">123456789012</span>
          </button>
        ) : (
          <button type="button" onClick={onComplete} className="w-full text-left text-xs py-2 px-2 rounded hover:bg-[#232f3e] text-[#ff9900] flex items-center gap-2">
            <DollarSign className="w-3 h-3" /> Billing Dashboard
            <Check className="w-3 h-3 ml-auto text-emerald-400" />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-2">Click Account ID, then Billing Dashboard.</p>
    </div>
  );
}

export function CostExplorerPanel({ onInsight }: { onInsight: (text: string) => void }) {
  const services = [
    { name: "EC2 Compute", cost: "₹42,300", pct: 38 },
    { name: "Data Transfer OUT", cost: "₹28,100", pct: 25, highlight: true },
    { name: "EBS Storage", cost: "₹18,400", pct: 16 },
    { name: "RDS", cost: "₹12,200", pct: 11 },
  ];

  return (
    <div className="mt-5 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-4 py-2 bg-[#232f3e] flex items-center gap-2 border-b border-slate-700">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium">Cost Explorer · Last 30 days</span>
        <span className="ml-auto text-xs text-slate-400">Group by: Service</span>
      </div>
      <div className="p-4 bg-[#0f1115] space-y-2">
        {services.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => onInsight(`${s.name}: ${s.cost} (${s.pct}% of total)`)}
            className={`w-full flex items-center gap-3 p-3 rounded border text-left transition ${
              s.highlight ? "border-rose-500/40 bg-rose-950/20" : "border-slate-800 hover:border-slate-600"
            }`}
          >
            <div className="flex-1">
              <div className="text-sm text-slate-200">{s.name}</div>
              <div className="h-1.5 mt-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#ff9900]" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
            <span className="text-sm font-mono text-slate-300">{s.cost}</span>
          </button>
        ))}
      </div>
      <div className="px-4 py-2 bg-[#161b22] border-t border-slate-700 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-xs text-slate-500">Click a service line to investigate cost driver</span>
      </div>
    </div>
  );
}

export function getInteractiveMode(taskId: string): "region" | "account" | "cost" | null {
  if (["C1.2-T2", "C1.2-T5", "C1.3-T1"].includes(taskId)) return "region";
  if (taskId === "C1.3-T3") return "account";
  if (taskId.startsWith("C1.4")) return "cost";
  return null;
}

export function getCorrectRegion(taskId: string): string {
  if (taskId === "C1.2-T2") return "eu-central-1";
  if (taskId === "C1.2-T5" || taskId === "C1.3-T1") return "ap-south-1";
  return "ap-south-1";
}
