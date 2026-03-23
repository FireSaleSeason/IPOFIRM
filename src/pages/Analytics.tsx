import { useState, useMemo } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Database, Star, Layers, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface Entity {
  id: string;
  name: string;
  source: string | null;
  score: number | null;
  status: string | null;
  created_at: string;
}

interface ScrapingJob {
  id: string;
  source: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface FilterCheck {
  id: string;
  entity_id: string | null;
  rule_name: string;
  passed: boolean | null;
  score: number | null;
  checked_at: string | null;
}

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

function getDateCutoff(range: DateRange): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (range === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  return null;
}

function formatDateLabel(dateStr: string, range: DateRange): string {
  const d = new Date(dateStr);
  if (range === "7d") {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const { data: entities, isLoading: entitiesLoading } = useQuery({
    queryKey: ["analytics_entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("id, name, source, score, status, created_at")
        .order("created_at", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data as Entity[];
    },
  });

  const { data: scrapingJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["analytics_scraping_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scraping_jobs")
        .select("id, source, status, started_at, completed_at, created_at")
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as ScrapingJob[];
    },
  });

  const { data: filterChecks, isLoading: checksLoading } = useQuery({
    queryKey: ["analytics_filter_checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_checks")
        .select("id, entity_id, rule_name, passed, score, checked_at")
        .limit(500);
      if (error) throw error;
      return data as FilterCheck[];
    },
  });

  const isLoading = entitiesLoading || jobsLoading || checksLoading;

  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    const cutoff = getDateCutoff(dateRange);
    if (!cutoff) return entities;
    return entities.filter((e) => new Date(e.created_at) >= cutoff);
  }, [entities, dateRange]);

  const filteredJobs = useMemo(() => {
    if (!scrapingJobs) return [];
    const cutoff = getDateCutoff(dateRange);
    if (!cutoff) return scrapingJobs;
    return scrapingJobs.filter((j) => new Date(j.created_at) >= cutoff);
  }, [scrapingJobs, dateRange]);

  const analytics = useMemo(() => {
    const totalEntities = filteredEntities.length;
    const scrapingJobCount = filteredJobs.length;
    const scores = filteredEntities.map((e) => e.score).filter((s): s is number => s !== null);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highValueLeads = filteredEntities.filter((e) => (e.score ?? 0) >= 80).length;

    // Entity discovery over time (by day)
    const dayMap: Record<string, number> = {};
    filteredEntities.forEach((e) => {
      const dayKey = new Date(e.created_at).toISOString().split("T")[0];
      dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
    });
    const discoveryData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: formatDateLabel(date, dateRange),
        count,
      }));

    // Entities by source
    const sourceCounts: Record<string, number> = {};
    filteredEntities.forEach((e) => {
      const src = e.source || "Unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceData = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([source, count]) => ({ source, count }));

    // Status distribution for pie chart
    const statusCounts: Record<string, number> = {};
    filteredEntities.forEach((e) => {
      const s = e.status || "unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

    // Average score over time (by day)
    const scoreByDay: Record<string, number[]> = {};
    filteredEntities.forEach((e) => {
      if (e.score === null) return;
      const dayKey = new Date(e.created_at).toISOString().split("T")[0];
      if (!scoreByDay[dayKey]) scoreByDay[dayKey] = [];
      scoreByDay[dayKey].push(e.score);
    });
    const scoreOverTime = Object.entries(scoreByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date: formatDateLabel(date, dateRange),
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      }));

    // Top performing sources (by avg score)
    const sourceScores: Record<string, number[]> = {};
    filteredEntities.forEach((e) => {
      if (e.score === null) return;
      const src = e.source || "Unknown";
      if (!sourceScores[src]) sourceScores[src] = [];
      sourceScores[src].push(e.score);
    });
    const topSources = Object.entries(sourceScores)
      .map(([source, scores]) => ({
        source,
        count: sourceCounts[source] || 0,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        highValue: scores.filter((s) => s >= 80).length,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      totalEntities,
      scrapingJobCount,
      avgScore: avgScore.toFixed(1),
      highValueLeads,
      discoveryData,
      sourceData,
      statusData,
      scoreOverTime,
      topSources,
    };
  }, [filteredEntities, filteredJobs, dateRange]);

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">ANALYTICS & INSIGHTS</h2>
                <p className="text-muted-foreground">Comprehensive data intelligence across all sources and pipelines</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={dateRange === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateRange(opt.value)}
                    className="text-xs"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Database className="w-4 h-4" /> Total Entities
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{analytics.totalEntities.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">In selected period</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Scraping Jobs
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{analytics.scrapingJobCount.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Jobs executed</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Avg Score
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{analytics.avgScore}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Across all scored entities</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" /> High-Value Leads
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-yellow-400">{analytics.highValueLeads.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Score ≥ 80</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Area Chart + Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Entity Discovery Over Time</CardTitle>
                      <CardDescription>New entities found per day in the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.discoveryData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                          No discovery data in this period.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={analytics.discoveryData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(val: number) => [val, "Entities"]}
                            />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="#6366f1"
                              strokeWidth={2}
                              fill="url(#colorCount)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Entities by Source</CardTitle>
                      <CardDescription>COMPANIES_HOUSE, GLEIF, SEC_EDGAR, ASIC and others</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.sourceData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                          No source data available.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={analytics.sourceData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="source" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(val: number) => [val.toLocaleString(), "Entities"]}
                            />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Pie Chart + Line Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Entity Status Distribution</CardTitle>
                      <CardDescription>Breakdown of entities by current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.statusData.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                          No status data available.
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width="60%" height={220}>
                            <PieChart>
                              <Pie
                                data={analytics.statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {analytics.statusData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                                formatter={(val: number, name: string) => [val.toLocaleString(), name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-2">
                            {analytics.statusData.map((item, index) => (
                              <div key={item.name} className="flex items-center gap-2 text-sm">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                />
                                <span className="text-muted-foreground capitalize truncate">{item.name}</span>
                                <span className="ml-auto font-semibold text-foreground">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Average Scores Over Time</CardTitle>
                      <CardDescription>Daily average entity score trend</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.scoreOverTime.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                          No score trend data available.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={analytics.scoreOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(val: number) => [`${val}`, "Avg Score"]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="avgScore"
                              name="Avg Score"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Sources Table */}
                <Card className="bg-card/70 border-border backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" /> Top Performing Sources
                    </CardTitle>
                    <CardDescription>Data sources ranked by average entity score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.topSources.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-6">No source performance data available for this period.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 pr-4 text-muted-foreground font-medium">Source</th>
                              <th className="text-right py-3 pr-4 text-muted-foreground font-medium">Entities</th>
                              <th className="text-right py-3 pr-4 text-muted-foreground font-medium">Avg Score</th>
                              <th className="text-right py-3 text-muted-foreground font-medium">High Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.topSources.map((src, idx) => (
                              <tr key={src.source} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs w-5">{idx + 1}</span>
                                    <Badge variant="outline" className="text-xs">{src.source}</Badge>
                                  </div>
                                </td>
                                <td className="py-3 pr-4 text-right text-foreground font-medium">
                                  {src.count.toLocaleString()}
                                </td>
                                <td className="py-3 pr-4 text-right">
                                  <span className={`font-bold ${src.avgScore >= 70 ? "text-green-500" : src.avgScore >= 50 ? "text-yellow-500" : "text-red-400"}`}>
                                    {src.avgScore}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <span className="text-yellow-400 font-semibold">{src.highValue}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
};

export default Analytics;
