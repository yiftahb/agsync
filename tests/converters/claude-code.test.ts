import { join } from "node:path";
import { ClaudeCodeConverter } from "@/converters/claude-code";
import type { ResolvedConfig } from "@/types";

describe("ClaudeCodeConverter", () => {
  const converter = new ClaudeCodeConverter();

  it("has the correct name", () => {
    expect(converter.name).toBe("claude-code");
  });

  it("generates per-skill markdown files under .claude/skills/", () => {
    const config: ResolvedConfig = {
      targets: ["claude-code"],
      skills: [
        {
          name: "reviewer",
          description: "Code reviewer",
          instructions: "Review code carefully",
          tools: [],
          extendsChain: ["reviewer"],
        },
      ],
      tools: [],
    };

    const output = converter.convert(config, "/project");
    const skillFiles = output.files.filter((f) => f.path.endsWith("SKILL.md"));
    expect(skillFiles).toHaveLength(1);
    expect(skillFiles[0].path).toBe(
      join("/project", ".claude", "skills", "reviewer", "SKILL.md")
    );
    expect(skillFiles[0].content).toContain("name: reviewer");
    expect(skillFiles[0].content).toContain("Review code carefully");
  });

  it("generates .claude/settings.json for MCP tools", () => {
    const config: ResolvedConfig = {
      targets: ["claude-code"],
      skills: [],
      tools: [
        {
          name: "my-server",
          description: "Test server",
          type: "mcp",
          command: "node",
          args: ["server.js"],
          env: { PORT: "3000" },
        },
      ],
    };

    const output = converter.convert(config, "/project");
    const settingsFile = output.files.find((f) => f.path.endsWith("settings.json"));
    expect(settingsFile).toBeDefined();

    const parsed = JSON.parse(settingsFile!.content);
    expect(parsed.mcpServers["my-server"]).toBeDefined();
    expect(parsed.mcpServers["my-server"].command).toBe("node");
  });

  it("returns no settings.json when there are no MCP tools", () => {
    const config: ResolvedConfig = {
      targets: ["claude-code"],
      skills: [
        {
          name: "test",
          description: "Test",
          instructions: "Test",
          tools: [],
          extendsChain: ["test"],
        },
      ],
      tools: [{ name: "grep", description: "Search", type: "cli", command: "grep" }],
    };

    const output = converter.convert(config, "/project");
    const settingsFile = output.files.find((f) => f.path.endsWith("settings.json"));
    expect(settingsFile).toBeUndefined();
  });
});
