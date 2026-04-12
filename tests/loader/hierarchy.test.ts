import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { collectConfigChain, loadHierarchicalConfig } from "@/loader/hierarchy";
import type { UserAgentConfig } from "@/types";

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

describe("collectConfigChain", () => {
  it("finds single config at root", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { codex: { instructions: { enabled: true } } },
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const chain = await collectConfigChain(tempDir);
    expect(chain).toHaveLength(1);
    expect(chain[0]).toBe(join(tempDir, "agsync.yaml"));
  });

  it("finds configs at multiple levels", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { codex: { instructions: { enabled: true } } },
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const childDir = join(tempDir, "apps", "api");
    await mkdir(childDir, { recursive: true });
    await writeFile(
      join(childDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { cursor: { mcp: { enabled: true } } },
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const chain = await collectConfigChain(childDir);
    expect(chain).toHaveLength(2);
    expect(chain[0]).toBe(join(tempDir, "agsync.yaml"));
    expect(chain[1]).toBe(join(childDir, "agsync.yaml"));
  });

  it("returns empty when no config exists", async () => {
    const chain = await collectConfigChain(tempDir);
    expect(chain).toHaveLength(0);
  });
});

describe("loadHierarchicalConfig", () => {
  it("merges parent and child skills and concatenates skill lists", async () => {
    await mkdir(join(tempDir, "skills", "root-skill"), { recursive: true });
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { codex: { instructions: { enabled: true } } },
        skills: [{ path: "skills/*" }],
        commands: [],
        tools: [],
      })
    );
    await writeFile(
      join(tempDir, "skills", "root-skill", "SKILL.md"),
      skillMd(
        { name: "root-skill", description: "Root" },
        "Root instructions"
      )
    );

    const childDir = join(tempDir, "apps", "api");
    await mkdir(join(childDir, "skills", "child-skill"), { recursive: true });
    await writeFile(
      join(childDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { codex: { skills: { enabled: true } } },
        skills: [{ path: "skills/*" }],
        commands: [],
        tools: [],
      })
    );
    await writeFile(
      join(childDir, "skills", "child-skill", "SKILL.md"),
      skillMd(
        { name: "child-skill", description: "Child" },
        "Child instructions"
      )
    );

    const result = await loadHierarchicalConfig(childDir);
    expect(result).not.toBeNull();
    expect(result!.config.agents.codex?.instructions?.enabled).toBe(true);
    expect(result!.config.agents.codex?.skills?.enabled).toBe(true);
    expect(result!.skills).toHaveLength(2);
    expect(result!.skills.map((s) => s.name)).toEqual(["root-skill", "child-skill"]);
  });

  it("deep-merges agents so child feature fields override parent per agent", async () => {
    const parentClaude: Partial<UserAgentConfig> = {
      instructions: { enabled: false, destination: "/parent/docs", merge_strategy: "merge" },
      mcp: { enabled: true, destination: "/parent/mcp" },
    };
    const childClaude: Partial<UserAgentConfig> = {
      instructions: { enabled: true },
    };

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { claude: parentClaude },
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const childDir = join(tempDir, "pkg");
    await mkdir(childDir, { recursive: true });
    await writeFile(
      join(childDir, "agsync.yaml"),
      toYaml({
        version: "2",
        agents: { claude: childClaude },
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const result = await loadHierarchicalConfig(childDir);
    expect(result).not.toBeNull();
    expect(result!.config.version).toBe("2");
    const merged = result!.config.agents.claude;
    expect(merged?.instructions).toEqual({
      enabled: true,
      destination: "/parent/docs",
      merge_strategy: "merge",
    });
    expect(merged?.mcp).toEqual({ enabled: true, destination: "/parent/mcp" });
  });

  it("returns null when no config found", async () => {
    const result = await loadHierarchicalConfig(tempDir);
    expect(result).toBeNull();
  });

  it("merges features — child enables a feature that parent left off", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        features: { instructions: false, skills: true, commands: false, mcp: false },
        agents: {},
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const childDir = join(tempDir, "pkg");
    await mkdir(childDir, { recursive: true });
    await writeFile(
      join(childDir, "agsync.yaml"),
      toYaml({
        version: "1",
        features: { instructions: true, skills: false, commands: false, mcp: true },
        agents: {},
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const result = await loadHierarchicalConfig(childDir);
    expect(result).not.toBeNull();
    expect(result!.config.features).toEqual({
      instructions: true,
      skills: true,
      commands: false,
      mcp: true,
    });
  });

  it("merges gitignore — child overrides parent", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        gitignore: "off",
        agents: {},
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const childDir = join(tempDir, "pkg");
    await mkdir(childDir, { recursive: true });
    await writeFile(
      join(childDir, "agsync.yaml"),
      toYaml({
        version: "1",
        gitignore: "on",
        agents: {},
        skills: [],
        commands: [],
        tools: [],
      })
    );

    const result = await loadHierarchicalConfig(childDir);
    expect(result).not.toBeNull();
    expect(result!.config.gitignore).toBe("on");
  });
});
