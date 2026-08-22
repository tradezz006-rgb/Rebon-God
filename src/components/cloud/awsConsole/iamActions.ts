/** In-console action log for ops grading */
export type IamConsoleAction =
  | { type: "navigate"; path: string }
  | { type: "search_user"; query: string }
  | { type: "open_user"; user_name: string }
  | { type: "attach_policy"; user_name: string; policy: string }
  | { type: "add_to_group"; user_name: string; group: string }
  | { type: "delete_access_key"; user_name: string }
  | { type: "create_access_key"; user_name: string };

export function criteriaMet(
  actions: IamConsoleAction[],
  required: string[],
  opts?: { target_user?: string; target_policy?: string }
): boolean {
  const types = new Set(actions.map((a) => a.type));
  for (const need of required) {
    if (!types.has(need as IamConsoleAction["type"])) return false;
  }
  if (opts?.target_user) {
    const hit = actions.some(
      (a) =>
        (a.type === "attach_policy" ||
          a.type === "open_user" ||
          a.type === "add_to_group") &&
        a.user_name === opts.target_user
    );
    if (!hit) return false;
  }
  if (opts?.target_policy) {
    const hit = actions.some(
      (a) =>
        a.type === "attach_policy" &&
        a.policy === opts.target_policy &&
        (!opts.target_user || a.user_name === opts.target_user)
    );
    if (!hit) return false;
  }
  return true;
}
