import { useMemo } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Filter, CheckCircle, XCircle, Percent, Database } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Entity {
  id: string;
  name: string;
  source: string | null;
  score: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  company_number: string | null;
}

interface FilterCheck {
  id: string;
  entity_id: string | null;
  rule_name: string;
  passed: boolean | null;
  score: number | null;
  checked_at: string | null;
}

const FUNNEL_STAGES = [
  { key: "discovered", label: "Discovered", color: "bg-blue-500" },
  { key: "scored", label: "Scored", color: "bg-indigo-500" },
  { key: "qualified", label: "Qualified", color: "bg-violet-500" },
  { key: "contacted", label: "Contacted", color: "bg-purple-500" },
  { key: "converted", label: "Converted", color: "bg-green-500" },
];

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  if (diffWeeks === 0) return "This Week";
  if (diffWeeks === 1) return "1w ago";
  if (diffWeeks === 2) return "2w ago";
  if (diffWeeks === 3) return "3w ago";
  return "4w+ ago";
}

const PipelinePerformance = () => {
  const { data: entities, isLoading: entitiesLoading } = useQuery({
    queryKey: ["pipeline_entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Entity[];
    },
  });

  const { data: filterChecks, isLoading: checksLoading } = useQuery({
    queryKey: ["pipeline_filter_checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_checks")
        .select("*")
        .limit(200);
      if (error) throw error;
      return data as FilterCheck[];
    },
  });

  const isLoading = entitiesLoading || checksLoading;

  const metrics = useMemo(() => {
    if (!entities) return null;

    const total = entities.length;
    const qualified = entities.filter((e) => (e.score ?? 0) > 70).length;
    const rejected = entities.filter((e) => (e.score ?? 0) <= 70 && e.score !== null).length;
    const conversionRate = total > 0 ? ((qualified / total) * 100).toFixed(1) : "0.0";

    // Funnel stage counts by status field
    const statusMap: Record<string, number> = {};
    entities.forEach((e) => {
      const s = (e.status || "discovered").toLowerCase();
      statusMap[s] = (statusMap[s] || 0) + 1;
    });

    const funnelCounts = {
      discovered: total,
      scored: entities.filter((e) => e.score !== null).length,
      qualified,
      contacted: entities.filter((e) => {
        const s = (e.status || "").toLowerCase();
        return s === "contacted" || s === "converted";
      }).length,
      converted: entities.filter((e) => (e.status || "").toLowerCase() === "converted").length,
    };

    // Entities per source
    const sourceCounts: Record<string, number> = {};
    entities.forEach((e) => {
      const src = e.source || "Unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });
    const sourceData = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));

    // Top 10 by score
    const topEntities = [...entities]
      .filter((e) => e.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 10);

    // Weekly trend: last 4 weeks
    const now = Date.now();
    const weekBuckets: Record<string, number> = {
      "4w+ ago": 0,
      "3w ago": 0,
      "2w ago": 0,
      "1w ago": 0,
      "This Week": 0,
    };

    entities.forEach((e) => {
      const label = getWeekLabel(e.created_at);
      if (weekBuckets[label] !== undefined) {
        weekBuckets[label]++;
      }
    });

    const weeklyData = ["4w+ ago", "3w ago", "2w ago", "1w ago", "This Week"].map((week) => ({
      week,
      count: weekBuckets[week],
    }));

    return {
      total,
      qualified,
      rejected,
      conversionRate,
      funnelCounts,
      sourceData,
      topEntities,
      weeklyData,
    };
  }, [entities]);

  const maxFunnelCount = metrics ? Math.max(...Object.values(metrics.funnelCounts)) : 1;

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">PIPELINE PERFORMANCE</h2>
              <p className="text-muted-foreground">Data pipeline analytics, entity qualification funnel, and source performance</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !metrics || metrics.total === 0 ? (
              <Card className="bg-card/70 border-border backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <Database className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg">No entity data available yet.</p>
                  <p className="text-muted-foreground text-sm mt-1">Start scraping to populate the pipeline.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Database className="w-4 h-4" /> Total in Pipeline
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{metrics.total.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">All discovered entities</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" /> Qualified
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-green-500">{metrics.qualified.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Score &gt; 70</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" /> Rejected
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-red-400">{metrics.rejected.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Score ≤ 70</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Percent className="w-4 h-4" /> Conversion Rate
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{metrics.conversionRate}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Qualified / total</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Funnel + Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" /> Pipeline Funnel
                      </CardTitle>
                      <CardDescription>Entity counts at each pipeline stage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      {FUNNEL_STAGES.map((stage) => {
                        const count = metrics.funnelCounts[stage.key as keyof typeof metrics.funnelCounts];
                        const pct = maxFunnelCount > 0 ? (count / maxFunnelCount) * 100 : 0;
                        return (
                          <div key={stage.key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-foreground font-medium">{stage.label}</span>
                              <span className="text-muted-foreground font-semibold">{count.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-muted/40 rounded-full h-3">
                              <div
                                className={`${stage.color} h-3 rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Entities by Source</CardTitle>
                      <CardDescription>Distribution of scraped entities per registry</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics.sourceData.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No source data available.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={metrics.sourceData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis
                              dataKey="source"
                              tick={{ fontSize: 10 }}
                              angle={-25}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(val: number) => [val.toLocaleString(), "Entities"]}
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Top Entities + Weekly Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" /> Top Scoring Entities
                      </CardTitle>
                      <CardDescription>Top 10 entities ranked by score</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {metrics.topEntities.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-6">No scored entities found.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">#</th>
                                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Name</th>
                                <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Source</th>
                                <th className="text-right py-2 text-muted-foreground font-medium">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.topEntities.map((entity, idx) => (
                                <tr key={entity.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                  <td className="py-2.5 pr-3 text-muted-foreground">{idx + 1}</td>
                                  <td className="py-2.5 pr-3 font-medium text-foreground truncate max-w-[160px]">
                                    {entity.name || "—"}
                                  </td>
                                  <td className="py-2.5 pr-3">
                                    <Badge variant="outline" className="text-xs">
                                      {entity.source || "Unknown"}
                                    </Badge>
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <span className={`font-bold ${(entity.score ?? 0) > 70 ? "text-green-500" : "text-orange-400"}`}>
                                      {entity.score ?? "—"}
                                    </span>
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
                      <CardTitle>Weekly Entity Trend</CardTitle>
                      <CardDescription>New entities discovered over the last 4 weeks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={metrics.weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                            formatter={(val: number) => [val.toLocaleString(), "Entities"]}
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
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

export default PipelinePerformance;
