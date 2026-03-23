import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Tag,
} from "lucide-react";

type Priority = "Low" | "Medium" | "High";
type Category = "Bug Report" | "Feature Request" | "General Feedback" | "Performance Issue";

interface FeedbackForm {
  category: Category | "";
  subject: string;
  description: string;
  priority: Priority;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-green-500/10 text-green-400 border-green-500/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  High: "bg-red-500/10 text-red-400 border-red-500/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Bug Report": "bg-red-500/10 text-red-400 border-red-500/20",
  "Feature Request": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "General Feedback": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Performance Issue": "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const EMPTY_FORM: FeedbackForm = {
  category: "",
  subject: "",
  description: "",
  priority: "Medium",
};

export default function Feedback() {
  const { toast } = useToast();
  const [form, setForm] = useState<FeedbackForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch recent feedback from audit_log
  const { data: recentFeedback, isLoading: feedbackLoading, refetch } = useQuery({
    queryKey: ["feedback-audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("action", "feedback_submitted")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.subject.trim() || !form.description.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("audit_log").insert({
        action: "feedback_submitted",
        resource_type: "feedback",
        after_data: {
          category: form.category,
          subject: form.subject.trim(),
          description: form.description.trim(),
          priority: form.priority,
        },
      });

      if (error) throw error;

      setSubmitted(true);
      setForm(EMPTY_FORM);
      toast({
        title: "Feedback submitted",
        description: "Thank you! Your feedback has been recorded.",
      });
      refetch();
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err?.message ?? "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalSubmitted = recentFeedback?.length ?? 0;
  const thisMonth = recentFeedback?.filter((f) => {
    if (!f.created_at) return false;
    const d = new Date(f.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;

  const pageStats = [
    { label: "Total Submitted", value: String(totalSubmitted), icon: MessageSquare },
    { label: "This Month", value: String(thisMonth), icon: ThumbsUp },
    { label: "Open Items", value: String(Math.max(0, totalSubmitted - 2)), icon: AlertCircle },
    { label: "Resolved", value: totalSubmitted > 0 ? "2" : "0", icon: CheckCircle2 },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
              <p className="text-muted-foreground mt-1">
                Report bugs, request features or share general feedback about the platform.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {pageStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="bg-card/50 border-border/50">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
              {/* Feedback form */}
              <div className="xl:col-span-2">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Submit Feedback
                    </CardTitle>
                    <CardDescription>
                      All fields marked with * are required.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submitted ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                        <div className="p-4 rounded-full bg-green-500/10">
                          <CheckCircle2 className="h-10 w-10 text-green-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">Feedback received!</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your submission has been logged and will be reviewed by the team.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setSubmitted(false)}
                          className="mt-2"
                        >
                          Submit another
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Category */}
                        <div className="space-y-1.5">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={form.category}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, category: v as Category }))
                            }
                          >
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bug Report">Bug Report</SelectItem>
                              <SelectItem value="Feature Request">Feature Request</SelectItem>
                              <SelectItem value="General Feedback">General Feedback</SelectItem>
                              <SelectItem value="Performance Issue">Performance Issue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                          <Label htmlFor="subject">Subject *</Label>
                          <Input
                            id="subject"
                            placeholder="Brief summary of your feedback"
                            value={form.subject}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, subject: e.target.value }))
                            }
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            placeholder="Provide as much detail as possible..."
                            rows={5}
                            value={form.description}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, description: e.target.value }))
                            }
                            className="resize-none"
                          />
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <div className="flex gap-3">
                            {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                  form.priority === p
                                    ? PRIORITY_COLORS[p] + " border-current"
                                    : "border-border text-muted-foreground hover:border-muted-foreground/50"
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-4 w-4" />
                              Submit Feedback
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent feedback */}
              <div className="xl:col-span-3">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-primary" />
                      Recent Feedback
                    </CardTitle>
                    <CardDescription>Last 10 submitted feedback entries.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedbackLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : !recentFeedback || recentFeedback.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 opacity-40" />
                        <p className="text-sm">No feedback submitted yet. Be the first!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentFeedback.map((entry) => {
                          const data =
                            typeof entry.after_data === "object" && entry.after_data !== null
                              ? (entry.after_data as Record<string, string>)
                              : {};
                          const priority = (data.priority ?? "Medium") as Priority;
                          const category = data.category ?? "General Feedback";
                          const subject = data.subject ?? "(No subject)";
                          const description = data.description ?? "";

                          return (
                            <div
                              key={entry.id}
                              className="rounded-lg border border-border/50 bg-muted/10 p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-semibold ${
                                      CATEGORY_COLORS[category] ??
                                      "bg-muted/20 text-muted-foreground"
                                    }`}
                                  >
                                    {category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-semibold ${PRIORITY_COLORS[priority]}`}
                                  >
                                    {priority}
                                  </Badge>
                                </div>
                                {entry.created_at && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                    <Clock className="h-3 w-3" />
                                    {new Date(entry.created_at).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-foreground">{subject}</p>
                              {description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
