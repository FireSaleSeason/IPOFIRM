import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Save } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScoringRule {
  id: string;
  name: string;
  weight: number;
  enabled: boolean;
  description: string | null;
  sort_order: number;
}

interface FilterRule {
  id: string;
  name: string;
  label: string | null;
  description: string | null;
  enabled: boolean;
}

const RulesScoring = () => {
  const { toast } = useToast();
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [scoringRes, filterRes] = await Promise.all([
      supabase.from("scoring_rules").select("*").order("sort_order"),
      supabase.from("filter_rules").select("*").order("name"),
    ]);
    if (scoringRes.data) setScoringRules(scoringRes.data);
    if (filterRes.data) setFilters(filterRes.data);
    setLoading(false);
    setDirty(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleRule = (id: string) => {
    setScoringRules(prev => prev.map(rule =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    ));
    setDirty(true);
  };

  const updateWeight = (id: string, value: number[]) => {
    const newWeight = value[0];
    const rule = scoringRules.find(r => r.id === id);
    if (!rule) return;

    const oldWeight = rule.weight;
    const diff = newWeight - oldWeight;
    const otherRules = scoringRules.filter(r => r.id !== id && r.enabled);
    if (otherRules.length === 0) {
      setScoringRules(prev => prev.map(r =>
        r.id === id ? { ...r, weight: newWeight } : r
      ));
      setDirty(true);
      return;
    }

    const otherTotalWeight = otherRules.reduce((sum, r) => sum + r.weight, 0);
    setScoringRules(prev => prev.map(r => {
      if (r.id === id) return { ...r, weight: newWeight };
      if (r.enabled && otherTotalWeight > 0) {
        const proportion = r.weight / otherTotalWeight;
        const adjustment = diff * proportion;
        return { ...r, weight: Math.round(Math.max(0, Math.min(100, r.weight - adjustment))) };
      }
      return r;
    }));
    setDirty(true);
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from("scoring_rules").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setScoringRules(prev => prev.filter(r => r.id !== id));
    toast({ title: "Rule deleted", description: "Scoring rule has been removed" });
  };

  const addNewRule = async () => {
    const maxOrder = scoringRules.reduce((max, r) => Math.max(max, r.sort_order), 0);
    const { data, error } = await supabase.from("scoring_rules").insert({
      name: "New Rule",
      weight: 0,
      enabled: true,
      description: "Custom scoring rule",
      sort_order: maxOrder + 1,
    }).select().single();
    if (error || !data) {
      toast({ title: "Error", description: error?.message || "Failed to add rule", variant: "destructive" });
      return;
    }
    setScoringRules(prev => [...prev, data]);
    toast({ title: "Rule added", description: "New scoring rule created" });
  };

  const toggleFilter = (id: string) => {
    setFilters(prev => prev.map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
    setDirty(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Upsert scoring rules
      const scoringPromises = scoringRules.map(r =>
        supabase.from("scoring_rules").update({
          weight: r.weight,
          enabled: r.enabled,
          name: r.name,
          description: r.description,
          sort_order: r.sort_order,
        }).eq("id", r.id)
      );
      // Upsert filter rules
      const filterPromises = filters.map(f =>
        supabase.from("filter_rules").update({ enabled: f.enabled }).eq("id", f.id)
      );
      const results = await Promise.all([...scoringPromises, ...filterPromises]);
      const hasError = results.some(r => r.error);
      if (hasError) {
        toast({ title: "Error saving", description: "Some rules failed to save", variant: "destructive" });
      } else {
        setDirty(false);
        toast({ title: "Saved", description: "All rules and weights persisted successfully" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <NavigationSidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Rules & Scoring</h2>
                <p className="text-muted-foreground">Configure scoring algorithms and filtering rules</p>
              </div>
              <div className="flex gap-2">
                {dirty && (
                  <Button onClick={saveAll} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
                <Button onClick={addNewRule}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Scoring Algorithm</CardTitle>
                <CardDescription>
                  Adjust weights for different scoring factors. Total must equal 100%.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3 pb-6 border-b border-border last:border-0">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))
                ) : (
                  scoringRules.map((rule) => (
                    <div key={rule.id} className="space-y-3 pb-6 border-b border-border last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">{rule.name}</h4>
                              <Badge variant="secondary">{rule.weight}%</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      {rule.enabled && (
                        <Slider
                          value={[rule.weight]}
                          onValueChange={(value) => updateWeight(rule.id, value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filtering Rules</CardTitle>
                <CardDescription>
                  Automatic filters applied to incoming data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))
                  ) : (
                    filters.map((filter) => (
                      <div key={filter.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">{filter.label || filter.name}</h4>
                          <p className="text-sm text-muted-foreground">{filter.description}</p>
                        </div>
                        <Switch checked={filter.enabled} onCheckedChange={() => toggleFilter(filter.id)} />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RulesScoring;
