import { join } from "node:path";
import { WindsurfConverter } from "@/converters/windsurf";
import type { ResolvedConfig } from "@/types";

describe("WindsurfConverter", () => {
  const converter = new WindsurfConverter();

  it("has the correct name", () => {
    expect(converter.name).toBe("windsurf");
  });

  it("generates .windsurf/mcp_config.json for MCP tools", () => {
    const config: ResolvedConfig = {
      targets: ["windsurf"],
      skills: [],
      tools: [
        {
          name: "server",
          description: "MCP Server",
          type: "mcp",
          command: "node",
          args: ["index.js"],
          env: { API_KEY: "test" },
        },
      ],
    };

    const output = converter.convert(config, "/project");
    const mcpFile = output.files.find((f) => f.path.endsWith("mcp_config.json"));
    expect(mcpFile).toBeDefined();
    const parsed = JSON.parse(mcpFile!.content);
    expect(parsed.mcpServers.server.command).toBe("node");
    expect(parsed.mcpServers.server.args).toEqual(["index.js"]);
    expect(parsed.mcpServers.server.env.API_KEY).toBe("test");
  });

  it("outputs to .windsurf/mcp_config.json not mcp.json", () => {
    const config: ResolvedConfig = {
      targets: ["windsurf"],
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
    const mcpFile = output.files[0];
    expect(mcpFile.path).toBe(join("/project", ".windsurf", "mcp_config.json"));
  });

  it("returns no files when there are no MCP tools", () => {
    const config: ResolvedConfig = {
      targets: ["windsurf"],
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

  it("returns correct output paths", () => {
    const paths = converter.getOutputPaths("/project");
    expect(paths).toContainEqual(join("/project", ".windsurf", "mcp_config.json"));
  });
});
