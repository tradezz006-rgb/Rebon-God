import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { ConsoleCursorAction } from "@/types/professionalMode";
import type { IamSimState } from "@/types/cloudLesson";
import type { IamConsoleAction } from "@/components/cloud/awsConsole/iamActions";
import { AwsConsole } from "@/components/cloud/awsConsole/cloudscape/AwsConsole";
import { useAccountStore } from "@/components/cloud/awsConsole/cloudscape/store";
import type { ConsoleMode, ServiceId } from "@/components/cloud/awsConsole/cloudscape/types";

export type TeachableConsoleHandle = {
  resolveTarget: (id: string) => HTMLElement | null;
  performAction: (action: ConsoleCursorAction) => Promise<void>;
  getClickedTrail: () => string[];
  clearTrail: () => void;
  resetView: () => void;
  getActionLog: () => IamConsoleAction[];
};

type Props = {
  accountId: string;
  accountName: string;
  region: string;
  studentControl: boolean;
  highlightTarget?: string | null;
  onStudentClick?: (targetId: string) => void;
  requireSignIn?: boolean;
  iamSeed?: IamSimState | null;
  initialView?: "home" | "iam" | "ec2" | "s3" | "vpc" | "cloudwatch" | "billing";
  initialPage?: string;
  onActionsChange?: (actions: IamConsoleAction[]) => void;
  mode?: ConsoleMode;
  ticket?: {
    from?: string;
    subject?: string;
    body?: string;
    priority?: string;
  } | null;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function asService(view?: string): ServiceId {
  if (
    view === "iam" ||
    view === "ec2" ||
    view === "s3" ||
    view === "vpc" ||
    view === "cloudwatch" ||
    view === "billing"
  ) {
    return view;
  }
  return "home";
}

/**
 * Shared Cloudscape AWS console — Learn (Ren) and Work (tickets).
 */
export const TeachableAwsConsole = forwardRef<TeachableConsoleHandle, Props>(
  function TeachableAwsConsole(
    {
      accountId,
      accountName,
      region,
      studentControl,
      highlightTarget,
      onStudentClick,
      iamSeed = null,
      initialView = "home",
      initialPage,
      onActionsChange,
      mode = "learn",
      ticket = null,
    },
    ref
  ) {
    const rootRef = useRef<HTMLDivElement>(null);
    const onStudentClickRef = useRef(onStudentClick);
    onStudentClickRef.current = onStudentClick;

    useEffect(() => {
      useAccountStore.getState().hydrate({
        accountId,
        accountName,
        region,
        iamSeed,
        initialService: asService(initialView),
        initialPage,
      });
    }, [accountId, accountName, region, iamSeed, initialView, initialPage]);

    useEffect(() => {
      useAccountStore.setState({ interactive: mode === "work" || studentControl });
    }, [mode, studentControl]);

    useEffect(() => {
      let prevLen = useAccountStore.getState().clickedTrail.length;
      const unsub = useAccountStore.subscribe((s) => {
        if (s.clickedTrail.length > prevLen) {
          prevLen = s.clickedTrail.length;
          const last = s.clickedTrail[s.clickedTrail.length - 1];
          if (last) onStudentClickRef.current?.(last);
        }
      });
      return unsub;
    }, []);

    useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      if (highlightTarget) {
        root.setAttribute("data-highlight-target", highlightTarget);
      } else {
        root.removeAttribute("data-highlight-target");
      }
      return () => root.removeAttribute("data-highlight-target");
    }, [highlightTarget]);

    const resolveTarget = useCallback((id: string) => {
      const aliases: Record<string, string> = {
        "account-switcher": "account-badge",
        "region-option-us-east-1": "region-us-east-1",
        "region-option-ap-south-1": "region-ap-south-1",
        "ec2-instances-sidebar": "service-ec2",
        "ec2-instances-list-mumbai": "ec2-instances-list",
        "ec2-instances-empty-state": "ec2-instances-empty",
        "ec2-dashboard": "service-ec2",
        "region-dropdown-list": "region-dropdown",
        "services-menu-security-category": "services-menu",
        "region-selector-global-indicator": "region-selector",
        "iam-service-result": "search-result-iam",
        "search-result-iam-users": "nav-users",
      };
      const resolved = aliases[id] || id;
      const safe = resolved.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return (
        rootRef.current?.querySelector<HTMLElement>(
          `[data-console-target="${safe}"]`
        ) || null
      );
    }, []);

    const performAction = useCallback(async (action: ConsoleCursorAction) => {
      const store = useAccountStore.getState();
      const id = action.target;

      if (action.action === "key") {
        const key = String(action.value || action.target || "").toLowerCase();
        if (key === "escape" || key === "esc") {
          store.setOverlay({
            services_open: false,
            search_open: false,
            region_open: false,
            account_open: false,
          });
        }
        await sleep(action.pause_ms ?? 200);
        return;
      }

      // highlight / hover: point only — open panels when needed so target exists
      if (action.action === "highlight" || action.action === "hover") {
        if (
          id === "region-dropdown" ||
          id === "region-dropdown-list" ||
          (id.startsWith("region-") && id !== "region-selector")
        ) {
          store.setOverlay({
            region_open: true,
            services_open: false,
            search_open: false,
          });
        } else if (
          id === "ec2-instances-list" ||
          id === "ec2-instances-empty" ||
          id === "ec2-instances-list-mumbai" ||
          id === "ec2-instances-empty-state"
        ) {
          store.navigate("ec2", "instances");
        }
        await sleep(action.pause_ms ?? 280);
        return;
      }

      store.markClick(id);

      if (id === "search-bar" && action.action === "type" && action.value) {
        store.setSearch(action.value);
        store.log("search_user", "console", "search", { query: action.value });
        await sleep(action.pause_ms ?? 280);
        return;
      }

      switch (id) {
        case "aws-logo":
          store.navigate("home");
          break;
        case "services-menu":
        case "services-menu-security-category":
          store.setOverlay({
            services_open: true,
            search_open: false,
            region_open: false,
          });
          break;
        case "search-bar":
          store.setOverlay({
            search_open: true,
            services_open: false,
            region_open: false,
          });
          break;
        case "search-result-iam":
        case "service-iam":
        case "iam-service-result":
          store.navigate("iam", "users");
          break;
        case "search-result-ec2":
        case "service-ec2":
        case "ec2-instances-sidebar":
        case "ec2-dashboard":
        case "ec2-instances-list":
        case "ec2-instances-list-mumbai":
        case "ec2-instances-empty":
        case "ec2-instances-empty-state":
          store.markClick("service-ec2");
          store.navigate("ec2", "instances");
          break;
        case "search-result-s3":
        case "service-s3":
          store.navigate("s3", "buckets");
          break;
        case "service-vpc":
          store.navigate("vpc", "vpcs");
          break;
        case "service-cloudwatch":
          store.navigate("cloudwatch", "alarms");
          break;
        case "service-billing":
          store.navigate("billing", "cost-explorer");
          break;
        case "region-selector":
        case "region-dropdown":
        case "region-dropdown-list":
        case "region-selector-global-indicator":
          store.setOverlay({
            region_open: true,
            services_open: false,
            search_open: false,
          });
          break;
        case "region-ap-south-1":
        case "region-option-ap-south-1":
        case "region-ap-south-2":
        case "region-ap-southeast-2":
        case "region-us-east-1":
        case "region-option-us-east-1":
        case "region-eu-west-1":
          store.setRegion(
            id
              .replace("region-option-", "")
              .replace("region-", "")
          );
          break;
        case "account-badge":
        case "account-switcher":
          store.setOverlay({
            account_open: true,
            services_open: false,
            search_open: false,
            region_open: false,
          });
          break;
        case "account-id-display":
          store.setOverlay({
            account_open: true,
            services_open: false,
            search_open: false,
            region_open: false,
          });
          break;
        case "nav-dashboard":
          store.navigate("iam", "dashboard");
          break;
        case "nav-users":
          store.navigate("iam", "users");
          break;
        case "nav-groups":
          store.navigate("iam", "groups");
          break;
        case "nav-roles":
          store.navigate("iam", "roles");
          break;
        case "nav-policies":
          store.navigate("iam", "policies");
          break;
        case "create-user":
        case "iam-create-user-btn":
          store.navigate("iam", "create-user");
          break;
        case "launch-instance":
          store.navigate("ec2", "launch");
          break;
        case "create-bucket":
          store.navigate("s3", "create-bucket");
          break;
        case "create-vpc":
          store.navigate("vpc", "create-vpc");
          break;
        default:
          if (id.startsWith("user-")) {
            const name = id.slice("user-".length);
            store.log("open_user", "iam_user", name, {});
            store.navigate("iam", "user-detail", name);
          } else if (id.startsWith("region-option-")) {
            store.setRegion(id.slice("region-option-".length));
          } else if (id.startsWith("region-")) {
            store.setRegion(id.slice("region-".length));
          }
      }

      await sleep(action.pause_ms ?? 280);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        resolveTarget,
        performAction,
        getClickedTrail: () => useAccountStore.getState().clickedTrail,
        clearTrail: () => useAccountStore.getState().clearTrail(),
        getActionLog: () => useAccountStore.getState().gradingLog,
        resetView: () => {
          useAccountStore.getState().hydrate({
            accountId,
            accountName,
            region,
            iamSeed,
            initialService: asService(initialView),
            initialPage,
          });
        },
      }),
      [resolveTarget, performAction, accountId, accountName, region, iamSeed, initialView, initialPage]
    );

    return (
      <div ref={rootRef} className="h-full min-h-0">
        <AwsConsole mode={mode} ticket={ticket} />
      </div>
    );
  }
);
