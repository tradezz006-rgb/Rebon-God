import { createContext, useContext, useState, ReactNode } from "react";

export type Domain = "communication" | "fullstack";
export type Section = "learning" | "workspace" | "profile";

interface DomainContextType {
  domain: Domain;
  setDomain: (domain: Domain) => void;
  section: Section;
  setSection: (section: Section) => void;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export const DomainProvider = ({ children }: { children: ReactNode }) => {
  const [domain, setDomain] = useState<Domain>("communication");
  const [section, setSection] = useState<Section>("learning");

  return (
    <DomainContext.Provider value={{ domain, setDomain, section, setSection }}>
      {children}
    </DomainContext.Provider>
  );
};

export const useDomain = () => {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error("useDomain must be used within a DomainProvider");
  }
  return context;
};
