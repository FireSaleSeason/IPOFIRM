import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const DashboardHeader = () => {
  return (
    <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-depth-sm">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex items-center justify-between px-8 py-3">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by company name, registry ID, or country"
              className="pl-10 h-9 bg-background/60 border-border/60 focus:border-primary/50 focus:ring-primary/20 text-sm placeholder:text-muted-foreground/60 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="relative w-9 h-9 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full shadow-glow-blue" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="w-9 h-9 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
