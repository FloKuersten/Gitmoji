import { describe, expect, it } from "vitest";
import { isValidMapping } from "../dictionary";
import { parseWorkspaceMappings } from "../workspaceMappings";

const valid = { gitmoji: "🐛", keywords: ["fix"] };
describe("custom mapping metadata", () => {
  it.each([
    { category: 12 },
    { name: [] },
    { code: {} },
    { description: false },
    { tags: "broken" },
    { tags: [42] },
    { semver: "invalid" },
  ])("rejects unsafe picker metadata %j", (fields) => {
    expect(isValidMapping({ ...valid, ...fields })).toBe(false);
    expect(
      parseWorkspaceMappings({ mappings: [valid, { ...valid, ...fields }] })
    ).toEqual([valid]);
  });
  it("accepts complete metadata and optional null semver", () => {
    expect(
      isValidMapping({
        ...valid,
        code: ":bug:",
        name: "bug",
        category: "Quality",
        description: "Fix a defect",
        tags: ["repair"],
        semver: null,
      })
    ).toBe(true);
  });
});
