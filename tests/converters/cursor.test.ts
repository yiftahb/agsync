import { CursorConverter } from "@/converters/cursor";
import type { ResolvedConfig } from "@/types";

describe("CursorConverter", () => {
  const converter = new CursorConverter();

  it("has the correct name", () => {
    expect(converter.name).toBe("cursor");
  });

  it("generates mcp.json for MCP tools", () => {
    const config: ResolvedConfig = {
      targets: ["cursor"],
      skills: [],
      tools: [
        {
          name: "server",
          description: "MCP Server",
          type: "mcp",
          command: "node",
          args: ["index.js"],
        },
      ],
    };

    const output = converter.convert(config, "/project");
    const mcpFile = output.files.find((f) => f.path.endsWith("mcp.json"));
    expect(mcpFile).toBeDefined();
    const parsed = JSON.parse(mcpFile!.content);
    expect(parsed.mcpServers.server.command).toBe("node");
  });

  it("returns no files when there are no MCP tools", () => {
    const config: ResolvedConfig = {
      targets: ["cursor"],
      skills: [
        {
          name: "test",
          description: "Test",
          instructions: "Test",
          tools: [],
          extendsChain: ["test"],
        },
      ],
      tools: [],
    };

    const output = converter.convert(config, "/project");
    expect(output.files).toHaveLength(0);
  });
});
