import { mkdtemp, writeFile, mkdir, readFile, lstat, readlink, rm } from "node:fs/promises";
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

async function setupProject(dir: string) {
  const skillDir = join(dir, ".agsync", "skills", "helper");
  await mkdir(skillDir, { recursive: true });
  await mkdir(join(dir, ".agsync", "tools"), { recursive: true });

  await writeFile(
    join(dir, "agsync.yaml"),
    toYaml({
      version: "1",
      targets: ["claude-code", "codex", "cursor"],
      skills: [{ path: ".agsync/skills/*" }],
      tools: [{ path: ".agsync/tools/*.yaml" }],
    })
  );

  await writeFile(
    join(skillDir, "helper.yaml"),
    toYaml({
      name: "helper",
      description: "A helpful assistant",
      instructions: "Help the user with coding tasks",
    })
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
  it("injects agsync section into AGENTS.md", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(join(tempDir, "AGENTS.md"), "utf-8");
    expect(content).toContain("<!-- agsync:begin -->");
    expect(content).toContain("<!-- agsync:end -->");
    expect(content).toContain("### helper");
    expect(content).toContain("Help the user with coding tasks");
  });

  it("preserves existing content outside agsync markers", async () => {
    await setupProject(tempDir);
    await writeFile(join(tempDir, "AGENTS.md"), "# My Project\n\nCustom content.\n");

    await runSync(tempDir);

    const content = await readFile(join(tempDir, "AGENTS.md"), "utf-8");
    expect(content).toContain("# My Project");
    expect(content).toContain("Custom content.");
    expect(content).toContain("<!-- agsync:begin -->");
  });

  it("replaces existing agsync section on re-sync", async () => {
    await setupProject(tempDir);
    await writeFile(
      join(tempDir, "AGENTS.md"),
      "# Project\n\n<!-- agsync:begin -->\nold\n<!-- agsync:end -->\n\n## Notes\n"
    );

    await runSync(tempDir);

    const content = await readFile(join(tempDir, "AGENTS.md"), "utf-8");
    expect(content).toContain("# Project");
    expect(content).toContain("## Notes");
    expect(content).not.toContain("old\n<!-- agsync:end -->");
    expect(content).toContain("### helper");
  });

  it("creates CLAUDE.md as symlink to AGENTS.md", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const stat = await lstat(join(tempDir, "CLAUDE.md"));
    expect(stat.isSymbolicLink()).toBe(true);
    expect(await readlink(join(tempDir, "CLAUDE.md"))).toBe("AGENTS.md");
  });

  it("generates .agents/skills/<name>/SKILL.md for codex", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(
      join(tempDir, ".agents", "skills", "helper", "SKILL.md"),
      "utf-8"
    );
    expect(content).toContain("name: helper");
    expect(content).toContain("Help the user with coding tasks");
  });

  it("generates .claude/skills/<name>/SKILL.md", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(
      join(tempDir, ".claude", "skills", "helper", "SKILL.md"),
      "utf-8"
    );
    expect(content).toContain("name: helper");
    expect(content).toContain("Help the user with coding tasks");
  });

  it("generates .claude/settings.json with MCP config", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(join(tempDir, ".claude", "settings.json"), "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers["my-mcp"]).toBeDefined();
  });

  it("generates .cursor/mcp.json", async () => {
    await setupProject(tempDir);
    await runSync(tempDir);

    const content = await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8");
    const parsed = JSON.parse(content);
    expect(parsed.mcpServers["my-mcp"]).toBeDefined();
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
      await runSync(tempDir);

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

  it("throws when env variable is not set during sync", async () => {
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

    await expect(runSync(tempDir)).rejects.toThrow("AGSYNC_UNSET_VAR");
  });

  it("throws on validation errors", async () => {
    const skillDir = join(tempDir, ".agsync", "skills", "bad");
    await mkdir(skillDir, { recursive: true });

    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({ version: "1", targets: ["codex"], skills: [{ path: ".agsync/skills/*" }] })
    );

    await writeFile(
      join(skillDir, "bad.yaml"),
      toYaml({ name: "bad", description: "Bad", instructions: "Bad", tools: ["nonexistent"] })
    );

    await expect(runSync(tempDir)).rejects.toThrow("Validation failed");
  });
});
