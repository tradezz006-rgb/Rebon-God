import { motion, AnimatePresence } from "framer-motion";
import { Lock, Server, Shield, Globe, DollarSign, Activity, Zap, Network } from "lucide-react";
import { LESSON_MISSIONS, TASK_ARCHITECTURE_UNLOCKS } from "@/data/cloud/projectPhoenix";

interface Props {
  lessonId: string;
  tasksCompleted: number;
  totalTasks: number;
  lessonComplete: boolean;
  completedTaskIds: string[];
}

export function CloudArchitecturePanel({
  lessonId,
  tasksCompleted,
  totalTasks,
  lessonComplete,
  completedTaskIds,
}: Props) {
  const mission = LESSON_MISSIONS[lessonId];
  const baseLevel = mission?.architectureLevel ?? 1;
  const taskProgress = totalTasks > 0 ? tasksCompleted / totalTasks : 0;
  const showLevel = lessonComplete ? baseLevel : Math.max(0, baseLevel - 1 + taskProgress);

  const unlocked = new Set(completedTaskIds.map((id) => TASK_ARCHITECTURE_UNLOCKS[id]?.node).filter(Boolean));
  const recentUnlocks = completedTaskIds
    .slice(-2)
    .map((id) => TASK_ARCHITECTURE_UNLOCKS[id])
    .filter(Boolean);

  const levels = {
    ec2: showLevel >= 1 || unlocked.has("ec2"),
    economics: unlocked.has("economics"),
    autoscale: unlocked.has("autoscale"),
    region: showLevel >= 2 || unlocked.has("region"),
    multiAz: showLevel >= 2.3 || unlocked.has("multiaz"),
    cloudfront: showLevel >= 2.6 || unlocked.has("cloudfront"),
    console: showLevel >= 3 || unlocked.has("console"),
    hunt: unlocked.has("hunt"),
    billing: showLevel >= 4 || unlocked.has("billing"),
    costexplorer: unlocked.has("costexplorer"),
    security: showLevel >= 5 || unlocked.has("security"),
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0c10] border-l border-slate-800">
      <div className="px-3 py-2 border-b border-slate-800 bg-[#161b22]">
        <div className="text-[10px] font-mono text-[#ff9900] uppercase tracking-widest">Live Architecture</div>
        <div className="text-xs text-slate-400 mt-0.5">Project Phoenix · ap-south-1</div>
      </div>

      <div className="flex-1 relative overflow-hidden p-3 overflow-y-auto">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative space-y-3">
          <AnimatePresence>
            {recentUnlocks.filter(Boolean).map((u) => (
              <motion.div
                key={u!.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30"
              >
                ✓ {u!.label}
              </motion.div>
            ))}
          </AnimatePresence>

          {levels.cloudfront && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[10px] text-cyan-400">
              <Globe className="w-3 h-3" /> CloudFront Edge
            </motion.div>
          )}

          {(levels.region || levels.ec2) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`border-2 border-dashed rounded-lg p-3 ${levels.security ? "border-emerald-500/60" : "border-[#ff9900]/40"}`}
            >
              <div className="text-[9px] font-mono text-[#ff9900] mb-2">AWS Region: ap-south-1</div>
              <div className="flex gap-2 justify-center">
                <Node active={levels.ec2} label="AZ-a" icon={Server} />
                {levels.multiAz && (
                  <>
                    <ConnectionLine />
                    <Node active label="AZ-b" icon={Server} />
                  </>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {levels.economics && <Badge icon={DollarSign} label="OpEx model" />}
            {levels.autoscale && <Badge icon={Zap} label="Auto-scale" />}
            {levels.console && <Badge icon={Activity} label="Console" />}
            {levels.costexplorer && <Badge icon={DollarSign} label="Cost Explorer" />}
            {levels.billing && <Badge icon={DollarSign} label="Budget alerts" color="emerald" />}
            {levels.security && <Badge icon={Shield} label="IAM hardened" color="emerald" />}
            {levels.hunt && <Badge icon={Network} label="Global hunt" />}
          </div>

          {lessonComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-3 py-2 rounded border border-emerald-500/30 text-center"
            >
              LAYER {baseLevel} DEPLOYED
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-3 py-2 border-t border-slate-800 bg-[#161b22]">
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
          <span>Layer {Math.min(5, Math.ceil(showLevel))}/5</span>
          <span>{tasksCompleted}/{totalTasks}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#ff9900]"
            animate={{ width: `${(tasksCompleted / Math.max(totalTasks, 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Node({ active, label, icon: Icon }: { active?: boolean; label: string; icon: typeof Server }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-lg border-2 p-2 ${
          active ? "border-[#ff9900] bg-[#232f3e] shadow-[0_0_12px_rgba(255,153,0,0.3)]" : "border-slate-700 opacity-40"
        }`}
      >
        {active ? <Icon className="w-5 h-5 text-[#ff9900]" /> : <Lock className="w-4 h-4 text-slate-600" />}
      </div>
      <span className="text-[8px] font-mono text-slate-500">{label}</span>
    </div>
  );
}

function ConnectionLine() {
  return <motion.div initial={{ width: 0 }} animate={{ width: 24 }} className="h-0.5 bg-emerald-500/60 self-center mt-4" />;
}

function Badge({ icon: Icon, label, color = "cyan" }: { icon: typeof Server; label: string; color?: "cyan" | "emerald" }) {
  const c = color === "emerald" ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/30" : "text-cyan-400 border-cyan-500/30 bg-cyan-950/30";
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono border ${c}`}>
      <Icon className="w-3 h-3" /> {label}
    </div>
  );
}
