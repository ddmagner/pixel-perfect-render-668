import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import SpaRedirector from "./components/SpaRedirector";
import Index from "./pages/Index";
import { TimeArchivePage } from "./pages/TimeArchive";
import SettingsPage from "./pages/Settings";
import ClientAddressPage from "./pages/ClientAddress";
import TermsOfUsePage from "./pages/TermsOfUse";
import PrivacyPolicyPage from "./pages/PrivacyPolicy";
import Auth from "./pages/Auth";
import NativeCallback from "./pages/NativeCallback";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import InvoicePage from "./pages/InvoicePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SpaRedirector />
            <ScrollToTop />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/native-callback" element={<NativeCallback />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/archive" element={
                <ProtectedRoute>
                  <TimeArchivePage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/client-address" element={
                <ProtectedRoute>
                  <ClientAddressPage />
                </ProtectedRoute>
              } />
              <Route path="/terms" element={
                <ProtectedRoute>
                  <TermsOfUsePage />
                </ProtectedRoute>
              } />
              <Route path="/privacy" element={
                <ProtectedRoute>
                  <PrivacyPolicyPage />
                </ProtectedRoute>
              } />
              <Route path="/invoice" element={<InvoicePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SubscriptionProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
