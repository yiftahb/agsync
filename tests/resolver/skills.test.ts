import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { resolveAllSkills } from "@/resolver/skills";
import type { SkillDefinition } from "@/types";

let tempDir: string;
let skillsDir: string;
let cacheDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-resolver-"));
  skillsDir = join(tempDir, "skills");
  cacheDir = join(tempDir, ".agsync", "cache");
  await mkdir(skillsDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("resolveAllSkills", () => {
  it("resolves a skill with no extends", async () => {
    const skill: SkillDefinition = {
      name: "simple",
      description: "Simple skill",
      instructions: "Do things",
      tools: ["grep"],
    };

    const result = await resolveAllSkills([skill], skillsDir, cacheDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("simple");
    expect(result[0].instructions).toBe("Do things");
    expect(result[0].tools).toEqual(["grep"]);
    expect(result[0].extendsChain).toEqual(["simple"]);
  });

  it("resolves local extends", async () => {
    const baseSkill = {
      name: "base",
      description: "Base skill",
      instructions: "Base instructions",
      tools: ["read"],
    };
    await writeFile(join(skillsDir, "base.yaml"), toYaml(baseSkill));

    const childSkill: SkillDefinition = {
      name: "child",
      description: "Child skill",
      extends: ["./base"],
      instructions: "Child instructions",
      tools: ["write"],
    };

    const result = await resolveAllSkills([childSkill], skillsDir, cacheDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("child");
    expect(result[0].instructions).toContain("Base instructions");
    expect(result[0].instructions).toContain("Child instructions");
    expect(result[0].tools).toContain("read");
    expect(result[0].tools).toContain("write");
  });

  it("resolves multiple levels of extends", async () => {
    const grandparent = {
      name: "grandparent",
      description: "GP",
      instructions: "GP instructions",
      tools: ["tool-a"],
    };
    await writeFile(join(skillsDir, "grandparent.yaml"), toYaml(grandparent));

    const parent = {
      name: "parent",
      description: "Parent",
      extends: ["./grandparent"],
      instructions: "Parent instructions",
      tools: ["tool-b"],
    };
    await writeFile(join(skillsDir, "parent.yaml"), toYaml(parent));

    const child: SkillDefinition = {
      name: "child",
      description: "Child",
      extends: ["./parent"],
      instructions: "Child instructions",
      tools: ["tool-c"],
    };

    const result = await resolveAllSkills([child], skillsDir, cacheDir);
    expect(result[0].tools).toContain("tool-a");
    expect(result[0].tools).toContain("tool-b");
    expect(result[0].tools).toContain("tool-c");
    expect(result[0].instructions).toContain("GP instructions");
    expect(result[0].instructions).toContain("Parent instructions");
    expect(result[0].instructions).toContain("Child instructions");
  });

  it("detects circular extends", async () => {
    const skillA = {
      name: "skill-a",
      description: "A",
      extends: ["./skill-b"],
      instructions: "A",
    };
    await writeFile(join(skillsDir, "skill-a.yaml"), toYaml(skillA));

    const skillB = {
      name: "skill-b",
      description: "B",
      extends: ["./skill-a"],
      instructions: "B",
    };
    await writeFile(join(skillsDir, "skill-b.yaml"), toYaml(skillB));

    const entrySkill: SkillDefinition = {
      name: "skill-a",
      description: "A",
      extends: ["./skill-b"],
      instructions: "A",
    };

    await expect(resolveAllSkills([entrySkill], skillsDir, cacheDir)).rejects.toThrow(
      /[Cc]ircular/
    );
  });

  it("union-merges tools without duplicates", async () => {
    const base = {
      name: "base",
      description: "Base",
      instructions: "Base",
      tools: ["grep", "read"],
    };
    await writeFile(join(skillsDir, "base.yaml"), toYaml(base));

    const child: SkillDefinition = {
      name: "child",
      description: "Child",
      extends: ["./base"],
      instructions: "Child",
      tools: ["grep", "write"],
    };

    const result = await resolveAllSkills([child], skillsDir, cacheDir);
    const grepCount = result[0].tools.filter((t) => t === "grep").length;
    expect(grepCount).toBe(1);
    expect(result[0].tools).toContain("read");
    expect(result[0].tools).toContain("write");
  });
});
