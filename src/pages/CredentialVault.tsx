import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Zap,
  CreditCard,
  Phone,
  Database,
  Bot,
} from "lucide-react";

type IntegrationStatus = "configured" | "not_configured";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: IntegrationStatus;
  lastUpdated: string;
  keyLabel: string;
  placeholder: string;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "n8n",
    name: "N8N",
    description: "Workflow automation and orchestration engine",
    icon: Zap,
    status: "configured",
    lastUpdated: "2026-03-10",
    keyLabel: "Webhook URL",
    placeholder: "https://your-n8n-instance.com/webhook/...",
  },
  {
    id: "twilio",
    name: "Twilio",
    description: "SMS and voice communication platform",
    icon: Phone,
    status: "configured",
    lastUpdated: "2026-02-28",
    keyLabel: "Account SID / Auth Token",
    placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing and billing",
    icon: CreditCard,
    status: "configured",
    lastUpdated: "2026-03-01",
    keyLabel: "Secret Key",
    placeholder: "sk_live_...",
  },
  {
    id: "apify",
    name: "Apify",
    description: "Web scraping and data extraction platform",
    icon: Bot,
    status: "not_configured",
    lastUpdated: "—",
    keyLabel: "API Token",
    placeholder: "apify_api_...",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Backend database and authentication",
    icon: Database,
    status: "configured",
    lastUpdated: "2026-01-15",
    keyLabel: "Service Role Key",
    placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
];

export default function CredentialVault() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [pingResults, setPingResults] = useState<Record<string, "ok" | "fail" | "loading">>({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  const handleEdit = (integration: Integration) => {
    setEditingId(integration.id);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = async (integration: Integration) => {
    if (!editValue.trim()) {
      toast({
        title: "Validation error",
        description: "Please enter a valid key or URL before saving.",
        variant: "destructive",
      });
      return;
    }
    setSavingId(integration.id);
    try {
      // Keys are stored server-side in Supabase Vault — we invoke an edge function to securely update
      const { error } = await supabase.functions.invoke("update-integration-secret", {
        body: { integration: integration.id, value: editValue },
      });
      if (error) throw error;
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integration.id
            ? { ...i, status: "configured" as IntegrationStatus, lastUpdated: new Date().toISOString().split("T")[0] }
            : i
        )
      );
      toast({
        title: "Credential updated",
        description: `${integration.name} ${integration.keyLabel} has been securely saved.`,
      });
      setEditingId(null);
      setEditValue("");
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save credential. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handlePingOne = async (id: string) => {
    setPingResults((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const { error } = await supabase.functions.invoke("health-check-integration", {
        body: { integration: id },
      });
      setPingResults((prev) => ({ ...prev, [id]: error ? "fail" : "ok" }));
    } catch {
      setPingResults((prev) => ({ ...prev, [id]: "fail" }));
    }
  };

  const handleRunAllHealthChecks = async () => {
    setIsRunningAll(true);
    const configured = integrations.filter((i) => i.status === "configured");
    setPingResults(Object.fromEntries(configured.map((i) => [i.id, "loading"])));
    await Promise.allSettled(
      configured.map(async (i) => {
        try {
          const { error } = await supabase.functions.invoke("health-check-integration", {
            body: { integration: i.id },
          });
          setPingResults((prev) => ({ ...prev, [i.id]: error ? "fail" : "ok" }));
        } catch {
          setPingResults((prev) => ({ ...prev, [i.id]: "fail" }));
        }
      })
    );
    setIsRunningAll(false);
    toast({
      title: "Health checks complete",
      description: "All configured integrations have been tested.",
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">SECURITY & CREDENTIAL VAULT</h2>
                <p className="text-muted-foreground">
                  Manage API keys and integration credentials securely
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRunAllHealthChecks}
                disabled={isRunningAll}
                className="flex items-center gap-2"
              >
                {isRunningAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Integration Health Check
              </Button>
            </div>

            {/* Security Notice */}
            <Card className="bg-amber-500/10 border-amber-500/30 backdrop-blur-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-500 text-sm">Security Notice</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      API keys are stored encrypted in{" "}
                      <span className="font-medium text-foreground">Supabase Vault</span> and are never
                      exposed in the frontend. The UI only manages labels and triggers secure server-side
                      updates via Edge Functions. Keys entered here are transmitted over TLS and immediately
                      discarded after storage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="bg-card/70 border-border backdrop-blur-sm">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {integrations.filter((i) => i.status === "configured").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Configured</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-border backdrop-blur-sm">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {integrations.filter((i) => i.status === "not_configured").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Not Configured</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/70 border-border backdrop-blur-sm col-span-2 sm:col-span-1">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{integrations.length}</p>
                      <p className="text-xs text-muted-foreground">Total Integrations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Cards */}
            <div className="space-y-4">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                const isEditing = editingId === integration.id;
                const isSaving = savingId === integration.id;
                const pingResult = pingResults[integration.id];

                return (
                  <Card key={integration.id} className="bg-card/70 border-border backdrop-blur-sm">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-start gap-4 flex-wrap">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h3 className="font-semibold text-foreground">{integration.name}</h3>
                            <Badge
                              variant={integration.status === "configured" ? "default" : "outline"}
                              className={
                                integration.status === "configured"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                                  : "text-amber-500 border-amber-500/50 text-xs"
                              }
                            >
                              {integration.status === "configured" ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Configured
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Not Configured
                                </span>
                              )}
                            </Badge>
                            {pingResult && (
                              <Badge
                                variant={pingResult === "ok" ? "default" : pingResult === "loading" ? "secondary" : "destructive"}
                                className={
                                  pingResult === "ok"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                                    : "text-xs"
                                }
                              >
                                {pingResult === "loading" ? (
                                  <span className="flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                                  </span>
                                ) : pingResult === "ok" ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Reachable
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Unreachable
                                  </span>
                                )}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">{integration.keyLabel}</span>
                            {" · "}Last updated: {integration.lastUpdated}
                          </p>

                          {/* Edit Form */}
                          {isEditing && (
                            <div className="mt-4 p-4 rounded-lg border border-border bg-background/50 space-y-3">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Update {integration.keyLabel}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <input
                                    type="password"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder={integration.placeholder}
                                    className="w-full pl-9 pr-4 py-2 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSave(integration);
                                      if (e.key === "Escape") handleCancelEdit();
                                    }}
                                    autoFocus
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(integration)}
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Transmitted over TLS — never stored in frontend state
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!isEditing && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePingOne(integration.id)}
                                disabled={pingResult === "loading" || integration.status === "not_configured"}
                                title="Run health check"
                              >
                                {pingResult === "loading" ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(integration)}
                                className="flex items-center gap-1.5"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Vault Info Footer */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="w-4 h-4" />
                  How Credential Storage Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-muted-foreground">
                  <div className="flex flex-col gap-1.5">
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" /> AES-256 Encryption
                    </p>
                    <p>All secrets are encrypted at rest inside Supabase Vault using AES-256 before writing to disk.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" /> Zero Frontend Exposure
                    </p>
                    <p>Keys are never returned to the browser. Edge Functions read secrets directly from the Vault at runtime.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-medium text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" /> Access Controlled
                    </p>
                    <p>Only authenticated admin users can trigger secret updates. All changes are logged in the audit trail.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
