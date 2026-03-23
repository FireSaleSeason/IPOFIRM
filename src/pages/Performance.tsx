import { useMemo } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Clock, Zap, Database, AlertTriangle, Award } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ScrapingJob {
  id: string;
  source: string;
  search_term: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

function getDurationSeconds(job: ScrapingJob): number | null {
  if (!job.started_at || !job.completed_at) return null;
  const start = new Date(job.started_at).getTime();
  const end = new Date(job.completed_at).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

function getPerformanceGrade(successRate: number): { grade: string; color: string; description: string } {
  if (successRate >= 90) return { grade: "A", color: "text-green-500", description: "Excellent" };
  if (successRate >= 75) return { grade: "B", color: "text-blue-500", description: "Good" };
  if (successRate >= 60) return { grade: "C", color: "text-yellow-500", description: "Fair" };
  return { grade: "D", color: "text-red-500", description: "Needs Improvement" };
}

function classifyError(errorMessage: string | null): string {
  if (!errorMessage) return "Unknown Error";
  const msg = errorMessage.toLowerCase();
  if (msg.includes("parse") || msg.includes("json") || msg.includes("xml")) return "Parse Error";
  if (msg.includes("timeout") || msg.includes("timed out")) return "Timeout";
  if (msg.includes("network") || msg.includes("connection") || msg.includes("connect")) return "Network Error";
  if (msg.includes("auth") || msg.includes("403") || msg.includes("401") || msg.includes("unauthorized")) return "Auth Error";
  if (msg.includes("404") || msg.includes("not found")) return "Not Found";
  if (msg.includes("rate limit") || msg.includes("429")) return "Rate Limited";
  if (msg.includes("500") || msg.includes("server")) return "Server Error";
  return "Other Error";
}

const Performance = () => {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["scraping_jobs_performance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scraping_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ScrapingJob[];
    },
  });

  const metrics = useMemo(() => {
    if (!jobs || jobs.length === 0) return null;

    const completedJobs = jobs.filter((j) => j.status === "completed" && j.started_at && j.completed_at);
    const failedJobs = jobs.filter((j) => j.status === "failed" || j.status === "error");
    const durations = completedJobs.map((j) => getDurationSeconds(j)).filter((d): d is number => d !== null);

    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Jobs per hour: use the last 24 hours
    const now = Date.now();
    const last24h = jobs.filter((j) => {
      const t = new Date(j.created_at).getTime();
      return now - t <= 24 * 60 * 60 * 1000;
    });
    const jobsPerHour = last24h.length / 24;

    // Entity discovery rate: entities found per completed job (proxy: completed jobs / total jobs)
    const totalJobs = jobs.length;
    const successRate = totalJobs > 0 ? (completedJobs.length / totalJobs) * 100 : 0;
    const errorRate = totalJobs > 0 ? (failedJobs.length / totalJobs) * 100 : 0;

    // Last 30 completed jobs for chart
    const last30 = completedJobs.slice(0, 30).reverse().map((j, idx) => ({
      index: idx + 1,
      duration: getDurationSeconds(j) ?? 0,
      source: j.source,
      date: j.completed_at ? new Date(j.completed_at).toLocaleDateString() : "",
    }));

    // Top 5 slowest jobs
    const slowestJobs = [...completedJobs]
      .map((j) => ({ ...j, duration: getDurationSeconds(j) ?? 0 }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    // Error analysis
    const errorCounts: Record<string, number> = {};
    failedJobs.forEach((j) => {
      const type = classifyError(j.error_message);
      errorCounts[type] = (errorCounts[type] || 0) + 1;
    });

    const grade = getPerformanceGrade(successRate);

    return {
      avgDuration: Math.round(avgDuration),
      jobsPerHour: jobsPerHour.toFixed(1),
      entityDiscoveryRate: successRate.toFixed(1),
      errorRate: errorRate.toFixed(1),
      last30,
      slowestJobs,
      errorCounts,
      totalJobs,
      completedCount: completedJobs.length,
      failedCount: failedJobs.length,
      successRate,
      grade,
    };
  }, [jobs]);

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">SYSTEM PERFORMANCE</h2>
              <p className="text-muted-foreground">Scraping job metrics, error analysis, and system health</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !metrics ? (
              <Card className="bg-card/70 border-border backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <Database className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg">No scraping job data available yet.</p>
                  <p className="text-muted-foreground text-sm mt-1">Run some scraping jobs to see performance metrics here.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Avg Job Duration
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{metrics.avgDuration}s</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Across {metrics.completedCount} completed jobs</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Jobs / Hour
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{metrics.jobsPerHour}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Avg over last 24 hours</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Database className="w-4 h-4" /> Entity Discovery Rate
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{metrics.entityDiscoveryRate}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Job success rate</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Error Rate
                      </CardDescription>
                      <CardTitle className={`text-3xl font-bold ${Number(metrics.errorRate) > 20 ? "text-red-500" : "text-foreground"}`}>
                        {metrics.errorRate}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">{metrics.failedCount} of {metrics.totalJobs} jobs failed</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Line Chart + Grade */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Job Completion Times</CardTitle>
                      <CardDescription>Duration (seconds) for the last {metrics.last30.length} completed jobs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics.last30.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                          No completed jobs with timing data available.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={metrics.last30} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="index" tick={{ fontSize: 11 }} label={{ value: "Job #", position: "insideBottomRight", offset: -5 }} />
                            <YAxis tick={{ fontSize: 11 }} label={{ value: "Seconds", angle: -90, position: "insideLeft", offset: 10 }} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(val: number) => [`${val}s`, "Duration"]}
                              labelFormatter={(label) => `Job #${label}`}
                            />
                            <Line
                              type="monotone"
                              dataKey="duration"
                              stroke="#6366f1"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" /> Performance Grade
                      </CardTitle>
                      <CardDescription>Based on overall job success rate</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
                      <div className={`text-8xl font-black ${metrics.grade.color}`}>
                        {metrics.grade.grade}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-sm px-4 py-1 ${metrics.grade.color} border-current`}
                      >
                        {metrics.grade.description}
                      </Badge>
                      <div className="text-center mt-2 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Success rate: <span className="font-semibold text-foreground">{metrics.successRate.toFixed(1)}%</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {metrics.completedCount} completed / {metrics.totalJobs} total
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Slowest Jobs + Error Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Slowest Jobs</CardTitle>
                      <CardDescription>Top 5 slowest completed scraping jobs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics.slowestJobs.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">No completed jobs with timing data.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Source</th>
                                <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Duration</th>
                                <th className="text-right py-2 text-muted-foreground font-medium">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.slowestJobs.map((job) => (
                                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                  <td className="py-3 pr-4 font-medium text-foreground truncate max-w-[140px]">
                                    {job.source || "—"}
                                  </td>
                                  <td className="py-3 pr-4 text-right">
                                    <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                                      {job.duration}s
                                    </Badge>
                                  </td>
                                  <td className="py-3 text-right text-muted-foreground text-xs">
                                    {job.completed_at ? new Date(job.completed_at).toLocaleDateString() : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Error Analysis</CardTitle>
                      <CardDescription>Breakdown of failed jobs by error type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(metrics.errorCounts).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <Zap className="w-8 h-8 text-green-500" />
                          <p className="text-muted-foreground text-sm">No errors recorded. System is healthy.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(metrics.errorCounts)
                            .sort(([, a], [, b]) => b - a)
                            .map(([type, count]) => {
                              const pct = metrics.failedCount > 0 ? (count / metrics.failedCount) * 100 : 0;
                              return (
                                <div key={type} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-foreground font-medium">{type}</span>
                                    <span className="text-muted-foreground">
                                      {count} ({pct.toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted/40 rounded-full h-2">
                                    <div
                                      className="bg-red-500/70 h-2 rounded-full transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          <p className="text-xs text-muted-foreground pt-2">
                            Total failed jobs: {metrics.failedCount}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Performance;
