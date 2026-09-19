import { describe, expect, it } from "vitest";
import {
  getBuiltInMappings,
  isValidMapping,
  mergeMappingLayers,
  mergeMappings,
} from "../dictionary";
import type { GitmojiMapping } from "../types";
import { parseWorkspaceMappings } from "../workspaceMappings";

describe("isValidMapping", () => {
  it("accepts a well-formed mapping", () => {
    expect(isValidMapping({ keywords: ["fix"], gitmoji: "🐛" })).toBe(true);
  });

  it("accepts an optional description", () => {
    expect(
      isValidMapping({ keywords: ["fix"], gitmoji: "🐛", description: "bug" })
    ).toBe(true);
  });

  it.each([
    [null, "null"],
    [undefined, "undefined"],
    ["fix", "a string"],
    [42, "a number"],
    [{ keywords: ["fix"] }, "a missing emoji"],
    [{ gitmoji: "🐛" }, "missing keywords"],
    [{ keywords: [], gitmoji: "🐛" }, "an empty keyword list"],
    [{ keywords: ["fix"], gitmoji: "" }, "an empty emoji"],
    [{ keywords: ["fix"], gitmoji: "   " }, "a whitespace emoji"],
    [{ keywords: [""], gitmoji: "🐛" }, "an empty keyword"],
    [{ keywords: [1], gitmoji: "🐛" }, "a non-string keyword"],
    [{ keywords: "fix", gitmoji: "🐛" }, "keywords that are not an array"],
  ])("rejects %s (%s)", (value, _label) => {
    expect(isValidMapping(value)).toBe(false);
  });
});

describe("getBuiltInMappings", () => {
  it("returns the bundled dictionary", () => {
    const mappings = getBuiltInMappings();
    expect(mappings.length).toBeGreaterThan(10);
    expect(mappings.every((m) => isValidMapping(m))).toBe(true);
  });
});

describe("mergeMappings", () => {
  const builtIn: GitmojiMapping[] = [
    { keywords: ["fix", "bug"], gitmoji: "🐛" },
    { keywords: ["feat"], gitmoji: "✨" },
  ];

  it("returns the built-in list sorted by longest keyword", () => {
    const merged = mergeMappings(builtIn, []);
    expect(merged).toHaveLength(2);
    expect(merged[0].keywords[0]).toBe("feat");
  });

  it("lets a custom mapping override a built-in keyword", () => {
    const merged = mergeMappings(builtIn, [
      { keywords: ["fix"], gitmoji: "🔨" },
    ]);

    const fix = merged.find((m) => m.keywords.includes("fix"));
    expect(fix?.gitmoji).toBe("🔨");
  });

  it("keeps the untouched keywords of a partially overridden mapping", () => {
    const merged = mergeMappings(builtIn, [
      { keywords: ["fix"], gitmoji: "🔨" },
    ]);

    const bug = merged.find((m) => m.keywords.includes("bug"));
    expect(bug?.gitmoji).toBe("🐛");
  });

  it("overrides case-insensitively", () => {
    const merged = mergeMappings(builtIn, [
      { keywords: ["FIX"], gitmoji: "🔨" },
    ]);

    const remaining = merged.filter((m) =>
      m.keywords.some((k) => k.toLowerCase() === "fix")
    );
    expect(remaining).toHaveLength(1);
    expect(remaining[0].gitmoji).toBe("🔨");
  });

  it("drops a built-in mapping whose keywords are fully overridden", () => {
    const merged = mergeMappings(builtIn, [
      { keywords: ["fix", "bug"], gitmoji: "🔨" },
    ]);

    expect(merged.filter((m) => m.gitmoji === "🐛")).toHaveLength(0);
  });

  it("adds brand-new custom keywords", () => {
    const merged = mergeMappings(builtIn, [
      { keywords: ["ship"], gitmoji: "🚢" },
    ]);

    expect(merged.find((m) => m.keywords.includes("ship"))?.gitmoji).toBe("🚢");
    expect(merged).toHaveLength(3);
  });

  it("does not mutate the built-in list", () => {
    mergeMappings(builtIn, [{ keywords: ["fix"], gitmoji: "🔨" }]);
    expect(builtIn[0].keywords).toEqual(["fix", "bug"]);
  });
});

describe("mergeMappingLayers", () => {
  it("applies later layers over earlier ones", () => {
    const layers = mergeMappingLayers(
      [{ keywords: ["fix"], gitmoji: "🐛" }],
      [{ keywords: ["fix"], gitmoji: "🚑" }],
      [{ keywords: ["fix"], gitmoji: "🔨" }]
    );
    expect(layers.find((m) => m.keywords.includes("fix"))?.gitmoji).toBe("🔨");
  });

  it("keeps keywords from earlier layers that were not overridden", () => {
    const layers = mergeMappingLayers(
      [
        { keywords: ["fix", "bug"], gitmoji: "🐛" },
        { keywords: ["feat"], gitmoji: "✨" },
      ],
      [{ keywords: ["fix"], gitmoji: "🔨" }]
    );
    expect(layers.find((m) => m.keywords.includes("bug"))?.gitmoji).toBe("🐛");
    expect(layers.find((m) => m.keywords.includes("feat"))?.gitmoji).toBe("✨");
  });
});

describe("parseWorkspaceMappings", () => {
  it("accepts a mappings object", () => {
    const parsed = parseWorkspaceMappings({
      mappings: [{ keywords: ["ship"], gitmoji: "🚢" }],
    });
    expect(parsed).toHaveLength(1);
    expect(parsed[0].gitmoji).toBe("🚢");
  });

  it("accepts customMappings and a bare array", () => {
    expect(
      parseWorkspaceMappings({
        customMappings: [{ keywords: ["wip"], gitmoji: "🏗️" }],
      })
    ).toHaveLength(1);
    expect(
      parseWorkspaceMappings([{ keywords: ["wip"], gitmoji: "🏗️" }])
    ).toHaveLength(1);
  });

  it("drops invalid entries", () => {
    expect(
      parseWorkspaceMappings({
        mappings: [
          { keywords: ["ok"], gitmoji: "✅" },
          { keywords: [], gitmoji: "❌" },
          { gitmoji: "❌" },
        ],
      })
    ).toHaveLength(1);
  });
});
