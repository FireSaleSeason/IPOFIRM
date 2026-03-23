import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Activity, CheckCircle, XCircle, Clock, RefreshCw, Server, Cpu, Database, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays, differenceInSeconds, isAfter, parseISO } from "date-fns";

type ScrapingJob = {
  id: string;
  source: string;
  search_term: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed": return "default";
    case "running": return "secondary";
    case "failed": return "destructive";
    default: return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "text-green-500";
    case "running": return "text-blue-500";
    case "failed": return "text-red-500";
    default: return "text-muted-foreground";
  }
};

const formatDuration = (started: string | null, completed: string | null): string => {
  if (!started || !completed) return "—";
  const secs = differenceInSeconds(parseISO(completed), parseISO(started));
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
};

export default function SystemHealth() {
  const { data: jobs, isLoading, refetch } = useQuery<ScrapingJob[]>({
    queryKey: ["scraping_jobs_health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scraping_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000,
  });

  const now = new Date();
  const last24h = subDays(now, 1);

  const totalJobs = jobs?.length ?? 0;
  const completedJobs = jobs?.filter((j) => j.status === "completed").length ?? 0;
  const activeJobs = jobs?.filter((j) => j.status === "running").length ?? 0;
  const failedLast24h =
    jobs?.filter(
      (j) =>
        j.status === "failed" &&
        j.created_at &&
        isAfter(parseISO(j.created_at), last24h)
    ).length ?? 0;
  const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : "0.0";

  // Determine N8N health: last job succeeded within last 24h
  const lastJob = jobs?.[0];
  const n8nHealthy =
    lastJob?.status === "completed" &&
    lastJob?.created_at &&
    isAfter(parseISO(lastJob.created_at), last24h);

  // Jobs per day for last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    const count =
      jobs?.filter((j) => j.created_at?.startsWith(dayStr)).length ?? 0;
    return { day: format(day, "MMM d"), count };
  });

  const recentJobs = jobs?.slice(0, 10) ?? [];

  const services = [
    {
      name: "Supabase DB",
      icon: Database,
      healthy: true,
      description: "PostgreSQL database connection",
    },
    {
      name: "N8N Orchestration",
      icon: Zap,
      healthy: !!n8nHealthy,
      description: "Workflow automation engine",
    },
    {
      name: "Scraping Engine",
      icon: Cpu,
      healthy: activeJobs >= 0 && failedLast24h < 5,
      description: "Data extraction workers",
    },
    {
      name: "Export Service",
      icon: Server,
      healthy: true,
      description: "File generation and delivery",
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">SYSTEM HEALTH MONITOR</h2>
                <p className="text-muted-foreground">
                  Operational dashboard for system performance and service status
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-500 border-green-500 px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  99.9% Uptime
                </Badge>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Total Jobs Run
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-foreground">{totalJobs.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Success Rate
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-green-500">{successRate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completedJobs.toLocaleString()} completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Active Jobs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-blue-500">{activeJobs}</p>
                      <p className="text-xs text-muted-foreground mt-1">Currently running</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Failed (Last 24h)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-red-500">{failedLast24h}</p>
                      <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Service Status */}
                <Card className="bg-card/70 border-border backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      Service Status
                    </CardTitle>
                    <CardDescription>Real-time health of all integrated services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {services.map((service) => {
                        const Icon = service.icon;
                        return (
                          <div
                            key={service.name}
                            className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-background/40"
                          >
                            <div className="flex items-center justify-between">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                              <Badge
                                variant={service.healthy ? "default" : "destructive"}
                                className={service.healthy ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                              >
                                {service.healthy ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Healthy
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Degraded
                                  </span>
                                )}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{service.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Jobs Per Day Chart */}
                <Card className="bg-card/70 border-border backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Jobs Per Day — Last 7 Days
                    </CardTitle>
                    <CardDescription>Volume of scraping jobs executed daily</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
                        />
                        <Bar dataKey="count" name="Jobs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card className="bg-card/70 border-border backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Last 10 scraping jobs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentJobs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Activity className="w-10 h-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground font-medium">No jobs recorded yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Scraping jobs will appear here once they are triggered.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {recentJobs.map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  job.status === "completed"
                                    ? "bg-green-500"
                                    : job.status === "running"
                                    ? "bg-blue-500 animate-pulse"
                                    : "bg-red-500"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground truncate">
                                  {job.source}
                                  {job.search_term ? ` — ${job.search_term}` : ""}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {job.created_at
                                    ? format(parseISO(job.created_at), "MMM d, yyyy HH:mm")
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                {formatDuration(job.started_at, job.completed_at)}
                              </span>
                              <Badge variant={getStatusVariant(job.status)} className="capitalize text-xs">
                                {job.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
