import {
  getRebonMode,
  setRebonMode,
  useRebonMode,
  REBON_MODE_META,
  SECTION_THEME,
  type RebonProductMode,
  type SectionThemeKey,
} from "@/data/cloud/rebonMode";

interface Props {
  className?: string;
  /** Active section paints the selected mode tab in Learn gold / Work violet. */
  section?: SectionThemeKey;
}

export function RebonModeSwitcher({
  className = "",
  section = "learn",
}: Props) {
  const [mode, setMode] = useRebonMode();
  const theme = SECTION_THEME[section === "proof" ? "learn" : section];
  const modes: RebonProductMode[] = [
    "student",
    "professional",
    "ai_professional",
  ];

  return (
    <div
      className={`inline-flex rounded-lg border border-white/[0.1] bg-black/30 p-1 ${className}`}
      role="tablist"
      aria-label="Product mode"
    >
      {modes.map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMode(m)}
            className="rounded-md px-3.5 py-2 text-[12px] font-semibold tracking-wide transition sm:px-4 sm:text-[13px]"
            style={
              active
                ? {
                    background: theme.soft,
                    color: theme.color,
                    boxShadow: `inset 0 0 0 1px ${theme.ring}`,
                  }
                : { color: "#94a3b8" }
            }
          >
            {REBON_MODE_META[m].short}
          </button>
        );
      })}
    </div>
  );
}

export { getRebonMode, setRebonMode, useRebonMode, REBON_MODE_META, SECTION_THEME };
export type { RebonProductMode, SectionThemeKey };
