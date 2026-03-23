import { useState, useMemo } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Webhook,
  RefreshCw,
  Loader2,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Zap,
} from "lucide-react";

type ActiveTab = "webhooks" | "scraping";

function getStatusBadge(status: string | null) {
  if (!status) return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>;
  const s = status.toLowerCase();
  if (s === "success" || s === "completed" || s === "done") {
    return (
      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  }
  if (s === "failed" || s === "error") {
    return (
      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
        <XCircle className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  }
  if (s === "pending" || s === "running" || s === "active") {
    return (
      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Clock className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border">
      {status}
    </Badge>
  );
}

function getSourceBadge(source: string | null) {
  if (!source) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
  const colors: Record<string, string> = {
    linkedin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    companies_house: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    gleif: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    asic: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    crunchbase: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  };
  const key = source.toLowerCase().replace(/\s+/g, "_");
  const cls = colors[key] ?? "bg-muted/40 text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cls}>
      {source}
    </Badge>
  );
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

function truncatePayload(payload: unknown): string {
  if (!payload) return "—";
  try {
    const str = typeof payload === "string" ? payload : JSON.stringify(payload);
    return str.length > 80 ? str.slice(0, 80) + "…" : str;
  } catch {
    return "—";
  }
}

const IntegrationLogs = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("webhooks");

  const { data: callbacks, isLoading: cbLoading, isError: cbError } = useQuery({
    queryKey: ["callback_inbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("callback_inbox")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: scrapingJobs, isLoading: sjLoading, isError: sjError } = useQuery({
    queryKey: ["scraping_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scraping_jobs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const totalWebhooks = callbacks?.length ?? 0;
    const successfulWebhooks =
      callbacks?.filter((c) =>
        ["success", "completed", "done"].includes((c.status ?? "").toLowerCase())
      ).length ?? 0;
    const successRate =
      totalWebhooks > 0
        ? `${Math.round((successfulWebhooks / totalWebhooks) * 100)}%`
        : "—";
    const failedJobs =
      scrapingJobs?.filter((j) =>
        ["failed", "error"].includes((j.status ?? "").toLowerCase())
      ).length ?? 0;
    const activeJobs =
      scrapingJobs?.filter((j) =>
        ["running", "active", "pending"].includes((j.status ?? "").toLowerCase())
      ).length ?? 0;
    return { totalWebhooks, successRate, failedJobs, activeJobs };
  }, [callbacks, scrapingJobs]);

  const handleRetry = (id: string) => {
    toast.success(`Retry triggered for job ${id}`);
  };

  const statCards = [
    {
      label: "Total Webhooks",
      value: stats.totalWebhooks,
      icon: Webhook,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Success Rate",
      value: stats.successRate,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Failed Jobs",
      value: stats.failedJobs,
      icon: AlertCircle,
      color: stats.failedJobs > 0 ? "text-red-500" : "text-muted-foreground",
      bg: stats.failedJobs > 0 ? "bg-red-500/10" : "bg-muted/20",
    },
    {
      label: "Active Jobs",
      value: stats.activeJobs,
      icon: Activity,
      color: stats.activeJobs > 0 ? "text-yellow-500" : "text-muted-foreground",
      bg: stats.activeJobs > 0 ? "bg-yellow-500/10" : "bg-muted/20",
    },
  ];

  const isLoading = cbLoading || sjLoading;

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">INTEGRATION LOGS</h2>
              <p className="text-muted-foreground">
                Webhook callbacks and scraping job monitoring for all data integrations
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.label} className="bg-card/70 border-border backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${card.bg}`}>
                          <Icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{card.label}</p>
                          <p className={`text-2xl font-bold ${card.color}`}>
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              card.value
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Tabs + Content */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Integration Activity
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Webhook callbacks and scraping job history
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 p-1 bg-muted/30 rounded-lg self-start sm:self-auto">
                    <button
                      onClick={() => setActiveTab("webhooks")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "webhooks"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Webhook className="w-3.5 h-3.5" />
                      Webhook Callbacks
                    </button>
                    <button
                      onClick={() => setActiveTab("scraping")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "scraping"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      Scraping Jobs
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === "webhooks" && (
                  <>
                    {cbLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : cbError ? (
                      <p className="text-red-500 text-sm py-6 text-center">
                        Failed to load webhook callbacks. Please try again.
                      </p>
                    ) : !callbacks || callbacks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Webhook className="w-10 h-10 opacity-30" />
                        <p className="text-sm">No webhook callbacks recorded yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="text-left py-3 px-2 font-medium">Job ID</th>
                              <th className="text-left py-3 px-2 font-medium">Status</th>
                              <th className="text-left py-3 px-2 font-medium">Payload Preview</th>
                              <th className="text-left py-3 px-2 font-medium">Received At</th>
                              <th className="text-left py-3 px-2 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {callbacks.map((cb) => (
                              <tr
                                key={cb.id}
                                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                              >
                                <td className="py-3 px-2 font-mono text-xs text-muted-foreground truncate max-w-[140px]">
                                  {cb.job_id ?? "—"}
                                </td>
                                <td className="py-3 px-2">{getStatusBadge(cb.status)}</td>
                                <td className="py-3 px-2 font-mono text-xs text-muted-foreground max-w-[240px] truncate">
                                  {truncatePayload(cb.payload)}
                                </td>
                                <td className="py-3 px-2 text-muted-foreground text-xs whitespace-nowrap">
                                  {cb.created_at
                                    ? new Date(cb.created_at).toLocaleString()
                                    : "—"}
                                </td>
                                <td className="py-3 px-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => handleRetry(cb.id)}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Retry
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-muted-foreground mt-3 pl-2">
                          Showing {callbacks.length} webhook callbacks
                        </p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "scraping" && (
                  <>
                    {sjLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : sjError ? (
                      <p className="text-red-500 text-sm py-6 text-center">
                        Failed to load scraping jobs. Please try again.
                      </p>
                    ) : !scrapingJobs || scrapingJobs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Database className="w-10 h-10 opacity-30" />
                        <p className="text-sm">No scraping jobs found.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="text-left py-3 px-2 font-medium">Source</th>
                              <th className="text-left py-3 px-2 font-medium">Search Term</th>
                              <th className="text-left py-3 px-2 font-medium">Status</th>
                              <th className="text-left py-3 px-2 font-medium">Started At</th>
                              <th className="text-left py-3 px-2 font-medium">Duration</th>
                              <th className="text-left py-3 px-2 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scrapingJobs.map((job) => (
                              <tr
                                key={job.id}
                                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                              >
                                <td className="py-3 px-2">
                                  {getSourceBadge(job.source)}
                                </td>
                                <td className="py-3 px-2 text-muted-foreground max-w-[200px] truncate">
                                  {job.search_term ?? "—"}
                                </td>
                                <td className="py-3 px-2">
                                  {getStatusBadge(job.status)}
                                </td>
                                <td className="py-3 px-2 text-muted-foreground text-xs whitespace-nowrap">
                                  {job.started_at
                                    ? new Date(job.started_at).toLocaleString()
                                    : "—"}
                                </td>
                                <td className="py-3 px-2 text-muted-foreground text-xs">
                                  {formatDuration(job.started_at, job.completed_at)}
                                </td>
                                <td className="py-3 px-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => handleRetry(job.id)}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Retry
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {scrapingJobs.some((j) => j.error_message) && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground pl-2">Error Details</p>
                            {scrapingJobs
                              .filter((j) => j.error_message)
                              .map((j) => (
                                <div
                                  key={`err-${j.id}`}
                                  className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                                >
                                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-red-400">
                                      {j.source ?? "Unknown source"} — {j.search_term ?? ""}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {j.error_message}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-3 pl-2">
                          Showing {scrapingJobs.length} scraping jobs
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default IntegrationLogs;
