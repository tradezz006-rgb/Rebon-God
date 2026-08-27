import ACTION_MAP_JSON from "@/data/cloud/awsConsole/ACTION_MAP.json";
import { useAccountStore } from "../cloudscape/store";
import { parseActionCode, type ActionResult } from "./types";

const FAMILIES = ACTION_MAP_JSON.ACTION_MAP;

function isWhitelisted(raw: string): boolean {
  const parsed = parseActionCode(raw);
  if (!parsed) return false;
  const list = (FAMILIES as Record<string, string[]>)[parsed.family];
  if (!list) return false;
  return list.some((pattern) => {
    // Exact match or template match (replace {id}/{value}/{service} with wildcards)
    const escaped = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\\{id\\\}/g, "[^:]+")
      .replace(/\\\{value\\\}/g, ".+")
      .replace(/\\\{service\\\}/g, "[a-z0-9-]+");
    return new RegExp(`^${escaped}$`, "i").test(raw);
  });
}

function dispatchDomClick(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);
  if (el) el.click();
}

/**
 * Pre-verified action executor. Ren (Phase 3) may only call this —
 * never mutate the store freely.
 */
export async function executeAction(code: string): Promise<ActionResult> {
  const raw = code.trim();
  if (!isWhitelisted(raw)) {
    return {
      ok: false,
      code: raw,
      reason: "Action is not in ACTION_MAP whitelist. Describe in speech instead.",
    };
  }

  const parsed = parseActionCode(raw);
  if (!parsed) {
    return { ok: false, code: raw, reason: "Could not parse action code." };
  }

  const store = useAccountStore.getState();

  try {
    switch (parsed.family) {
      case "NAV": {
        const map: Record<string, () => void> = {
          "iam-users": () => store.navigate("iam", "users"),
          "iam-create-user": () => store.navigate("iam", "create-user"),
          "ec2-instances": () => store.navigate("ec2", "instances"),
          "ec2-launch-instance": () => store.navigate("ec2", "launch"),
          "s3-buckets": () => store.navigate("s3", "buckets"),
          "s3-create-bucket": () => store.navigate("s3", "create-bucket"),
          "vpc-vpcs": () => store.navigate("vpc", "vpcs"),
          "vpc-create": () => store.navigate("vpc", "create-vpc"),
          "cw-alarms": () => store.navigate("cloudwatch", "alarms"),
          "cw-create-alarm": () => store.navigate("cloudwatch", "create-alarm"),
          "cost-explorer-view": () => store.navigate("billing", "cost-explorer"),
          "cost-explorer": () => store.navigate("billing", "cost-explorer"),
          "ec2-launch": () => store.navigate("ec2", "launch"),
        };
        const fn = map[parsed.resource];
        if (!fn) {
          return { ok: false, code: raw, reason: `Unknown NAV target: ${parsed.resource}` };
        }
        fn();
        return { ok: true, code: raw };
      }

      case "HIGHLIGHT": {
        let target = parsed.resource;
        if (target === "nav-search") target = "search-bar";
        if (target === "flash-banner") target = "flash-banner";
        if (target === "s3-block-public-warning") target = "s3-block-public-warning";
        if (target === "ec2-instance-state-dropdown")
          target = "ec2-instance-state-dropdown";
        if (target === "vpc-architecture-preview") target = "vpc-architecture-preview";
        if (target === "btn-create-user") {
          store.navigate("iam", "create-user");
          target = "iam-create-user-btn";
        }
        if (target === "btn-launch-instance") {
          store.navigate("ec2", "launch");
          target = "launch-instance";
        }
        if (target === "btn-create-bucket") {
          store.navigate("s3", "create-bucket");
          target = "create-bucket";
        }
        if (target === "btn-create-vpc") {
          store.navigate("vpc", "create-vpc");
          target = "create-vpc";
        }
        if (target.startsWith("table-row") && parsed.value) {
          target = parsed.value;
        }
        if (target.startsWith("btn-create-") || target === "btn-create") {
          const svc = parsed.value || parsed.resource.replace("btn-create-", "");
          const createMap: Record<string, string> = {
            iam: "iam-create-user",
            user: "iam-create-user",
            ec2: "launch-instance",
            s3: "create-bucket",
            vpc: "create-vpc",
          };
          const nav = createMap[svc];
          if (nav?.startsWith("iam") || svc === "user") store.navigate("iam", "create-user");
          else if (svc === "ec2") store.navigate("ec2", "launch");
          else if (svc === "s3") store.navigate("s3", "create-bucket");
          else if (svc === "vpc") store.navigate("vpc", "create-vpc");
          store.setActionDraft({ highlight: nav || svc });
          return { ok: true, code: raw };
        }
        store.setActionDraft({ highlight: target });
        const root = document.querySelector(".aws-console-root");
        if (root) root.setAttribute("data-highlight-target", target);
        return { ok: true, code: raw };
      }

      case "CLICK": {
        const clickMap: Record<string, string> = {
          "wizard-next": '[data-console-target="create-user-next"], button[data-testid="wizard-next"], .awsui_button-primary button',
          "wizard-prev": '[data-console-target="create-user-back"]',
          "wizard-submit":
            '[data-console-target="create-user-submit"], [data-console-target="create-bucket-submit"], [data-console-target="create-vpc-submit"]',
          "modal-close": '[aria-label="Close"], button[aria-label="Dismiss"]',
          "btn-create-user-submit": '[data-console-target="create-user-submit"]',
          "btn-launch-instance-submit": '[data-console-target="launch-instance-submit"] button, [data-action-id="CLICK:btn-launch-instance-submit"] button',
          "btn-create-bucket-submit": '[data-console-target="create-bucket-submit"] button',
          "btn-create-vpc-submit": '[data-console-target="create-vpc-submit"] button',
          "btn-download-credentials": '[data-action-id="CLICK:btn-download-credentials"]',
        };
        const sel = clickMap[parsed.resource];
        if (!sel) {
          return { ok: false, code: raw, reason: `Unknown CLICK: ${parsed.resource}` };
        }
        // Prefer explicit data-console-target first
        if (parsed.resource === "wizard-next") {
          dispatchDomClick('[data-console-target="create-user-next"]');
          // Cloudscape Wizard primary button fallback
          const btns = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
          );
          const next = btns.find((b) => /next/i.test(b.textContent || ""));
          next?.click();
        } else if (parsed.resource === "wizard-prev") {
          const btns = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
          );
          const prev = btns.find((b) => /previous|back/i.test(b.textContent || ""));
          prev?.click();
        } else if (parsed.resource === "wizard-submit") {
          dispatchDomClick('[data-console-target="create-user-submit"]');
          dispatchDomClick('[data-console-target="create-bucket-submit"]');
          dispatchDomClick('[data-console-target="create-vpc-submit"]');
          const btns = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
          );
          const submit = btns.find((b) =>
            /create user|create bucket|create vpc|create alarm/i.test(
              b.textContent || ""
            )
          );
          submit?.click();
        } else if (parsed.resource.startsWith("btn-")) {
          dispatchDomClick(sel);
          const btns = Array.from(
            document.querySelectorAll<HTMLButtonElement>("button")
          );
          if (parsed.resource.includes("launch")) {
            btns.find((b) => /launch instance/i.test(b.textContent || ""))?.click();
          }
          if (parsed.resource.includes("create-user")) {
            btns.find((b) => /create user/i.test(b.textContent || ""))?.click();
          }
          if (parsed.resource.includes("create-bucket")) {
            btns.find((b) => /create bucket/i.test(b.textContent || ""))?.click();
          }
          if (parsed.resource.includes("create-vpc")) {
            btns.find((b) => /create vpc/i.test(b.textContent || ""))?.click();
          }
        } else {
          dispatchDomClick(sel);
        }
        return { ok: true, code: raw };
      }

      case "FILL": {
        const value = parsed.value ?? "";
        if (parsed.resource === "iam-user-name") {
          store.setActionDraft({ "iam-user-name": value });
          const input = document.querySelector<HTMLInputElement>(
            '[data-console-target="iam-username-input"] input'
          );
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value"
            )?.set;
            setter?.call(input, value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        } else if (parsed.resource === "ec2-instance-name") {
          store.setActionDraft({ "ec2-instance-name": value });
        } else if (parsed.resource === "s3-bucket-name") {
          store.setActionDraft({ "s3-bucket-name": value });
          const input = document.querySelector<HTMLInputElement>(
            '[data-console-target="bucket-name-input"] input'
          );
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value"
            )?.set;
            setter?.call(input, value.toLowerCase());
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        } else if (parsed.resource === "vpc-cidr-block") {
          store.setActionDraft({ "vpc-cidr-block": value });
        } else if (parsed.resource === "cw-threshold-value") {
          store.setActionDraft({ "cw-threshold-value": value });
          const input = document.querySelector<HTMLInputElement>(
            '[data-action-id="FILL:cw-threshold-value"] input'
          );
          if (input) {
            const setter = Object.getOwnPropertyDescriptor(
              HTMLInputElement.prototype,
              "value"
            )?.set;
            setter?.call(input, value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        } else {
          return { ok: false, code: raw, reason: `Unknown FILL field: ${parsed.resource}` };
        }
        return { ok: true, code: raw };
      }

      case "TOGGLE": {
        if (
          parsed.resource === "s3-block-public-access" ||
          parsed.resource === "s3-block-all-public"
        ) {
          const next = !store.actionDrafts["s3-block-public-access"];
          store.setActionDraft({ "s3-block-public-access": next });
          dispatchDomClick('[data-action-id="TOGGLE:s3-block-all-public"] input, [data-action-id="TOGGLE:s3-block-all-public"]');
        } else if (parsed.resource === "s3-public-acknowledgement") {
          dispatchDomClick(
            '[data-action-id="TOGGLE:s3-public-acknowledgement"] input, [data-action-id="TOGGLE:s3-public-acknowledgement"]'
          );
        } else if (parsed.resource === "iam-console-access") {
          store.setActionDraft({
            "iam-console-access": !store.actionDrafts["iam-console-access"],
          });
        } else {
          return { ok: false, code: raw, reason: `Unknown TOGGLE: ${parsed.resource}` };
        }
        return { ok: true, code: raw };
      }

      case "SELECT": {
        if (parsed.resource === "ec2-ami-amazon-linux") {
          dispatchDomClick('[data-action-id="SELECT:ec2-ami-amazon-linux"]');
        } else if (parsed.resource === "ec2-instance-type-t2-micro") {
          store.setActionDraft({ "ec2-instance-type": "t2.micro" });
        } else {
          return { ok: false, code: raw, reason: `Unknown SELECT: ${parsed.resource}` };
        }
        return { ok: true, code: raw };
      }

      case "SHOW": {
        if (parsed.resource === "architecture-diagram") {
          store.setActionDraft({ showArchitecture: true });
          store.navigate("vpc", "create-vpc");
        } else if (parsed.resource === "json-policy-viewer") {
          store.setActionDraft({
            showPolicyViewer: parsed.value || "AdministratorAccess",
          });
        } else {
          return { ok: false, code: raw, reason: `Unknown SHOW: ${parsed.resource}` };
        }
        return { ok: true, code: raw };
      }

      case "RESET": {
        if (parsed.resource === "current-wizard-state") {
          store.setActionDraft({
            "iam-user-name": "",
            "ec2-instance-name": "",
            "s3-bucket-name": "",
            "vpc-cidr-block": "10.0.0.0/16",
            "cw-threshold-value": "80",
            "ec2-instance-type": "t2.micro",
            "iam-console-access": false,
            "s3-block-public-access": true,
            highlight: null,
            showArchitecture: false,
            showPolicyViewer: null,
          });
          store.setOverlay({
            services_open: false,
            search_open: false,
            region_open: false,
            account_open: false,
          });
        } else if (parsed.resource === "filters") {
          store.setSearch("");
          store.setOverlay({ search_open: false });
        } else {
          return { ok: false, code: raw, reason: `Unknown RESET: ${parsed.resource}` };
        }
        return { ok: true, code: raw };
      }

      default:
        return { ok: false, code: raw, reason: `Unknown family: ${parsed.family}` };
    }
  } catch (err) {
    return {
      ok: false,
      code: raw,
      reason: err instanceof Error ? err.message : "Action execution failed",
    };
  }
}

export function listActionCodes(): string[] {
  return Object.values(FAMILIES).flat();
}
