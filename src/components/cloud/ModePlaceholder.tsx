import type { RebonProductMode } from "@/data/cloud/rebonMode";
import { REBON_MODE_META } from "@/data/cloud/rebonMode";
import { CloudDeskShell, CloudEmptyState } from "@/components/cloud/CloudDeskShell";

interface Props {
  mode: RebonProductMode;
  section: "learn" | "work";
}

export function ModePlaceholder({ mode, section }: Props) {
  const label = REBON_MODE_META[mode].label;
  return (
    <CloudDeskShell
      section={section}
      title={label}
      subtitle={
        section === "learn"
          ? "Curriculum for this mode is next. Student Mode lessons are ready now."
          : "Tickets for this mode are next. Student and Professional problems are ready now."
      }
    >
      <CloudEmptyState
        section={section}
        title="Coming next"
        body={
          section === "learn"
            ? "Switch to Student Mode to open board lessons with Ren."
            : "Switch to Student or Professional Mode to open problems."
        }
      />
    </CloudDeskShell>
  );
}
