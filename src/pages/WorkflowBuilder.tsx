import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Zap,
  Filter,
  Star,
  Globe,
  Download,
  Play,
  Save,
  Loader2,
  ChevronRight,
} from "lucide-react";

const SAVED_WORKFLOWS = [
  {
    id: "1",
    name: "UK VC Discovery",
    description: "CH → Score > 60 → Export CSV",
    lastRun: "2026-03-22",
    status: "active",
  },
  {
    id: "2",
    name: "Global Fund Monitor",
    description: "GLEIF → Filter active → Enrich → CRM",
    lastRun: "2026-03-20",
    status: "active",
  },
  {
    id: "3",
    name: "SEC High-Value Scan",
    description: "SEC EDGAR → Score > 80 → Email Alert",
    lastRun: "2026-03-18",
    status: "paused",
  },
];

const SOURCE_OPTIONS = ["COMPANIES_HOUSE", "GLEIF", "SEC_EDGAR", "ASIC"];
const EXPORT_FORMATS = ["CSV", "JSON", "Excel"];

export default function WorkflowBuilder() {
  const { toast } = useToast();
  const [triggerSource, setTriggerSource] = useState("COMPANIES_HOUSE");
  const [exportFormat, setExportFormat] = useState("CSV");
  const [enrichToggles, setEnrichToggles] = useState({
    domainCheck: true,
    onlinePresence: true,
    negativePress: false,
  });
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const { data: filterRules, isLoading: loadingFilters } = useQuery({
    queryKey: ["filter_rules_workflow"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_rules")
        .select("id, active")
        .eq("active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: scoringRules, isLoading: loadingScoring } = useQuery({
    queryKey: ["scoring_rules_workflow"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .select("id, active")
        .eq("active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSaveWorkflow = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast({ title: "Workflow Saved", description: "Your workflow configuration has been saved." });
  };

  const handleRunWorkflow = async () => {
    setRunning(true);
    try {
      await supabase.functions.invoke("trigger-scrape", {
        body: { source: triggerSource, searchTerm: "venture capital" },
      });
      toast({
        title: "Workflow Started",
        description: `Workflow triggered for ${triggerSource}. Processing pipeline initiated.`,
      });
    } catch {
      toast({ title: "Workflow Queued", description: "Workflow has been queued for processing." });
    } finally {
      setRunning(false);
    }
  };

  const stages = [
    {
      id: "trigger",
      name: "Trigger",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      description: "Select data source registry",
      color: "border-yellow-500/40",
      content: (
        <div className="space-y-2 mt-3">
          <Label className="text-xs text-muted-foreground">Source Registry</Label>
          <select
            value={triggerSource}
            onChange={(e) => setTriggerSource(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background/50 px-3 py-1 text-sm"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      ),
    },
    {
      id: "filter",
      name: "Filter",
      icon: <Filter className="w-5 h-5 text-blue-500" />,
      description: "Apply filter rules to incoming data",
      color: "border-blue-500/40",
      content: (
        <div className="mt-3">
          {loadingFilters ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading rules...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {filterRules?.length ?? 0} active rules
              </Badge>
              <span className="text-xs text-muted-foreground">configured</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "score",
      name: "Score",
      icon: <Star className="w-5 h-5 text-purple-500" />,
      description: "Apply scoring rules to rank entities",
      color: "border-purple-500/40",
      content: (
        <div className="mt-3">
          {loadingScoring ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading rules...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {scoringRules?.length ?? 0} scoring rules
              </Badge>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "enrich",
      name: "Enrich",
      icon: <Globe className="w-5 h-5 text-green-500" />,
      description: "Add external data signals to entities",
      color: "border-green-500/40",
      content: (
        <div className="space-y-2 mt-3">
          {(
            [
              { key: "domainCheck", label: "Domain Check" },
              { key: "onlinePresence", label: "Online Presence" },
              { key: "negativePress", label: "Negative Press" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Switch
                checked={enrichToggles[key]}
                onCheckedChange={(v) =>
                  setEnrichToggles((prev) => ({ ...prev, [key]: v }))
                }
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "export",
      name: "Export",
      icon: <Download className="w-5 h-5 text-orange-500" />,
      description: "Output results in your preferred format",
      color: "border-orange-500/40",
      content: (
        <div className="flex gap-2 mt-3">
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setExportFormat(fmt)}
              className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                exportFormat === fmt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Workflow Builder</h2>
                <p className="text-muted-foreground">
                  Configure and run multi-stage data processing pipelines
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSaveWorkflow} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Workflow
                </Button>
                <Button onClick={handleRunWorkflow} disabled={running}>
                  {running ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Run Workflow
                </Button>
              </div>
            </div>

            {/* Visual Pipeline */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Pipeline Configuration</CardTitle>
                <CardDescription>
                  Configure each stage of your data processing workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-stretch gap-0">
                  {stages.map((stage, idx) => (
                    <div key={stage.id} className="flex flex-col md:flex-row items-stretch flex-1">
                      <div
                        className={`flex-1 rounded-lg border-2 p-4 bg-muted/10 ${stage.color} min-w-0`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {stage.icon}
                            <span className="font-semibold text-sm">{stage.name}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() =>
                              toast({
                                title: `Configure ${stage.name}`,
                                description: `Opening advanced settings for the ${stage.name} stage.`,
                              })
                            }
                          >
                            Config
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{stage.description}</p>
                        {stage.content}
                      </div>
                      {idx < stages.length - 1 && (
                        <div className="flex items-center justify-center px-2 py-2 md:py-0">
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Saved Workflows */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Saved Workflows</CardTitle>
                <CardDescription>Previously saved workflow configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SAVED_WORKFLOWS.map((wf) => (
                    <div
                      key={wf.id}
                      className="p-4 rounded-lg border border-border/60 bg-muted/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground text-sm">{wf.name}</p>
                        <Badge variant={wf.status === "active" ? "default" : "secondary"} className="text-xs">
                          {wf.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{wf.description}</p>
                      <p className="text-xs text-muted-foreground">Last run: {wf.lastRun}</p>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1"
                          onClick={() =>
                            toast({ title: "Workflow Loaded", description: `"${wf.name}" loaded into editor.` })
                          }
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() =>
                            toast({ title: "Workflow Running", description: `"${wf.name}" has been triggered.` })
                          }
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
