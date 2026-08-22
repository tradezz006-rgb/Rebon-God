import { useEffect, useState } from "react";

/** Shared Learn/Work mode — Student | Professional | AI Professional */

export type RebonProductMode = "student" | "professional" | "ai_professional";

const KEY = "rebon_product_mode";

export const REBON_MODE_META: Record<
  RebonProductMode,
  { label: string; short: string }
> = {
  student: { label: "Student Mode", short: "Student" },
  professional: { label: "Professional Mode", short: "Professional" },
  ai_professional: { label: "AI Professional", short: "AI Pro" },
};

/**
 * Section brand colors — match DomainNavbar (do not replace with mode colors).
 * Learn = gold · Work = violet · Proof = emerald
 */
export const SECTION_THEME = {
  learn: {
    label: "Learn",
    color: "#F59E0B",
    soft: "rgba(245, 158, 11, 0.12)",
    ring: "rgba(245, 158, 11, 0.4)",
    textClass: "text-amber-brand",
    barClass: "bg-[#F59E0B]",
  },
  work: {
    label: "Work",
    color: "#7C3AED",
    soft: "rgba(124, 58, 237, 0.12)",
    ring: "rgba(124, 58, 237, 0.4)",
    textClass: "text-violet-brand",
    barClass: "bg-[#7C3AED]",
  },
  proof: {
    label: "Proof",
    color: "#10B981",
    soft: "rgba(16, 185, 129, 0.12)",
    ring: "rgba(16, 185, 129, 0.4)",
    textClass: "text-emerald-brand",
    barClass: "bg-[#10B981]",
  },
} as const;

export type SectionThemeKey = keyof typeof SECTION_THEME;

export function getRebonMode(): RebonProductMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "professional" || v === "ai_professional" || v === "student") {
      return v;
    }
  } catch {
    /* ignore */
  }
  return "student";
}

export function setRebonMode(mode: RebonProductMode) {
  localStorage.setItem(KEY, mode);
  window.dispatchEvent(new CustomEvent("rebon-mode-change", { detail: mode }));
}

export function useRebonMode(): [RebonProductMode, (m: RebonProductMode) => void] {
  const [mode, setModeState] = useState<RebonProductMode>(() => getRebonMode());

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as RebonProductMode | undefined;
      setModeState(detail || getRebonMode());
    };
    const onStorage = () => setModeState(getRebonMode());
    window.addEventListener("rebon-mode-change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("rebon-mode-change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setMode = (m: RebonProductMode) => {
    setRebonMode(m);
    setModeState(m);
  };

  return [mode, setMode];
}
