import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isProfessionalUnlocked } from "@/data/cloud/studentModeProgress";

/**
 * Work section gate until Day 5 readiness pass.
 * Professional Mode console comes later — do not build it here.
 */
export default function ProfessionalModeGate() {
  const navigate = useNavigate();
  const unlocked = isProfessionalUnlocked();

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#05080d] px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15">
        <Lock className="h-5 w-5 text-violet-300" />
      </div>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-violet-300">
        Professional Mode
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-white">
        {unlocked ? "Unlocked — console coming next" : "Locked"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        {unlocked
          ? "You passed Console Readiness. The full-screen AWS console simulation ships in the next build — not in this Student Mode pass."
          : "Complete Student Mode Days 1–5 and pass the Console Readiness Check to unlock. Work stays closed until then."}
      </p>
      <Button
        className="mt-8 bg-amber-500 font-semibold text-black hover:bg-amber-400"
        onClick={() => navigate("/learning")}
      >
        {unlocked ? "Back to Student Mode" : "Go to Student Mode"}
      </Button>
    </div>
  );
}
