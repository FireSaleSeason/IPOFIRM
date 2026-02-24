import gleifLogo from "@/assets/gleif-logo.png";
import hkIcrisLogo from "@/assets/hk-icris-logo.png";
import ukCompaniesHouseLogo from "@/assets/uk-companies-house-logo.png";

interface DataSource {
  id: string;
  name: string;
  flag?: string;
  icon?: string;
  enabled: boolean;
  comingSoon?: boolean;
}

const dataSources: DataSource[] = [
  { id: "CH", name: "UK Companies House", icon: ukCompaniesHouseLogo, enabled: true },
  { id: "gleif", name: "LEI Number", icon: gleifLogo, enabled: true },
  { id: "hk", name: "Hong Kong ICRIS", icon: hkIcrisLogo, enabled: false, comingSoon: true },
  { id: "asic", name: "ASIC (Australia)", flag: "🇦🇺", enabled: false, comingSoon: true },
];

interface DataSourceGridProps {
  selectedSource: string;
  onSelectSource: (id: string) => void;
}

export const DataSourceGrid = ({ selectedSource, onSelectSource }: DataSourceGridProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Select Data Source</h3>
      <div className="grid grid-cols-2 gap-3">
        {dataSources.map((source) => (
          <button
            key={source.id}
            onClick={() => !source.comingSoon && onSelectSource(source.id)}
            disabled={source.comingSoon}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              selectedSource === source.id
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                : source.comingSoon
                ? "border-border bg-muted/50 opacity-40 cursor-not-allowed grayscale"
                : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center gap-3">
              {source.icon ? (
                <img src={source.icon} alt={source.name} className="w-14 h-14 object-contain" />
              ) : (
                <span className="text-5xl">{source.flag}</span>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{source.name}</p>
                {source.comingSoon && (
                  <p className="text-xs text-muted-foreground mt-1">Coming Soon</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
