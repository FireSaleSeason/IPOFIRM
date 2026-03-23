import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  FileText,
  FileJson,
  Table2,
  Plus,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";

type ExportJob = {
  id: string;
  entity_ids: string[] | null;
  format: string;
  status: string;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
};

const FORMAT_OPTIONS = [
  { value: "CSV", label: "CSV", icon: FileText, description: "Comma-separated values, compatible with Excel & Google Sheets" },
  { value: "JSON", label: "JSON", icon: FileJson, description: "Structured JSON format for developers and APIs" },
  { value: "Excel", label: "Excel", icon: Table2, description: "Native .xlsx spreadsheet for Microsoft Excel" },
];

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed": return "default";
    case "pending":
    case "processing": return "secondary";
    case "failed": return "destructive";
    default: return "outline";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle className="w-3 h-3" />;
    case "pending":
    case "processing": return <Clock className="w-3 h-3" />;
    case "failed": return <XCircle className="w-3 h-3" />;
    default: return null;
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy HH:mm");
  } catch {
    return "—";
  }
};

export default function Exports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewExport, setShowNewExport] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("CSV");
  const [isCreating, setIsCreating] = useState(false);

  const { data: exportJobs, isLoading } = useQuery<ExportJob[]>({
    queryKey: ["export_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("export_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15000,
  });

  const totalExports = exportJobs?.length ?? 0;
  const completedExports = exportJobs?.filter((j) => j.status === "completed").length ?? 0;
  const pendingExports = exportJobs?.filter((j) => ["pending", "processing"].includes(j.status)).length ?? 0;
  const failedExports = exportJobs?.filter((j) => j.status === "failed").length ?? 0;

  const handleCreateExport = async () => {
    setIsCreating(true);
    try {
      const { error } = await supabase.functions.invoke("export-entities", {
        body: { format: selectedFormat },
      });
      if (error) throw error;
      toast({
        title: "Export queued",
        description: `Your ${selectedFormat} export has been queued and will be ready shortly.`,
      });
      setShowNewExport(false);
      queryClient.invalidateQueries({ queryKey: ["export_jobs"] });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Failed to start export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">EXPORT MANAGEMENT</h2>
                <p className="text-muted-foreground">
                  Generate and download entity data in your preferred format
                </p>
              </div>
              <Button onClick={() => setShowNewExport((v) => !v)} className="flex items-center gap-2">
                {showNewExport ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showNewExport ? "Cancel" : "New Export"}
              </Button>
            </div>

            {/* New Export Panel */}
            {showNewExport && (
              <Card className="bg-card/70 border-border backdrop-blur-sm border-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Create New Export
                  </CardTitle>
                  <CardDescription>Select a format and trigger a full entity data export</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {FORMAT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const selected = selectedFormat === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedFormat(opt.value)}
                          className={`text-left p-4 rounded-lg border-2 transition-all ${
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background/40 hover:border-primary/50"
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <p className={`font-semibold text-sm ${selected ? "text-primary" : "text-foreground"}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleCreateExport} disabled={isCreating} className="min-w-[140px]">
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Create Export
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Exports run asynchronously. You will see the download link once complete.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Exports", value: totalExports, icon: Package, color: "text-foreground" },
                { label: "Completed", value: completedExports, icon: CheckCircle, color: "text-green-500" },
                { label: "Pending", value: pendingExports, icon: Clock, color: "text-blue-500" },
                { label: "Failed", value: failedExports, icon: XCircle, color: "text-red-500" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="bg-card/70 border-border backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                        <div>
                          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Export Table */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export History
                </CardTitle>
                <CardDescription>All export jobs, most recent first</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !exportJobs || exportJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="font-semibold text-foreground">No exports yet</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Click "New Export" above to generate your first data export.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wide">
                          <th className="text-left pb-3 pr-4 font-medium">Format</th>
                          <th className="text-left pb-3 pr-4 font-medium">Status</th>
                          <th className="text-left pb-3 pr-4 font-medium hidden sm:table-cell">Entities</th>
                          <th className="text-left pb-3 pr-4 font-medium hidden md:table-cell">Created</th>
                          <th className="text-left pb-3 pr-4 font-medium hidden lg:table-cell">Completed</th>
                          <th className="text-left pb-3 font-medium">Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {exportJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-accent/30 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                {job.format === "JSON" ? (
                                  <FileJson className="w-4 h-4 text-muted-foreground" />
                                ) : job.format === "Excel" ? (
                                  <Table2 className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                )}
                                <Badge variant="outline" className="font-mono text-xs">
                                  {job.format ?? "CSV"}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant={getStatusVariant(job.status)}
                                className={
                                  job.status === "completed"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : ""
                                }
                              >
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(job.status)}
                                  <span className="capitalize">{job.status}</span>
                                </span>
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground hidden sm:table-cell">
                              {Array.isArray(job.entity_ids) ? job.entity_ids.length.toLocaleString() : "—"}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground hidden md:table-cell">
                              {formatDate(job.created_at)}
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground hidden lg:table-cell">
                              {formatDate(job.completed_at)}
                            </td>
                            <td className="py-3">
                              {job.file_url ? (
                                <a
                                  href={job.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  {job.status === "failed" && job.error_message
                                    ? "Error: " + job.error_message.slice(0, 40)
                                    : "—"}
                                </span>
                              )}
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
}
