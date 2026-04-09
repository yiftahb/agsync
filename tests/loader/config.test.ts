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

describe("findConfigFile", () => {
  it("returns path when agsync.yaml exists", async () => {
    await writeFile(join(tempDir, "agsync.yaml"), "version: '1'\ntargets: [codex]");
    const result = await findConfigFile(tempDir);
    expect(result).toBe(join(tempDir, "agsync.yaml"));
  });

  it("returns null when no config exists", async () => {
    const result = await findConfigFile(tempDir);
    expect(result).toBeNull();
  });
});

describe("loadConfigFile", () => {
  it("parses a valid agsync.yaml", async () => {
    const config = { version: "1", targets: ["claude-code", "cursor"] };
    const configPath = join(tempDir, "agsync.yaml");
    await writeFile(configPath, toYaml(config));

    const result = await loadConfigFile(configPath);
    expect(result.version).toBe("1");
    expect(result.targets).toEqual(["claude-code", "cursor"]);
  });

  it("throws on invalid config", async () => {
    const configPath = join(tempDir, "agsync.yaml");
    await writeFile(configPath, "targets: []");

    await expect(loadConfigFile(configPath)).rejects.toThrow();
  });
});

describe("loadFullConfig", () => {
  it("loads directory-based skills with <name>/<name>.yaml", async () => {
    const skillDir = join(tempDir, "skills", "my-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "my-skill.yaml"),
      toYaml({ name: "my-skill", description: "A test skill", instructions: "Do testing" })
    );

    await mkdir(join(tempDir, "tools"), { recursive: true });
    const tool = { name: "test-tool", description: "A test tool", type: "cli", command: "echo" };
    await writeFile(join(tempDir, "tools", "test.yaml"), toYaml(tool));

    const config = {
      version: "1",
      targets: ["codex"],
      skills: [{ path: "skills/*" }],
      tools: [{ path: "tools/*.yaml" }],
    };
    await writeFile(join(tempDir, "agsync.yaml"), toYaml(config));

    const result = await loadFullConfig(join(tempDir, "agsync.yaml"));

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe("my-skill");
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe("test-tool");
  });

  it("returns empty arrays when no files match patterns", async () => {
    const config = {
      version: "1",
      targets: ["codex"],
      skills: [{ path: "skills/*" }],
    };
    await writeFile(join(tempDir, "agsync.yaml"), toYaml(config));

    const result = await loadFullConfig(join(tempDir, "agsync.yaml"));
    expect(result.skills).toHaveLength(0);
  });

  it("loads skill with source field", async () => {
    const skillDir = join(tempDir, "skills", "sourced");
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, "sourced.yaml"),
      toYaml({
        name: "sourced",
        description: "Has source",
        instructions: "Do things",
        source: { registry: "github", org: "test-org", repo: "test-repo", path: "skills/sourced" },
      })
    );

    const config = { version: "1", targets: ["codex"], skills: [{ path: "skills/*" }] };
    await writeFile(join(tempDir, "agsync.yaml"), toYaml(config));

    const result = await loadFullConfig(join(tempDir, "agsync.yaml"));
    expect(result.skills[0].source).toBeDefined();
    expect(result.skills[0].source!.org).toBe("test-org");
  });
});
