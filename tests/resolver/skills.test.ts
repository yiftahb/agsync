import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { resolveAllSkills } from "@/resolver/skills";
import type { SkillDefinition } from "@/types";

let tempDir: string;
let skillsDir: string;
let cacheDir: string;
let originalFetch: typeof globalThis.fetch;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-resolver-"));
  skillsDir = join(tempDir, "skills");
  cacheDir = join(tempDir, ".agsync", "cache");
  await mkdir(skillsDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });
  originalFetch = globalThis.fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await rm(tempDir, { recursive: true, force: true });
});

describe("resolveAllSkills", () => {
  it("resolves a skill with instructions and no extends", async () => {
    const skill: SkillDefinition = {
      name: "simple",
      description: "Simple skill",
      instructions: "Do things",
      tools: ["grep"],
    };

    const { skills: result } = await resolveAllSkills([skill], skillsDir, cacheDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("simple");
    expect(result[0].instructions).toBe("Do things");
    expect(result[0].tools).toEqual(["grep"]);
    expect(result[0].extendsChain).toEqual(["simple"]);
  });

  it("resolves local extends loaded from YAML on disk", async () => {
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

    const { skills: result } = await resolveAllSkills([childSkill], skillsDir, cacheDir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("child");
    expect(result[0].instructions).toContain("Base instructions");
    expect(result[0].instructions).toContain("Child instructions");
    expect(result[0].tools).toContain("read");
    expect(result[0].tools).toContain("write");
  });

  it("resolves multiple levels of extends from YAML", async () => {
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

    const { skills: result } = await resolveAllSkills([child], skillsDir, cacheDir);
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

    const { skills: result } = await resolveAllSkills([child], skillsDir, cacheDir);
    const grepCount = result[0].tools.filter((t: string) => t === "grep").length;
    expect(grepCount).toBe(1);
    expect(result[0].tools).toContain("read");
    expect(result[0].tools).toContain("write");
  });

  it("resolves github extends using mocked fetches", async () => {
    const extOrg = "ExtOrg";
    const extRepo = "ExtRepo";
    const extPath = "skills/parent";
    const parentSkillMd = `---
name: parent
description: Parent from GitHub
tools:
  - gh-tool
---

Parent remote body
`;

    const commitSha = "abc123def456";

    globalThis.fetch = jest.fn(async (url: string) => {
      if (url.includes(`/repos/${extOrg}/${extRepo}/commits/v1.0.0`)) {
        return { ok: true, json: async () => ({ sha: commitSha }) };
      }
      if (url.includes(`/repos/${extOrg}/${extRepo}/contents/${extPath}`)) {
        return {
          ok: true,
          json: async () => [
            { name: "SKILL.md", path: `${extPath}/SKILL.md`, type: "file", download_url: `https://raw.githubusercontent.com/${extOrg}/${extRepo}/main/${extPath}/SKILL.md` },
          ],
        };
      }
      if (url.includes("SKILL.md")) {
        return { ok: true, text: async (): Promise<string> => parentSkillMd };
      }
      return { ok: false, status: 404, text: async (): Promise<string> => "not found" };
    }) as unknown as typeof fetch;

    const child: SkillDefinition = {
      name: "child",
      description: "Child",
      extends: [`github:${extOrg}/${extRepo}/${extPath}@v1.0.0`],
      instructions: "Local overlay",
      tools: ["local-tool"],
    };

    const { skills: result } = await resolveAllSkills([child], skillsDir, cacheDir);
    expect(result[0].name).toBe("child");
    expect(result[0].instructions).toContain("Parent remote body");
    expect(result[0].instructions).toContain("Local overlay");
    expect(result[0].tools).toContain("gh-tool");
    expect(result[0].tools).toContain("local-tool");
  });

  it("resolves source from GitHub SKILL.md with mocked API and raw fetches", async () => {
    const org = "SourceOrg";
    const repo = "SourceRepo";
    const remotePath = "packs/gh-skill";
    const apiDir = `https://api.github.com/repos/${org}/${repo}/contents/${remotePath}`;
    const rawSkill = `https://raw.githubusercontent.com/${org}/${repo}/main/${remotePath}/SKILL.md`;

    const remoteSkillMd = `---
name: gh-skill
description: Loaded from GitHub
---

Body from **SKILL.md**
`;

    const commitSha = "abc123def456";

    globalThis.fetch = jest.fn(async (url: string) => {
      if (url.includes(`/repos/${org}/${repo}/commits/v1.0.0`)) {
        return { ok: true, json: async () => ({ sha: commitSha }) };
      }
      if (url === apiDir) {
        return {
          ok: true,
          json: async (): Promise<unknown[]> => [
            {
              name: "SKILL.md",
              path: `${remotePath}/SKILL.md`,
              type: "file",
              download_url: rawSkill,
            },
          ],
        };
      }
      if (url === rawSkill) {
        return { ok: true, text: async (): Promise<string> => remoteSkillMd };
      }
      return { ok: false, status: 404, text: async (): Promise<string> => "not found" };
    }) as unknown as typeof fetch;

    const entry: SkillDefinition = {
      name: "gh-skill",
      description: "Placeholder until fetch",
      source: {
        registry: "github",
        org,
        repo,
        path: remotePath,
        version: "v1.0.0",
      },
    };

    const { skills: result } = await resolveAllSkills([entry], skillsDir, cacheDir);
    expect(result[0].name).toBe("gh-skill");
    expect(result[0].description).toBe("Loaded from GitHub");
    expect(result[0].instructions).toContain("Body from **SKILL.md**");
  });
});
