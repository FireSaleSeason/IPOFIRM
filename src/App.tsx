import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import DataSources from "./pages/DataSources";
import SentimentMonitor from "./pages/SentimentMonitor";
import LeadGeneration from "./pages/LeadGeneration";
import CRM from "./pages/CRM";
import AIAgent from "./pages/AIAgent";
import Marketing from "./pages/Marketing";
import Analytics from "./pages/Analytics";
import RegistryManagement from "./pages/RegistryManagement";
import DataNormalization from "./pages/DataNormalization";
import AITraining from "./pages/AITraining";
import ContentLibrary from "./pages/ContentLibrary";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import PipelinePerformance from "./pages/PipelinePerformance";
import CommunicationLogs from "./pages/CommunicationLogs";
import TaskScheduler from "./pages/TaskScheduler";
import CredentialVault from "./pages/CredentialVault";
import SystemHealth from "./pages/SystemHealth";
import Compliance from "./pages/Compliance";
import Documents from "./pages/Documents";
import InvestorIntelligence from "./pages/InvestorIntelligence";
import Performance from "./pages/Performance";
import Knowledge from "./pages/Knowledge";
import IntegrationLogs from "./pages/IntegrationLogs";
import Feedback from "./pages/Feedback";
import RulesScoring from "./pages/RulesScoring";
import Exports from "./pages/Exports";
import Settings from "./pages/Settings";
import InvestorFundScraper from "./pages/InvestorFundScraper";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="/sentiment-monitor" element={<SentimentMonitor />} />
            <Route path="/investor-fund-scraper" element={<InvestorFundScraper />} />
            <Route path="/lead-generation" element={<LeadGeneration />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/content-library" element={<ContentLibrary />} />
            <Route path="/data-normalization" element={<DataNormalization />} />
            <Route path="/rules-scoring" element={<RulesScoring />} />
            <Route path="/registry-management" element={<RegistryManagement />} />
            <Route path="/exports" element={<Exports />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/workflow-builder" element={<WorkflowBuilder />} />
            <Route path="/ai-agent" element={<AIAgent />} />
            <Route path="/ai-training" element={<AITraining />} />
            <Route path="/task-scheduler" element={<TaskScheduler />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/pipeline-performance" element={<PipelinePerformance />} />
            <Route path="/communication-logs" element={<CommunicationLogs />} />
            <Route path="/integration-logs" element={<IntegrationLogs />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/credential-vault" element={<CredentialVault />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
