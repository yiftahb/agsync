import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { collectConfigChain, loadHierarchicalConfig } from "@/loader/hierarchy";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-hierarchy-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("collectConfigChain", () => {
  it("finds single config at root", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({ version: "1", targets: ["codex"] })
    );

    const chain = await collectConfigChain(tempDir);
    expect(chain).toHaveLength(1);
    expect(chain[0]).toBe(join(tempDir, "agsync.yaml"));
  });

  it("finds configs at multiple levels", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({ version: "1", targets: ["codex"] })
    );

    const childDir = join(tempDir, "apps", "api");
    await mkdir(childDir, { recursive: true });
    await writeFile(
      join(childDir, "agsync.yaml"),
      toYaml({ version: "1", targets: ["cursor"] })
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
  it("merges parent and child configs", async () => {
    await mkdir(join(tempDir, "skills"), { recursive: true });
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        targets: ["codex"],
        skills: [{ path: "skills/*.yaml" }],
      })
    );
    await writeFile(
      join(tempDir, "skills", "root-skill.yaml"),
      toYaml({ name: "root-skill", description: "Root", instructions: "Root instructions" })
    );

    const childDir = join(tempDir, "apps", "api");
    await mkdir(join(childDir, "skills"), { recursive: true });
    await writeFile(
      join(childDir, "agsync.yaml"),
      toYaml({
        version: "1",
        targets: ["cursor"],
        skills: [{ path: "skills/*.yaml" }],
      })
    );
    await writeFile(
      join(childDir, "skills", "child-skill.yaml"),
      toYaml({ name: "child-skill", description: "Child", instructions: "Child instructions" })
    );

    const result = await loadHierarchicalConfig(childDir);
    expect(result).not.toBeNull();
    expect(result!.config.targets).toContain("codex");
    expect(result!.config.targets).toContain("cursor");
    expect(result!.skills).toHaveLength(2);
    expect(result!.skills.map((s) => s.name)).toEqual(["root-skill", "child-skill"]);
  });

  it("returns null when no config found", async () => {
    const result = await loadHierarchicalConfig(tempDir);
    expect(result).toBeNull();
  });
});
