import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ProtocolDigitizationAI from "@/pages/ProtocolDigitizationAI";
import StudyManagement from "@/pages/StudyManagement";
import DataIntegration from "@/pages/DataIntegration";
import TrialDataManagement from "@/pages/TrialDataManagement";
import DataManagement from "@/pages/DataManagement";
import DataManagerAI from "@/pages/DataManagerAI";
import CentralMonitorAI from "@/pages/CentralMonitorAI";
import CsrAi from "@/pages/CsrAi";
import Tasks from "@/pages/Tasks";
import RiskProfiles from "@/pages/RiskProfiles";
import SignalDetection from "@/pages/SignalDetection";
import SignalDetails from "@/pages/SignalDetails";
import Analytics from "@/pages/Analytics";
import Notifications from "@/pages/Notifications";
import Admin from "@/pages/Admin";
import AiAgents from "@/pages/AiAgents";
import TechnicalDetailsPage from "@/pages/technical-details";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      
      {/* Redirect root to dashboard */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/protocol-digitization-ai" component={ProtocolDigitizationAI} />
      <ProtectedRoute path="/study-management" component={StudyManagement} />
      <ProtectedRoute path="/data-integration" component={DataIntegration} />
      <ProtectedRoute path="/trial-data-management" component={TrialDataManagement} />
      <ProtectedRoute path="/trial-data-management/:studyId" component={TrialDataManagement} />
      <ProtectedRoute path="/data-management" component={DataManagement} />
      <ProtectedRoute path="/data-manager-ai" component={DataManagerAI} />
      <ProtectedRoute path="/central-monitor-ai" component={CentralMonitorAI} />
      <ProtectedRoute path="/csr-ai" component={CsrAi} />
      <ProtectedRoute path="/ai-agents" component={AiAgents} />
      <ProtectedRoute path="/signal-detection" component={SignalDetection} />
      <ProtectedRoute path="/signaldetection/details/:id" component={SignalDetails} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/tasks/create" component={Tasks} />
      <ProtectedRoute path="/tasks/:id" component={Tasks} />
      <ProtectedRoute path="/risk-profiles" component={RiskProfiles} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/notifications" component={Notifications} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={Admin} adminOnly={true} />
      <ProtectedRoute path="/admin/users" component={Admin} adminOnly={true} />
      <ProtectedRoute path="/admin/logs" component={Admin} adminOnly={true} />
      <ProtectedRoute path="/admin/security" component={Admin} adminOnly={true} />
      <ProtectedRoute path="/admin/settings" component={Admin} adminOnly={true} />
      <ProtectedRoute path="/technical-details" component={TechnicalDetailsPage} adminOnly={true} />
      
      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
