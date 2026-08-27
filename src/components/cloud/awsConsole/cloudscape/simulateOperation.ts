import type { ConsoleMode } from "./types";

/** Canonical work-mode durations (ms) from the 2024 AWS console spec. */
export const SIM_MS = {
  iamCreateUser: 800,
  iamCreateRole: 800,
  s3CreateBucket: 800,
  ec2LaunchButton: 800,
  ec2PendingToRunning: 35_000,
  ec2StatusChecks: 15_000,
  ec2Stop: 12_000,
  ec2Terminate: 10_000,
  ec2Start: 8_000,
  ec2Reboot: 6_000,
  vpcAndMore: 45_000,
  vpcStepSubnet: 1_200,
  vpcStepIgw: 1_000,
  vpcStepAttach: 800,
  vpcStepRoute: 1_400,
  vpcStepEndpoint: 1_100,
  cwCreateAlarm: 800,
  billingCreateBudget: 800,
} as const;

/** Learn mode scales long ops so Ren demos stay usable. */
const LEARN_SCALE: Partial<Record<keyof typeof SIM_MS, number>> = {
  ec2PendingToRunning: 8_000 / 35_000,
  ec2StatusChecks: 3_000 / 15_000,
  ec2Stop: 3_000 / 12_000,
  ec2Terminate: 3_000 / 10_000,
  ec2Start: 3_000 / 8_000,
  ec2Reboot: 2_000 / 6_000,
  vpcAndMore: 12_000 / 45_000,
  vpcStepSubnet: 400 / 1_200,
  vpcStepIgw: 300 / 1_000,
  vpcStepAttach: 250 / 800,
  vpcStepRoute: 350 / 1_400,
  vpcStepEndpoint: 300 / 1_100,
};

export function scaledMs(
  key: keyof typeof SIM_MS,
  mode: ConsoleMode = "work"
): number {
  const base = SIM_MS[key];
  if (mode === "learn" && LEARN_SCALE[key] != null) {
    return Math.round(base * (LEARN_SCALE[key] as number));
  }
  return base;
}

function hex(n: number): string {
  let out = "";
  while (out.length < n) {
    out += Math.random().toString(16).slice(2);
  }
  return out.slice(0, n);
}

/**
 * Real AWS-style IDs (Gemini / console 2024):
 * i-0 + 16 hex, vpc-0 + 16 hex, subnet-0…, sg-0…, igw-0…, rtb-0…, AKIA…
 */
export function awsId(
  kind: "i" | "vpc" | "subnet" | "sg" | "igw" | "rtb" | "akia" | "dopt" | "nat" | "vpce"
): string {
  switch (kind) {
    case "i":
      return `i-0${hex(16)}`;
    case "vpc":
      return `vpc-0${hex(16)}`;
    case "subnet":
      return `subnet-0${hex(16)}`;
    case "sg":
      return `sg-0${hex(16)}`;
    case "igw":
      return `igw-0${hex(16)}`;
    case "rtb":
      return `rtb-0${hex(16)}`;
    case "dopt":
      return `dopt-${hex(17)}`;
    case "nat":
      return `nat-0${hex(16)}`;
    case "vpce":
      return `vpce-0${hex(16)}`;
    case "akia":
      return `AKIA${hex(16).toUpperCase()}`;
  }
}

export type SimulateOpts = {
  durationMs: number;
  ticks?: number;
  onTick?: (progress: number, tickIndex: number) => void;
  signal?: AbortSignal;
};

/** Per-instance AbortControllers for EC2 state transition timers. */
const ec2TransitionControllers = new Map<string, AbortController>();

/** Start (or restart) a transition for an instance; returns its AbortSignal. */
export function beginEc2Transition(instanceId: string): AbortSignal {
  cancelEc2Transition(instanceId);
  const controller = new AbortController();
  ec2TransitionControllers.set(instanceId, controller);
  return controller.signal;
}

/** Abort pending timers for one instance (e.g. terminate while pending). */
export function cancelEc2Transition(instanceId: string): void {
  const controller = ec2TransitionControllers.get(instanceId);
  if (!controller) return;
  controller.abort();
  ec2TransitionControllers.delete(instanceId);
}

/** Abort all EC2 transition timers (hydrate, leave console, tab reset). */
export function cancelAllEc2Transitions(): void {
  for (const id of [...ec2TransitionControllers.keys()]) {
    cancelEc2Transition(id);
  }
}

export function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

/** Promise delay with optional progress ticks (0→1). Honors AbortSignal. */
export function simulateOperation(opts: SimulateOpts): Promise<void> {
  const { durationMs, ticks = 1, onTick, signal } = opts;
  if (durationMs <= 0) {
    onTick?.(1, 0);
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const n = Math.max(1, ticks);
    const step = durationMs / n;
    let i = 0;
    let timer: number | null = null;

    const onAbort = () => {
      if (timer != null) window.clearTimeout(timer);
      timer = null;
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const tick = () => {
      if (signal?.aborted) return;
      i += 1;
      const progress = Math.min(1, i / n);
      onTick?.(progress, i - 1);
      if (i >= n) {
        signal?.removeEventListener("abort", onAbort);
        if (signal) {
          // Drop finished controller entries keyed by matching signal
          for (const [id, c] of ec2TransitionControllers) {
            if (c.signal === signal) ec2TransitionControllers.delete(id);
          }
        }
        resolve();
        return;
      }
      timer = window.setTimeout(tick, step);
    };
    timer = window.setTimeout(tick, step);
  });
}
