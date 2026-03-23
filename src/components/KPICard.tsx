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
    default: "from-primary/20 to-primary/5 text-primary border-primary/20",
    success: "from-success/20 to-success/5 text-success border-success/20",
    warning: "from-accent/20 to-accent/5 text-accent border-accent/20",
    purple: "from-primary-glow/20 to-primary-glow/5 text-primary-glow border-primary-glow/20",
  };

  const glowColors = {
    default: "rgba(26, 143, 255, 0.12)",
    success: "rgba(52, 199, 123, 0.12)",
    warning: "rgba(240, 180, 41, 0.12)",
    purple: "rgba(100, 180, 255, 0.12)",
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-card border border-border/60 p-6 card-3d shadow-depth group"
      style={{ "--glow-color": glowColors[variant] } as React.CSSProperties}
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-80" />

      {/* Background depth gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20 pointer-events-none" />

      {/* Corner glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: glowColors[variant] }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground/80">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br border ${variantStyles[variant]} shadow-depth-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
