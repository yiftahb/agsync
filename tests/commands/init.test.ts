import { mkdtemp, readFile, access, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parse as parseYaml } from "yaml";
import { runInit } from "@/commands/init";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-init-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("runInit", () => {
  it("creates agsync.yaml and .agsync directories", async () => {
    const created = await runInit(tempDir);

    expect(created).toContain("agsync.yaml");
    expect(created).toContain(".agsync/skills/");
    expect(created).toContain(".agsync/commands/");
    expect(created).toContain(".agsync/tools/");
  });

  it("does not create a default skill", async () => {
    const created = await runInit(tempDir);
    expect(created).not.toContain(".agsync/skills/default/SKILL.md");
  });

  it("creates .agsync/instructions.md", async () => {
    const created = await runInit(tempDir);

    expect(created).toContain(".agsync/instructions.md");
    const instructions = await readFile(
      join(tempDir, ".agsync", "instructions.md"),
      "utf-8"
    );
    expect(instructions).toContain("agsync");
  });

  it("writes agsync.yaml with empty agents, features, and gitignore", async () => {
    await runInit(tempDir);

    const raw = await readFile(join(tempDir, "agsync.yaml"), "utf-8");
    const cfg = parseYaml(raw) as Record<string, unknown>;

    expect(cfg.agents).toEqual({});
    expect(cfg.targets).toBeUndefined();
    expect(cfg.features).toEqual({
      instructions: true,
      skills: true,
      commands: true,
      mcp: true,
    });
    expect(cfg.gitignore).toBe("mcpOnly");
  });

  it("throws if agsync.yaml already exists", async () => {
    await runInit(tempDir);
    await expect(runInit(tempDir)).rejects.toThrow("already exists");
  });

  it("creates required directories under .agsync", async () => {
    await runInit(tempDir);

    for (const dir of ["skills", "commands", "tools"]) {
      await expect(access(join(tempDir, ".agsync", dir))).resolves.toBeUndefined();
    }
  });
});
