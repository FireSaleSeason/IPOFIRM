import { useState } from "react";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Upload, Folder, HardDrive, Calendar, Search } from "lucide-react";

type DocType = "PDF" | "XLSX" | "DOCX";
type DocCategory = "Reports" | "Contracts" | "Filings" | "Templates";

interface Document {
  id: string;
  title: string;
  type: DocType;
  category: DocCategory;
  size: string;
  lastModified: string;
  description: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    title: "Q4 2025 IPO Pipeline Report",
    type: "PDF",
    category: "Reports",
    size: "4.2 MB",
    lastModified: "2026-03-18",
    description: "Quarterly pipeline analysis covering 47 prospective IPO candidates across APAC and EMEA markets.",
  },
  {
    id: "2",
    title: "Client Engagement Agreement – Nexora Capital",
    type: "DOCX",
    category: "Contracts",
    size: "1.1 MB",
    lastModified: "2026-03-15",
    description: "Signed engagement letter covering advisory scope, fees, and exclusivity terms for the Nexora Capital mandate.",
  },
  {
    id: "3",
    title: "SEC Form S-1 Draft – TechBridge Inc.",
    type: "PDF",
    category: "Filings",
    size: "9.8 MB",
    lastModified: "2026-03-12",
    description: "Initial draft S-1 registration statement for TechBridge Inc. pending legal review before SEC submission.",
  },
  {
    id: "4",
    title: "Investor Outreach Email Templates",
    type: "DOCX",
    category: "Templates",
    size: "320 KB",
    lastModified: "2026-03-10",
    description: "Standardised email sequences for institutional and retail investor outreach during roadshow preparation.",
  },
  {
    id: "5",
    title: "Financial Model – Horizon Biotech",
    type: "XLSX",
    category: "Reports",
    size: "2.7 MB",
    lastModified: "2026-03-08",
    description: "Five-year DCF and comparable company analysis supporting the Horizon Biotech IPO valuation range.",
  },
  {
    id: "6",
    title: "Underwriting Agreement Template",
    type: "DOCX",
    category: "Templates",
    size: "890 KB",
    lastModified: "2026-03-05",
    description: "Standard-form underwriting agreement template reviewed by external counsel for use across mandates.",
  },
  {
    id: "7",
    title: "ASIC Prospectus Filing – VaultPay",
    type: "PDF",
    category: "Filings",
    size: "6.3 MB",
    lastModified: "2026-02-28",
    description: "Lodged prospectus for VaultPay Pty Ltd under the Corporations Act 2001 for the ASX listing.",
  },
  {
    id: "8",
    title: "Data Room Index – Meridian Logistics",
    type: "XLSX",
    category: "Contracts",
    size: "540 KB",
    lastModified: "2026-02-22",
    description: "Structured index of all due diligence materials uploaded to the virtual data room for Meridian Logistics.",
  },
];

const TYPE_COLORS: Record<DocType, string> = {
  PDF: "bg-red-500/10 text-red-400 border-red-500/20",
  XLSX: "bg-green-500/10 text-green-400 border-green-500/20",
  DOCX: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const CATEGORIES = ["All", "Reports", "Contracts", "Filings", "Templates"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const pageStats = [
  { label: "Total Documents", value: "8", icon: Folder },
  { label: "Added This Month", value: "5", icon: Calendar },
  { label: "Storage Used", value: "2.3 GB", subtext: "of 10 GB", icon: HardDrive },
];

export default function Documents() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const filtered = mockDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || doc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUpload = () => {
    toast({
      title: "Upload unavailable",
      description: "Upload feature requires backend integration.",
    });
  };

  const handleDownload = (doc: Document) => {
    toast({
      title: "Download initiated",
      description: `Preparing "${doc.title}" for download.`,
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
                <h1 className="text-3xl font-bold text-foreground">Documents</h1>
                <p className="text-muted-foreground mt-1">
                  Manage reports, contracts, filings and templates in one place.
                </p>
              </div>
              <Button onClick={handleUpload} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                        {stat.subtext && (
                          <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                        )}
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
                placeholder="Search documents..."
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
              <TabsList className="mb-6">
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
                      <FileText className="h-10 w-10 opacity-40" />
                      <p className="text-sm">No documents match your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filtered.map((doc) => (
                        <Card
                          key={doc.id}
                          className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors flex flex-col"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-5 w-5 text-primary shrink-0" />
                                <CardTitle className="text-base leading-snug line-clamp-2">
                                  {doc.title}
                                </CardTitle>
                              </div>
                              <Badge
                                variant="outline"
                                className={`shrink-0 text-xs font-semibold ${TYPE_COLORS[doc.type]}`}
                              >
                                {doc.type}
                              </Badge>
                            </div>
                            <CardDescription className="mt-1 line-clamp-2 text-xs">
                              {doc.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col justify-between gap-3">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" /> {doc.size}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />{" "}
                                {new Date(doc.lastModified).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {doc.category}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center gap-2 mt-1"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
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
