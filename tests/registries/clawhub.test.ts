import { ClawHubRegistry } from "@/registries/clawhub";
import type { ClawHubSource } from "@/types";

let originalFetch: typeof globalThis.fetch;
const registry = new ClawHubRegistry();

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("ClawHubRegistry", () => {
  it("has name 'clawhub'", () => {
    expect(registry.name).toBe("clawhub");
  });

  it("fetches a skill by slug and version", async () => {
    const fetchCalls: string[] = [];
    globalThis.fetch = jest.fn(async (url: string) => {
      fetchCalls.push(url);
      const decoded = decodeURIComponent(url);
      if (decoded.includes("/api/v1/skills/author/my-skill?version=")) {
        return {
          ok: true,
          json: async () => ({
            slug: "author/my-skill",
            files: [
              { path: "SKILL.md", size: 100 },
              { path: "rules/rule1.md", size: 50 },
            ],
          }),
        };
      }
      if (decoded.includes("/file") && decoded.includes("path=SKILL.md")) {
        return { ok: true, text: async () => "---\nname: my-skill\ndescription: A skill\n---\nBody" };
      }
      if (decoded.includes("/file") && decoded.includes("path=rules/rule1.md")) {
        return { ok: true, text: async () => "Rule content" };
      }
      return { ok: false, status: 404, text: async () => "not found" };
    }) as unknown as typeof fetch;

    const source: ClawHubSource = {
      registry: "clawhub",
      slug: "author/my-skill",
      version: "3.0.0",
    };

    const result = await registry.fetch(source);
    expect(result.resolvedVersion).toBe("3.0.0");
    expect(result.skillMd).toContain("name: my-skill");
    expect(result.supportingFiles).toHaveLength(1);
    expect(result.supportingFiles[0].path).toBe("rules/rule1.md");
    expect(result.integrity).toMatch(/^sha256:/);
  });

  it("resolveLatest returns the latest version", async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        slug: "author/my-skill",
        latestVersion: "4.0.0",
        versions: [{ version: "4.0.0" }, { version: "3.0.0" }],
      }),
    })) as unknown as typeof fetch;

    const latest = await registry.resolveLatest({
      registry: "clawhub",
      slug: "author/my-skill",
    });
    expect(latest).toBe("4.0.0");
  });

  it("resolveLatest falls back to first version entry", async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        slug: "author/my-skill",
        versions: [{ version: "2.0.0" }, { version: "1.0.0" }],
      }),
    })) as unknown as typeof fetch;

    const latest = await registry.resolveLatest({
      registry: "clawhub",
      slug: "author/my-skill",
    });
    expect(latest).toBe("2.0.0");
  });

  it("throws when no versions found", async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ slug: "author/no-versions" }),
    })) as unknown as typeof fetch;

    await expect(
      registry.resolveLatest({ registry: "clawhub", slug: "author/no-versions" })
    ).rejects.toThrow(/No versions found/);
  });
});
