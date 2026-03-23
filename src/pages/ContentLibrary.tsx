import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileEdit, Copy, BookOpen, Image, Search, Plus, Calendar, Tag } from "lucide-react";

type ContentType = "Email Template" | "Social Media" | "Pitch Deck" | "Blog Post" | "Infographic";

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  category: string;
  lastEdited: string;
  status: "Published" | "Draft" | "Template";
  preview: string;
}

const mockContent: ContentItem[] = [
  {
    id: "1",
    title: "IPO Roadshow Introduction Email",
    type: "Email Template",
    category: "Email Templates",
    lastEdited: "2026-03-20",
    status: "Template",
    preview:
      "Dear [Investor Name], we are pleased to invite you to an exclusive roadshow briefing for [Company]'s upcoming IPO on [Exchange]...",
  },
  {
    id: "2",
    title: "Series A Follow-Up Sequence",
    type: "Email Template",
    category: "Email Templates",
    lastEdited: "2026-03-18",
    status: "Template",
    preview:
      "Following our recent conversation, I wanted to share the updated investor deck and preliminary valuation metrics for your review...",
  },
  {
    id: "3",
    title: "LinkedIn IPO Announcement Post",
    type: "Social Media",
    category: "Social Media",
    lastEdited: "2026-03-17",
    status: "Published",
    preview:
      "We're thrilled to announce that [Company] has successfully listed on [Exchange]. This milestone reflects years of innovation and investor trust...",
  },
  {
    id: "4",
    title: "Twitter / X Pre-IPO Teaser Thread",
    type: "Social Media",
    category: "Social Media",
    lastEdited: "2026-03-15",
    status: "Draft",
    preview:
      "Something big is coming. [Company] is set to go public. Here's why this is one of the most anticipated IPOs of 2026 🧵 (1/8)...",
  },
  {
    id: "5",
    title: "Institutional Investor Pitch Deck",
    type: "Pitch Deck",
    category: "Pitch Decks",
    lastEdited: "2026-03-14",
    status: "Template",
    preview:
      "Slide 1: Executive Summary — [Company] is a high-growth SaaS platform serving enterprise clients in 40+ markets with a $120M ARR...",
  },
  {
    id: "6",
    title: "Retail Investor Explainer Deck",
    type: "Pitch Deck",
    category: "Pitch Decks",
    lastEdited: "2026-03-12",
    status: "Published",
    preview:
      "What is an IPO? Why [Company]? How to participate? This deck answers the key questions for prospective retail investors in plain language...",
  },
  {
    id: "7",
    title: "IPO Market Trends – Q1 2026",
    type: "Blog Post",
    category: "Blog Posts",
    lastEdited: "2026-03-10",
    status: "Published",
    preview:
      "The first quarter of 2026 has seen a resurgence in technology IPOs, with 14 listings raising a combined $8.2B across US and European markets...",
  },
  {
    id: "8",
    title: "Due Diligence Checklist Infographic",
    type: "Infographic",
    category: "Infographics",
    lastEdited: "2026-03-08",
    status: "Template",
    preview:
      "A visual 12-step due diligence checklist for institutional investors evaluating pre-IPO opportunities, from financials to ESG scoring...",
  },
  {
    id: "9",
    title: "Valuation Multiples Comparison Chart",
    type: "Infographic",
    category: "Infographics",
    lastEdited: "2026-03-05",
    status: "Published",
    preview:
      "Side-by-side EV/Revenue and P/E multiples for recent tech, biotech, and fintech IPOs benchmarked against sector medians...",
  },
  {
    id: "10",
    title: "Post-IPO Performance Blog – 90-Day Review",
    type: "Blog Post",
    category: "Blog Posts",
    lastEdited: "2026-03-01",
    status: "Draft",
    preview:
      "How do newly listed companies perform in their first 90 days? We analysed 30 IPOs from 2025 and found that 67% outperformed their sector index...",
  },
];

const TYPE_ICON: Record<ContentType, React.ElementType> = {
  "Email Template": FileEdit,
  "Social Media": Copy,
  "Pitch Deck": BookOpen,
  "Blog Post": FileEdit,
  "Infographic": Image,
};

const STATUS_COLORS: Record<string, string> = {
  Published: "bg-green-500/10 text-green-400 border-green-500/20",
  Draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Template: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const CATEGORIES = [
  "All",
  "Email Templates",
  "Social Media",
  "Pitch Decks",
  "Blog Posts",
  "Infographics",
] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const pageStats = [
  { label: "Total Assets", value: "10", icon: BookOpen },
  { label: "Published", value: "4", icon: Tag },
  { label: "Drafts", value: "2", icon: FileEdit },
  { label: "Templates", value: "4", icon: Copy },
];

export default function ContentLibrary() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const filtered = mockContent.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.preview.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleNewContent = () => {
    toast({
      title: "Content editor",
      description: "Content editor will open here.",
    });
  };

  const handleEdit = (item: ContentItem) => {
    toast({
      title: "Opening editor",
      description: `Editing "${item.title}".`,
    });
  };

  const handleUseTemplate = (item: ContentItem) => {
    toast({
      title: "Template applied",
      description: `"${item.title}" has been copied to your workspace.`,
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Content Library</h1>
                <p className="text-muted-foreground mt-1">
                  Browse, manage and deploy marketing content across all channels.
                </p>
              </div>
              <Button onClick={handleNewContent} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Content
              </Button>
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

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Tabs + Grid */}
            <Tabs
              value={activeCategory}
              onValueChange={(v) => setActiveCategory(v as CategoryFilter)}
            >
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CATEGORIES.map((cat) => (
                <TabsContent key={cat} value={cat}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                      <BookOpen className="h-10 w-10 opacity-40" />
                      <p className="text-sm">No content matches your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filtered.map((item) => {
                        const Icon = TYPE_ICON[item.type];
                        return (
                          <Card
                            key={item.id}
                            className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors flex flex-col"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="h-5 w-5 text-primary shrink-0" />
                                  <CardTitle className="text-base leading-snug line-clamp-2">
                                    {item.title}
                                  </CardTitle>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`shrink-0 text-xs font-semibold ${STATUS_COLORS[item.status]}`}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {item.type}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-3">
                              <CardDescription className="text-xs line-clamp-3 flex-1">
                                {item.preview}
                              </CardDescription>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Last edited{" "}
                                {new Date(item.lastEdited).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 flex items-center gap-1"
                                  onClick={() => handleEdit(item)}
                                >
                                  <FileEdit className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1 flex items-center gap-1"
                                  onClick={() => handleUseTemplate(item)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Use Template
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
