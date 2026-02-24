import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "purple";
}

export const KPICard = ({ title, value, subtitle, icon: Icon, variant = "default" }: KPICardProps) => {
  const variantStyles = {
    default: "from-primary/15 to-primary/5 text-primary",
    success: "from-success/15 to-success/5 text-success",
    warning: "from-muted to-muted/50 text-muted-foreground",
    purple: "from-primary-glow/15 to-primary-glow/5 text-primary-glow",
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-card border border-border p-6 backdrop-blur-sm">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${variantStyles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
