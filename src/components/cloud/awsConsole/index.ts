export { AccountIdGate } from "./AccountIdGate";
export { OpsConsoleHost, useOpsUnlockForTask } from "./OpsConsoleHost";
export type { AccountUnlockState } from "./OpsConsoleHost";
export { AwsWorkspaceConsole } from "./AwsWorkspaceConsole";
export { AwsAccountSignup } from "./AwsAccountSignup";
export {
  loadAwsAccount,
  saveAwsAccount,
  clearAwsAccount,
  generateAccountId,
} from "./awsAccountStorage";
export type { SavedAwsAccount } from "./awsAccountStorage";
export {
  OPS_SHELL_CONTRACT,
  formatAccountIdDisplay,
  normalizeAccountId,
  accountIdsMatch,
} from "./shellContract";
export { criteriaMet } from "./iamActions";
export type { IamConsoleAction } from "./iamActions";

export { AwsConsole } from "./cloudscape/AwsConsole";
export { useAccountStore } from "./cloudscape/store";
export { createFreshBiteSeed, createEmptyAccountSeed } from "./cloudscape/seed";
export type { AccountSnapshot, ActionLogEntry, ConsoleMode, FlashMessage, VisualMode } from "./cloudscape/types";
export { executeAction, listActionCodes } from "./actionMap/executeAction";
export type { ActionResult } from "./actionMap/types";
export { awsId, scaledMs, simulateOperation, SIM_MS } from "./cloudscape/simulateOperation";
