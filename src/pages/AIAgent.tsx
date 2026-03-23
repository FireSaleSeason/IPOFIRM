import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, MessageSquare, Settings2, Activity, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MOCK_RESPONSES = [
  "I'm analyzing your query against the latest entity database...",
  "Based on the latest data, I found 12 relevant companies matching your criteria.",
  "Would you like me to schedule an outreach campaign for these leads?",
  "I've identified 3 high-priority targets with a score above 85. Shall I prepare a summary report?",
  "Running sentiment analysis on recent news for the selected entities. This will take a moment.",
];

const RECENT_ACTIONS = [
  {
    id: "1",
    action: "Auto-replied to enquiry from Acme Capital",
    time: "2 minutes ago",
    type: "reply",
  },
  {
    id: "2",
    action: "Scheduled meeting with Horizon Ventures for 25 Mar",
    time: "18 minutes ago",
    type: "meeting",
  },
  {
    id: "3",
    action: "Sent follow-up to Bridgewater LP (Day 3 sequence)",
    time: "1 hour ago",
    type: "followup",
  },
  {
    id: "4",
    action: "Flagged negative sentiment in TechFund Inc news",
    time: "3 hours ago",
    type: "alert",
  },
  {
    id: "5",
    action: "Generated outreach summary for 8 new leads",
    time: "5 hours ago",
    type: "report",
  },
];

export default function AIAgent() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Communications Agent. I can help you analyse leads, schedule outreach, and manage investor communications. What would you like to do today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [agentConfig, setAgentConfig] = useState({
    autoRespond: true,
    meetingScheduling: true,
    followUpReminders: true,
    sentimentFiltering: false,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: MOCK_RESPONSES[responseIndex % MOCK_RESPONSES.length],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setResponseIndex((i) => i + 1);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">AI Communications Agent</h2>
              <p className="text-muted-foreground">
                AI-driven investor relations and communication automation
              </p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Response Rate", value: "94%", sub: "last 30 days" },
                { label: "Avg Response Time", value: "1.2s", sub: "median" },
                { label: "Meetings Booked", value: "23", sub: "this month" },
                { label: "Leads Converted", value: "8", sub: "this month" },
              ].map((m) => (
                <Card key={m.label} className="bg-card/70 border-border backdrop-blur-sm">
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-foreground">{m.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{m.label}</p>
                    <p className="text-xs text-muted-foreground/60">{m.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Interface */}
              <Card className="bg-card/70 border-border backdrop-blur-sm lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chat Interface
                  </CardTitle>
                  <CardDescription>Interact with your AI Communications Agent</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {/* Message History */}
                  <div className="h-80 overflow-y-auto space-y-3 p-3 rounded-lg bg-muted/10 border border-border/50">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            msg.role === "assistant"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">U</span>
                          )}
                        </div>
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === "assistant"
                              ? "bg-muted/40 text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.role === "assistant"
                                ? "text-muted-foreground"
                                : "text-primary-foreground/70"
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-muted/40 rounded-lg px-3 py-2 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Input */}
                  <div className="flex gap-2">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask the AI agent anything... (Enter to send)"
                      rows={2}
                      className="flex-1 resize-none rounded-md border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="self-end">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Agent Configuration */}
                <Card className="bg-card/70 border-border backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings2 className="w-4 h-4" />
                      Agent Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(
                      [
                        { key: "autoRespond", label: "Auto-respond to enquiries" },
                        { key: "meetingScheduling", label: "Meeting scheduling" },
                        { key: "followUpReminders", label: "Follow-up reminders" },
                        { key: "sentimentFiltering", label: "Sentiment filtering" },
                      ] as const
                    ).map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <Label className="text-sm cursor-pointer leading-tight">{label}</Label>
                        <Switch
                          checked={agentConfig[key]}
                          onCheckedChange={(v) => {
                            setAgentConfig((prev) => ({ ...prev, [key]: v }));
                            toast({
                              title: `${label} ${v ? "Enabled" : "Disabled"}`,
                              description: `Agent setting updated.`,
                            });
                          }}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent AI Actions */}
                <Card className="bg-card/70 border-border backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-4 h-4" />
                      Recent AI Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {RECENT_ACTIONS.map((action) => (
                        <div key={action.id} className="flex gap-3 items-start">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-foreground leading-snug">{action.action}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{action.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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
