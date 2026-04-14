import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { findConfigFile, loadConfigFile, loadFullConfig } from "@/loader/config";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function agsyncYaml(extra: Record<string, unknown> = {}): string {
  return toYaml({
    version: "1",
    agents: {
      codex: { instructions: { enabled: true } },
    },
    skills: [],
    commands: [],
    mcp: [],
    ...extra,
  });
}

function skillMd(frontmatter: Record<string, unknown>, body: string): string {
  return `---\n${toYaml(frontmatter).trim()}\n---\n\n${body.trim()}\n`;
}

describe("findConfigFile", () => {
  it("returns path when agsync.yaml exists", async () => {
    await writeFile(join(tempDir, "agsync.yaml"), agsyncYaml());
    const result = await findConfigFile(tempDir);
    expect(result).toBe(join(tempDir, "agsync.yaml"));
  });

  it("returns null when no config exists", async () => {
    const result = await findConfigFile(tempDir);
    expect(result).toBeNull();
  });
});

describe("loadConfigFile", () => {
  it("parses a valid agsync.yaml with agents", async () => {
    const configPath = join(tempDir, "agsync.yaml");
    await writeFile(
      configPath,
      toYaml({
        version: "1",
        agents: {
          claude: { instructions: { enabled: true }, mcp: { enabled: false } },
          cursor: { skills: { enabled: true } },
        },
        skills: [{ path: "skills/*" }],
        commands: [{ path: "commands/*.md" }],
        mcp: [{ path: "mcp/*.yaml" }],
      })
    );

    const result = await loadConfigFile(configPath);
    expect(result.version).toBe("1");
    expect(result.agents.claude?.instructions?.enabled).toBe(true);
    expect(result.agents.cursor?.skills?.enabled).toBe(true);
    expect(result.skills).toEqual([{ path: "skills/*" }]);
    expect(result.mcp).toEqual([{ path: "mcp/*.yaml" }]);
  });

  it("throws on invalid config", async () => {
    const configPath = join(tempDir, "agsync.yaml");
    await writeFile(
      configPath,
      toYaml({
        version: "1",
        agents: {
          bad: { instructions: "not-an-object" },
        },
      })
    );

    await expect(loadConfigFile(configPath)).rejects.toThrow();
  });
});

describe("loadFullConfig", () => {
  it("loads skills from SKILL.md (frontmatter + body)", async () => {
    const skillDir = join(tempDir, "skills", "my-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      skillMd(
        { name: "my-skill", description: "A test skill" },
        "Do testing"
      )
    );

    await mkdir(join(tempDir, "mcp"), { recursive: true });
    const tool = { name: "test-tool", description: "A test tool", command: "echo" };
    await writeFile(join(tempDir, "mcp", "test.yaml"), toYaml(tool));

    await writeFile(
      join(tempDir, "agsync.yaml"),
      agsyncYaml({
        skills: [{ path: "skills/*" }],
        mcp: [{ path: "mcp/*.yaml" }],
      })
    );

    const result = await loadFullConfig(join(tempDir, "agsync.yaml"));

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe("my-skill");
    expect(result.skills[0].description).toBe("A test skill");
    expect(result.skills[0].instructions).toBe("Do testing");
    expect(result.mcp).toHaveLength(1);
    expect(result.mcp[0].name).toBe("test-tool");
  });

  it("loads commands from .md files (name from filename, raw content)", async () => {
    await mkdir(join(tempDir, "commands"), { recursive: true });
    const body = "# My command\n\nRun `agsync sync`.";
    await writeFile(join(tempDir, "commands", "review.md"), body);

    await writeFile(
      join(tempDir, "agsync.yaml"),
      agsyncYaml({
        commands: [{ path: "commands/*.md" }],
      })
    );

    const result = await loadFullConfig(join(tempDir, "agsync.yaml"));

    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]).toEqual({ name: "review", content: body });
  });

  it("returns empty arrays when no files match patterns", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      agsyncYaml({
        skills: [{ path: "skills/*" }],
        commands: [{ path: "commands/*.md" }],
        mcp: [{ path: "mcp/*.yaml" }],
      })
    );

    const result = await loadFullConfig(join(tempDir, "agsync.yaml"));
    expect(result.skills).toHaveLength(0);
    expect(result.commands).toHaveLength(0);
    expect(result.mcp).toHaveLength(0);
  });

  it("loads skill source and optional frontmatter fields from SKILL.md", async () => {
    const skillDir = join(tempDir, "skills", "sourced");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "SKILL.md"),
      skillMd(
        {
          name: "sourced",
          description: "Has source",
          extends: ["base-skill"],
          tools: ["test-tool"],
          source: {
            registry: "github",
            org: "test-org",
            repo: "test-repo",
            path: "skills/sourced",
            version: "v1.0.0",
          },
        },
        "Instructions body"
      )
    );

    await writeFile(
      join(tempDir, "agsync.yaml"),
      agsyncYaml({ skills: [{ path: "skills/*" }] })
    );

    const result = await loadFullConfig(join(tempDir, "agsync.yaml"));
    expect(result.skills[0].source).toBeDefined();
    const src = result.skills[0].source!;
    expect(src.registry).toBe("github");
    if (src.registry === "github") {
      expect(src.org).toBe("test-org");
    }
    expect(result.skills[0].extends).toEqual(["base-skill"]);
    expect(result.skills[0].tools).toEqual(["test-tool"]);
    expect(result.skills[0].instructions).toBe("Instructions body");
  });
});
