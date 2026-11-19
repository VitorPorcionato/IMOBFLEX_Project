import { describe, it, expect } from "vitest";
import { money, safeNext, dateTime } from "../../src/lib/format";
describe("public formatting and redirect boundaries", () => {
  it("preserves cents without concatenating prices", () => {
    expect(money("1250.90")).toContain("1.250,90");
  });
  it("rejects external and backslash redirects", () => {
    expect(safeNext("//example.com")).toBe("/imoveis");
    expect(safeNext("/\\example.com")).toBe("/imoveis");
    expect(safeNext("https://example.com")).toBe("/imoveis");
  });
  it("keeps valid post-login destination", () =>
    expect(safeNext("/imoveis/12")).toBe("/imoveis/12"));
  it("renders UTC as São Paulo time", () =>
    expect(dateTime("2026-10-20T15:00:00Z")).toContain("12:00"));
});
