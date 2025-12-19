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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/data-sources" element={<ProtectedRoute><DataSources /></ProtectedRoute>} />
            <Route path="/sentiment-monitor" element={<ProtectedRoute><SentimentMonitor /></ProtectedRoute>} />
            <Route path="/investor-fund-scraper" element={<ProtectedRoute><InvestorFundScraper /></ProtectedRoute>} />
            <Route path="/lead-generation" element={<ProtectedRoute><LeadGeneration /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
            <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/content-library" element={<ProtectedRoute><ContentLibrary /></ProtectedRoute>} />
            <Route path="/data-normalization" element={<ProtectedRoute><DataNormalization /></ProtectedRoute>} />
            <Route path="/rules-scoring" element={<ProtectedRoute><RulesScoring /></ProtectedRoute>} />
            <Route path="/registry-management" element={<ProtectedRoute><RegistryManagement /></ProtectedRoute>} />
            <Route path="/exports" element={<ProtectedRoute><Exports /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
            <Route path="/workflow-builder" element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} />
            <Route path="/ai-agent" element={<ProtectedRoute><AIAgent /></ProtectedRoute>} />
            <Route path="/ai-training" element={<ProtectedRoute><AITraining /></ProtectedRoute>} />
            <Route path="/task-scheduler" element={<ProtectedRoute><TaskScheduler /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/pipeline-performance" element={<ProtectedRoute><PipelinePerformance /></ProtectedRoute>} />
            <Route path="/communication-logs" element={<ProtectedRoute><CommunicationLogs /></ProtectedRoute>} />
            <Route path="/integration-logs" element={<ProtectedRoute><IntegrationLogs /></ProtectedRoute>} />
            <Route path="/system-health" element={<ProtectedRoute><SystemHealth /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
            <Route path="/credential-vault" element={<ProtectedRoute><CredentialVault /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
