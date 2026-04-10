import { mkdtemp, writeFile, mkdir, readFile, rm, readdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { runSync } from "@/commands/sync";

const SKILL_MD_CONTENT = `---
name: code-reviewer
description: |
  Thorough code review with focus on security, performance, and best practices.
license: MIT
metadata:
  author: awesome-llm-apps
  version: "2.0.0"
---

# Code Reviewer

You are an expert code reviewer.

## Available Rules

- [SQL Injection Prevention](rules/security-sql-injection.md)
- [XSS Prevention](rules/security-xss-prevention.md)
`;

const AGENTS_MD_CONTENT =
  "# Code Reviewer Rules\n\nDetailed compilation of all review rules.";

const RULE_FILES: Record<string, string> = {
  "correctness-error-handling.md":
    "# Correctness: Error Handling\n\nAlways handle errors properly.",
  "maintainability-naming.md":
    "# Maintainability: Naming\n\nUse meaningful variable names.",
  "maintainability-type-hints.md":
    "# Maintainability: Type Hints\n\nAdd type hints to functions.",
  "performance-n-plus-one.md":
    "# Performance: N+1\n\nAvoid N+1 query problems.",
  "security-sql-injection.md":
    "# Security: SQL Injection\n\nUse parameterized queries.",
  "security-xss-prevention.md":
    "# Security: XSS Prevention\n\nSanitize user input.",
};

const ORG = "TestOrg";
const REPO = "test-repo";
const REMOTE_PATH = "awesome_agent_skills/code-reviewer";
const RAW_BASE = `https://raw.githubusercontent.com/${ORG}/${REPO}/main`;

function mockDirectoryListing() {
  return [
    {
      name: "AGENTS.md",
      path: `${REMOTE_PATH}/AGENTS.md`,
      type: "file",
      download_url: `${RAW_BASE}/${REMOTE_PATH}/AGENTS.md`,
    },
    {
      name: "SKILL.md",
      path: `${REMOTE_PATH}/SKILL.md`,
      type: "file",
      download_url: `${RAW_BASE}/${REMOTE_PATH}/SKILL.md`,
    },
    {
      name: "rules",
      path: `${REMOTE_PATH}/rules`,
      type: "dir",
      download_url: null,
    },
  ];
}

function mockRulesListing() {
  return Object.keys(RULE_FILES).map((name) => ({
    name,
    path: `${REMOTE_PATH}/rules/${name}`,
    type: "file" as const,
    download_url: `${RAW_BASE}/${REMOTE_PATH}/rules/${name}`,
  }));
}

function createMockFetch() {
  return jest.fn(async (url: string) => {
    const apiBase = `https://api.github.com/repos/${ORG}/${REPO}/contents`;

    if (url === `${apiBase}/${REMOTE_PATH}`) {
      return { ok: true, json: async () => mockDirectoryListing() };
    }

    if (url === `${apiBase}/${REMOTE_PATH}/rules`) {
      return { ok: true, json: async () => mockRulesListing() };
    }

    if (url === `${RAW_BASE}/${REMOTE_PATH}/SKILL.md`) {
      return { ok: true, text: async () => SKILL_MD_CONTENT };
    }

    if (url === `${RAW_BASE}/${REMOTE_PATH}/AGENTS.md`) {
      return { ok: true, text: async () => AGENTS_MD_CONTENT };
    }

    for (const [name, content] of Object.entries(RULE_FILES)) {
      if (url === `${RAW_BASE}/${REMOTE_PATH}/rules/${name}`) {
        return { ok: true, text: async () => content };
      }
    }

    return { ok: false, status: 404, text: async () => "Not found" };
  });
}

let tempDir: string;
let originalFetch: typeof globalThis.fetch;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-supporting-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
  originalFetch = globalThis.fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await rm(tempDir, { recursive: true, force: true });
});

async function setupSourceSkillProject(dir: string) {
  const skillDir = join(dir, ".agsync", "skills", "code-reviewer");
  await mkdir(skillDir, { recursive: true });

  await writeFile(
    join(dir, "agsync.yaml"),
    toYaml({
      version: "1",
      targets: ["claude-code", "codex"],
      skills: [{ path: ".agsync/skills/*" }],
      tools: [],
    })
  );

  await writeFile(
    join(skillDir, "code-reviewer.yaml"),
    toYaml({
      name: "code-reviewer",
      description:
        "Thorough code review with focus on security, performance, and best practices.",
      source: {
        registry: "github",
        org: ORG,
        repo: REPO,
        path: REMOTE_PATH,
      },
    })
  );
}

describe("sync supporting files", () => {
  it("copies rules/ directory to canonical .agents/skills output", async () => {
    globalThis.fetch = createMockFetch() as unknown as typeof fetch;
    await setupSourceSkillProject(tempDir);
    await runSync(tempDir);

    const rulesDir = join(tempDir, ".agents", "skills", "code-reviewer", "rules");
    const ruleFiles = await readdir(rulesDir);
    expect(ruleFiles.sort()).toEqual(Object.keys(RULE_FILES).sort());

    for (const [name, expectedContent] of Object.entries(RULE_FILES)) {
      const content = await readFile(join(rulesDir, name), "utf-8");
      expect(content).toBe(expectedContent);
    }
  });

  it("makes rules/ accessible through .claude/skills symlink", async () => {
    globalThis.fetch = createMockFetch() as unknown as typeof fetch;
    await setupSourceSkillProject(tempDir);
    await runSync(tempDir);

    const s = await lstat(join(tempDir, ".claude", "skills"));
    expect(s.isSymbolicLink()).toBe(true);

    const rulesDir = join(tempDir, ".claude", "skills", "code-reviewer", "rules");
    const ruleFiles = await readdir(rulesDir);
    expect(ruleFiles.sort()).toEqual(Object.keys(RULE_FILES).sort());

    for (const [name, expectedContent] of Object.entries(RULE_FILES)) {
      const content = await readFile(join(rulesDir, name), "utf-8");
      expect(content).toBe(expectedContent);
    }
  });

  it("copies AGENTS.md to canonical dir alongside SKILL.md", async () => {
    globalThis.fetch = createMockFetch() as unknown as typeof fetch;
    await setupSourceSkillProject(tempDir);
    await runSync(tempDir);

    const outputBase = join(tempDir, ".agents", "skills", "code-reviewer");

    const agentsMd = await readFile(join(outputBase, "AGENTS.md"), "utf-8");
    expect(agentsMd).toBe(AGENTS_MD_CONTENT);

    const skillMd = await readFile(join(outputBase, "SKILL.md"), "utf-8");
    expect(skillMd).toContain("name: code-reviewer");
    expect(skillMd).toContain("You are an expert code reviewer.");
  });

  it("does not copy the YAML stub to output dir", async () => {
    globalThis.fetch = createMockFetch() as unknown as typeof fetch;
    await setupSourceSkillProject(tempDir);
    await runSync(tempDir);

    const entries = await readdir(
      join(tempDir, ".agents", "skills", "code-reviewer")
    );
    expect(entries).not.toContain("code-reviewer.yaml");
  });

  it("downloads supporting files to canonical .agsync dir during resolve", async () => {
    globalThis.fetch = createMockFetch() as unknown as typeof fetch;
    await setupSourceSkillProject(tempDir);
    await runSync(tempDir);

    const canonicalRules = join(
      tempDir,
      ".agsync",
      "skills",
      "code-reviewer",
      "rules"
    );
    const files = await readdir(canonicalRules);
    expect(files.sort()).toEqual(Object.keys(RULE_FILES).sort());
  });

  it("includes copied files in the written output", async () => {
    globalThis.fetch = createMockFetch() as unknown as typeof fetch;
    await setupSourceSkillProject(tempDir);
    const { written } = await runSync(tempDir);

    const ruleRelated = written.filter((p) => p.includes("rules/"));
    expect(ruleRelated.length).toBeGreaterThanOrEqual(Object.keys(RULE_FILES).length);
  });
});
