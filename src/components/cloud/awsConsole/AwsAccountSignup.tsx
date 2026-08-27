import { useState } from "react";
import "@/aws-console.css";
import {
  generateAccountId,
  iamUsernameFromEmail,
  loadAwsAccount,
  saveAwsAccount,
  type SavedAwsAccount,
} from "./awsAccountStorage";

type Props = {
  onComplete: (account: SavedAwsAccount) => void;
  onBack?: () => void;
};

type Mode = "create" | "signin";

export function AwsAccountSignup({ onComplete, onBack }: Props) {
  const existing = loadAwsAccount();
  const [mode, setMode] = useState<Mode>(existing ? "signin" : "create");
  const [email, setEmail] = useState(existing?.email || "");
  const [accountName, setAccountName] = useState(existing?.accountName || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitCreate = () => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (!accountName.trim()) {
      setError("Choose a name for your AWS account.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const account: SavedAwsAccount = {
      email: trimmedEmail,
      password,
      accountName: accountName.trim(),
      accountId: generateAccountId(),
      region: "us-east-1",
      createdAt: new Date().toISOString(),
    };
    saveAwsAccount(account);
    window.setTimeout(() => {
      setBusy(false);
      onComplete(account);
    }, 600);
  };

  const submitSignIn = () => {
    setError(null);
    const saved = loadAwsAccount();
    if (!saved) {
      setError("No account found. Create one first.");
      setMode("create");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== saved.email || password !== saved.password) {
      setError("Email or password is incorrect.");
      return;
    }
    onComplete(saved);
  };

  return (
    <div className="aws-signup-root">
      <header className="aws-signup-header">
        <div className="aws-signup-header-inner">
          <div className="aws-signup-logo" aria-hidden>
            aws
          </div>
          {onBack && (
            <button type="button" className="aws-signup-back" onClick={onBack}>
              ← Workspace
            </button>
          )}
        </div>
      </header>

      <main className="aws-signup-main">
        <div className="aws-signup-card">
          <h1>
            {mode === "create" ? "Create your AWS account" : "Sign in to the AWS Management Console"}
          </h1>
          <p className="aws-signup-lead">
            {mode === "create"
              ? "Start with a new sandbox account. No company ticket or pre-filled data — this is your own console."
              : "Use the root user email and password you created for this sandbox."}
          </p>

          <div className="aws-signup-tabs">
            <button
              type="button"
              className={mode === "create" ? "is-active" : ""}
              onClick={() => {
                setMode("create");
                setError(null);
              }}
            >
              Create account
            </button>
            <button
              type="button"
              className={mode === "signin" ? "is-active" : ""}
              onClick={() => {
                setMode("signin");
                setError(null);
                if (existing) setEmail(existing.email);
              }}
            >
              Sign in
            </button>
          </div>

          <form
            className="aws-signup-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "create") submitCreate();
              else submitSignIn();
            }}
          >
            <label>
              <span>Root user email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@example.com"
                required
              />
            </label>

            {mode === "create" && (
              <label>
                <span>AWS account name</span>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="My AWS account"
                  required
                />
              </label>
            )}

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                required
              />
            </label>

            {mode === "create" && (
              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
            )}

            {error && <p className="aws-signup-error">{error}</p>}

            <button type="submit" className="aws-signup-submit" disabled={busy}>
              {busy
                ? "Creating account…"
                : mode === "create"
                  ? "Create account and continue"
                  : "Sign in to console"}
            </button>
          </form>

          {mode === "create" && (
            <p className="aws-signup-footnote">
              This is a local simulation. Your account is stored in this browser only.
              {existing && (
                <>
                  {" "}
                  <button
                    type="button"
                    className="aws-signup-link"
                    onClick={() => {
                      setMode("signin");
                      setEmail(existing.email);
                      setError(null);
                    }}
                  >
                    Sign in instead
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </main>

      <footer className="aws-signup-footer">
        <span>© 2026, Amazon Web Services, Inc. or its affiliates. (Simulated)</span>
      </footer>
    </div>
  );
}

export { iamUsernameFromEmail };
