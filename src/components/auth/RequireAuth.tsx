import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_REQUIRED } from "@/lib/authGate";

type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Redirects unauthenticated users to /auth when AUTH_REQUIRED is on.
 * Shows a short loading state while the session is resolving.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (!AUTH_REQUIRED) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/auth" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
