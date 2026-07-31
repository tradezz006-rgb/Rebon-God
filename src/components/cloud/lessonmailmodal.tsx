/**
 * Inbox-style corporate mail — situation briefing + status reply.
 * Feels like a real workplace client (thread, signature, headers), not a game popup.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Check,
  Clock3,
  Mail,
  Paperclip,
  Reply,
  Send,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  canWriteLessonMailReply,
  getLessonMailContent,
  getLessonMailReply,
  isLessonMailRead,
  markLessonMailRead,
  saveLessonMailReply,
  type LessonMailKind,
} from "@/data/cloud/lessonMail";

type Props = {
  lessonId: string;
  kind: LessonMailKind;
  onClose: () => void;
  /** Called after briefing is marked read — parent can unlock "Open" */
  onBriefingRead?: () => void;
  onReplySaved?: () => void;
};

function initials(name: string): string {
  const parts = name.replace(/·.*/, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stampNow(): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
  } catch {
    return "Today";
  }
}

export function LessonMailModal({
  lessonId,
  kind,
  onClose,
  onBriefingRead,
  onReplySaved,
}: Props) {
  const mail = getLessonMailContent(lessonId);
  const [reply, setReply] = useState(() => getLessonMailReply(lessonId));
  const [saved, setSaved] = useState(() => Boolean(getLessonMailReply(lessonId)));
  const alreadyRead = isLessonMailRead(lessonId);
  const canReply = canWriteLessonMailReply(lessonId);
  const when = useMemo(() => stampNow(), [lessonId, kind]);
  const fromInitials = initials(mail.fromName);
  const wordCount = reply.trim() ? reply.trim().split(/\s+/).length : 0;

  useEffect(() => {
    setReply(getLessonMailReply(lessonId));
    setSaved(Boolean(getLessonMailReply(lessonId)));
  }, [lessonId, kind]);

  const markRead = () => {
    markLessonMailRead(lessonId);
  };

  const submitReply = () => {
    if (reply.trim().length < 40) return;
    saveLessonMailReply(lessonId, reply);
    setSaved(true);
    onReplySaved?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-[#020711]/88 p-2 backdrop-blur-[2px] sm:p-4 md:p-6"
      onClick={onClose}
    >
      <motion.section
        initial={{ y: 28, opacity: 0, scale: 0.985 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 18, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#2a3344] bg-[#0c1118] shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={kind === "briefing" ? "Unread mail" : "Compose reply"}
      >
        {/* App chrome — mail client */}
        <div className="flex items-center justify-between gap-3 border-b border-[#1e2633] bg-[#10161f] px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-slate-300">
                {mail.company} Mail ·{" "}
                {kind === "briefing" ? "Inbox" : "Sent / Compose"}
              </p>
              <p className="truncate font-mono text-[10px] text-slate-500">
                {mail.toEmail.split("@")[1]
                  ? `workspace · ${mail.toEmail.split("@")[1]}`
                  : "workspace"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-1 hidden items-center gap-1 rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-[10px] text-slate-500 sm:inline-flex">
              <Clock3 className="h-3 w-3" />
              {when}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Close mail"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Folder rail + thread */}
        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[7.5rem] shrink-0 flex-col gap-0.5 border-r border-[#1e2633] bg-[#0a0e14] p-2 md:flex">
            <RailItem active={kind === "briefing"} icon={Mail} label="Inbox" />
            <RailItem active={kind === "reply"} icon={Reply} label="Compose" />
            <RailItem icon={Star} label="Starred" muted />
            <RailItem icon={Archive} label="Archive" muted />
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Message header */}
            <div className="border-b border-[#1e2633] px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {kind === "briefing" && !alreadyRead && (
                      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                        Unread
                      </span>
                    )}
                    {mail.ticketLabel && (
                      <span className="rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-200/90">
                        {mail.ticketLabel}
                      </span>
                    )}
                    <span className="rounded border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-500">
                      Internal
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold leading-snug tracking-tight text-slate-50 sm:text-xl">
                    {kind === "briefing" ? mail.subject : `Re: ${mail.subject}`}
                  </h2>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-semibold tracking-wide text-slate-900"
                  style={{
                    background:
                      "linear-gradient(145deg, #fbbf24 0%, #d97706 100%)",
                  }}
                  aria-hidden
                >
                  {fromInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-semibold text-slate-100">
                      {mail.fromName}
                      <span className="ml-2 font-normal text-slate-500">
                        &lt;{mail.fromEmail}&gt;
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">{when}</p>
                  </div>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    to {mail.toName} &lt;{mail.toEmail}&gt;
                  </p>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {kind === "briefing" ? (
                <div className="px-4 py-5 sm:px-6 sm:py-6">
                  <article className="mx-auto max-w-2xl">
                    <div className="whitespace-pre-wrap text-[15px] leading-[1.8] text-slate-200 sm:text-[15.5px]">
                      {mail.body}
                    </div>

                    <div className="mt-7 border-l-2 border-amber-500/50 bg-amber-500/[0.05] py-3 pl-4 pr-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
                        Action required
                      </p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                        {mail.ask}
                      </p>
                    </div>

                    <div className="mt-8 border-t border-dashed border-white/10 pt-5">
                      <p className="text-sm text-slate-300">
                        Best,
                        <br />
                        <span className="font-medium text-slate-100">
                          {mail.fromName.replace(/·.*/, "").trim()}
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {mail.company}
                        {mail.ticketLabel ? ` · Ref ${mail.ticketLabel}` : ""}
                      </p>
                    </div>

                    <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-slate-500">
                      <Paperclip className="h-3 w-3" />
                      Situation attached as ticket context · no download
                    </div>
                  </article>
                </div>
              ) : (
                <div className="px-4 py-5 sm:px-6 sm:py-6">
                  {!canReply ? (
                    <div className="mx-auto max-w-2xl rounded-lg border border-[#2a3344] bg-[#0a0e14] p-5">
                      <p className="text-sm text-slate-400">
                        Finish every ticket in{" "}
                        <span className="font-medium text-slate-200">
                          {mail.lessonTitle}
                        </span>{" "}
                        before you can send a status reply. Managers expect a
                        clear write-up of what broke and what you changed — not
                        a quiz score.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-2xl">
                      {/* Quoted original — thread feel */}
                      <div className="mb-5 rounded-lg border border-[#1e2633] bg-[#0a0e14]/80 p-3.5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                          Original message
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                          {mail.body}
                        </p>
                      </div>

                      <div className="mb-3 grid gap-1 text-[12px] text-slate-400 sm:grid-cols-[3.5rem_1fr]">
                        <span className="text-slate-500">To</span>
                        <span>
                          {mail.fromName} &lt;{mail.fromEmail}&gt;
                        </span>
                        <span className="text-slate-500">Subject</span>
                        <span className="text-slate-300">Re: {mail.subject}</span>
                      </div>

                      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                        Status update · what broke, what you fixed
                      </label>
                      <textarea
                        value={reply}
                        onChange={(e) => {
                          setReply(e.target.value);
                          setSaved(false);
                        }}
                        rows={11}
                        placeholder={`Hi ${mail.fromName.split(" ")[0]},\n\nHere's what was actually wrong, what I changed, and what I'd watch next time…`}
                        className="w-full resize-y rounded-lg border border-[#2a3344] bg-[#080c12] px-3.5 py-3 font-sans text-[14.5px] leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/20"
                      />
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>
                          Write enough that a manager could hand this to the next
                          engineer.
                        </span>
                        <span className="font-mono">
                          {wordCount} words
                          {reply.trim().length < 40 ? " · too short" : ""}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1e2633] bg-[#10161f] px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-slate-400 transition hover:text-slate-200"
              >
                Close
              </button>

              {kind === "briefing" ? (
                <Button
                  onClick={() => {
                    const firstRead = !isLessonMailRead(lessonId);
                    markRead();
                    onClose();
                    if (firstRead) onBriefingRead?.();
                  }}
                  className="bg-sky-500 font-semibold text-white hover:bg-sky-400"
                >
                  {alreadyRead ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Close thread
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Mark read · open tickets
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  disabled={!canReply || reply.trim().length < 40}
                  onClick={submitReply}
                  className="bg-sky-500 font-semibold text-white hover:bg-sky-400 disabled:opacity-40"
                >
                  {saved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Reply sent
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

function RailItem({
  icon: Icon,
  label,
  active,
  muted,
}: {
  icon: typeof Mail;
  label: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
        active
          ? "bg-sky-500/15 font-medium text-sky-200"
          : muted
            ? "text-slate-600"
            : "text-slate-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

/** Shaking mail badge for lesson cards */
export function LessonMailBadge({
  unread,
  replyReady,
  replyDone,
  onClick,
}: {
  unread: boolean;
  replyReady?: boolean;
  replyDone?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`relative grid h-11 w-11 place-items-center rounded-lg border transition ${
        unread
          ? "border-sky-400/45 bg-sky-500/12 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
          : replyReady && !replyDone
            ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
            : replyDone
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20"
      }`}
      title={
        unread
          ? "New mail — read the situation before tickets"
          : replyReady && !replyDone
            ? "Reply — explain what you fixed"
            : replyDone
              ? "Reply sent"
              : "Open situation mail"
      }
      aria-label="Open situation mail"
    >
      <motion.span
        animate={
          unread
            ? { rotate: [0, -10, 10, -6, 6, 0], y: [0, -1, 0] }
            : replyReady && !replyDone
              ? { scale: [1, 1.06, 1] }
              : {}
        }
        transition={
          unread
            ? { duration: 0.75, repeat: Infinity, repeatDelay: 1.6 }
            : { duration: 1.5, repeat: Infinity }
        }
      >
        <Mail className="h-5 w-5" />
      </motion.span>
      {unread && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white shadow">
          1
        </span>
      )}
      {replyReady && !replyDone && !unread && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 shadow" />
      )}
    </button>
  );
}

export function LessonMailHost({
  open,
  lessonId,
  kind,
  onClose,
  onBriefingRead,
  onReplySaved,
}: {
  open: boolean;
  lessonId: string | null;
  kind: LessonMailKind;
  onClose: () => void;
  onBriefingRead?: () => void;
  onReplySaved?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && lessonId && (
        <LessonMailModal
          key={`${lessonId}-${kind}`}
          lessonId={lessonId}
          kind={kind}
          onClose={onClose}
          onBriefingRead={onBriefingRead}
          onReplySaved={onReplySaved}
        />
      )}
    </AnimatePresence>
  );
}
