import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Brain, Zap, Target, BarChart2, Loader2 } from "lucide-react";

interface TrainingJob {
  id: string;
  version: string;
  date: string;
  status: "completed" | "failed" | "running";
  accuracy: number;
  duration: string;
}

const TRAINING_JOBS: TrainingJob[] = [
  { id: "1", version: "v2.4.1", date: "2026-03-20", status: "completed", accuracy: 94.2, duration: "18m 32s" },
  { id: "2", version: "v2.4.0", date: "2026-03-15", status: "completed", accuracy: 91.8, duration: "21m 05s" },
  { id: "3", version: "v2.3.5", date: "2026-03-08", status: "failed", accuracy: 0, duration: "4m 12s" },
  { id: "4", version: "v2.3.4", date: "2026-03-01", status: "completed", accuracy: 89.5, duration: "19m 48s" },
];

const CATEGORIES = [
  "Investor Outreach",
  "Lead Qualification",
  "Meeting Scheduling",
  "Follow-up Sequences",
  "Sentiment Analysis",
  "Entity Classification",
  "Risk Assessment",
  "Market Research",
];

const RESPONSE_STYLES = ["Formal", "Balanced", "Casual"];

export default function AITraining() {
  const { toast } = useToast();
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [responseStyle, setResponseStyle] = useState("Balanced");
  const [sampleCategory, setSampleCategory] = useState(CATEGORIES[0]);
  const [sampleInput, setSampleInput] = useState("");
  const [sampleOutput, setSampleOutput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const handleSubmitSample = async () => {
    if (!sampleInput.trim() || !sampleOutput.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both Sample Input and Expected Output.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSampleInput("");
    setSampleOutput("");
    toast({
      title: "Training Sample Added",
      description: `Sample added to "${sampleCategory}" category successfully.`,
    });
  };

  const handleDeployModel = async () => {
    setDeploying(true);
    await new Promise((r) => setTimeout(r, 1200));
    setDeploying(false);
    toast({
      title: "Model Deployed",
      description: "v2.4.1 has been deployed to production successfully.",
    });
  };

  const statusVariant = (status: TrainingJob["status"]) => {
    if (status === "completed") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">AI Training</h2>
                <p className="text-muted-foreground">
                  Manage model configuration, training data, and deployment
                </p>
              </div>
              <Button onClick={handleDeployModel} disabled={deploying}>
                {deploying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Deploy Model
              </Button>
            </div>

            {/* Training Data Stats */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Training Data
                </CardTitle>
                <CardDescription>Current training corpus statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Samples", value: "2,847" },
                    { label: "Categories", value: "12" },
                    { label: "Last Trained", value: "3 days ago" },
                    { label: "Active Model", value: "v2.4.1" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Model Configuration */}
              <Card className="bg-card/70 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Model Configuration
                  </CardTitle>
                  <CardDescription>Tune model behaviour parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Temperature:{" "}
                      <span className="text-primary font-bold">{temperature.toFixed(2)}</span>
                    </Label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full accent-primary h-2 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.0 (Precise)</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Max Tokens:{" "}
                      <span className="text-primary font-bold">{maxTokens.toLocaleString()}</span>
                    </Label>
                    <input
                      type="range"
                      min={100}
                      max={4000}
                      step={100}
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      className="w-full accent-primary h-2 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>100</span>
                      <span>4,000</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Response Style</Label>
                    <div className="flex gap-2">
                      {RESPONSE_STYLES.map((style) => (
                        <button
                          key={style}
                          onClick={() => setResponseStyle(style)}
                          className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                            responseStyle === style
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      toast({
                        title: "Configuration Saved",
                        description: `Temperature: ${temperature}, Max Tokens: ${maxTokens}, Style: ${responseStyle}`,
                      })
                    }
                  >
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>

              {/* Add Training Sample */}
              <Card className="bg-card/70 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Add Training Sample
                  </CardTitle>
                  <CardDescription>Submit new examples to improve the model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={sampleCategory}
                      onChange={(e) => setSampleCategory(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sample Input</Label>
                    <textarea
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      placeholder="e.g. What's the latest funding status for Acme Capital?"
                      rows={3}
                      className="w-full resize-none rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Output</Label>
                    <textarea
                      value={sampleOutput}
                      onChange={(e) => setSampleOutput(e.target.value)}
                      placeholder="e.g. Acme Capital recently closed a Series B round of £12M..."
                      rows={3}
                      className="w-full resize-none rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSubmitSample}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    Submit Training Sample
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Training Jobs */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5" />
                  Training Jobs
                </CardTitle>
                <CardDescription>History of past training runs and their outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 pr-4 text-muted-foreground font-medium">Version</th>
                        <th className="pb-3 pr-4 text-muted-foreground font-medium">Date</th>
                        <th className="pb-3 pr-4 text-muted-foreground font-medium">Status</th>
                        <th className="pb-3 pr-4 text-muted-foreground font-medium">Accuracy</th>
                        <th className="pb-3 text-muted-foreground font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRAINING_JOBS.map((job) => (
                        <tr key={job.id} className="border-b border-border/40 last:border-0">
                          <td className="py-3 pr-4 font-mono font-medium">{job.version}</td>
                          <td className="py-3 pr-4 text-muted-foreground">{job.date}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={statusVariant(job.status)} className="capitalize">
                              {job.status}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            {job.status === "completed" ? (
                              <span className="font-medium">{job.accuracy}%</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 text-muted-foreground">{job.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* A/B Test Results */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  A/B Test Results
                </CardTitle>
                <CardDescription>
                  Comparing response quality between two model variants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      variant: "Variant A",
                      model: "v2.3.4 (Control)",
                      metrics: [
                        { label: "Response Relevance", value: "87%" },
                        { label: "User Satisfaction", value: "3.8/5" },
                        { label: "Avg Response Time", value: "1.4s" },
                        { label: "Completion Rate", value: "91%" },
                      ],
                      badge: "Control",
                    },
                    {
                      variant: "Variant B",
                      model: "v2.4.1 (Challenger)",
                      metrics: [
                        { label: "Response Relevance", value: "94%" },
                        { label: "User Satisfaction", value: "4.3/5" },
                        { label: "Avg Response Time", value: "1.2s" },
                        { label: "Completion Rate", value: "96%" },
                      ],
                      badge: "Winner",
                    },
                  ].map((variant) => (
                    <div
                      key={variant.variant}
                      className="rounded-lg border border-border/60 p-5 bg-muted/10 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{variant.variant}</p>
                          <p className="text-xs text-muted-foreground font-mono">{variant.model}</p>
                        </div>
                        <Badge variant={variant.badge === "Winner" ? "default" : "secondary"}>
                          {variant.badge}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {variant.metrics.map((m) => (
                          <div key={m.label} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{m.label}</span>
                            <span className="font-medium">{m.value}</span>
                          </div>
                        ))}
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
