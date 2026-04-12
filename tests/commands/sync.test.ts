import {
  mkdtemp,
  writeFile,
  mkdir,
  readFile,
  rm,
  stat,
  lstat,
  readlink,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { runSync } from "@/commands/sync";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-sync-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const MANAGED = "managed by agsync";

function defaultAgents() {
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

async function setupProject(
  dir: string,
  agents?: Record<string, unknown>,
  extra?: Record<string, unknown>
) {
  const skillDir = join(dir, ".agsync", "skills", "test-skill");
  await mkdir(skillDir, { recursive: true });
  await mkdir(join(dir, ".agsync", "tools"), { recursive: true });

  await writeFile(
    join(dir, "agsync.yaml"),
    toYaml({
      version: "1",
      features: { instructions: true, skills: true, commands: true, mcp: true },
      agents: agents ?? defaultAgents(),
      skills: [{ path: ".agsync/skills/*" }],
      tools: [{ path: ".agsync/tools/*.yaml" }],
      ...extra,
    })
  );

  await writeFile(
    join(dir, ".agsync", "instructions.md"),
    "# Project\n\nCustom instructions from `.agsync/instructions.md`.\n"
  );

  await writeFile(
    join(skillDir, "SKILL.md"),
    `---
name: test-skill
description: A helpful assistant
---

Help the user with coding tasks
`
  );

  await writeFile(
    join(dir, ".agsync", "tools", "server.yaml"),
    toYaml({
      name: "my-mcp",
      description: "MCP Server",
      type: "mcp",
      command: "node",
      args: ["server.js"],
    })
  );
}

describe("runSync", () => {
  it("generates AGENTS.md with managed header, instructions, and skill listing", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(join(tempDir, "AGENTS.md"), "utf-8");
    expect(content).toContain(MANAGED);
    expect(content).toContain("<!-- agsync:begin -->");
    expect(content).toContain("<!-- agsync:end -->");
    expect(content).toContain("**test-skill**");
    expect(content).toContain(".agents/skills/");
    expect(content).toContain("Custom instructions from `.agsync/instructions.md`.");
  });

  it("writes .agents/skills/test-skill/SKILL.md with managed header", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(
      join(tempDir, ".agents", "skills", "test-skill", "SKILL.md"),
      "utf-8"
    );
    expect(content).toContain(MANAGED);
    expect(content).toContain("name: test-skill");
    expect(content).toContain("Help the user with coding tasks");
  });

  it("creates CLAUDE.md as a symlink to AGENTS.md when Claude instructions are enabled", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const s = await lstat(join(tempDir, "CLAUDE.md"));
    expect(s.isSymbolicLink()).toBe(true);
    expect(await readlink(join(tempDir, "CLAUDE.md"))).toBe("AGENTS.md");

    const viaSymlink = await readFile(join(tempDir, "CLAUDE.md"), "utf-8");
    expect(viaSymlink).toContain(MANAGED);
    expect(viaSymlink).toContain("**test-skill**");
  });

  it("does not create CLAUDE.md when Claude is not configured", async () => {
    await setupProject(tempDir, {
      codex: { skills: { enabled: true } },
      cursor: { skills: { enabled: true } },
    });
    await runSync(tempDir);

    await expect(stat(join(tempDir, "CLAUDE.md"))).rejects.toThrow();
  });

  it("creates .claude/skills as a symlink to ../.agents/skills", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const claudeSkills = join(tempDir, ".claude", "skills");
    const s = await lstat(claudeSkills);
    expect(s.isSymbolicLink()).toBe(true);
    expect(await readlink(claudeSkills)).toBe(join("..", ".agents", "skills"));
  });

  it("reads synced SKILL.md through the .claude/skills symlink", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(
      join(tempDir, ".claude", "skills", "test-skill", "SKILL.md"),
      "utf-8"
    );
    expect(content).toContain(MANAGED);
    expect(content).toContain("name: test-skill");
  });

  it("does not create .claude/skills when Claude skills are disabled", async () => {
    await setupProject(tempDir, {
      claude: { mcp: { enabled: true } },
      codex: { skills: { enabled: true } },
      cursor: { skills: { enabled: true } },
    });
    await runSync(tempDir);

    await expect(lstat(join(tempDir, ".claude", "skills"))).rejects.toThrow();
  });

  it("re-creates symlinks on re-sync", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);
    await runSync(tempDir);

    const s = await lstat(join(tempDir, ".claude", "skills"));
    expect(s.isSymbolicLink()).toBe(true);
  });

  it("generates Claude MCP JSON at .claude/settings.json", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(join(tempDir, ".claude", "settings.json"), "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers["my-mcp"]).toBeDefined();
  });

  it("generates Cursor MCP JSON at .cursor/mcp.json", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers["my-mcp"]).toBeDefined();
  });

  it("generates Codex MCP TOML at .codex/config.toml", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(join(tempDir, ".codex", "config.toml"), "utf-8");
    expect(content).toContain("mcp_servers");
    expect(content).toContain("my-mcp");
  });

  it("creates .windsurf/skills symlink when Windsurf skills are enabled", async () => {
    await setupProject(tempDir, {
      windsurf: { skills: { enabled: true } },
    });
    await runSync(tempDir);

    const windsurfSkills = join(tempDir, ".windsurf", "skills");
    const s = await lstat(windsurfSkills);
    expect(s.isSymbolicLink()).toBe(true);
    expect(await readlink(windsurfSkills)).toBe(join("..", ".agents", "skills"));
  });

  it("generates .windsurf/mcp_config.json when Windsurf MCP is enabled", async () => {
    await setupProject(tempDir, {
      windsurf: { mcp: { enabled: true } },
    });
    await runSync(tempDir);

    const content = await readFile(join(tempDir, ".windsurf", "mcp_config.json"), "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers["my-mcp"]).toBeDefined();
  });

  it("does not create .windsurf/skills when Windsurf is not configured", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    await expect(lstat(join(tempDir, ".windsurf", "skills"))).rejects.toThrow();
  });

  it("expands env variables in tool definitions", async () => {
    const saved = process.env.TEST_SYNC_SECRET;
    process.env.TEST_SYNC_SECRET = "expanded-value";
    try {
      await setupProject(tempDir);
      await writeFile(
        join(tempDir, ".agsync", "tools", "env-tool.yaml"),
        toYaml({
          name: "env-tool",
          description: "Tool with env var",
          type: "mcp",
          command: "node",
          args: ["server.js"],
          env: { TOKEN: "$TEST_SYNC_SECRET" },
        })
      );
      const { warnings } = await runSync(tempDir);
      expect(warnings).toHaveLength(0);

      const claude = JSON.parse(
        await readFile(join(tempDir, ".claude", "settings.json"), "utf-8")
      );
      expect(claude.mcpServers["env-tool"].env.TOKEN).toBe("expanded-value");

      const cursor = JSON.parse(
        await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8")
      );
      expect(cursor.mcpServers["env-tool"].env.TOKEN).toBe("expanded-value");
    } finally {
      if (saved === undefined) delete process.env.TEST_SYNC_SECRET;
      else process.env.TEST_SYNC_SECRET = saved;
    }
  });

  it("warns and writes empty string when env variable is not set", async () => {
    delete process.env.AGSYNC_UNSET_VAR;
    await setupProject(tempDir);
    await writeFile(
      join(tempDir, ".agsync", "tools", "bad-env.yaml"),
      toYaml({
        name: "bad-env",
        description: "Missing env",
        type: "mcp",
        command: "node",
        env: { KEY: "$AGSYNC_UNSET_VAR" },
      })
    );

    const { written, warnings } = await runSync(tempDir);
    expect(warnings.some((w) => w.includes("AGSYNC_UNSET_VAR"))).toBe(true);
    expect(written.length).toBeGreaterThan(0);

    const claude = JSON.parse(
      await readFile(join(tempDir, ".claude", "settings.json"), "utf-8")
    );
    expect(claude.mcpServers["bad-env"].env.KEY).toBe("");
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
        tools: [],
      })
    );

    await writeFile(
      join(skillDir, "SKILL.md"),
      `---
name: bad
description: Bad
tools:
  - nonexistent
---

Body
`
    );

    await expect(runSync(tempDir)).rejects.toThrow("Validation failed");
  });

  it("generates gitignore with mcpOnly mode by default", async () => {
    await setupProject(tempDir, defaultAgents(), { gitignore: "mcpOnly" });
    await runSync(tempDir);

    const gitignore = await readFile(join(tempDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("# agsync:begin");
    expect(gitignore).toContain("# agsync:end");
    expect(gitignore).toContain(".claude/settings.json");
    expect(gitignore).toContain(".cursor/mcp.json");
    expect(gitignore).toContain(".codex/config.toml");
    expect(gitignore).not.toContain("AGENTS.md");
  });

  it("generates gitignore with on mode including all output", async () => {
    await setupProject(tempDir, defaultAgents(), { gitignore: "on" });
    await runSync(tempDir);

    const gitignore = await readFile(join(tempDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("# agsync:begin");
    expect(gitignore).toContain("AGENTS.md");
    expect(gitignore).toContain(".agents/");
  });

  it("does not create gitignore with off mode", async () => {
    await setupProject(tempDir, defaultAgents(), { gitignore: "off" });
    await runSync(tempDir);

    await expect(stat(join(tempDir, ".gitignore"))).rejects.toThrow();
  });

  it("global features mask disables agent features", async () => {
    await setupProject(tempDir, defaultAgents(), {
      features: { instructions: true, skills: true, commands: true, mcp: false },
    });
    await runSync(tempDir);

    await expect(stat(join(tempDir, ".claude", "settings.json"))).rejects.toThrow();
    await expect(stat(join(tempDir, ".cursor", "mcp.json"))).rejects.toThrow();
  });
});
