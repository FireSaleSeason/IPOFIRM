import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, CheckSquare, Sliders, Plus, RefreshCw, Table } from "lucide-react";

const FIELD_MAPPINGS = [
  { raw: "company_name", normalized: "name", type: "String" },
  { raw: "reg_number", normalized: "company_number", type: "String" },
  { raw: "registration_date", normalized: "incorporated_on", type: "Date" },
  { raw: "addr_line1", normalized: "address_line_1", type: "String" },
  { raw: "postal_code", normalized: "postcode", type: "String" },
  { raw: "sic_code", normalized: "industry_code", type: "String" },
  { raw: "officer_name", normalized: "director_name", type: "String" },
  { raw: "filing_status", normalized: "accounts_status", type: "Enum" },
  { raw: "lei_code", normalized: "lei", type: "String" },
  { raw: "entity_type", normalized: "company_type", type: "Enum" },
];

const QUALITY_STATS = [
  { label: "Completeness", value: "91%", color: "text-green-500", desc: "Fields with data" },
  { label: "Accuracy", value: "87%", color: "text-blue-500", desc: "Validated records" },
  { label: "Duplicates Found", value: "142", color: "text-yellow-500", desc: "Pending dedup" },
  { label: "Records Processed", value: "48,392", color: "text-foreground", desc: "Total entities" },
];

export default function DataNormalization() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: "",
    rule_type: "field_mapping",
    condition: "",
    value: "",
    weight: "1",
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["filter_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_rules")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const addRuleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("filter_rules").insert({
        rule_name: newRule.rule_name,
        rule_type: newRule.rule_type,
        condition: newRule.condition,
        value: newRule.value,
        weight: Number(newRule.weight),
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filter_rules"] });
      setNewRule({ rule_name: "", rule_type: "field_mapping", condition: "", value: "", weight: "1" });
      setShowAddRule(false);
      toast({ title: "Rule added", description: "Normalization rule saved successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    },
  });

  const toggleRule = async (id: string, active: boolean) => {
    await supabase.from("filter_rules").update({ active: !active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["filter_rules"] });
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
                <h2 className="text-3xl font-bold text-foreground mb-2">DATA NORMALIZATION</h2>
                <p className="text-muted-foreground">
                  Field mapping, transformation rules, and data quality management
                </p>
              </div>
              <Button
                onClick={() =>
                  toast({ title: "Normalization queued", description: "Data normalization job has been queued." })
                }
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Run Normalization
              </Button>
            </div>

            {/* Quality Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {QUALITY_STATS.map((stat) => (
                <Card key={stat.label} className="bg-card/70 border-border backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Field Mappings */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  Field Mapping Configuration
                </CardTitle>
                <CardDescription>
                  Raw source fields mapped to normalised internal schema fields
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 pr-6 text-muted-foreground font-medium">Raw Field</th>
                        <th className="pb-3 pr-6 text-muted-foreground font-medium" />
                        <th className="pb-3 pr-6 text-muted-foreground font-medium">Normalised Field</th>
                        <th className="pb-3 pr-6 text-muted-foreground font-medium">Type</th>
                        <th className="pb-3 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FIELD_MAPPINGS.map((m) => (
                        <tr key={m.raw} className="border-b border-border/40 last:border-0">
                          <td className="py-3 pr-6 font-mono text-foreground">{m.raw}</td>
                          <td className="py-3 pr-6 text-muted-foreground">
                            <ArrowRight className="w-4 h-4" />
                          </td>
                          <td className="py-3 pr-6 font-mono text-primary">{m.normalized}</td>
                          <td className="py-3 pr-6">
                            <Badge variant="outline" className="text-xs">
                              {m.type}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Normalization Rules */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="w-5 h-5" />
                    Normalization Rules
                  </CardTitle>
                  <CardDescription>Active transformation and validation rules</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddRule && (
                  <div className="rounded-lg border border-border/60 p-4 bg-muted/10 space-y-3">
                    <p className="text-sm font-medium">New Normalization Rule</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Rule Name</Label>
                        <Input
                          placeholder="e.g. trim_whitespace"
                          value={newRule.rule_name}
                          onChange={(e) => setNewRule((p) => ({ ...p, rule_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Condition</Label>
                        <Input
                          placeholder="e.g. field_contains"
                          value={newRule.condition}
                          onChange={(e) => setNewRule((p) => ({ ...p, condition: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          placeholder="e.g. Ltd"
                          value={newRule.value}
                          onChange={(e) => setNewRule((p) => ({ ...p, value: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weight (1–10)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={newRule.weight}
                          onChange={(e) => setNewRule((p) => ({ ...p, weight: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addRuleMutation.mutate()}
                        disabled={addRuleMutation.isPending || !newRule.rule_name}
                      >
                        {addRuleMutation.isPending && (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        )}
                        Save Rule
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddRule(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : rules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <CheckSquare className="w-8 h-8 opacity-40" />
                    <p className="text-sm">No normalization rules configured yet.</p>
                    <Button size="sm" variant="outline" onClick={() => setShowAddRule(true)}>
                      Add your first rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(rules as any[]).map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-md border border-border/40 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {rule.rule_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rule.condition} → {rule.value}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <Badge variant="outline" className="text-xs">
                            weight: {rule.weight}
                          </Badge>
                          <Switch
                            checked={rule.active ?? false}
                            onCheckedChange={() => toggleRule(rule.id, rule.active)}
                          />
                        </div>
                      </div>
                    ))}
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
