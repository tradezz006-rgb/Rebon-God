import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { RebonModeSwitcher } from "@/components/cloud/RebonModeSwitcher";
import {
  REBON_MODE_META,
  SECTION_THEME,
  useRebonMode,
  type SectionThemeKey,
} from "@/data/cloud/rebonMode";

type DeskSection = "learn" | "work";

/**
 * Shared Learn / Work frame — keeps section brand colors from DomainNavbar:
 * Learn = gold (#F59E0B), Work = violet (#7C3AED).
 * Layout mirrors the old CloudLearningDashboard density (not a narrow card strip).
 */
export function CloudDeskShell({
  section,
  title,
  subtitle,
  actions,
  children,
  progress,
}: {
  section: DeskSection;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  progress?: { done: number; total: number };
}) {
  const [mode] = useRebonMode();
  const theme = SECTION_THEME[section];
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl pb-20 pt-2 md:max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 md:mb-12"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className="mb-4 text-[11px] uppercase tracking-[0.28em]"
              style={{ color: theme.color }}
            >
              {theme.label}
              <span className="mx-2 text-white/25">·</span>
              <span className="text-muted-foreground">
                {REBON_MODE_META[mode].label}
              </span>
            </p>
            <h1 className="font-display text-3xl font-bold leading-[1.08] text-foreground md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end sm:pt-1">
            {actions}
            <RebonModeSwitcher section={section} />
          </div>
        </div>

        {pct != null && progress && (
          <>
            <div className="flex items-end justify-between gap-6 border-b border-white/[0.08] pb-4">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Progress
                </p>
                <p className="font-display text-sm text-foreground">
                  {progress.done} of {progress.total}{" "}
                  {section === "learn" ? "lessons" : "problem sets"}
                </p>
              </div>
              <p
                className="font-display text-3xl font-semibold tabular-nums"
                style={{ color: theme.color }}
              >
                {pct}%
              </p>
            </div>
            <div className="mt-0 h-px w-full overflow-hidden bg-white/[0.06]">
              <motion.div
                className="h-full"
                style={{ background: theme.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </>
        )}
      </motion.div>

      <div className="border-t border-white/[0.08]">{children}</div>
    </div>
  );
}

export function CloudPhaseBlock({
  index,
  title,
  description,
  meta,
  open,
  onToggle,
  children,
  section,
}: {
  index: number;
  title: string;
  description?: string;
  meta: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  section: DeskSection;
}) {
  const theme = SECTION_THEME[section];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className="border-b border-white/[0.08]"
    >
      <button
        type="button"
        className="grid w-full grid-cols-[3.5rem_1fr_auto] items-start gap-4 py-7 text-left transition-colors hover:bg-white/[0.015] md:gap-6"
        onClick={onToggle}
      >
        <span
          className="pt-1 font-display text-sm tracking-wider"
          style={{ color: `${theme.color}cc` }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <div>
          <h2 className="mb-1 font-display text-xl font-semibold text-foreground md:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="mb-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {meta}
          </p>
        </div>
        <span className="mt-1 font-display text-lg text-muted-foreground/50">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && <div className="overflow-hidden pb-6 pl-0 md:pl-[3.5rem]">{children}</div>}
    </motion.div>
  );
}

export function CloudLessonRow({
  title,
  description,
  meta,
  onClick,
  disabled,
  section,
}: {
  title: string;
  description?: string;
  meta?: string;
  onClick: () => void;
  disabled?: boolean;
  section: DeskSection;
}) {
  const theme = SECTION_THEME[section];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ ["--row-accent" as string]: theme.color }}
      className={`group flex w-full items-start gap-4 border-t border-white/[0.06] py-5 text-left transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-white/[0.02]"
      }`}
    >
      <span className="mt-1.5 flex w-5 shrink-0 justify-center">
        <span
          className="mt-0.5 h-1.5 w-1.5 rounded-full"
          style={{ background: disabled ? "rgba(255,255,255,0.2)" : theme.color }}
        />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 font-display text-base font-medium text-foreground transition-colors group-hover:text-[var(--row-accent)] md:text-lg">
          {title}
        </h3>
        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/60">
            {meta}
          </p>
        ) : null}
      </div>
      {!disabled && (
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-[var(--row-accent)]" />
      )}
    </button>
  );
}

export function CloudEmptyState({
  section,
  title,
  body,
}: {
  section: SectionThemeKey;
  title: string;
  body: string;
}) {
  const theme = SECTION_THEME[section];
  return (
    <div className="border-b border-white/[0.08] py-16 text-center">
      <p
        className="mb-4 text-[11px] uppercase tracking-[0.28em]"
        style={{ color: theme.color }}
      >
        {theme.label}
      </p>
      <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
