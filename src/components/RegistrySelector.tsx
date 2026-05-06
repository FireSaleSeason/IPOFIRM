import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, Globe, Building2, FileText } from "lucide-react";
import { useTriggerScrape, type Registry } from "@/hooks/useScraper";

const REGISTRIES: {
  id: Registry;
  label: string;
  sub: string;
  icon: React.ReactNode;
  flag: string;
  color: string;
}[] = [
  {
    id: "CH",
    label: "Companies House",
    sub: "United Kingdom",
    icon: <Building2 size={18} />,
    flag: "🇬🇧",
    color: "#4f72e3",
  },
  {
    id: "GLEIF",
    label: "GLEIF",
    sub: "Global (LEI)",
    icon: <Globe size={18} />,
    flag: "🌐",
    color: "#22c55e",
  },
  {
    id: "EDGAR",
    label: "SEC EDGAR",
    sub: "United States",
    icon: <FileText size={18} />,
    flag: "🇺🇸",
    color: "#d4af37",
  },
  {
    id: "ASIC",
    label: "ASIC / ABN",
    sub: "Australia",
    icon: <Building2 size={18} />,
    flag: "🇦🇺",
    color: "#f59e0b",
  },
];

export default function RegistrySelector() {
  const [selected, setSelected] = useState<Registry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { trigger, isLoading, error } = useTriggerScrape();

  const handleLaunch = async () => {
    if (!selected || !searchTerm.trim()) return;
    await trigger(selected, searchTerm.trim());
    setSearchTerm("");
  };

  return (
    <div className="space-y-5">
      {/* Registry grid */}
      <div className="grid grid-cols-2 gap-3">
        {REGISTRIES.map((reg, i) => (
          <motion.button
            key={reg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(reg.id)}
            className="relative p-4 rounded-xl text-left border transition-all duration-200 overflow-hidden group"
            style={{
              background:
                selected === reg.id
                  ? `${reg.color}18`
                  : "rgba(255,255,255,0.03)",
              borderColor:
                selected === reg.id ? `${reg.color}60` : "rgba(255,255,255,0.07)",
            }}
          >
            {/* Selected indicator */}
            <AnimatePresence>
              {selected === reg.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                  style={{ background: reg.color }}
                />
              )}
            </AnimatePresence>

            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${reg.color}20`, color: reg.color }}
            >
              {reg.icon}
            </div>
            <div className="text-sm font-semibold text-white/90 leading-tight">
              {reg.flag} {reg.label}
            </div>
            <div className="text-xs text-white/35 mt-0.5 tracking-wide">{reg.sub}</div>
          </motion.button>
        ))}
      </div>

      {/* Search input */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLaunch()}
                placeholder={`Search ${selected} registry…`}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white/90 placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(212,175,55,0.2)",
                }}
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Launch button */}
      <motion.button
        whileHover={!isLoading && selected && searchTerm ? { scale: 1.02 } : {}}
        whileTap={!isLoading && selected && searchTerm ? { scale: 0.98 } : {}}
        onClick={handleLaunch}
        disabled={!selected || !searchTerm.trim() || isLoading}
        className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background:
            selected && searchTerm && !isLoading
              ? "linear-gradient(135deg, #d4af37, #f59e0b)"
              : "rgba(212,175,55,0.15)",
          color: selected && searchTerm && !isLoading ? "#04080f" : "#d4af37",
          boxShadow:
            selected && searchTerm && !isLoading
              ? "0 0 24px rgba(212,175,55,0.3)"
              : "none",
        }}
      >
        {isLoading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block"
            />
            Launching…
          </>
        ) : (
          <>
            <Zap size={15} />
            Launch Scrape
          </>
        )}
      </motion.button>
    </div>
  );
}
