import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { runValidate } from "@/commands/validate";
import { loadHierarchicalConfig } from "@/loader/hierarchy";

let tempDir: string;

function skillMd(frontmatter: Record<string, unknown>, body: string): string {
  return `---\n${toYaml(frontmatter).trim()}\n---\n\n${body}\n`;
}

function baseConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: "1",
    agents: {
      codex: { skills: { enabled: true }, mcp: { enabled: true } },
    },
    skills: [{ path: ".agsync/skills/*" }],
    commands: [{ path: ".agsync/commands/*.md" }],
    tools: [{ path: ".agsync/tools/*.yaml" }],
    ...overrides,
  };
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-validate-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("runValidate", () => {
  it("returns error when no config found", async () => {
    const errors = await runValidate(tempDir);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("No agsync.yaml found");
  });

  it("passes with valid config and matching references", async () => {
    const skillDir = join(tempDir, ".agsync", "skills", "test");
    await mkdir(skillDir, { recursive: true });
    await mkdir(join(tempDir, ".agsync", "tools"), { recursive: true });
    await mkdir(join(tempDir, ".agsync", "commands"), { recursive: true });

    await writeFile(join(tempDir, "agsync.yaml"), toYaml(baseConfig()));

    await writeFile(
      join(tempDir, ".agsync", "tools", "grep.yaml"),
      toYaml({ name: "grep", description: "Search", type: "cli", command: "grep" })
    );

    await writeFile(
      join(skillDir, "SKILL.md"),
      skillMd(
        { name: "test", description: "Test", tools: ["grep"] },
        "Test instructions"
      )
    );

    await writeFile(join(tempDir, ".agsync", "commands", "lint.md"), "# lint\n", "utf-8");

    const errors = await runValidate(tempDir);
    expect(errors).toHaveLength(0);
  });

  it("detects unknown tool references", async () => {
    const skillDir = join(tempDir, ".agsync", "skills", "test");
    await mkdir(skillDir, { recursive: true });

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml(baseConfig({ commands: [] }))
    );

    await writeFile(
      join(skillDir, "SKILL.md"),
      skillMd(
        { name: "test", description: "Test", tools: ["nonexistent"] },
        "Test instructions"
      )
    );

    const errors = await runValidate(tempDir);
    expect(errors.some((e) => e.message.includes("nonexistent"))).toBe(true);
  });

  it("warns when env var references are not set", async () => {
    delete process.env.AGSYNC_MISSING_TOKEN;
    await mkdir(join(tempDir, ".agsync", "tools"), { recursive: true });

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml(baseConfig({ skills: [], commands: [] }))
    );

    await writeFile(
      join(tempDir, ".agsync", "tools", "api.yaml"),
      toYaml({
        name: "api",
        description: "API server",
        type: "mcp",
        command: "node",
        env: { TOKEN: "$AGSYNC_MISSING_TOKEN" },
      })
    );

    const errors = await runValidate(tempDir);
    const warnings = errors.filter((e) => e.severity === "warn");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain("AGSYNC_MISSING_TOKEN");
  });

  it("does not warn when env var is set", async () => {
    const saved = process.env.AGSYNC_SET_TOKEN;
    process.env.AGSYNC_SET_TOKEN = "value";
    try {
      await mkdir(join(tempDir, ".agsync", "tools"), { recursive: true });

      await writeFile(
        join(tempDir, "agsync.yaml"),
        toYaml(baseConfig({ skills: [], commands: [] }))
      );

      await writeFile(
        join(tempDir, ".agsync", "tools", "api.yaml"),
        toYaml({
          name: "api",
          description: "API server",
          type: "mcp",
          command: "node",
          env: { TOKEN: "$AGSYNC_SET_TOKEN" },
        })
      );

      const errors = await runValidate(tempDir);
      expect(errors.filter((e) => e.severity === "warn")).toHaveLength(0);
    } finally {
      if (saved === undefined) delete process.env.AGSYNC_SET_TOKEN;
      else process.env.AGSYNC_SET_TOKEN = saved;
    }
  });

  it("detects duplicate skill names", async () => {
    const skillDirA = join(tempDir, ".agsync", "skills", "a");
    const skillDirB = join(tempDir, ".agsync", "skills", "b");
    await mkdir(skillDirA, { recursive: true });
    await mkdir(skillDirB, { recursive: true });

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml(baseConfig({ commands: [] }))
    );

    await writeFile(
      join(skillDirA, "SKILL.md"),
      skillMd({ name: "dupe", description: "A" }, "A")
    );
    await writeFile(
      join(skillDirB, "SKILL.md"),
      skillMd({ name: "dupe", description: "B" }, "B")
    );

    const errors = await runValidate(tempDir);
    expect(errors.some((e) => e.message.includes("Duplicate"))).toBe(true);
  });

  it("warns when a command file is empty", async () => {
    await mkdir(join(tempDir, ".agsync", "commands"), { recursive: true });
    await mkdir(join(tempDir, ".agsync", "skills", "only"), { recursive: true });

    await writeFile(join(tempDir, "agsync.yaml"), toYaml(baseConfig()));

    await writeFile(
      join(tempDir, ".agsync", "skills", "only", "SKILL.md"),
      skillMd({ name: "only", description: "Only skill" }, "Body")
    );

    await writeFile(join(tempDir, ".agsync", "commands", "empty.md"), "", "utf-8");

    const errors = await runValidate(tempDir);
    const emptyCmd = errors.find(
      (e) => e.severity === "warn" && e.message.includes("Command file is empty")
    );
    expect(emptyCmd).toBeDefined();
    expect(emptyCmd!.file).toContain("command: empty");
  });

  it("exposes commands on LoadedConfig from hierarchy loader", async () => {
    await mkdir(join(tempDir, ".agsync", "commands"), { recursive: true });
    await mkdir(join(tempDir, ".agsync", "skills", "s"), { recursive: true });

    await writeFile(join(tempDir, "agsync.yaml"), toYaml(baseConfig()));

    await writeFile(
      join(tempDir, ".agsync", "skills", "s", "SKILL.md"),
      skillMd({ name: "s", description: "S" }, "Hi")
    );
    await writeFile(join(tempDir, ".agsync", "commands", "x.md"), "# x\n", "utf-8");

    const loaded = await loadHierarchicalConfig(tempDir);
    expect(loaded).not.toBeNull();
    expect(Array.isArray(loaded!.commands)).toBe(true);
    expect(loaded!.commands.map((c) => c.name)).toContain("x");
  });
});
