import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { runValidate } from "@/commands/validate";

let tempDir: string;

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

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        targets: ["codex"],
        skills: [{ path: ".agsync/skills/*" }],
        tools: [{ path: ".agsync/tools/*.yaml" }],
      })
    );

    await writeFile(
      join(tempDir, ".agsync", "tools", "grep.yaml"),
      toYaml({ name: "grep", description: "Search", type: "cli", command: "grep" })
    );

    await writeFile(
      join(skillDir, "test.yaml"),
      toYaml({ name: "test", description: "Test", instructions: "Test", tools: ["grep"] })
    );

    const errors = await runValidate(tempDir);
    expect(errors).toHaveLength(0);
  });

  it("detects unknown tool references", async () => {
    const skillDir = join(tempDir, ".agsync", "skills", "test");
    await mkdir(skillDir, { recursive: true });

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({ version: "1", targets: ["codex"], skills: [{ path: ".agsync/skills/*" }] })
    );

    await writeFile(
      join(skillDir, "test.yaml"),
      toYaml({ name: "test", description: "Test", instructions: "Test", tools: ["nonexistent"] })
    );

    const errors = await runValidate(tempDir);
    expect(errors.some((e) => e.message.includes("nonexistent"))).toBe(true);
  });

  it("warns when env var references are not set", async () => {
    delete process.env.AGSYNC_MISSING_TOKEN;
    await mkdir(join(tempDir, ".agsync", "tools"), { recursive: true });

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        targets: ["codex"],
        skills: [],
        tools: [{ path: ".agsync/tools/*.yaml" }],
      })
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
        toYaml({
          version: "1",
          targets: ["codex"],
          skills: [],
          tools: [{ path: ".agsync/tools/*.yaml" }],
        })
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
      toYaml({ version: "1", targets: ["codex"], skills: [{ path: ".agsync/skills/*" }] })
    );

    await writeFile(
      join(skillDirA, "a.yaml"),
      toYaml({ name: "dupe", description: "A", instructions: "A" })
    );
    await writeFile(
      join(skillDirB, "b.yaml"),
      toYaml({ name: "dupe", description: "B", instructions: "B" })
    );

    const errors = await runValidate(tempDir);
    expect(errors.some((e) => e.message.includes("Duplicate"))).toBe(true);
  });
});
