import {
  agsyncConfigSchema,
  agentConfigSchema,
  agentFeatureConfigSchema,
  pathRefSchema,
  skillDefinitionSchema,
  skillMdFrontmatterSchema,
  skillSourceSchema,
  mcpDefinitionSchema,
} from "@/schema/config";

describe("pathRefSchema", () => {
  it("accepts a non-empty path", () => {
    expect(pathRefSchema.parse({ path: ".agsync/skills/*" })).toEqual({
      path: ".agsync/skills/*",
    });
  });

  it("rejects empty path", () => {
    expect(() => pathRefSchema.parse({ path: "" })).toThrow();
  });
});

describe("agentFeatureConfigSchema", () => {
  it("defaults enabled to false", () => {
    const result = agentFeatureConfigSchema.parse({});
    expect(result.enabled).toBe(false);
  });

  it("accepts optional destination and merge_strategy", () => {
    const result = agentFeatureConfigSchema.parse({
      enabled: true,
      destination: ".custom/out",
      merge_strategy: "override",
    });
    expect(result).toEqual({
      enabled: true,
      destination: ".custom/out",
      merge_strategy: "override",
    });
  });

  it("rejects invalid merge_strategy", () => {
    expect(() =>
      agentFeatureConfigSchema.parse({ enabled: true, merge_strategy: "replace" })
    ).toThrow();
  });
});

describe("agentConfigSchema", () => {
  it("accepts partial feature overrides", () => {
    const result = agentConfigSchema.parse({
      skills: { enabled: true },
      mcp: { enabled: false, merge_strategy: "merge" },
    });
    expect(result.skills?.enabled).toBe(true);
    expect(result.mcp?.merge_strategy).toBe("merge");
  });

  it("accepts empty object", () => {
    expect(agentConfigSchema.parse({})).toEqual({});
  });
});

describe("agsyncConfigSchema", () => {
  it("parses a valid config with agents and path refs", () => {
    const input = {
      version: "2",
      agents: {
        claude: { skills: { enabled: true } },
        cursor: { mcp: { enabled: false } },
      },
      skills: [{ path: ".agsync/skills/**/SKILL.md" }],
      commands: [{ path: ".agsync/commands/*.md" }],
      mcp: [{ path: ".agsync/mcp/*.yaml" }],
    };
    const result = agsyncConfigSchema.parse(input);
    expect(result.version).toBe("2");
    expect(result.agents.claude?.skills?.enabled).toBe(true);
    expect(result.skills).toHaveLength(1);
    expect(result.commands).toHaveLength(1);
    expect(result.mcp).toHaveLength(1);
  });

  it("applies defaults for version, agents, features, gitignore, and path arrays", () => {
    const result = agsyncConfigSchema.parse({});
    expect(result.version).toBe("1");
    expect(result.agents).toEqual({});
    expect(result.skills).toEqual([]);
    expect(result.commands).toEqual([]);
    expect(result.mcp).toEqual([]);
    expect(result.features).toEqual({
      instructions: false,
      skills: false,
      commands: false,
      mcp: false,
    });
    expect(result.gitignore).toBe("mcpOnly");
  });

  it("accepts explicit features and gitignore values", () => {
    const result = agsyncConfigSchema.parse({
      features: { instructions: true, skills: true, commands: false, mcp: false },
      gitignore: "on",
    });
    expect(result.features.instructions).toBe(true);
    expect(result.features.skills).toBe(true);
    expect(result.features.commands).toBe(false);
    expect(result.gitignore).toBe("on");
  });

  it("rejects invalid gitignore values", () => {
    expect(() => agsyncConfigSchema.parse({ gitignore: "auto" })).toThrow();
  });
});

describe("skillSourceSchema", () => {
  it("parses a github source with version", () => {
    const result = skillSourceSchema.parse({
      registry: "github",
      org: "acme",
      repo: "skills",
      path: "pack/reviewer",
      version: "v1.0.0",
    });
    expect(result.registry).toBe("github");
    if (result.registry === "github") {
      expect(result.org).toBe("acme");
      expect(result.version).toBe("v1.0.0");
    }
  });

  it("parses a clawhub source with version", () => {
    const result = skillSourceSchema.parse({
      registry: "clawhub",
      slug: "author/skill",
      version: "3.0.0",
    });
    expect(result.registry).toBe("clawhub");
    if (result.registry === "clawhub") {
      expect(result.slug).toBe("author/skill");
      expect(result.version).toBe("3.0.0");
    }
  });

  it("rejects source without version", () => {
    expect(() =>
      skillSourceSchema.parse({
        registry: "github",
        org: "acme",
        repo: "skills",
        path: "pack/reviewer",
      })
    ).toThrow();
  });
});

describe("skillMdFrontmatterSchema", () => {
  it("parses minimal frontmatter", () => {
    const result = skillMdFrontmatterSchema.parse({
      name: "reviewer",
      description: "Reviews PRs",
    });
    expect(result.name).toBe("reviewer");
    expect(result.extends).toBeUndefined();
    expect(result.tools).toBeUndefined();
    expect(result.source).toBeUndefined();
  });

  it("parses optional extends, tools, and source", () => {
    const result = skillMdFrontmatterSchema.parse({
      name: "imported",
      description: "Remote skill",
      extends: ["./base", "github:org/repo@v1"],
      tools: ["grep", "read_file"],
      source: { registry: "github", org: "o", repo: "r", path: "s", version: "v1.0.0" },
      license: "MIT",
      metadata: { author: "me", version: "1.0.0", extra: true },
    });
    expect(result.extends).toEqual(["./base", "github:org/repo@v1"]);
    expect(result.tools).toEqual(["grep", "read_file"]);
    expect(result.source?.registry).toBe("github");
    if (result.source?.registry === "github") {
      expect(result.source.repo).toBe("r");
    }
    expect(result.metadata).toMatchObject({ author: "me", extra: true });
  });
});

describe("skillDefinitionSchema", () => {
  it("parses a skill with extends and tools", () => {
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
      source: { registry: "github", org: "org", repo: "repo", path: "skills/imported", version: "v1.0.0" },
    };
    const result = skillDefinitionSchema.parse(input);
    expect(result.source?.registry).toBe("github");
    if (result.source?.registry === "github") {
      expect(result.source.org).toBe("org");
    }
  });

  it("accepts a skill without instructions", () => {
    const result = skillDefinitionSchema.parse({ name: "sourced", description: "remote skill" });
    expect(result.instructions).toBeUndefined();
  });
});

describe("mcpDefinitionSchema", () => {
  it("parses an MCP tool", () => {
    const input = {
      name: "my-server",
      description: "MCP server",
      type: "mcp",
      command: "node",
      args: ["server.js"],
      env: { API_KEY: "ref:secret" },
    };
    const result = mcpDefinitionSchema.parse(input);
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
    const result = mcpDefinitionSchema.parse(input);
    expect(result.type).toBe("cli");
  });

  it("parses a builtin tool", () => {
    const input = {
      name: "fs",
      description: "Built-in filesystem",
      type: "builtin",
    };
    expect(mcpDefinitionSchema.parse(input).type).toBe("builtin");
  });

  it("rejects unknown type", () => {
    expect(() =>
      mcpDefinitionSchema.parse({ name: "x", description: "x", type: "unknown" })
    ).toThrow();
  });
});
