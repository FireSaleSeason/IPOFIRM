import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  FileCheck,
  Loader2,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const Compliance = () => {
  const [exportLoading, setExportLoading] = useState(false);

  const {
    data: auditLogs,
    isLoading: auditLoading,
    isError: auditError,
  } = useQuery({
    queryKey: ["audit_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: riskFlags,
    isLoading: riskLoading,
    isError: riskError,
  } = useQuery({
    queryKey: ["filter_checks_failed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_checks")
        .select("*")
        .eq("passed", false)
        .order("checked_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const apiCallsToday =
    auditLogs?.filter((log) => log.created_at?.startsWith(today)).length ?? 0;
  const totalActions = auditLogs?.length ?? 0;
  const totalRiskFlags = riskFlags?.length ?? 0;

  const allFilterChecks = useQuery({
    queryKey: ["filter_checks_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_checks")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalChecks = allFilterChecks.data?.length ?? 0;
  const passedChecks = allFilterChecks.data?.filter((c) => c.passed).length ?? 0;
  const compliantPct =
    totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  const handleExportCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    setExportLoading(true);
    try {
      const headers = ["ID", "Action", "Resource Type", "Resource ID", "User ID", "IP Address", "Created At"];
      const rows = auditLogs.map((log) => [
        log.id,
        log.action ?? "",
        log.resource_type ?? "",
        log.resource_id ?? "",
        log.user_id ?? "",
        log.ip_address ?? "",
        log.created_at ?? "",
      ]);
      const csvContent = [headers, ...rows]
        .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit_log_${today}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  const kpiCards = [
    {
      label: "Total Audited Actions",
      value: totalActions,
      icon: Activity,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "API Calls Today",
      value: apiCallsToday,
      icon: FileCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Risk Flags",
      value: totalRiskFlags,
      icon: AlertTriangle,
      color: totalRiskFlags > 0 ? "text-red-500" : "text-green-500",
      bg: totalRiskFlags > 0 ? "bg-red-500/10" : "bg-green-500/10",
    },
    {
      label: "Compliant Entities %",
      value: `${compliantPct}%`,
      icon: ShieldCheck,
      color: compliantPct >= 80 ? "text-green-500" : "text-yellow-500",
      bg: compliantPct >= 80 ? "bg-green-500/10" : "bg-yellow-500/10",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  COMPLIANCE & AUDIT CENTER
                </h2>
                <p className="text-muted-foreground">
                  Legal and regulatory audit tracking for SEC/GDPR compliance
                </p>
              </div>
              <Button
                onClick={handleExportCSV}
                disabled={exportLoading || !auditLogs || auditLogs.length === 0}
                className="flex items-center gap-2"
              >
                {exportLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export CSV
              </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card) => {
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
                            {auditLoading || allFilterChecks.isLoading ? (
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

            {/* Audit Log Table */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Audit Log
                </CardTitle>
                <CardDescription>
                  Every API call, data update, and user edit — last 50 entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : auditError ? (
                  <p className="text-red-500 text-sm py-6 text-center">
                    Failed to load audit log. Please try again.
                  </p>
                ) : !auditLogs || auditLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <FileCheck className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No audit log entries found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-3 px-2 font-medium">Action</th>
                          <th className="text-left py-3 px-2 font-medium">Resource Type</th>
                          <th className="text-left py-3 px-2 font-medium">Resource ID</th>
                          <th className="text-left py-3 px-2 font-medium">IP Address</th>
                          <th className="text-left py-3 px-2 font-medium">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-3 px-2">
                              <Badge
                                variant="outline"
                                className={
                                  log.action?.toLowerCase().includes("delete")
                                    ? "border-red-500/50 text-red-400"
                                    : log.action?.toLowerCase().includes("create") ||
                                      log.action?.toLowerCase().includes("insert")
                                    ? "border-green-500/50 text-green-400"
                                    : "border-blue-500/50 text-blue-400"
                                }
                              >
                                {log.action ?? "—"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {log.resource_type ?? "—"}
                            </td>
                            <td className="py-3 px-2 font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                              {log.resource_id ?? "—"}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs">
                              {log.ip_address ?? "—"}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs whitespace-nowrap">
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Risk Flags */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Compliance Risk Flags
                </CardTitle>
                <CardDescription>
                  Entities that failed one or more compliance filter checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {riskLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : riskError ? (
                  <p className="text-red-500 text-sm py-6 text-center">
                    Failed to load risk flags. Please try again.
                  </p>
                ) : !riskFlags || riskFlags.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 text-green-500 opacity-60" />
                    <p className="text-sm font-medium text-green-500">
                      No compliance risk flags detected.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      All entities passed their filter checks.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-3 px-2 font-medium">Entity ID</th>
                          <th className="text-left py-3 px-2 font-medium">Rule Name</th>
                          <th className="text-left py-3 px-2 font-medium">Score</th>
                          <th className="text-left py-3 px-2 font-medium">Status</th>
                          <th className="text-left py-3 px-2 font-medium">Checked At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskFlags.map((flag) => (
                          <tr
                            key={flag.id}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-3 px-2 font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                              {flag.entity_id ?? "—"}
                            </td>
                            <td className="py-3 px-2 font-medium">{flag.rule_name ?? "—"}</td>
                            <td className="py-3 px-2">
                              <span className="text-red-400 font-semibold">
                                {flag.score != null ? flag.score.toFixed(2) : "—"}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs whitespace-nowrap">
                              {flag.checked_at
                                ? new Date(flag.checked_at).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Compliance;
