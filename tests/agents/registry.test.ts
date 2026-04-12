import {
  getAgentNames,
  getAgentRegistry,
  getEnabledAgents,
  resolveAgentConfig,
} from "@/agents/registry";

const EXPECTED_AGENT_NAMES = [
  "antigravity",
  "claude",
  "codex",
  "copilot",
  "cursor",
  "gemini",
  "opencode",
  "windsurf",
];

describe("getAgentNames", () => {
  it("returns eight built-in agent ids", () => {
    const names = getAgentNames();
    expect(names).toHaveLength(8);
    expect([...names].sort()).toEqual(EXPECTED_AGENT_NAMES);
  });
});

describe("getAgentRegistry", () => {
  it("exposes definitions with destinations and types", () => {
    const registry = getAgentRegistry();
    expect(registry.claude.features.skills).toMatchObject({
      enabled: false,
      destination: ".claude/skills",
      type: "symlink",
    });
    expect(registry.claude.features.mcp).toMatchObject({
      destination: ".claude/settings.json",
      type: "generated",
      merge_strategy: "merge",
    });
    expect(registry.antigravity.features.mcp).toBeUndefined();
  });
});

describe("resolveAgentConfig", () => {
  it("merges user overrides with registry defaults for supported features", () => {
    const resolved = resolveAgentConfig({
      claude: { skills: { enabled: true, destination: ".claude/skills-custom" } },
    });
    expect(resolved.claude?.skills).toMatchObject({
      enabled: true,
      destination: ".claude/skills-custom",
      type: "symlink",
    });
    expect(resolved.claude?.mcp?.enabled).toBe(false);
    expect(resolved.claude?.mcp?.mcp_format).toEqual({
      format: "json",
      root_key: "mcpServers",
    });
  });

  it("throws for an unknown agent", () => {
    expect(() => resolveAgentConfig({ vscode: {} })).toThrow(/Unknown agent/);
  });

  it("throws when enabling a feature the agent does not support", () => {
    expect(() =>
      resolveAgentConfig({ copilot: { skills: { enabled: true } } })
    ).toThrow(/does not support feature "skills"/);
  });

  it("throws when the agent has no mcp support", () => {
    expect(() =>
      resolveAgentConfig({ antigravity: { mcp: { enabled: true } } })
    ).toThrow(/does not support feature "mcp"/);
  });

  it("returns an empty object when no agents are configured", () => {
    expect(resolveAgentConfig({})).toEqual({});
  });

  it("applies global feature masking — skills globally off overrides per-agent enabled", () => {
    const resolved = resolveAgentConfig(
      { claude: { skills: { enabled: true }, mcp: { enabled: true } } },
      { instructions: true, skills: false, commands: true, mcp: true }
    );
    expect(resolved.claude?.skills?.enabled).toBe(false);
    expect(resolved.claude?.mcp?.enabled).toBe(true);
  });

  it("respects all-false global features — nothing enabled", () => {
    const resolved = resolveAgentConfig(
      { claude: { instructions: { enabled: true }, skills: { enabled: true }, mcp: { enabled: true } } },
      { instructions: false, skills: false, commands: false, mcp: false }
    );
    expect(resolved.claude?.instructions?.enabled).toBe(false);
    expect(resolved.claude?.skills?.enabled).toBe(false);
    expect(resolved.claude?.mcp?.enabled).toBe(false);
  });

  it("does not mask when globalFeatures is omitted", () => {
    const resolved = resolveAgentConfig(
      { claude: { skills: { enabled: true } } }
    );
    expect(resolved.claude?.skills?.enabled).toBe(true);
  });
});

describe("getEnabledAgents", () => {
  it("lists agents with any enabled feature", () => {
    const resolved = resolveAgentConfig({
      claude: { skills: { enabled: true } },
      codex: { mcp: { enabled: false } },
      cursor: { mcp: { enabled: true } },
    });
    const enabled = getEnabledAgents(resolved).sort();
    expect(enabled).toEqual(["claude", "cursor"]);
  });

  it("returns empty when nothing is enabled", () => {
    const resolved = resolveAgentConfig({
      windsurf: { skills: { enabled: false } },
    });
    expect(getEnabledAgents(resolved)).toEqual([]);
  });
});
