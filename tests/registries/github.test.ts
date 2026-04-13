import { GitHubRegistry } from "@/registries/github";
import type { GitHubSource } from "@/types";

let originalFetch: typeof globalThis.fetch;
const registry = new GitHubRegistry();

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("GitHubRegistry", () => {
  it("has name 'github'", () => {
    expect(registry.name).toBe("github");
  });

  it("resolves a version tag to a commit SHA", async () => {
    const sha = "abc123def456789";
    globalThis.fetch = jest.fn(async (url: string) => {
      if (url.includes("/commits/v1.0.0")) {
        return { ok: true, json: async () => ({ sha }) };
      }
      if (url.includes("/contents/")) {
        return {
          ok: true,
          json: async () => [
            { name: "SKILL.md", path: "skill/SKILL.md", type: "file", download_url: "https://example.com/SKILL.md" },
          ],
        };
      }
      if (url.includes("SKILL.md")) {
        return { ok: true, text: async () => "---\nname: test\ndescription: Test\n---\nBody" };
      }
      return { ok: false, status: 404 };
    }) as unknown as typeof fetch;

    const source: GitHubSource = {
      registry: "github",
      org: "acme",
      repo: "skills",
      path: "skill",
      version: "v1.0.0",
    };

    const result = await registry.fetch(source);
    expect(result.resolvedVersion).toBe(sha);
    expect(result.skillMd).toContain("name: test");
    expect(result.integrity).toMatch(/^sha256:/);
  });

  it("uses SHA directly when version is a commit SHA", async () => {
    const sha = "abc123def456";
    globalThis.fetch = jest.fn(async (url: string) => {
      if (url.includes("/contents/")) {
        return {
          ok: true,
          json: async () => [
            { name: "SKILL.md", path: "skill/SKILL.md", type: "file", download_url: "https://example.com/SKILL.md" },
          ],
        };
      }
      if (url.includes("SKILL.md")) {
        return { ok: true, text: async () => "---\nname: test\ndescription: Test\n---\nBody" };
      }
      return { ok: false, status: 404 };
    }) as unknown as typeof fetch;

    const source: GitHubSource = {
      registry: "github",
      org: "acme",
      repo: "skills",
      path: "skill",
      version: sha,
    };

    const result = await registry.fetch(source);
    expect(result.resolvedVersion).toBe(sha);
  });

  it("resolveLatest returns first semver tag", async () => {
    globalThis.fetch = jest.fn(async (url: string) => {
      if (url.includes("/tags")) {
        return {
          ok: true,
          json: async () => [
            { name: "v2.1.0", commit: { sha: "aaa" } },
            { name: "v1.0.0", commit: { sha: "bbb" } },
          ],
        };
      }
      return { ok: false, status: 404 };
    }) as unknown as typeof fetch;

    const latest = await registry.resolveLatest({
      registry: "github",
      org: "acme",
      repo: "skills",
      path: "skill",
    });
    expect(latest).toBe("v2.1.0");
  });

  it("resolveLatest falls back to HEAD SHA when no tags", async () => {
    globalThis.fetch = jest.fn(async (url: string) => {
      if (url.includes("/tags")) {
        return { ok: true, json: async () => [] };
      }
      if (url.includes("/commits/main")) {
        return { ok: true, json: async () => ({ sha: "0123456789abcdef" }) };
      }
      return { ok: false, status: 404 };
    }) as unknown as typeof fetch;

    const latest = await registry.resolveLatest({
      registry: "github",
      org: "acme",
      repo: "skills",
      path: "skill",
    });
    expect(latest).toBe("0123456789ab");
  });
});
