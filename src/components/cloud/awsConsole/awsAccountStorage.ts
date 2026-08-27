export type SavedAwsAccount = {
  email: string;
  password: string;
  accountName: string;
  accountId: string;
  region: string;
  createdAt: string;
};

const STORAGE_KEY = "rebon-aws-sandbox-account";

export function generateAccountId(): string {
  let id = "";
  for (let i = 0; i < 12; i += 1) {
    id += String(Math.floor(Math.random() * 10));
  }
  return id;
}

export function loadAwsAccount(): SavedAwsAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedAwsAccount;
    if (!parsed.email || !parsed.accountId || !parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAwsAccount(account: SavedAwsAccount): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
}

export function clearAwsAccount(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function iamUsernameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local || "root";
}
