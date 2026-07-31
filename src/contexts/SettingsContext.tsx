import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type TeachLanguage = "english" | "tanglish";
export type AppTheme = "dark" | "light";

interface SettingsContextType {
  teachLanguage: TeachLanguage;
  setTeachLanguage: (lang: TeachLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [teachLanguage, setTeachLanguageState] = useState<TeachLanguage>(() => {
    return (localStorage.getItem("rebon_teach_language") as TeachLanguage) || "english";
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem("rebon_theme") as AppTheme) || "dark";
  });

  const setTeachLanguage = (lang: TeachLanguage) => {
    setTeachLanguageState(lang);
    localStorage.setItem("rebon_teach_language", lang);
  };

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    localStorage.setItem("rebon_theme", t);
    if (t === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // Apply theme on mount
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ teachLanguage, setTeachLanguage, theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
