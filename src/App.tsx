import { Toaster } from "@/components/ui/toaster";
import { Toaster as ToasterSonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/dashboard/Overview";
import SubscribersPage from "./pages/dashboard/Subscribers";
import SequencesPage from "./pages/dashboard/Sequences";
import BroadcastsPage from "./pages/dashboard/Broadcasts";
import LandingPagesPage from "./pages/dashboard/LandingPages";
import SettingsPage from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";

import PublicLandingPage from "./pages/PublicLandingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <ToasterSonner />
      <BrowserRouter basename="/plainly-yours/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/p/:slug" element={<PublicLandingPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="subscribers" element={<SubscribersPage />} />
            <Route path="sequences" element={<SequencesPage />} />
            <Route path="broadcasts" element={<BroadcastsPage />} />
            <Route path="pages" element={<LandingPagesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
