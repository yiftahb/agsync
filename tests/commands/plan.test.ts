import { mkdtemp, writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { buildSyncPlan } from "@/commands/sync";
import { runPlan, formatPlan } from "@/commands/plan";
import type { SyncPlan } from "@/types";

let tempDir: string;

function skillMd(frontmatter: Record<string, unknown>, body: string): string {
  return `---\n${toYaml(frontmatter).trim()}\n---\n\n${body}\n`;
}

function agentsThreeWay(): Record<string, unknown> {
  return {
    claude: {
      instructions: { enabled: true },
      skills: { enabled: true },
      mcp: { enabled: true },
    },
    codex: {
      instructions: { enabled: true },
      skills: { enabled: true },
      mcp: { enabled: true },
    },
    cursor: {
      skills: { enabled: true },
      mcp: { enabled: true },
    },
  };
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-plan-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

async function setupProject(dir: string) {
  const skillDir = join(dir, ".agsync", "skills", "helper");
  await mkdir(skillDir, { recursive: true });
  await mkdir(join(dir, ".agsync", "mcp"), { recursive: true });

  await writeFile(
    join(dir, "agsync.yaml"),
    toYaml({
      version: "1",
      features: { instructions: true, skills: true, commands: true, mcp: true },
      agents: agentsThreeWay(),
      skills: [{ path: ".agsync/skills/*" }],
      commands: [],
      mcp: [{ path: ".agsync/mcp/*.yaml" }],
    })
  );

  await writeFile(
    join(skillDir, "SKILL.md"),
    skillMd(
      { name: "helper", description: "A helpful assistant" },
      "Help the user with coding tasks"
    )
  );

  await writeFile(
    join(dir, ".agsync", "mcp", "server.yaml"),
    toYaml({
      name: "my-mcp",
      description: "MCP Server",
      command: "node",
      args: ["server.js"],
    })
  );
}

describe("buildSyncPlan", () => {
  it("marks skills as create for a fresh project", async () => {
    await setupProject(tempDir);
    const plan = await buildSyncPlan(tempDir);

    expect(plan.skills).toEqual([{ name: "helper", operation: "create" }]);
  });

  it("marks skills as update when output dirs already exist", async () => {
    await setupProject(tempDir);
    await mkdir(join(tempDir, ".agents", "skills", "helper"), { recursive: true });
    await writeFile(join(tempDir, ".agents", "skills", "helper", "SKILL.md"), "old");

    const plan = await buildSyncPlan(tempDir);

    expect(plan.skills).toEqual([{ name: "helper", operation: "update" }]);
  });

  it("marks stale skills as delete", async () => {
    await setupProject(tempDir);
    await mkdir(join(tempDir, ".agents", "skills", "old-skill"), { recursive: true });
    await writeFile(join(tempDir, ".agents", "skills", "old-skill", "SKILL.md"), "old");

    const plan = await buildSyncPlan(tempDir);

    const deletes = plan.skills.filter((s) => s.operation === "delete");
    expect(deletes).toEqual([{ name: "old-skill", operation: "delete" }]);
  });

  it("plans file creation for skill files, AGENTS.md, agent outputs, and skill symlinks", async () => {
    await setupProject(tempDir);
    const plan = await buildSyncPlan(tempDir);

    const paths = plan.files.map((f) => f.path);
    expect(paths).toContainEqual(join(tempDir, ".agents", "skills", "helper", "SKILL.md"));
    expect(paths).toContainEqual(join(tempDir, "AGENTS.md"));
    expect(paths).toContainEqual(join(tempDir, "CLAUDE.md"));
    expect(paths).toContainEqual(join(tempDir, ".claude", "settings.json"));
    expect(paths).toContainEqual(join(tempDir, ".cursor", "mcp.json"));

    const symlinkEntry = plan.files.find((f) => f.path === join(tempDir, ".claude", "skills"));
    expect(symlinkEntry).toBeDefined();
    expect(symlinkEntry!.symlink).toBe(join("..", ".agents", "skills"));
  });

  it("plans updates when AGENTS.md exists and generated content differs", async () => {
    await setupProject(tempDir);
    await writeFile(join(tempDir, ".agsync", "instructions.md"), "# Project intro\n");
    await writeFile(join(tempDir, "AGENTS.md"), "# Stale root\n");

    const plan = await buildSyncPlan(tempDir);

    const agentsMd = plan.files.find((f) => f.path === join(tempDir, "AGENTS.md"));
    expect(agentsMd).toBeDefined();
    expect(agentsMd!.operation).toBe("update");
    expect(agentsMd!.existing).toBe("# Stale root\n");
    expect(agentsMd!.content).toContain("# Project intro");
    expect(agentsMd!.content).toContain("<!-- agsync:begin -->");
  });

  it("does not write to disk", async () => {
    await setupProject(tempDir);
    await buildSyncPlan(tempDir);

    let agentsExists = true;
    try {
      await readFile(join(tempDir, "AGENTS.md"), "utf-8");
    } catch {
      agentsExists = false;
    }
    expect(agentsExists).toBe(false);
  });

  it("plans .windsurf/skills symlink when windsurf has skills enabled", async () => {
    await setupProject(tempDir);
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        features: { instructions: true, skills: true, commands: true, mcp: true },
        agents: {
          codex: { skills: { enabled: true }, mcp: { enabled: true } },
          windsurf: { skills: { enabled: true } },
        },
        skills: [{ path: ".agsync/skills/*" }],
        commands: [],
        mcp: [{ path: ".agsync/mcp/*.yaml" }],
      })
    );

    const plan = await buildSyncPlan(tempDir);

    const symlinkEntry = plan.files.find((f) => f.path === join(tempDir, ".windsurf", "skills"));
    expect(symlinkEntry).toBeDefined();
    expect(symlinkEntry!.symlink).toBe(join("..", ".agents", "skills"));
  });

  it("does not plan .windsurf/skills symlink when windsurf is not configured", async () => {
    await setupProject(tempDir);
    const plan = await buildSyncPlan(tempDir);

    const symlinkEntry = plan.files.find((f) => f.path === join(tempDir, ".windsurf", "skills"));
    expect(symlinkEntry).toBeUndefined();
  });

  it("does not plan CLAUDE.md when claude is not in agents config", async () => {
    await setupProject(tempDir);
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        features: { instructions: true, skills: true, commands: true, mcp: true },
        agents: {
          codex: { skills: { enabled: true }, mcp: { enabled: true } },
        },
        skills: [{ path: ".agsync/skills/*" }],
        commands: [],
        mcp: [{ path: ".agsync/mcp/*.yaml" }],
      })
    );

    const plan = await buildSyncPlan(tempDir);
    const claudeMd = plan.files.find((f) => f.path === join(tempDir, "CLAUDE.md"));
    expect(claudeMd).toBeUndefined();
  });

  it("does not throw on missing env vars", async () => {
    delete process.env.AGSYNC_PLAN_TEST_VAR;
    await setupProject(tempDir);
    await writeFile(
      join(tempDir, ".agsync", "mcp", "env-tool.yaml"),
      toYaml({
        name: "env-tool",
        description: "Tool with env var",
        command: "node",
        env: { TOKEN: "$AGSYNC_PLAN_TEST_VAR" },
      })
    );

    const plan = await runPlan(tempDir);
    expect(plan.skills.length).toBeGreaterThan(0);
  });

  it("throws on validation errors", async () => {
    const skillDir = join(tempDir, ".agsync", "skills", "bad");
    await mkdir(skillDir, { recursive: true });

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        features: { instructions: true, skills: true, commands: true, mcp: true },
        agents: { codex: { skills: { enabled: true } } },
        skills: [{ path: ".agsync/skills/*" }],
        commands: [],
        mcp: [],
      })
    );

    await writeFile(
      join(skillDir, "SKILL.md"),
      skillMd(
        { name: "bad", description: "Bad", tools: ["nonexistent"] },
        "Bad"
      )
    );

    await expect(buildSyncPlan(tempDir)).rejects.toThrow("Validation failed");
  });

  it("detects stale skills in canonical output dir", async () => {
    await setupProject(tempDir);
    await mkdir(join(tempDir, ".agents", "skills", "stale-skill"), { recursive: true });
    await writeFile(join(tempDir, ".agents", "skills", "stale-skill", "SKILL.md"), "x");

    const plan = await buildSyncPlan(tempDir);
    const deletes = plan.skills.filter((s) => s.operation === "delete");
    expect(deletes.some((s) => s.name === "stale-skill")).toBe(true);
  });
});

describe("formatPlan", () => {
  it("formats skill creates, updates, and deletes", () => {
    const plan: SyncPlan = {
      skills: [
        { name: "new-skill", operation: "create" },
        { name: "existing", operation: "update" },
        { name: "old", operation: "delete" },
      ],
      files: [],
      skillOutputDirs: [],
      canonicalSkillsDir: "/project/.agsync/skills",
      warnings: [],
    };
    const output = formatPlan(plan, "/project");

    expect(output).toContain("+ new-skill (create)");
    expect(output).toContain("~ existing (update)");
    expect(output).toContain("- old (delete)");
    expect(output).toContain("3 skill(s): 1 create, 1 update, 1 delete");
  });

  it("formats file changes alongside skills", () => {
    const plan: SyncPlan = {
      skills: [{ name: "s", operation: "create" }],
      files: [
        { path: "/project/AGENTS.md", content: "x", existing: "", operation: "create" },
      ],
      skillOutputDirs: [],
      canonicalSkillsDir: "/project/.agsync/skills",
      warnings: [],
    };
    const output = formatPlan(plan, "/project");

    expect(output).toContain("Skills:");
    expect(output).toContain("Files:");
    expect(output).toContain("+ AGENTS.md");
  });

  it("formats symlink entries distinctly", () => {
    const plan: SyncPlan = {
      skills: [{ name: "s", operation: "create" }],
      files: [
        {
          path: "/project/.claude/skills",
          content: "",
          existing: "",
          operation: "create",
          symlink: join("..", ".agents", "skills"),
        },
      ],
      skillOutputDirs: [],
      canonicalSkillsDir: "/project/.agsync/skills",
      warnings: [],
    };
    const output = formatPlan(plan, "/project");

    expect(output).toContain("(symlink)");
    expect(output).toContain(join("..", ".agents", "skills"));
  });

  it("reports no changes when plan is empty", () => {
    const output = formatPlan(
      {
        skills: [],
        files: [],
        skillOutputDirs: [],
        canonicalSkillsDir: "/project/.agsync/skills",
        warnings: [],
      },
      "/project"
    );
    expect(output).toContain("No changes needed");
  });
});

describe("runPlan", () => {
  it("returns the plan without writing to disk", async () => {
    await setupProject(tempDir);
    const plan = await runPlan(tempDir);

    expect(plan.skills.length).toBeGreaterThan(0);
    expect(plan.skills.every((s) => s.operation)).toBe(true);
  });

  it("fails when symlink target is a non-empty directory", async () => {
    await setupProject(tempDir);
    await mkdir(join(tempDir, ".claude", "skills"), { recursive: true });
    await writeFile(join(tempDir, ".claude", "skills", "existing.md"), "real content");

    await expect(runPlan(tempDir)).rejects.toThrow(/non-empty directory/);
  });
});
