import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { loadHierarchicalConfig } from "@/loader/hierarchy";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-hierarchy-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function skillMd(frontmatter: Record<string, unknown>, body: string): string {
  return `---\n${toYaml(frontmatter).trim()}\n---\n\n${body.trim()}\n`;
}

describe("findGitRoot", () => {
  it("is exported", async () => {
    const { findGitRoot } = await import("@/loader/hierarchy");
    expect(typeof findGitRoot).toBe("function");
    expect(findGitRoot(tempDir)).toBe(tempDir);
  });
});

describe("loadHierarchicalConfig", () => {
  it("loads single root config with root .agsync/ skills", async () => {
    await mkdir(join(tempDir, ".agsync", "skills", "root-skill"), { recursive: true });
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { codex: { instructions: { enabled: true } } },
        skills: [{ path: ".agsync/skills/*" }],
        commands: [],
        mcp: [],
      })
    );
    await writeFile(
      join(tempDir, ".agsync", "skills", "root-skill", "SKILL.md"),
      skillMd({ name: "root-skill", description: "Root" }, "Root instructions")
    );

    const result = await loadHierarchicalConfig(tempDir);
    expect(result).not.toBeNull();
    expect(result!.skills).toHaveLength(1);
    expect(result!.skills[0].name).toBe("root-skill");
    expect(result!.skills[0].scope).toBeUndefined();
  });

  it("discovers subfolder .agsync/ and scopes skills with prefix", async () => {
    await mkdir(join(tempDir, ".agsync", "skills", "root-skill"), { recursive: true });
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: {},
        skills: [{ path: ".agsync/skills/*" }],
        commands: [],
        mcp: [],
      })
    );
    await writeFile(
      join(tempDir, ".agsync", "skills", "root-skill", "SKILL.md"),
      skillMd({ name: "root-skill", description: "Root" }, "Root body")
    );

    const childDir = join(tempDir, "frontend");
    await mkdir(join(childDir, ".agsync", "skills", "ui-kit"), { recursive: true });
    await writeFile(
      join(childDir, ".agsync", "skills", "ui-kit", "SKILL.md"),
      skillMd({ name: "ui-kit", description: "UI components" }, "UI body")
    );

    const result = await loadHierarchicalConfig(tempDir);
    expect(result).not.toBeNull();
    expect(result!.skills).toHaveLength(2);

    const rootSkill = result!.skills.find((s) => s.name === "root-skill");
    expect(rootSkill).toBeDefined();
    expect(rootSkill!.scope).toBeUndefined();

    const childSkill = result!.skills.find((s) => s.name === "frontend:ui-kit");
    expect(childSkill).toBeDefined();
    expect(childSkill!.scope).toBe("frontend");
    expect(childSkill!.sourceDir).toContain(join("frontend", ".agsync", "skills", "ui-kit"));
  });

  it("scopes subfolder commands with prefix", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: {},
        skills: [],
        commands: [],
        mcp: [],
      })
    );

    const childDir = join(tempDir, "backend");
    await mkdir(join(childDir, ".agsync", "commands"), { recursive: true });
    await writeFile(join(childDir, ".agsync", "commands", "deploy.md"), "Deploy the backend");

    const result = await loadHierarchicalConfig(tempDir);
    expect(result).not.toBeNull();
    const cmd = result!.commands.find((c) => c.name === "backend:deploy");
    expect(cmd).toBeDefined();
    expect(cmd!.scope).toBe("backend");
  });

  it("collects tools from subfolder .agsync/", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: {},
        skills: [],
        commands: [],
        mcp: [],
      })
    );

    const childDir = join(tempDir, "services");
    await mkdir(join(childDir, ".agsync", "mcp"), { recursive: true });
    await writeFile(
      join(childDir, ".agsync", "mcp", "db.yaml"),
      toYaml({ name: "db", description: "Database tool", command: "db-server" })
    );

    const result = await loadHierarchicalConfig(tempDir);
    expect(result).not.toBeNull();
    expect(result!.mcp).toHaveLength(1);
    expect(result!.mcp[0].name).toBe("db");
  });

  it("populates scopes array with subfolder content", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: {},
        skills: [],
        commands: [],
        mcp: [],
      })
    );

    const childDir = join(tempDir, "frontend");
    await mkdir(join(childDir, ".agsync"), { recursive: true });
    await writeFile(join(childDir, ".agsync", "instructions.md"), "Frontend instructions");

    const result = await loadHierarchicalConfig(tempDir);
    expect(result).not.toBeNull();
    expect(result!.scopes).toHaveLength(1);
    expect(result!.scopes[0].scope).toBe("frontend");
    expect(result!.scopes[0].instructions).toBe("Frontend instructions");
  });

  it("returns null when no config found", async () => {
    const result = await loadHierarchicalConfig(tempDir);
    expect(result).toBeNull();
  });

  it("finds config from subdirectory", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: {},
        skills: [],
        commands: [],
        mcp: [],
      })
    );

    const childDir = join(tempDir, "packages", "core");
    await mkdir(childDir, { recursive: true });

    const result = await loadHierarchicalConfig(childDir);
    expect(result).not.toBeNull();
    expect(result!.config.version).toBe("1");
  });
});

describe("buildScopeChain", () => {
  it("builds the ordered ancestor chain, skipping prefixes with no instructions", async () => {
    const { buildScopeChain } = await import("@/loader/hierarchy");
    const empty = { guidelines: [], applyPatterns: [] };
    const map = new Map([
      ["", empty],
      ["backend", empty],
      ["backend/service-a", empty],
    ]);
    // "middle" prefix backend/service-a exists; missing intermediate is skipped
    const chain = buildScopeChain("backend/service-a", map);
    expect(chain.map((l) => l.scope)).toEqual(["", "backend", "backend/service-a"]);
  });

  it("skips an intermediate prefix that has no instructions", async () => {
    const { buildScopeChain } = await import("@/loader/hierarchy");
    const empty = { guidelines: [], applyPatterns: [] };
    const map = new Map([
      ["", empty],
      ["backend/service-a", empty],
    ]);
    const chain = buildScopeChain("backend/service-a", map);
    expect(chain.map((l) => l.scope)).toEqual(["", "backend/service-a"]);
  });

  it("returns just root for the root scope", async () => {
    const { buildScopeChain } = await import("@/loader/hierarchy");
    const empty = { guidelines: [], applyPatterns: [] };
    const chain = buildScopeChain("", new Map([["", empty]]));
    expect(chain.map((l) => l.scope)).toEqual([""]);
  });
});

describe("loadHierarchicalConfig — nested context cascade", () => {
  it("cascades root + nested scopes into a self-contained leaf context", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        features: { context: true },
        agents: {},
        skills: [],
        commands: [],
        mcp: [],
      })
    );
    await mkdir(join(tempDir, ".agsync"), { recursive: true });
    await writeFile(
      join(tempDir, ".agsync", "instructions.md"),
      "## Guidelines\n\n- id: no-comments\n  rule: self-explanatory code\n"
    );

    const backend = join(tempDir, "backend", ".agsync");
    await mkdir(backend, { recursive: true });
    await writeFile(
      join(backend, "instructions.md"),
      "## Guidelines\n\n- id: structured-logging\n  rule: use the logger\n  paths: [\"src/**\"]\n"
    );

    const svc = join(tempDir, "backend", "service-a", ".agsync");
    await mkdir(svc, { recursive: true });
    await writeFile(
      join(svc, "instructions.md"),
      "## Guidelines\n\n- id: health-endpoint\n  rule: expose /health\n"
    );

    const result = await loadHierarchicalConfig(tempDir);
    expect(result).not.toBeNull();

    const leaf = result!.compiledContexts!.find((c) => c.scope === "backend/service-a")!;
    expect(leaf).toBeDefined();
    const ids = leaf.guidelines.map((g) => g.id).sort();
    expect(ids).toEqual(["health-endpoint", "no-comments", "structured-logging"]);

    expect(leaf.guidelines.find((g) => g.id === "no-comments")!.paths).toEqual(["**"]);
    expect(leaf.guidelines.find((g) => g.id === "structured-logging")!.paths).toEqual(["backend/src/**"]);
    expect(leaf.guidelines.find((g) => g.id === "health-endpoint")!.paths).toEqual(["backend/service-a/**"]);
  });
});

describe("loadHierarchicalConfig — monorepo mixed adoption", () => {
  it("applies a shared pattern scope-relative and ignores folders without .agsync", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        features: { context: true },
        agents: {},
        skills: [],
        commands: [],
        mcp: [],
      })
    );

    await mkdir(join(tempDir, ".agsync", "patterns"), { recursive: true });
    await writeFile(
      join(tempDir, ".agsync", "instructions.md"),
      "## Guidelines\n\n- id: no-comments\n  rule: self-explanatory code\n"
    );
    await writeFile(
      join(tempDir, ".agsync", "patterns", "rest-api.md"),
      "---\nid: rest-api\n---\n\n## Guidelines\n\n- id: thin-controllers\n  rule: no business logic in controllers\n  paths: [\"controllers/**\"]\n"
    );

    const svcA = join(tempDir, "backend", "service-a", ".agsync");
    await mkdir(svcA, { recursive: true });
    await writeFile(
      join(svcA, "instructions.md"),
      "---\napply_patterns:\n  - id: rest-api\n---\n\n## Guidelines\n\n- id: svc-rule\n  rule: expose /health\n"
    );

    // service-b has real code but no .agsync — must be ignored
    await mkdir(join(tempDir, "backend", "service-b", "src"), { recursive: true });
    await writeFile(join(tempDir, "backend", "service-b", "src", "index.ts"), "export const x = 1;\n");

    const result = await loadHierarchicalConfig(tempDir);
    expect(result).not.toBeNull();

    const scopes = result!.compiledContexts!.map((c) => c.scope).sort();
    expect(scopes).toEqual(["", "backend/service-a"]);

    const leaf = result!.compiledContexts!.find((c) => c.scope === "backend/service-a")!;
    expect(leaf.guidelines.find((g) => g.id === "no-comments")!.paths).toEqual(["**"]);
    expect(leaf.guidelines.find((g) => g.id === "rest-api:thin-controllers")!.paths).toEqual([
      "backend/service-a/controllers/**",
    ]);
    expect(leaf.guidelines.find((g) => g.id === "svc-rule")!.paths).toEqual(["backend/service-a/**"]);
    expect(leaf.patterns).toEqual(["rest-api"]);
  });
});
