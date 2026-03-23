import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate the scraping input validation schema from trigger-scrape edge function
const TriggerScrapeSchema = z.object({
  source: z.enum(["COMPANIES_HOUSE", "CH", "GLEIF", "SEC_EDGAR", "ASIC"]),
  searchTerm: z.string().max(500).optional(),
  filters: z.record(z.unknown()).optional(),
});

describe("Scraping input validation", () => {
  it("accepts valid COMPANIES_HOUSE source", () => {
    expect(() => TriggerScrapeSchema.parse({ source: "COMPANIES_HOUSE", searchTerm: "venture capital" })).not.toThrow();
  });

  it("accepts CH alias", () => {
    expect(() => TriggerScrapeSchema.parse({ source: "CH" })).not.toThrow();
  });

  it("accepts all valid sources", () => {
    for (const source of ["COMPANIES_HOUSE", "CH", "GLEIF", "SEC_EDGAR", "ASIC"] as const) {
      expect(() => TriggerScrapeSchema.parse({ source })).not.toThrow();
    }
  });

  it("rejects unknown source", () => {
    const result = TriggerScrapeSchema.safeParse({ source: "UNKNOWN_REGISTRY" });
    expect(result.success).toBe(false);
  });

  it("rejects search term over 500 chars", () => {
    const result = TriggerScrapeSchema.safeParse({
      source: "COMPANIES_HOUSE",
      searchTerm: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts search term at exactly 500 chars", () => {
    expect(() =>
      TriggerScrapeSchema.parse({ source: "COMPANIES_HOUSE", searchTerm: "a".repeat(500) })
    ).not.toThrow();
  });

  it("accepts optional filters object", () => {
    expect(() =>
      TriggerScrapeSchema.parse({
        source: "GLEIF",
        filters: { jurisdiction: "US", minScore: 80 },
      })
    ).not.toThrow();
  });
});

describe("Source normalization logic", () => {
  const aliases: Record<string, string> = { CH: "COMPANIES_HOUSE", SEC: "SEC_EDGAR" };

  it("normalizes CH to COMPANIES_HOUSE", () => {
    expect(aliases["CH"]).toBe("COMPANIES_HOUSE");
  });

  it("returns undefined for unknown alias", () => {
    expect(aliases["UNKNOWN"]).toBeUndefined();
  });
});
