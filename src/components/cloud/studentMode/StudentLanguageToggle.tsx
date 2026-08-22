import type { StudentLanguage } from "@/types/studentMode";
import { SECTION_THEME, type SectionThemeKey } from "@/data/cloud/rebonMode";

interface Props {
  language: StudentLanguage;
  onChange: (lang: StudentLanguage) => void;
  section?: SectionThemeKey;
}

export function StudentLanguageToggle({
  language,
  onChange,
  section = "learn",
}: Props) {
  const theme = SECTION_THEME[section === "proof" ? "learn" : section];

  return (
    <div
      className="inline-flex rounded-lg border border-white/[0.1] bg-black/30 p-1 text-[12px] font-semibold"
      role="group"
      aria-label="Lesson language"
    >
      {(["english", "tanglish"] as const).map((lang) => {
        const active = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            className="rounded-md px-3.5 py-2 transition sm:px-4"
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
            {lang === "english" ? "EN" : "Tanglish"}
          </button>
        );
      })}
    </div>
  );
}
