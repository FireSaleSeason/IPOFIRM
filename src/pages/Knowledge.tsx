import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Search, ChevronRight, Book, ChevronDown, Clock, Layers } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  lastUpdated: string;
  content: string;
}

const mockArticles: Article[] = [
  // Platform Setup
  {
    id: "1",
    title: "Getting Started with IPOFirm",
    description: "A step-by-step guide to setting up your workspace, inviting team members and configuring your first pipeline.",
    category: "Platform Setup",
    lastUpdated: "2026-03-19",
    content: `## Getting Started\n\n### 1. Create your organisation\nNavigate to **Settings > Organisation** and enter your firm name, jurisdiction and primary contact.\n\n### 2. Invite team members\nGo to **User Management** and click **Invite User**. Assign a role (Admin, Analyst, Viewer) and send the invite.\n\n### 3. Configure your pipeline\nOpen the **CRM** module and create your first deal stage under **Pipeline Settings**. Drag and reorder stages to match your workflow.\n\n### 4. Connect data sources\nVisit **Data Sources** to connect registry APIs and scraping targets. At least one active source is required before running your first scrape.`,
  },
  {
    id: "2",
    title: "Configuring User Roles and Permissions",
    description: "Understand the Admin, Analyst and Viewer roles and how to customise access per module.",
    category: "Platform Setup",
    lastUpdated: "2026-03-15",
    content: `## Roles Overview\n\n| Role | CRM | Data Sources | Admin Panel |\n|------|-----|-------------|-------------|\n| Admin | Full | Full | Full |\n| Analyst | Full | Read/Write | None |\n| Viewer | Read | Read | None |\n\n### Customising permissions\nAdmins can toggle per-module access in **Settings > Roles**. Changes take effect immediately without requiring a re-login.`,
  },
  {
    id: "3",
    title: "Setting Up Your Notification Preferences",
    description: "Configure email, in-app and webhook alerts for pipeline events, scrape completions and lead scores.",
    category: "Platform Setup",
    lastUpdated: "2026-03-10",
    content: `## Notification Channels\n\n- **In-app**: Shown in the bell icon in the top navigation.\n- **Email**: Sent to your registered email. Manage frequency under **Profile > Notifications**.\n- **Webhook**: POST payloads to your endpoint for pipeline changes. Configure under **Settings > Webhooks**.\n\n### Recommended defaults\nEnable email digests for daily scrape summaries and real-time in-app alerts for high-priority lead score changes (>80).`,
  },
  // Scraping Guide
  {
    id: "4",
    title: "Running Your First Scrape Job",
    description: "Learn how to configure, launch and monitor a registry scrape job from start to finish.",
    category: "Scraping Guide",
    lastUpdated: "2026-03-17",
    content: `## Launching a Scrape\n\n1. Navigate to **Data Sources** and select a connected registry.\n2. Click **New Scrape Job** and choose your target filters (industry, jurisdiction, founding year).\n3. Set the schedule: one-time or recurring (daily / weekly / monthly).\n4. Click **Run** — the job appears in **Task Scheduler** with real-time status.\n\n### Monitoring progress\nOpen **Integration Logs** to view per-record status. Failed records are automatically retried up to 3 times.`,
  },
  {
    id: "5",
    title: "Understanding Scrape Quotas and Rate Limits",
    description: "How credit consumption works, rate limit handling and what happens when you hit your monthly quota.",
    category: "Scraping Guide",
    lastUpdated: "2026-03-12",
    content: `## Credit System\n\nEach successful record extraction consumes 1 scrape credit. Your monthly allocation is shown in **Settings > Billing**.\n\n### Rate limits\nThe platform automatically throttles requests to comply with each registry's rate limit policy. You do not need to configure this manually.\n\n### Quota exhaustion\nWhen you reach 90% of your monthly quota, an alert is sent. Jobs scheduled beyond the quota are queued and resume on the first day of the next billing cycle.`,
  },
  // Integration Docs
  {
    id: "6",
    title: "Connecting to Salesforce CRM",
    description: "Bi-directional sync between IPOFirm leads and your Salesforce instance using OAuth 2.0.",
    category: "Integration Docs",
    lastUpdated: "2026-03-14",
    content: `## Salesforce Integration\n\n### Prerequisites\n- Salesforce Professional or Enterprise edition\n- OAuth 2.0 connected app credentials\n\n### Setup steps\n1. Go to **Settings > Integrations > Salesforce**.\n2. Click **Authorise** and complete the OAuth flow.\n3. Map IPOFirm fields to Salesforce object fields using the drag-and-drop mapper.\n4. Choose sync direction: IPOFirm → Salesforce, bidirectional, or read-only.\n5. Set sync frequency (real-time or scheduled).`,
  },
  {
    id: "7",
    title: "Zapier and Make Integration Guide",
    description: "Trigger automation workflows from IPOFirm events using Zapier or Make (formerly Integromat).",
    category: "Integration Docs",
    lastUpdated: "2026-03-09",
    content: `## Zapier Setup\n\n1. In Zapier, create a new Zap and search for **IPOFirm** as the trigger app.\n2. Authenticate with your IPOFirm API key (found under **Settings > API**).\n3. Choose a trigger event: *New Lead*, *Score Changed*, *Scrape Completed*.\n4. Add your action step (e.g. send Slack message, create HubSpot contact).\n\n## Make (Integromat)\nThe IPOFirm Make module supports the same events plus HTTP webhook triggers for custom flows.`,
  },
  // API Reference
  {
    id: "8",
    title: "REST API Authentication",
    description: "How to generate API keys, use Bearer token authentication and handle token rotation.",
    category: "API Reference",
    lastUpdated: "2026-03-18",
    content: `## Authentication\n\nAll API requests must include a Bearer token in the Authorization header:\n\n\`\`\`\nAuthorization: Bearer YOUR_API_KEY\n\`\`\`\n\n### Generating an API key\nNavigate to **Settings > API Keys** and click **Generate New Key**. Keys are shown once — store them securely.\n\n### Token rotation\nRotate keys at any time from the same page. Old keys are invalidated immediately upon rotation.`,
  },
  {
    id: "9",
    title: "Leads API – Endpoints Reference",
    description: "Full reference for the /leads endpoints: list, get, create, update and delete.",
    category: "API Reference",
    lastUpdated: "2026-03-11",
    content: `## Leads Endpoints\n\n| Method | Endpoint | Description |\n|--------|----------|-------------|\n| GET | /v1/leads | List all leads (paginated) |\n| GET | /v1/leads/:id | Get a single lead |\n| POST | /v1/leads | Create a new lead |\n| PATCH | /v1/leads/:id | Update lead fields |\n| DELETE | /v1/leads/:id | Archive a lead |\n\n### Pagination\nAll list endpoints support \`?page=1&limit=50\`. Maximum page size is 200.`,
  },
  // FAQs
  {
    id: "10",
    title: "Why are some companies missing from my scrape results?",
    description: "Common reasons for missing records and how to adjust your scrape configuration to improve coverage.",
    category: "FAQs",
    lastUpdated: "2026-03-16",
    content: `## Common Causes\n\n1. **Filter too narrow**: Check that your industry and founding year filters are not excluding valid targets.\n2. **Registry lag**: Some registries update records on a 48–72 hour delay. Re-run the scrape after the lag period.\n3. **Rate limit hit mid-job**: Check **Integration Logs** for rate-limit errors. The system will retry, but coverage may be partial until the next cycle.\n4. **Data normalisation rules**: If a record fails normalisation validation it is held in the **Data Normalisation** queue for manual review.`,
  },
  {
    id: "11",
    title: "How is the lead score calculated?",
    description: "An explanation of the scoring model, signal weights and how to customise scoring rules.",
    category: "FAQs",
    lastUpdated: "2026-03-13",
    content: `## Scoring Model\n\nThe default model scores leads from 0–100 based on:\n\n- **Financial signals** (40%): Revenue growth, profitability trend, funding history.\n- **Operational signals** (30%): Headcount growth, job posting velocity, technology stack.\n- **Market signals** (20%): Sector momentum, comparable listings, analyst coverage.\n- **Engagement signals** (10%): Email open rate, meeting history, CRM activity.\n\n### Customising weights\nGo to **Rules & Scoring** to adjust signal weights or add custom rules using boolean logic.`,
  },
];

const ALL_CATEGORIES = [
  "Platform Setup",
  "Scraping Guide",
  "Integration Docs",
  "API Reference",
  "FAQs",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Platform Setup": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Scraping Guide": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Integration Docs": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "API Reference": "bg-green-500/10 text-green-400 border-green-500/20",
  "FAQs": "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

export default function Knowledge() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockArticles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = ALL_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = mockArticles.filter((a) => a.category === cat).length;
    return acc;
  }, {});

  const handleViewFull = (article: Article) => {
    toast({
      title: "Opening full article",
      description: "Full docs viewer opens here.",
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
            {/* Page header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
              <p className="text-muted-foreground mt-1">
                Documentation, guides and reference material for the IPOFirm platform.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Articles</p>
                    <p className="text-2xl font-bold text-foreground">{mockArticles.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold text-foreground">{ALL_CATEGORIES.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-2xl font-bold text-foreground">19 Mar</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Main layout: sidebar + articles */}
            <div className="flex gap-6 items-start">
              {/* Category sidebar */}
              <aside className="w-56 shrink-0 hidden md:block">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pb-2">
                    <button
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-muted/40 ${
                        !selectedCategory
                          ? "text-foreground font-medium bg-muted/30"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      <span className="flex items-center gap-2">
                        <Book className="h-4 w-4" />
                        All Articles
                      </span>
                      <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                        {mockArticles.length}
                      </span>
                    </button>
                    {ALL_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-muted/40 ${
                          selectedCategory === cat
                            ? "text-foreground font-medium bg-muted/30"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      >
                        <span className="flex items-center gap-2 text-left">
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                          {cat}
                        </span>
                        <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                          {categoryCounts[cat]}
                        </span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </aside>

              {/* Articles list */}
              <div className="flex-1 space-y-4 min-w-0">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <BookOpen className="h-10 w-10 opacity-40" />
                    <p className="text-sm">No articles match your search.</p>
                  </div>
                ) : (
                  filtered.map((article) => (
                    <Card
                      key={article.id}
                      className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge
                                variant="outline"
                                className={`text-xs font-semibold ${CATEGORY_COLORS[article.category]}`}
                              >
                                {article.category}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(article.lastUpdated).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 mt-0.5"
                            onClick={() => toggleExpand(article.id)}
                            aria-label={expandedId === article.id ? "Collapse" : "Expand"}
                          >
                            {expandedId === article.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{article.description}</p>
                      </CardHeader>

                      {expandedId === article.id && (
                        <CardContent className="pt-0">
                          <div className="border-t border-border/50 pt-4 mt-2">
                            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed bg-muted/20 rounded-lg p-4 overflow-x-auto">
                              {article.content}
                            </pre>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 flex items-center gap-2"
                              onClick={() => handleViewFull(article)}
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              View Full Article
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
