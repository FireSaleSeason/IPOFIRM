import { useState, useMemo } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Users,
  CheckCircle,
  DollarSign,
  Target,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Filter,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface EmailSubscriber {
  id: string;
  name: string | null;
  email: string | null;
  subscription_status: string | null;
  capital_available: number | null;
  interested_sectors: string[] | null;
  created_at: string;
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  subscribed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  unsubscribed: "bg-muted/50 text-muted-foreground border-border",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  verified: "bg-green-500/20 text-green-400 border-green-500/30",
};

function formatCapital(val: number | null): string {
  if (val === null || val === undefined) return "—";
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

const InvestorIntelligence = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [capitalFilter, setCapitalFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ["investor_subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_subscribers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as EmailSubscriber[];
    },
  });

  const allSectors = useMemo(() => {
    if (!subscribers) return [];
    const sectorSet = new Set<string>();
    subscribers.forEach((s) => {
      if (Array.isArray(s.interested_sectors)) {
        s.interested_sectors.forEach((sector) => sectorSet.add(sector));
      }
    });
    return Array.from(sectorSet).sort();
  }, [subscribers]);

  const allStatuses = useMemo(() => {
    if (!subscribers) return [];
    const statusSet = new Set<string>();
    subscribers.forEach((s) => {
      if (s.subscription_status) statusSet.add(s.subscription_status);
    });
    return Array.from(statusSet).sort();
  }, [subscribers]);

  const filteredSubscribers = useMemo(() => {
    if (!subscribers) return [];
    return subscribers.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const term = search.toLowerCase();
      if (term && !name.includes(term) && !email.includes(term)) return false;

      if (statusFilter !== "all" && s.subscription_status !== statusFilter) return false;

      if (capitalFilter !== "all") {
        const cap = s.capital_available ?? 0;
        if (capitalFilter === "<1m" && cap >= 1_000_000) return false;
        if (capitalFilter === "1m-10m" && (cap < 1_000_000 || cap >= 10_000_000)) return false;
        if (capitalFilter === "10m-100m" && (cap < 10_000_000 || cap >= 100_000_000)) return false;
        if (capitalFilter === ">100m" && cap < 100_000_000) return false;
      }

      if (sectorFilter !== "all") {
        const sectors = s.interested_sectors || [];
        if (!sectors.includes(sectorFilter)) return false;
      }

      return true;
    });
  }, [subscribers, search, statusFilter, capitalFilter, sectorFilter]);

  const metrics = useMemo(() => {
    if (!subscribers) return null;
    const total = subscribers.length;
    const verified = subscribers.filter(
      (s) => s.subscription_status === "active" || s.subscription_status === "verified" || s.subscription_status === "subscribed"
    ).length;
    const totalCapital = subscribers.reduce((sum, s) => sum + (s.capital_available ?? 0), 0);
    const activeOpportunities = subscribers.filter(
      (s) => (s.capital_available ?? 0) >= 1_000_000 && (s.subscription_status === "active" || s.subscription_status === "subscribed")
    ).length;
    return { total, verified, totalCapital, activeOpportunities };
  }, [subscribers]);

  const sectorPieData = useMemo(() => {
    if (!subscribers) return [];
    const sectorCounts: Record<string, number> = {};
    subscribers.forEach((s) => {
      if (Array.isArray(s.interested_sectors)) {
        s.interested_sectors.forEach((sector) => {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        });
      }
    });
    return Object.entries(sectorCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [subscribers]);

  const handleOutreach = (investor: EmailSubscriber) => {
    toast({
      title: "Investor Outreach Module",
      description: `Initiating outreach to ${investor.name || investor.email || "this investor"}.`,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">INVESTOR INTELLIGENCE</h2>
              <p className="text-muted-foreground">Investor CRM, outreach tracking, and sector distribution insights</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !metrics || metrics.total === 0 ? (
              <Card className="bg-card/70 border-border backdrop-blur-sm">
                <CardContent className="py-16 text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-lg">No investor data found.</p>
                  <p className="text-muted-foreground text-sm mt-1">Add email subscribers to populate this dashboard.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Total Investors
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">{metrics.total.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">All subscribers</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" /> Verified
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-green-400">{metrics.verified.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Active / subscribed</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-yellow-400" /> Capital Available
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-yellow-400">
                        {formatCapital(metrics.totalCapital)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Total declared capital</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/70 border-border backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" /> Active Opportunities
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold text-blue-400">{metrics.activeOpportunities.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Active + capital ≥ $1M</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Investor Table + Sector Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Filters */}
                    <Card className="bg-card/70 border-border backdrop-blur-sm">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                          <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Search name or email..."
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                            >
                              <option value="all">All Statuses</option>
                              {allStatuses.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>

                            <select
                              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                              value={capitalFilter}
                              onChange={(e) => setCapitalFilter(e.target.value)}
                            >
                              <option value="all">All Capital</option>
                              <option value="<1m">&lt; $1M</option>
                              <option value="1m-10m">$1M – $10M</option>
                              <option value="10m-100m">$10M – $100M</option>
                              <option value=">100m">&gt; $100M</option>
                            </select>

                            {allSectors.length > 0 && (
                              <select
                                className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                value={sectorFilter}
                                onChange={(e) => setSectorFilter(e.target.value)}
                              >
                                <option value="all">All Sectors</option>
                                {allSectors.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Table */}
                    <Card className="bg-card/70 border-border backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" /> Investor Directory
                        </CardTitle>
                        <CardDescription>
                          {filteredSubscribers.length} of {metrics.total} investors
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {filteredSubscribers.length === 0 ? (
                          <div className="py-12 text-center text-muted-foreground text-sm px-6">
                            No investors match the current filters.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border bg-muted/20">
                                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden md:table-cell">Email</th>
                                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Capital</th>
                                  <th className="text-left py-3 px-4 text-muted-foreground font-medium hidden lg:table-cell">Sectors</th>
                                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Status</th>
                                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredSubscribers.map((investor) => (
                                  <>
                                    <tr
                                      key={investor.id}
                                      className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                                      onClick={() => toggleExpand(investor.id)}
                                    >
                                      <td className="py-3 px-4 font-medium text-foreground">
                                        <div className="flex items-center gap-2">
                                          {expandedId === investor.id ? (
                                            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                          )}
                                          <span className="truncate max-w-[130px]">{investor.name || "—"}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell truncate max-w-[160px]">
                                        {investor.email || "—"}
                                      </td>
                                      <td className="py-3 px-4 text-right font-semibold text-foreground">
                                        {formatCapital(investor.capital_available)}
                                      </td>
                                      <td className="py-3 px-4 hidden lg:table-cell">
                                        <div className="flex gap-1 flex-wrap">
                                          {(investor.interested_sectors || []).slice(0, 2).map((sector) => (
                                            <Badge key={sector} variant="outline" className="text-xs">
                                              {sector}
                                            </Badge>
                                          ))}
                                          {(investor.interested_sectors || []).length > 2 && (
                                            <Badge variant="outline" className="text-xs">
                                              +{(investor.interested_sectors || []).length - 2}
                                            </Badge>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <Badge
                                          variant="outline"
                                          className={`text-xs capitalize ${STATUS_COLORS[investor.subscription_status || ""] || "text-muted-foreground border-border"}`}
                                        >
                                          {investor.subscription_status || "unknown"}
                                        </Badge>
                                      </td>
                                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-7 px-3 gap-1"
                                          onClick={() => handleOutreach(investor)}
                                        >
                                          <Mail className="w-3 h-3" />
                                          Outreach
                                        </Button>
                                      </td>
                                    </tr>

                                    {expandedId === investor.id && (
                                      <tr key={`${investor.id}-expanded`} className="bg-muted/10 border-b border-border/50">
                                        <td colSpan={6} className="px-6 py-4">
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                            <div>
                                              <p className="text-muted-foreground mb-1">Email</p>
                                              <p className="text-foreground">{investor.email || "—"}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground mb-1">Capital Available</p>
                                              <p className="text-foreground font-semibold">{formatCapital(investor.capital_available)}</p>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground mb-1">KYC Status</p>
                                              <Badge
                                                variant="outline"
                                                className={`capitalize ${
                                                  investor.subscription_status === "verified" || investor.subscription_status === "active"
                                                    ? "text-green-400 border-green-400/30"
                                                    : "text-yellow-400 border-yellow-400/30"
                                                }`}
                                              >
                                                {investor.subscription_status === "verified" ? "KYC Verified" : "KYC Pending"}
                                              </Badge>
                                            </div>
                                            <div>
                                              <p className="text-muted-foreground mb-1">Member Since</p>
                                              <p className="text-foreground">{new Date(investor.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                              <p className="text-muted-foreground mb-1">Interested Sectors</p>
                                              <div className="flex gap-1.5 flex-wrap">
                                                {(investor.interested_sectors || []).length > 0 ? (
                                                  (investor.interested_sectors || []).map((sector) => (
                                                    <Badge key={sector} variant="outline" className="text-xs">{sector}</Badge>
                                                  ))
                                                ) : (
                                                  <span className="text-muted-foreground">None specified</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sector Pie Chart */}
                  <div className="space-y-6">
                    <Card className="bg-card/70 border-border backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle>Sector Distribution</CardTitle>
                        <CardDescription>Investor interest by sector</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {sectorPieData.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                            <Target className="w-8 h-8" />
                            <p>No sector data available.</p>
                          </div>
                        ) : (
                          <>
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={sectorPieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={85}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {sectorPieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                                  formatter={(val: number, name: string) => [val, name]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-4">
                              {sectorPieData.slice(0, 6).map((item, index) => (
                                <div key={item.name} className="flex items-center gap-2 text-xs">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                  />
                                  <span className="text-muted-foreground truncate flex-1">{item.name}</span>
                                  <span className="font-semibold text-foreground">{item.value}</span>
                                </div>
                              ))}
                              {sectorPieData.length > 6 && (
                                <p className="text-xs text-muted-foreground text-center pt-1">
                                  +{sectorPieData.length - 6} more sectors
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="bg-card/70 border-border backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Capital</span>
                          <span className="font-semibold text-foreground">
                            {formatCapital(
                              subscribers && subscribers.length > 0
                                ? subscribers.reduce((s, i) => s + (i.capital_available ?? 0), 0) / subscribers.length
                                : null
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unique Sectors</span>
                          <span className="font-semibold text-foreground">{allSectors.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status Types</span>
                          <span className="font-semibold text-foreground">{allStatuses.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Showing Filtered</span>
                          <span className="font-semibold text-foreground">{filteredSubscribers.length}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default InvestorIntelligence;
