import { join } from "node:path";
import { ClaudeCodeConverter } from "@/converters/claude-code";
import type { ResolvedConfig } from "@/types";

describe("ClaudeCodeConverter", () => {
  const converter = new ClaudeCodeConverter();

  it("has the correct name", () => {
    expect(converter.name).toBe("claude-code");
  });

  it("does not generate skill files (handled by sync)", () => {
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
    const skillFiles = output.files.filter((f) => f.path.includes("skills"));
    expect(skillFiles).toHaveLength(0);
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

  it("does not include .claude/skills in output paths", () => {
    const paths = converter.getOutputPaths("/project");
    expect(paths).not.toContainEqual(join("/project", ".claude", "skills"));
    expect(paths).toContainEqual(join("/project", ".claude", "settings.json"));
  });
});
