import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDomain } from "@/contexts/DomainContext";
import DomainNavbar from "@/components/app/DomainNavbar";
import { useRebonMode } from "@/components/cloud/RebonModeSwitcher";
import { StudentWorkCatalog } from "@/components/cloud/studentMode/StudentWorkCatalog";
import { ProfessionalWorkCatalog } from "@/components/cloud/professionalMode/ProfessionalWorkCatalog";
import { ModePlaceholder } from "@/components/cloud/ModePlaceholder";
import CommunicationWorkspace from "@/components/workspace/CommunicationWorkspace";
import { AUTH_REQUIRED } from "@/lib/authGate";

/**
 * Work — same page chrome as Learn (CloudDeskShell inside catalogs).
 */
const Workspace = () => {
  const { user, loading } = useAuth();
  const { domain, setSection } = useDomain();
  const navigate = useNavigate();
  const [mode] = useRebonMode();

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

  const renderCloudWork = () => {
    if (mode === "student") return <StudentWorkCatalog />;
    if (mode === "professional") return <ProfessionalWorkCatalog />;
    return <ModePlaceholder mode="ai_professional" section="work" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <DomainNavbar />
      <main
        className={
          domain === "fullstack"
            ? "mx-auto w-full max-w-4xl px-4 pt-28 pb-10 md:px-6"
            : "container mx-auto px-4 pt-28 pb-12"
        }
      >
        {domain === "fullstack" ? renderCloudWork() : <CommunicationWorkspace />}
      </main>
    </div>
  );
};

export default Workspace;
