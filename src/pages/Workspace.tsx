import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDomain } from "@/contexts/DomainContext";
import DomainNavbar from "@/components/app/DomainNavbar";
import CloudFresherWorkspace from "@/components/cloud/CloudFresherWorkspace";
import CommunicationWorkspace from "@/components/workspace/CommunicationWorkspace";
import { AUTH_REQUIRED } from "@/lib/authGate";

/**
 * Work section router.
 * Engineering → Cloud workspace (phases, tickets, journey map).
 * Communication → communication practice only.
 * Do not mix domains or revive the old "Full Stack Practice" shell here.
 */
const Workspace = () => {
  const { user, loading } = useAuth();
  const { domain, setSection } = useDomain();
  const navigate = useNavigate();

  useEffect(() => {
    setSection("workspace");
  }, [setSection]);

  useEffect(() => {
    if (AUTH_REQUIRED && !loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (AUTH_REQUIRED && loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DomainNavbar />
      <main
        className={
          domain === "fullstack"
            ? "w-full pt-28 pb-12"
            : "container mx-auto px-4 pt-28 pb-12"
        }
      >
        {domain === "fullstack" ? (
          <CloudFresherWorkspace />
        ) : (
          <CommunicationWorkspace />
        )}
      </main>
    </div>
  );
};

export default Workspace;
