import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useFilteringAudit, useFilteringStats } from "@/hooks/useFilteringAudit";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ScoringLegend } from "@/components/ScoringLegend";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Search, TrendingDown, TrendingUp, ArrowLeft, Shield, FileText } from "lucide-react";
import { format } from "date-fns";

export default function SentimentMonitor() {
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState(7);
  const [testCompany, setTestCompany] = useState("");
  const [testArticleText, setTestArticleText] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  
  const { data: auditRecords, refetch } = useFilteringAudit(selectedDays);
  const { data: stats } = useFilteringStats(selectedDays);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('filtering-audit-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'filtering_audit'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleTestCompany = async () => {
    if (!testCompany.trim()) return;
    
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-sentiment', {
        body: { 
          companyName: testCompany,
          articleText: testArticleText.trim() || undefined 
        }
      });

      if (error) throw error;
      setTestResult(data);
      toast.success("Sentiment analysis complete");
    } catch (error: any) {
      toast.error("Failed to test sentiment: " + error.message);
    } finally {
      setTesting(false);
    }
  };

  const blockedCompanies = auditRecords?.filter(r => r.blocked) || [];
  const negativeBlocks = blockedCompanies.filter(r => r.filter_type === 'negative_press');

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/overview")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sentiment Monitor</h1>
            <p className="text-muted-foreground">Track and tune negative press filtering</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 7, 30].map(days => (
            <Button
              key={days}
              variant={selectedDays === days ? "default" : "outline"}
              onClick={() => setSelectedDays(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Scoring System Legend */}
      <ScoringLegend />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Processed</p>
              <p className="text-3xl font-bold text-foreground">{stats?.total || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Blocked</p>
              <p className="text-3xl font-bold text-foreground">{stats?.blocked || 0}</p>
              {(stats?.blocked || 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Requires review</p>
              )}
            </div>
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Block Rate</p>
              <p className="text-3xl font-bold text-foreground">
                {stats?.blockRate.toFixed(1) || 0}%
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Negative Press Blocks</p>
              <p className="text-3xl font-bold text-foreground">{negativeBlocks.length}</p>
              {negativeBlocks.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No issues detected</p>
              )}
            </div>
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Test Company */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Company Sentiment</h2>
        <div className="space-y-4">
          <Input
            placeholder="Enter company name..."
            value={testCompany}
            onChange={(e) => setTestCompany(e.target.value)}
          />
          <Textarea
            placeholder="Article text (optional - paste article content or description for more accurate scoring)"
            value={testArticleText}
            onChange={(e) => setTestArticleText(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <Button onClick={handleTestCompany} disabled={testing}>
            <Search className="w-4 h-4 mr-2" />
            {testing ? "Testing..." : "Test"}
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={testResult.wouldBlock ? "destructive" : "default"}>
                {testResult.wouldBlock ? "WOULD BLOCK" : "WOULD PASS"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Score: {testResult.negativeScore.toFixed(3)} | Threshold: {testResult.threshold}
              </span>
            </div>

            {testResult.articles.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Articles Found ({testResult.articles.length})</h3>
                {testResult.articles.map((article: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline"
                        >
                          {article.title}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">{article.snippet}</p>
                      </div>
                      <Badge variant={article.score >= testResult.threshold ? "destructive" : "secondary"}>
                        {article.score.toFixed(3)}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Recent Blocks Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recently Blocked Companies</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Filter Type</TableHead>
              <TableHead>Sentiment Score</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Top Article</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blockedCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No blocked companies in the last {selectedDays} days
                </TableCell>
              </TableRow>
            ) : (
              blockedCompanies.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.company_name}</TableCell>
                  <TableCell>
                    <Badge variant={record.filter_type === 'negative_press' ? 'destructive' : 'secondary'}>
                      {record.filter_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.sentiment_score !== null ? record.sentiment_score.toFixed(3) : 'N/A'}
                  </TableCell>
                  <TableCell>{record.articles_found || 0}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.top_article_title || 'N/A'}
                  </TableCell>
                  <TableCell>{format(new Date(record.created_at), 'MMM d, HH:mm')}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCompany(record)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCompany?.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Filter Type</p>
                <Badge>{selectedCompany?.filter_type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentiment Score</p>
                <p className="font-semibold">
                  {selectedCompany?.sentiment_score?.toFixed(3) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Articles Found</p>
                <p className="font-semibold">{selectedCompany?.articles_found || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {selectedCompany && format(new Date(selectedCompany.created_at), 'PPpp')}
                </p>
              </div>
            </div>

            {selectedCompany?.top_article_title && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Negative Article</p>
                <Card className="p-4">
                  <p className="font-medium">{selectedCompany.top_article_title}</p>
                  {selectedCompany.top_article_url && (
                    <a
                      href={selectedCompany.top_article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Article →
                    </a>
                  )}
                </Card>
              </div>
            )}

            {selectedCompany?.decision_details && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Decision Details</p>
                <Card className="p-4 bg-muted">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(selectedCompany.decision_details, null, 2)}
                  </pre>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}