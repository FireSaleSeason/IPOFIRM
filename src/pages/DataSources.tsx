import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DataSourceGrid } from "@/components/DataSourceGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, ChevronRight, CheckCircle2, XCircle, Clock, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useScrapingJobs } from "@/hooks/useScrapingJobs";
import { RecentEntitiesPreview } from "@/components/RecentEntitiesPreview";
import { useCleanupJobs } from "@/hooks/useCleanupJobs";
import ukLogo from "@/assets/uk-companies-house-logo.png";
import gleifLogo from "@/assets/gleif-logo.png";
import { format } from "date-fns";

interface SourceStats {
  registry_source: string;
  count: number;
}

const sourceMap: Record<string, { name: string; logo: string; id: string }> = {
  COMPANIES_HOUSE: { name: "UK Companies House", logo: ukLogo, id: "CH" },
  GLEIF: { name: "GLEIF Global", logo: gleifLogo, id: "GLEIF" },
  SEC_EDGAR: { name: "SEC EDGAR", logo: "", id: "SEC_EDGAR" },
  ASIC: { name: "ASIC (Australia)", logo: "", id: "ASIC" },
};

const DataSources = () => {
  const [selectedSource, setSelectedSource] = useState("CH");
  const [isLoading, setIsLoading] = useState(false);
  const [sourceStats, setSourceStats] = useState<SourceStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { jobs, activeJobs } = useScrapingJobs();
  const { cleanupStaleJobs, isLoading: isCleaningUp } = useCleanupJobs();

  useEffect(() => {
    fetchSourceStats();
  }, []);

  // Refresh stats when jobs complete
  useEffect(() => {
    const completedJobs = jobs.filter(j => j.status === 'completed');
    if (completedJobs.length > 0) {
      fetchSourceStats();
    }
  }, [jobs]);

  const fetchSourceStats = async () => {
    try {
      setStatsLoading(true);
      const { data, error } = await supabase
        .from('entities')
        .select('registry_source')
        .not('registry_source', 'is', null);

      if (error) throw error;

      // Count entities per source
      const counts = data.reduce((acc: Record<string, number>, curr) => {
        const source = curr.registry_source;
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      const stats: SourceStats[] = Object.entries(counts).map(([source, count]) => ({
        registry_source: source,
        count: count as number,
      }));

      setSourceStats(stats);
    } catch (error) {
      console.error("Error fetching source stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRunScrape = async () => {
    setIsLoading(true);
    console.log("Triggering scrape for:", { source: selectedSource });

    try {
      // Always use trigger-scrape to hit n8n webhook
      const { data, error} = await supabase.functions.invoke('trigger-scrape', {
        body: {
          source: selectedSource,
          searchTerm: "venture capital",  // Always filter for venture capital firms
          filters: {}
        }
      });

      if (error) throw error;

      toast({
        title: "Scraping job started",
        description: `Job is running. You'll be notified when it completes.`,
      });

      console.log("Scraping job created:", data);
    } catch (error: any) {
      console.error("Error triggering scrape:", error);
      toast({
        variant: "destructive",
        title: "Failed to start scraping",
        description: error.message || "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceName = (registrySource: string) => {
    return sourceMap[registrySource]?.name || registrySource;
  };

  const getSourceLogo = (registrySource: string) => {
    return sourceMap[registrySource]?.logo || "";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      completed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <NavigationSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Data Sources</h2>
              <p className="text-muted-foreground">Manage and configure your registry data sources</p>
            </div>

            <DataSourceGrid selectedSource={selectedSource} onSelectSource={setSelectedSource} />

            <Card>
              <CardHeader>
                <CardTitle>Scraping Configuration</CardTitle>
                <CardDescription>
                  Selected Source: <span className="font-semibold text-primary">
                    {sourceMap[Object.keys(sourceMap).find(k => sourceMap[k].id === selectedSource) || '']?.name || selectedSource}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleRunScrape} 
                  disabled={isLoading || !selectedSource}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Scrape...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Scrape for {sourceMap[Object.keys(sourceMap).find(k => sourceMap[k].id === selectedSource) || '']?.name || selectedSource}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Recent Scraping Jobs</CardTitle>
                    <CardDescription>
                      {activeJobs > 0 ? `${activeJobs} job${activeJobs > 1 ? 's' : ''} currently running` : 'View recent scraping activity'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={cleanupStaleJobs}
                        disabled={isCleaningUp}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isCleaningUp ? "Cleaning..." : "Clear Stuck Jobs"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No scraping jobs yet</p>
                    <p className="text-sm mt-2">Run your first scrape to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(job.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {sourceMap[job.source]?.name || job.source}
                              </p>
                              <Badge variant={getStatusBadge(job.status)}>
                                {job.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {job.records_processed} entities processed
                              {job.created_at && ` • ${format(new Date(job.created_at), 'MMM d, h:mm a')}`}
                            </p>
                            {job.error_message && (
                              <p className="text-sm text-red-500 mt-1">{job.error_message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Statistics</CardTitle>
                <CardDescription>Total entities collected from each source</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sourceStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No data sources available yet</p>
                    <p className="text-sm mt-2">Run your first scrape to see statistics</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sourceStats.map((stat) => {
                      const sourceName = getSourceName(stat.registry_source);
                      const sourceLogo = getSourceLogo(stat.registry_source);
                      
                      return (
                        <button
                          key={stat.registry_source}
                          onClick={() => {
                            if (stat.registry_source === 'COMPANIES_HOUSE') {
                              window.open('https://www.gov.uk/government/organisations/companies-house', '_blank');
                            } else {
                              navigate(`/lead-generation?source=${stat.registry_source}`);
                            }
                          }}
                          className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary hover:bg-card/80 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            {sourceLogo ? (
                              <img src={sourceLogo} alt={sourceName} className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                {stat.registry_source.substring(0, 2)}
                              </div>
                            )}
                            <div className="text-left">
                              <p className="font-medium text-foreground">{sourceName}</p>
                              <p className="text-sm text-muted-foreground">
                                {stat.count.toLocaleString()} entities
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Active</Badge>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Scraped Data</CardTitle>
                <CardDescription>Preview of most recently added entities</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentEntitiesPreview />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DataSources;
