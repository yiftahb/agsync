import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { buildSyncPlan } from "@/commands/sync";
import { writeLockFile } from "@/lock/lock";
import type { LockFile } from "@/types";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-frozen-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function setupProject(dir: string) {
  const skillDir = join(dir, ".agsync", "skills", "local-skill");
  await mkdir(skillDir, { recursive: true });
  await writeFile(
    join(skillDir, "SKILL.md"),
    `---\nname: local-skill\ndescription: A local skill\n---\n\nDo things\n`
  );

  await writeFile(
    join(dir, "agsync.yaml"),
    toYaml({
      version: "1",
      features: { instructions: true, skills: true, commands: true, mcp: true },
      agents: {},
      skills: [{ path: ".agsync/skills/*" }],
      commands: [],
      mcp: [],
    })
  );
}

describe("--frozen mode", () => {
  it("throws when frozen and no lock file exists", async () => {
    await setupProject(tempDir);
    await expect(
      buildSyncPlan(tempDir, { frozen: true })
    ).rejects.toThrow(/--frozen.*lock/i);
  });

  it("succeeds when frozen and lock file is present (no external skills)", async () => {
    await setupProject(tempDir);
    const lock: LockFile = { lockVersion: 1, sources: {}, extends: {} };
    await writeLockFile(tempDir, lock);

    const plan = await buildSyncPlan(tempDir, { frozen: true });
    expect(plan.skills.length).toBeGreaterThanOrEqual(1);
  });

  it("succeeds without frozen flag when no lock file exists", async () => {
    await setupProject(tempDir);
    const plan = await buildSyncPlan(tempDir, { frozen: false });
    expect(plan.skills.length).toBeGreaterThanOrEqual(1);
  });
});
