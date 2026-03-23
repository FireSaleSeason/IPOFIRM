import { useState, useMemo } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MessagesSquare,
  Search,
  Loader2,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Clock,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

type FilterTab = "all" | "email" | "call" | "message";

const ACTION_TYPE_COLORS: Record<string, string> = {
  email: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  call: "bg-green-500/20 text-green-400 border-green-500/30",
  message: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  sms: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  note: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  meeting: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function getActionBadgeClass(actionType: string | null): string {
  if (!actionType) return "bg-muted text-muted-foreground border-border";
  const key = actionType.toLowerCase();
  for (const [pattern, cls] of Object.entries(ACTION_TYPE_COLORS)) {
    if (key.includes(pattern)) return cls;
  }
  return "bg-muted/40 text-muted-foreground border-border";
}

function matchesTab(actionType: string | null, tab: FilterTab): boolean {
  if (tab === "all") return true;
  if (!actionType) return false;
  const lower = actionType.toLowerCase();
  if (tab === "email") return lower.includes("email");
  if (tab === "call") return lower.includes("call");
  if (tab === "message") return lower.includes("message") || lower.includes("sms") || lower.includes("chat");
  return false;
}

const TABS: { id: FilterTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All", icon: MessagesSquare },
  { id: "email", label: "Emails", icon: Mail },
  { id: "call", label: "Calls", icon: Phone },
  { id: "message", label: "Messages", icon: MessageSquare },
];

const CommunicationLogs = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: actions, isLoading, isError } = useQuery({
    queryKey: ["company_actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const oneWeekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);

  const stats = useMemo(() => {
    if (!actions) return { total: 0, thisWeek: 0, successRate: "—", pending: 0 };
    const total = actions.length;
    const thisWeek = actions.filter(
      (a) => a.created_at && new Date(a.created_at) >= oneWeekAgo
    ).length;
    const completed = actions.filter((a) =>
      ["completed", "sent", "done", "success"].includes(
        (a.action_type ?? "").toLowerCase()
      )
    ).length;
    const successRate = total > 0 ? `${Math.round((completed / total) * 100)}%` : "—";
    const pending = actions.filter((a) =>
      ["pending", "scheduled", "follow-up"].includes(
        (a.action_type ?? "").toLowerCase()
      )
    ).length;
    return { total, thisWeek, successRate, pending };
  }, [actions, oneWeekAgo]);

  const filtered = useMemo(() => {
    if (!actions) return [];
    return actions.filter((a) => {
      const matchTab = matchesTab(a.action_type, activeTab);
      if (!matchTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (a.actor ?? "").toLowerCase().includes(q) ||
        (a.action_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [actions, activeTab, searchQuery]);

  const statCards = [
    {
      label: "Total Interactions",
      value: stats.total,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "This Week",
      value: stats.thisWeek,
      icon: Clock,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Success Rate",
      value: stats.successRate,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Pending Follow-ups",
      value: stats.pending,
      icon: HelpCircle,
      color: stats.pending > 0 ? "text-yellow-500" : "text-muted-foreground",
      bg: stats.pending > 0 ? "bg-yellow-500/10" : "bg-muted/20",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                INVESTOR COMMUNICATION LOGS
              </h2>
              <p className="text-muted-foreground">
                Chronological record of every interaction with investors and entities
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card key={card.label} className="bg-card/70 border-border backdrop-blur-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${card.bg}`}>
                          <Icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{card.label}</p>
                          <p className={`text-2xl font-bold ${card.color}`}>
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              card.value
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Communication Logs Table */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessagesSquare className="w-5 h-5" />
                  Communication History
                </CardTitle>
                <CardDescription>
                  Filter and search all recorded interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter Tabs + Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
                    {TABS.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actor or action type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-muted/20 border-border"
                    />
                  </div>
                </div>

                {/* Table */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : isError ? (
                  <p className="text-red-500 text-sm py-6 text-center">
                    Failed to load communication logs. Please try again.
                  </p>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <MessagesSquare className="w-10 h-10 opacity-30" />
                    <p className="text-sm">
                      {searchQuery
                        ? `No results for "${searchQuery}".`
                        : "No communication logs found for this filter."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-3 px-2 font-medium">Actor</th>
                          <th className="text-left py-3 px-2 font-medium">Action Type</th>
                          <th className="text-left py-3 px-2 font-medium">Entity ID</th>
                          <th className="text-left py-3 px-2 font-medium">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((action) => (
                          <tr
                            key={action.id}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-3 px-2 font-medium">
                              {action.actor ?? <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-3 px-2">
                              <Badge
                                variant="outline"
                                className={getActionBadgeClass(action.action_type)}
                              >
                                {action.action_type ?? "Unknown"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                              {action.entity_id ?? "—"}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground text-xs whitespace-nowrap">
                              {action.created_at
                                ? new Date(action.created_at).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-muted-foreground mt-3 pl-2">
                      Showing {filtered.length} of {actions?.length ?? 0} interactions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CommunicationLogs;
