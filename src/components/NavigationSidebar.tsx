import { Database, Globe, Sliders, Download, Settings, LogOut, User, Grid, ChevronDown, Users, Bot, Megaphone, BarChart3, Briefcase, ShieldCheck, FolderLock, Target, Activity, BookOpen, GitBranch, LineChart, MoreVertical, Cog, Layers, Brain, Library, GitMerge, BarChart2, MessagesSquare, CalendarDays, Lock, Gauge, ChevronRight, LayoutDashboard, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "react-router-dom";
import logoImage from "@/assets/vc-logo-custom.jpeg";
import adminAvatar from "@/assets/admin-avatar.webp";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { name: "Overview", icon: Grid, path: "/overview" },
  { name: "Data Sources", icon: Globe, path: "/data-sources" },
  { name: "Sentiment Monitor", icon: TrendingUp, path: "/sentiment-monitor" },
  { name: "Marketing & Analytics", icon: BarChart3, path: "/marketing" },
  { name: "Rules & Scoring", icon: Sliders, path: "/rules-scoring" },
  { name: "Exports", icon: Download, path: "/exports" },
  { name: "User Management", icon: Users, path: "/users" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export const NavigationSidebar = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { signOut } = useAuth();

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <aside className="w-[220px] h-screen bg-sidebar flex flex-col sticky top-0 shadow-sidebar z-20">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md" />
            <img src={logoImage} alt="VC Scraper Bot Logo" className="relative w-10 h-10 object-contain rounded-lg" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">VC Scraper Bot</h1>
            <p className="text-[10px] text-primary/70 font-medium tracking-widest uppercase">Entity Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name);
          const isChildActive = hasChildren && item.children.some(child => location.pathname === child.path);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive || isChildActive
                        ? "nav-item-active font-medium"
                        : item.name === "ANDREW'S EXTRAS"
                        ? "text-red-400 hover:bg-sidebar-accent/60"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs flex-1 text-left">{item.name}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-sidebar-border/40 pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildItemActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.name}
                            to={child.path}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                              isChildItemActive
                                ? "nav-item-active font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                            }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "nav-item-active font-medium"
                      : item.name === "ANDREW'S EXTRAS"
                      ? "text-red-400 hover:bg-sidebar-accent/60"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{item.name}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Profile Dropdown */}
      <div className="p-3 border-t border-sidebar-border/60 bg-gradient-to-t from-black/20 to-transparent">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-sidebar-accent/60 transition-all duration-200 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/15 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                <Avatar className="relative w-8 h-8">
                  <AvatarImage src={adminAvatar} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">AD</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">Administration</p>
                <p className="text-[10px] text-muted-foreground truncate">admin@vc.com</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
