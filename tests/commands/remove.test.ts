import { mkdtemp, writeFile, mkdir, rm, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { runRemove, runRemoveCommand, runRemoveTool } from "@/commands/remove";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-remove-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function setupConfig(dir: string) {
  await mkdir(join(dir, ".agsync", "skills"), { recursive: true });
  await mkdir(join(dir, ".agsync", "commands"), { recursive: true });
  await mkdir(join(dir, ".agsync", "tools"), { recursive: true });
  await writeFile(
    join(dir, "agsync.yaml"),
    toYaml({
      version: "1",
      features: { instructions: true, skills: true, commands: true, mcp: true },
      agents: {},
      skills: [{ path: ".agsync/skills/*" }],
      commands: [{ path: ".agsync/commands/*" }],
      tools: [{ path: ".agsync/tools/*.yaml" }],
    })
  );
}

describe("runRemove (skills)", () => {
  it("removes an existing skill directory", async () => {
    await setupConfig(tempDir);
    const skillDir = join(tempDir, ".agsync", "skills", "my-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "---\nname: my-skill\n---\n");

    await runRemove(tempDir, "my-skill");
    await expect(access(skillDir)).rejects.toThrow();
  });

  it("throws when skill does not exist", async () => {
    await setupConfig(tempDir);
    await expect(runRemove(tempDir, "nonexistent")).rejects.toThrow(/not found/);
  });

  it("finds nearest .agsync/ from subdirectory", async () => {
    await setupConfig(tempDir);
    const skillDir = join(tempDir, ".agsync", "skills", "test-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "---\nname: test-skill\n---\n");

    const subDir = join(tempDir, "src");
    await mkdir(subDir, { recursive: true });

    await runRemove(subDir, "test-skill");
    await expect(access(skillDir)).rejects.toThrow();
  });

  it("removes from subfolder .agsync/ when present", async () => {
    await setupConfig(tempDir);
    const subDir = join(tempDir, "frontend");
    const skillDir = join(subDir, ".agsync", "skills", "ui-skill");
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, "SKILL.md"), "---\nname: ui-skill\n---\n");

    await runRemove(subDir, "ui-skill");
    await expect(access(skillDir)).rejects.toThrow();
  });
});

describe("runRemoveCommand", () => {
  it("removes an existing command file", async () => {
    await setupConfig(tempDir);
    const cmdPath = join(tempDir, ".agsync", "commands", "deploy.md");
    await writeFile(cmdPath, "# deploy\n");

    await runRemoveCommand(tempDir, "deploy");
    await expect(access(cmdPath)).rejects.toThrow();
  });

  it("throws when command does not exist", async () => {
    await setupConfig(tempDir);
    await expect(runRemoveCommand(tempDir, "nonexistent")).rejects.toThrow(/not found/);
  });

  it("finds nearest config from subdirectory", async () => {
    await setupConfig(tempDir);
    const cmdPath = join(tempDir, ".agsync", "commands", "test.md");
    await writeFile(cmdPath, "# test\n");

    const subDir = join(tempDir, "src");
    await mkdir(subDir, { recursive: true });

    await runRemoveCommand(subDir, "test");
    await expect(access(cmdPath)).rejects.toThrow();
  });
});

describe("runRemoveTool", () => {
  it("removes an existing tool file", async () => {
    await setupConfig(tempDir);
    const toolPath = join(tempDir, ".agsync", "tools", "github.yaml");
    await writeFile(toolPath, "name: github\ntype: mcp\n");

    await runRemoveTool(tempDir, "github");
    await expect(access(toolPath)).rejects.toThrow();
  });

  it("throws when tool does not exist", async () => {
    await setupConfig(tempDir);
    await expect(runRemoveTool(tempDir, "nonexistent")).rejects.toThrow(/not found/);
  });

  it("finds nearest config from subdirectory", async () => {
    await setupConfig(tempDir);
    const toolPath = join(tempDir, ".agsync", "tools", "test.yaml");
    await writeFile(toolPath, "name: test\ntype: mcp\n");

    const subDir = join(tempDir, "src");
    await mkdir(subDir, { recursive: true });

    await runRemoveTool(subDir, "test");
    await expect(access(toolPath)).rejects.toThrow();
  });
});
