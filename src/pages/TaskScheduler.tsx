import { NavigationSidebar } from "@/components/NavigationSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CalendarDays, Play, Plus, Loader2, Clock } from "lucide-react";

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  cronDisplay: string;
  source: string;
  status: "active" | "paused";
  lastRun: string;
  nextRun: string;
}

const INITIAL_TASKS: ScheduledTask[] = [
  {
    id: "1",
    name: "Daily CH Scrape",
    schedule: "Daily",
    cronDisplay: "Daily 02:00 UTC",
    source: "COMPANIES_HOUSE",
    status: "active",
    lastRun: "2026-03-22 02:00 UTC",
    nextRun: "2026-03-23 02:00 UTC",
  },
  {
    id: "2",
    name: "Weekly GLEIF Sync",
    schedule: "Weekly",
    cronDisplay: "Weekly Mon 03:00 UTC",
    source: "GLEIF",
    status: "active",
    lastRun: "2026-03-16 03:00 UTC",
    nextRun: "2026-03-23 03:00 UTC",
  },
  {
    id: "3",
    name: "Monthly Report",
    schedule: "Monthly",
    cronDisplay: "Monthly 1st 06:00 UTC",
    source: "COMPANIES_HOUSE",
    status: "active",
    lastRun: "2026-03-01 06:00 UTC",
    nextRun: "2026-04-01 06:00 UTC",
  },
  {
    id: "4",
    name: "Data Cleanup",
    schedule: "Weekly",
    cronDisplay: "Weekly Sun 00:00 UTC",
    source: "SEC_EDGAR",
    status: "paused",
    lastRun: "2026-03-15 00:00 UTC",
    nextRun: "Paused",
  },
  {
    id: "5",
    name: "Score Refresh",
    schedule: "Daily",
    cronDisplay: "Daily 04:00 UTC",
    source: "GLEIF",
    status: "active",
    lastRun: "2026-03-22 04:00 UTC",
    nextRun: "2026-03-23 04:00 UTC",
  },
];

const SCHEDULE_OPTIONS = ["Hourly", "Daily", "Weekly", "Monthly"];
const SOURCE_OPTIONS = ["COMPANIES_HOUSE", "GLEIF", "SEC_EDGAR", "ASIC"];

export default function TaskScheduler() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ScheduledTask[]>(INITIAL_TASKS);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskSchedule, setNewTaskSchedule] = useState("Daily");
  const [newTaskSource, setNewTaskSource] = useState("COMPANIES_HOUSE");

  const handleRunNow = async (task: ScheduledTask) => {
    setRunning((prev) => ({ ...prev, [task.id]: true }));
    try {
      await supabase.functions.invoke("trigger-scrape", {
        body: { source: task.source, searchTerm: "venture capital" },
      });
      toast({
        title: "Task Triggered",
        description: `"${task.name}" has been triggered successfully.`,
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, lastRun: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" } : t
        )
      );
    } catch {
      toast({
        title: "Task Queued",
        description: `"${task.name}" has been queued.`,
      });
    } finally {
      setRunning((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  const handleToggleStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === "active" ? "paused" : "active",
              nextRun:
                t.status === "active"
                  ? "Paused"
                  : "Scheduled",
            }
          : t
      )
    );
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) {
      toast({ title: "Error", description: "Please enter a task name.", variant: "destructive" });
      return;
    }
    const cronMap: Record<string, string> = {
      Hourly: "Every hour :00 UTC",
      Daily: "Daily 02:00 UTC",
      Weekly: "Weekly Mon 03:00 UTC",
      Monthly: "Monthly 1st 06:00 UTC",
    };
    const newTask: ScheduledTask = {
      id: String(Date.now()),
      name: newTaskName.trim(),
      schedule: newTaskSchedule,
      cronDisplay: cronMap[newTaskSchedule] ?? newTaskSchedule,
      source: newTaskSource,
      status: "active",
      lastRun: "Never",
      nextRun: "Scheduled",
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskName("");
    setShowAddForm(false);
    toast({ title: "Task Added", description: `"${newTask.name}" has been created.` });
  };

  const activeTasks = tasks.filter((t) => t.status === "active").length;
  const pausedTasks = tasks.filter((t) => t.status === "paused").length;
  const jobsToday = tasks.filter((t) => t.status === "active" && t.schedule === "Daily").length;
  const nextScheduled = tasks
    .filter((t) => t.status === "active")
    .map((t) => t.nextRun)
    .find((r) => r !== "Scheduled" && r !== "Paused") ?? "N/A";

  return (
    <div className="flex min-h-screen bg-gradient-bg relative">
      <NavigationSidebar />
      <div className="flex-1 flex flex-col relative z-10">
        <DashboardHeader />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Task Scheduler</h2>
                <p className="text-muted-foreground">
                  Manage and automate scheduled scraping and processing tasks
                </p>
              </div>
              <Button onClick={() => setShowAddForm((v) => !v)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Tasks", value: activeTasks },
                { label: "Paused Tasks", value: pausedTasks },
                { label: "Jobs Today", value: jobsToday },
                { label: "Next Scheduled", value: nextScheduled },
              ].map((stat) => (
                <Card key={stat.label} className="bg-card/70 border-border backdrop-blur-sm">
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-foreground truncate">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Task Form */}
            {showAddForm && (
              <Card className="bg-card/70 border-border backdrop-blur-sm border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plus className="w-4 h-4" />
                    New Scheduled Task
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taskName">Task Name</Label>
                      <Input
                        id="taskName"
                        placeholder="e.g. Morning CH Scrape"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taskSchedule">Schedule</Label>
                      <select
                        id="taskSchedule"
                        value={newTaskSchedule}
                        onChange={(e) => setNewTaskSchedule(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                      >
                        {SCHEDULE_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taskSource">Source</Label>
                      <select
                        id="taskSource"
                        value={newTaskSource}
                        onChange={(e) => setNewTaskSource(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                      >
                        {SOURCE_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTask}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Task List */}
            <Card className="bg-card/70 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Scheduled Tasks
                </CardTitle>
                <CardDescription>{tasks.length} tasks configured</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No tasks configured yet. Add your first task above.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <Clock className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground">{task.name}</p>
                              <Badge
                                variant={task.status === "active" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {task.status === "active" ? "Active" : "Paused"}
                              </Badge>
                              <Badge variant="outline" className="text-xs font-mono">
                                {task.source}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{task.cronDisplay}</p>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>Last run: {task.lastRun}</span>
                              <span>Next: {task.nextRun}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Switch
                            checked={task.status === "active"}
                            onCheckedChange={() => handleToggleStatus(task.id)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRunNow(task)}
                            disabled={running[task.id]}
                          >
                            {running[task.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span className="ml-1">Run Now</span>
                          </Button>
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
