import { Bell, ChevronDown, HelpCircle, Search, Settings, User } from "lucide-react";

interface Props {
  activeService: string;
  region?: string;
  accountLabel?: string;
}

export function AwsConsoleChrome({ activeService, region = "ap-south-1 (Mumbai)", accountLabel = "FreshBite-Prod" }: Props) {
  return (
    <div className="bg-[#232f3e] border-b border-[#1a222c] text-white shrink-0">
      <div className="h-10 flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-[#ff9900] rounded-sm grid place-items-center text-[#232f3e] font-black text-xs">aws</div>
          <span className="text-sm font-semibold truncate hidden sm:inline">AWS Management Console</span>
        </div>

        <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-[#161b22] border border-slate-600 rounded-md px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Search services, resources, docs — press /</span>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs">
          <button type="button" className="hidden lg:flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-slate-300">
            <HelpCircle className="w-3.5 h-3.5" /> Support
          </button>
          <button type="button" className="p-1.5 rounded hover:bg-white/10 text-slate-300">
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-slate-200 border border-slate-600">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{region}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <button type="button" className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 border border-slate-600">
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline max-w-[100px] truncate">{accountLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="h-9 px-3 flex items-center gap-1 bg-[#1a222c] border-t border-slate-700/50 overflow-x-auto">
        {["Console home", activeService, "CloudShell", "Billing"].map((tab, i) => (
          <span
            key={tab}
            className={`px-3 py-1.5 text-[11px] whitespace-nowrap rounded-t ${
              i === 1 ? "bg-[#0f1115] text-[#ff9900] border-t-2 border-[#ff9900]" : "text-slate-400"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  );
}
