import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DomainProvider } from "@/contexts/DomainContext";
import { AvaProvider } from "@/contexts/AvaContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { UniverseGateProvider } from "@/components/landing/UniverseGate";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Learning from "./pages/Learning";
import LessonRouter from "./pages/LessonRouter";
import Workspace from "./pages/Workspace";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SettingsProvider>
        <DomainProvider>
          <AvaProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <UniverseGateProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/lesson/:id" element={<LessonRouter />} />
                    <Route path="/workspace" element={<Workspace />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </UniverseGateProvider>
              </BrowserRouter>
            </TooltipProvider>
          </AvaProvider>
        </DomainProvider>
      </SettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
