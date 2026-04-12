import { getRegistry } from "@/registries/index";

describe("getRegistry", () => {
  it("returns GitHub registry for 'github'", () => {
    const registry = getRegistry("github");
    expect(registry.name).toBe("github");
  });

  it("returns ClawHub registry for 'clawhub'", () => {
    const registry = getRegistry("clawhub");
    expect(registry.name).toBe("clawhub");
  });

  it("throws for unknown registry name", () => {
    expect(() => getRegistry("unknown")).toThrow(/Unknown skill registry/);
  });
});
