import { mkdtemp, readFile, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { runAdd, runAddCommand, runAddTool } from "@/commands/add";

let tempDir: string;
let originalFetch: typeof globalThis.fetch;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-add-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
  originalFetch = globalThis.fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await rm(tempDir, { recursive: true, force: true });
});

async function setupConfig(dir: string) {
  await mkdir(join(dir, ".agsync", "skills"), { recursive: true });
  await mkdir(join(dir, ".agsync", "tools"), { recursive: true });
  await writeFile(
    join(dir, "agsync.yaml"),
    toYaml({
      version: "1",
      features: { instructions: true, skills: true, commands: true, mcp: true },
      agents: {},
      skills: [{ path: ".agsync/skills/*" }],
      commands: [],
      tools: [],
    })
  );
}

describe("runAdd", () => {
  it("creates a local empty skill when given a plain name", async () => {
    await setupConfig(tempDir);
    const files = await runAdd(tempDir, "my-skill", "");

    expect(files).toHaveLength(1);
    expect(files[0]).toContain("my-skill");
    expect(files[0]).toContain("SKILL.md");

    const content = await readFile(files[0], "utf-8");
    expect(content).toContain("name: my-skill");
    expect(content).toContain("description:");
    expect(content).not.toContain("source:");
  });

  it("creates a local skill with name override", async () => {
    await setupConfig(tempDir);
    const files = await runAdd(tempDir, "original", "custom-name");

    expect(files).toHaveLength(1);
    const content = await readFile(files[0], "utf-8");
    expect(content).toContain("name: custom-name");
  });

  it("finds nearest config when run from a subdirectory", async () => {
    await setupConfig(tempDir);
    const subDir = join(tempDir, "src", "components");
    await mkdir(subDir, { recursive: true });

    const files = await runAdd(subDir, "deep-skill", "");

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(join(tempDir, ".agsync", "skills", "deep-skill"));
  });

  it("finds nearest config when run from inside .agsync", async () => {
    await setupConfig(tempDir);
    const insideAgsync = join(tempDir, ".agsync", "skills");

    const files = await runAdd(insideAgsync, "from-inside", "");

    expect(files).toHaveLength(1);
    expect(files[0]).toContain(join(tempDir, ".agsync", "skills", "from-inside"));
    expect(files[0]).not.toContain(".agsync/.agsync");
  });

  it("throws when no .agsync/ or agsync.yaml is found", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "agsync-no-config-"));
    await expect(runAdd(emptyDir, "test", "")).rejects.toThrow(/agsync.yaml/);
    await rm(emptyDir, { recursive: true, force: true });
  });

  it("adds skill to nearest .agsync/ in subfolder", async () => {
    await setupConfig(tempDir);
    const subDir = join(tempDir, "frontend");
    await mkdir(join(subDir, ".agsync", "skills"), { recursive: true });

    const files = await runAdd(subDir, "sub-skill", "");
    expect(files).toHaveLength(1);
    expect(files[0]).toContain(join(subDir, ".agsync", "skills", "sub-skill"));
  });

  it("parses github: prefix and fetches from registry", async () => {
    await setupConfig(tempDir);

    const commitSha = "abc123def456";
    globalThis.fetch = jest.fn(async (url: string) => {
      if (url.includes("/commits/v1.0.0")) {
        return { ok: true, json: async () => ({ sha: commitSha }) };
      }
      if (url.includes("/contents/")) {
        return {
          ok: true,
          json: async () => [
            { name: "SKILL.md", path: "my-skill/SKILL.md", type: "file", download_url: "https://example.com/SKILL.md" },
          ],
        };
      }
      if (url.includes("SKILL.md")) {
        return { ok: true, text: async () => "---\nname: remote-skill\ndescription: From GitHub\n---\nBody" };
      }
      return { ok: false, status: 404 };
    }) as unknown as typeof fetch;

    const files = await runAdd(tempDir, "github:acme/skills/my-skill@v1.0.0", "");

    expect(files).toHaveLength(1);
    const content = await readFile(files[0], "utf-8");
    expect(content).toContain("name: remote-skill");
    expect(content).toContain("registry: github");
  });

  it("parses clawhub: prefix and fetches from registry", async () => {
    await setupConfig(tempDir);

    globalThis.fetch = jest.fn(async (url: string) => {
      const decoded = decodeURIComponent(url);
      if (decoded.includes("/api/v1/skills/author/cool-skill?version=2.0.0")) {
        return {
          ok: true,
          json: async () => ({
            slug: "author/cool-skill",
            files: [{ path: "SKILL.md", size: 50 }],
          }),
        };
      }
      if (decoded.includes("/file") && decoded.includes("path=SKILL.md")) {
        return { ok: true, text: async () => "---\nname: cool-skill\ndescription: From ClawHub\n---\nBody" };
      }
      return { ok: false, status: 404 };
    }) as unknown as typeof fetch;

    const files = await runAdd(tempDir, "clawhub:author/cool-skill@2.0.0", "");

    expect(files).toHaveLength(1);
    const content = await readFile(files[0], "utf-8");
    expect(content).toContain("name: cool-skill");
    expect(content).toContain("registry: clawhub");
  });

  it("throws on invalid github: reference missing path", async () => {
    await setupConfig(tempDir);
    await expect(runAdd(tempDir, "github:org/repo", "")).rejects.toThrow(/Invalid GitHub reference/);
    await expect(runAdd(tempDir, "github:invalid", "")).rejects.toThrow(/Invalid GitHub reference/);
  });
});

describe("runAddCommand", () => {
  it("creates an empty command .md file", async () => {
    await setupConfig(tempDir);
    const file = await runAddCommand(tempDir, "deploy");

    expect(file).toContain("deploy.md");
    const content = await readFile(file, "utf-8");
    expect(content).toContain("# deploy");
  });

  it("finds nearest .agsync/ when run from a subdirectory", async () => {
    await setupConfig(tempDir);
    const subDir = join(tempDir, "src");
    await mkdir(subDir, { recursive: true });

    const file = await runAddCommand(subDir, "test-cmd");
    expect(file).toContain(join(tempDir, ".agsync", "commands", "test-cmd.md"));
  });

  it("adds to subfolder .agsync/ when present", async () => {
    await setupConfig(tempDir);
    const subDir = join(tempDir, "frontend");
    await mkdir(join(subDir, ".agsync"), { recursive: true });

    const file = await runAddCommand(subDir, "build");
    expect(file).toContain(join(subDir, ".agsync", "commands", "build.md"));
  });

  it("throws when no .agsync/ or agsync.yaml is found", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "agsync-no-config-"));
    await expect(runAddCommand(emptyDir, "test")).rejects.toThrow(/agsync.yaml/);
    await rm(emptyDir, { recursive: true, force: true });
  });
});

describe("runAddTool", () => {
  it("creates an empty tool .yaml file", async () => {
    await setupConfig(tempDir);
    const file = await runAddTool(tempDir, "github");

    expect(file).toContain("github.yaml");
    const content = await readFile(file, "utf-8");
    expect(content).toContain("name: github");
    expect(content).toContain("type: mcp");
  });

  it("finds nearest .agsync/ when run from a subdirectory", async () => {
    await setupConfig(tempDir);
    const subDir = join(tempDir, "src");
    await mkdir(subDir, { recursive: true });

    const file = await runAddTool(subDir, "my-tool");
    expect(file).toContain(join(tempDir, ".agsync", "tools", "my-tool.yaml"));
  });

  it("adds to subfolder .agsync/ when present", async () => {
    await setupConfig(tempDir);
    const subDir = join(tempDir, "services");
    await mkdir(join(subDir, ".agsync"), { recursive: true });

    const file = await runAddTool(subDir, "db");
    expect(file).toContain(join(subDir, ".agsync", "tools", "db.yaml"));
  });

  it("throws when no .agsync/ or agsync.yaml is found", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "agsync-no-config-"));
    await expect(runAddTool(emptyDir, "test")).rejects.toThrow(/agsync.yaml/);
    await rm(emptyDir, { recursive: true, force: true });
  });
});
