import { mkdtemp, readFile, access, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
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
    expect(created).toContain(".agsync/tools/");
  });

  it("creates a sample skill in directory format", async () => {
    await runInit(tempDir);

    const skillContent = await readFile(
      join(tempDir, ".agsync", "skills", "default", "default.yaml"),
      "utf-8"
    );
    expect(skillContent).toContain("name: default");
  });

  it("throws if agsync.yaml already exists", async () => {
    await runInit(tempDir);
    await expect(runInit(tempDir)).rejects.toThrow("already exists");
  });

  it("creates required directories under .agsync", async () => {
    await runInit(tempDir);

    for (const dir of ["skills", "tools"]) {
      await expect(access(join(tempDir, ".agsync", dir))).resolves.toBeUndefined();
    }
  });
});
