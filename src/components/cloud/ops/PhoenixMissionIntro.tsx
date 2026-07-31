import { motion } from "framer-motion";
import { AlertTriangle, Building2, Server, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PHOENIX_COMPANY, LESSON_MISSIONS } from "@/data/cloud/projectPhoenix";

interface Props {
  lessonId: string;
  onBegin: () => void;
}

export function PhoenixMissionIntro({ lessonId, onBegin }: Props) {
  const mission = LESSON_MISSIONS[lessonId];

  return (
    <div className="fixed inset-0 z-[60] bg-[#0d1117] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ff990033 1px, transparent 1px),
            linear-gradient(to bottom, #ff990033 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-3xl w-full bg-[#161b22] border border-[#ff9900]/30 rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="bg-[#232f3e] px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#ff9900]/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#ff9900]" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#ff9900] uppercase tracking-widest">P1 Incident · Project Phoenix</div>
              <div className="text-lg font-bold text-white">{PHOENIX_COMPANY.name} — {PHOENIX_COMPANY.tagline}</div>
            </div>
          </div>
          <span className="text-xs font-mono text-rose-400 bg-rose-950/50 px-3 py-1 rounded-full border border-rose-500/30">
            DAY 1 ON THE JOB
          </span>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Building2, label: "Company", value: PHOENIX_COMPANY.name },
              { icon: Server, label: "Your Role", value: "Cloud Engineer (Intern → Hire track)" },
              { icon: Zap, label: "Sprint", value: "30-day AWS migration" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#0d1117] border border-slate-800 rounded-lg p-4">
                <Icon className="w-4 h-4 text-[#ff9900] mb-2" />
                <div className="text-[10px] uppercase text-slate-500 font-mono">{label}</div>
                <div className="text-sm text-slate-200 mt-1">{value}</div>
              </div>
            ))}
          </div>

          <div className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-5">
            <div className="text-xs font-mono text-rose-400 uppercase mb-2">Crisis Briefing</div>
            <p className="text-slate-300 leading-relaxed">{PHOENIX_COMPANY.crisis}</p>
          </div>

          {mission && (
            <div className="space-y-3">
              <div className="text-xs font-mono text-[#ff9900] uppercase tracking-widest">
                Lesson {lessonId} · {mission.title}
              </div>
              <p className="text-slate-300 leading-relaxed italic border-l-2 border-[#ff9900] pl-4">
                Ren: "{mission.renIntro}"
              </p>
              <p className="text-sm text-slate-400">{mission.missionBrief}</p>
            </div>
          )}

          <div className="bg-[#0d1117] border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-500">
            <span className="text-emerald-400">$</span> aws sts get-caller-identity — Authenticating as CloudEngineer@freshbite...
            <br />
            <span className="text-slate-400">Opening Jira board · Slack #cloud-ops · AWS Console ap-south-1</span>
          </div>

          <Button
            onClick={onBegin}
            className="w-full h-12 bg-[#ff9900] hover:bg-[#e88b00] text-[#232f3e] font-bold text-sm tracking-wide"
          >
            ENTER OPERATIONS CENTER →
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
