import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (classnames utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates tailwind classes", () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("base", undefined, null as unknown as string)).toBe("base");
  });
});
