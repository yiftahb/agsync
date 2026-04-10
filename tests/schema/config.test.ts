import {
  agsyncConfigSchema,
  skillDefinitionSchema,
  toolDefinitionSchema,
  targetClientSchema,
} from "@/schema/config";

describe("targetClientSchema", () => {
  it("accepts valid targets", () => {
    expect(targetClientSchema.parse("claude-code")).toBe("claude-code");
    expect(targetClientSchema.parse("codex")).toBe("codex");
    expect(targetClientSchema.parse("cursor")).toBe("cursor");
  });

  it("rejects invalid targets", () => {
    expect(() => targetClientSchema.parse("vscode")).toThrow();
  });
});

describe("agsyncConfigSchema", () => {
  it("parses a valid config", () => {
    const input = {
      version: "1",
      targets: ["claude-code", "cursor"],
      skills: [{ path: ".agsync/skills/*" }],
      tools: [{ path: ".agsync/tools/*.yaml" }],
    };
    const result = agsyncConfigSchema.parse(input);
    expect(result.version).toBe("1");
    expect(result.targets).toEqual(["claude-code", "cursor"]);
    expect(result.skills).toHaveLength(1);
  });

  it("applies defaults for optional arrays", () => {
    const input = { targets: ["codex"] };
    const result = agsyncConfigSchema.parse(input);
    expect(result.version).toBe("1");
    expect(result.skills).toEqual([]);
    expect(result.tools).toEqual([]);
  });

  it("rejects config with no targets", () => {
    expect(() => agsyncConfigSchema.parse({ targets: [] })).toThrow();
  });
});

describe("skillDefinitionSchema", () => {
  it("parses a skill with extends", () => {
    const input = {
      name: "reviewer",
      description: "Code reviewer",
      extends: ["github:org/repo", "./base"],
      instructions: "Review code carefully",
      tools: ["grep"],
    };
    const result = skillDefinitionSchema.parse(input);
    expect(result.extends).toEqual(["github:org/repo", "./base"]);
    expect(result.tools).toEqual(["grep"]);
  });

  it("parses a skill without extends", () => {
    const input = {
      name: "helper",
      description: "General helper",
      instructions: "Help the user",
    };
    const result = skillDefinitionSchema.parse(input);
    expect(result.extends).toBeUndefined();
    expect(result.tools).toBeUndefined();
  });

  it("parses a skill with source", () => {
    const input = {
      name: "imported",
      description: "Imported skill",
      instructions: "Do things",
      source: { registry: "github", org: "org", repo: "repo", path: "skills/imported" },
    };
    const result = skillDefinitionSchema.parse(input);
    expect(result.source?.org).toBe("org");
  });

  it("accepts a skill without instructions (optional when source present)", () => {
    const result = skillDefinitionSchema.parse({ name: "sourced", description: "remote skill" });
    expect(result.instructions).toBeUndefined();
  });
});

describe("toolDefinitionSchema", () => {
  it("parses an MCP tool", () => {
    const input = {
      name: "my-server",
      description: "MCP server",
      type: "mcp",
      command: "node",
      args: ["server.js"],
      env: { API_KEY: "ref:secret" },
    };
    const result = toolDefinitionSchema.parse(input);
    expect(result.type).toBe("mcp");
    expect(result.args).toEqual(["server.js"]);
  });

  it("parses a CLI tool", () => {
    const input = {
      name: "grep",
      description: "Search tool",
      type: "cli",
      command: "grep",
    };
    const result = toolDefinitionSchema.parse(input);
    expect(result.type).toBe("cli");
  });

  it("rejects unknown type", () => {
    expect(() =>
      toolDefinitionSchema.parse({ name: "x", description: "x", type: "unknown" })
    ).toThrow();
  });
});
