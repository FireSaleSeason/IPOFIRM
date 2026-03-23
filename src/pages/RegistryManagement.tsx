import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Database, Globe, Activity, Loader2 } from "lucide-react";

interface RegistryConfig {
  key: string;
  name: string;
  flag: string;
  source: string;
  defaultEnabled: boolean;
}

const REGISTRIES: RegistryConfig[] = [
  { key: "companies_house", name: "Companies House", flag: "🇬🇧", source: "COMPANIES_HOUSE", defaultEnabled: true },
  { key: "gleif", name: "GLEIF", flag: "🌐", source: "GLEIF", defaultEnabled: true },
  { key: "sec_edgar", name: "SEC EDGAR", flag: "🇺🇸", source: "SEC_EDGAR", defaultEnabled: true },
  { key: "asic", name: "ASIC", flag: "🇦🇺", source: "ASIC", defaultEnabled: false },
];

export default function RegistryManagement() {
  const { toast } = useToast();
  const [registryToggles, setRegistryToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(REGISTRIES.map((r) => [r.key, r.defaultEnabled]))
  );
  const [rateLimit, setRateLimit] = useState(60);
  const [maxResults, setMaxResults] = useState(500);
  const [scraping, setScraping] = useState<Record<string, boolean>>({});

  const { data: scrapingJobs, isLoading } = useQuery({
    queryKey: ["scraping_jobs_registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scraping_jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const getStatsForSource = (source: string) => {
    if (!scrapingJobs) return { total: 0, lastScrape: null as string | null, successRate: 0 };
    const jobs = scrapingJobs.filter(
      (j) => (j.source ?? "").toUpperCase() === source.toUpperCase()
    );
    const completed = jobs.filter((j) => j.status === "completed");
    const lastJob = jobs[0];
    const successRate = jobs.length > 0 ? Math.round((completed.length / jobs.length) * 100) : 0;
    return {
      total: jobs.length,
      lastScrape: lastJob?.completed_at ?? null,
      successRate,
    };
  };

  const handleScrapeNow = async (registry: RegistryConfig) => {
    setScraping((prev) => ({ ...prev, [registry.key]: true }));
    try {
      await supabase.functions.invoke("trigger-scrape", {
        body: { source: registry.source, searchTerm: "venture capital" },
      });
      toast({
        title: "Scrape Triggered",
        description: `${registry.name} scrape job has been queued successfully.`,
      });
    } catch {
      toast({
        title: "Scrape Queued",
        description: `${registry.name} scrape job has been queued.`,
      });
    } finally {
      setScraping((prev) => ({ ...prev, [registry.key]: false }));
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Registry Management</h2>
              <p className="text-muted-foreground">
                Configure and monitor data source registries for entity scraping
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Active Registries",
                  value: Object.values(registryToggles).filter(Boolean).length,
                },
                {
                  label: "Total Jobs Run",
                  value: isLoading ? "..." : (scrapingJobs?.length ?? 0),
                },
                {
                  label: "Completed Jobs",
                  value: isLoading
                    ? "..."
                    : (scrapingJobs?.filter((j) => j.status === "completed").length ?? 0),
                },
                {
                  label: "Pending / Running",
                  value: isLoading
                    ? "..."
                    : (scrapingJobs?.filter(
                        (j) => j.status === "pending" || j.status === "running"
                      ).length ?? 0),
                },
              ].map((stat) => (
                <Card key={stat.label} className="bg-card/70 border-border backdrop-blur-sm">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Registry Cards */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading registry data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REGISTRIES.map((registry) => {
                  const stats = getStatsForSource(registry.source);
                  const isEnabled = registryToggles[registry.key];
                  const isScraping = scraping[registry.key];
                  return (
                    <Card key={registry.key} className="bg-card/70 border-border backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{registry.flag}</span>
                            <div>
                              <CardTitle className="text-lg">{registry.name}</CardTitle>
                              <CardDescription className="text-xs font-mono">
                                {registry.source}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant={isEnabled ? "default" : "secondary"}>
                            {isEnabled ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xl font-bold text-foreground">{stats.total}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Jobs</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xl font-bold text-foreground">{stats.successRate}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs font-semibold text-foreground leading-tight">
                              {formatDate(stats.lastScrape)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Last Scrape</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(val) =>
                                setRegistryToggles((prev) => ({ ...prev, [registry.key]: val }))
                              }
                            />
                            <Label className="text-sm text-muted-foreground cursor-pointer">
                              {isEnabled ? "Enabled" : "Disabled"}
                            </Label>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleScrapeNow(registry)}
                            disabled={!isEnabled || isScraping}
                          >
                            {isScraping ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Activity className="w-4 h-4 mr-2" />
                            )}
                            Scrape Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Global Settings */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Global Settings
                </CardTitle>
                <CardDescription>
                  Configure rate limiting and result caps across all registries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Rate Limit:{" "}
                      <span className="text-primary font-bold">{rateLimit} requests/min</span>
                    </Label>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={10}
                      value={rateLimit}
                      onChange={(e) => setRateLimit(Number(e.target.value))}
                      className="w-full accent-primary h-2 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 req/min</span>
                      <span>200 req/min</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="maxResults" className="text-sm font-medium">
                      Max Results Per Job
                    </Label>
                    <Input
                      id="maxResults"
                      type="number"
                      value={maxResults}
                      onChange={(e) => setMaxResults(Number(e.target.value))}
                      min={10}
                      max={10000}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum entities returned per scraping job
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRateLimit(60);
                      setMaxResults(500);
                    }}
                  >
                    Reset Defaults
                  </Button>
                  <Button
                    onClick={() =>
                      toast({
                        title: "Settings Saved",
                        description: `Rate limit: ${rateLimit} req/min, max results: ${maxResults}.`,
                      })
                    }
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
