import type { AgentDefinition, AgentConfig, AgentMcpFeatureConfig, AgsyncConfig, ResolvedAgentConfig, UserAgentConfig, GlobalFeatures } from "@/types";

const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  claude: {
    name: "claude",
    description: "Anthropic Claude Code",
    features: {
      instructions: { enabled: false, destination: "CLAUDE.md", type: "symlink" },
      skills: { enabled: false, destination: ".claude/skills", type: "symlink" },
      commands: { enabled: false, destination: ".claude/commands", type: "symlink" },
      mcp: {
        enabled: false,
        destination: ".claude/settings.json",
        type: "generated",
        merge_strategy: "merge",
        mcp_format: { format: "json", root_key: "mcpServers" },
      },
    },
  },
  cursor: {
    name: "cursor",
    description: "Cursor AI editor",
    features: {
      instructions: { enabled: false, destination: "AGENTS.md", type: "generated" },
      skills: { enabled: false, destination: ".cursor/skills", type: "symlink" },
      commands: { enabled: false, destination: ".cursor/commands", type: "symlink" },
      mcp: {
        enabled: false,
        destination: ".cursor/mcp.json",
        type: "generated",
        merge_strategy: "merge",
        mcp_format: { format: "json", root_key: "mcpServers" },
      },
    },
  },
  codex: {
    name: "codex",
    description: "OpenAI Codex CLI",
    features: {
      instructions: { enabled: false, destination: ".codex/instructions.md", type: "symlink" },
      skills: { enabled: false, destination: ".codex/skills", type: "symlink" },
      commands: { enabled: false, destination: ".codex/commands", type: "symlink" },
      mcp: {
        enabled: false,
        destination: ".codex/config.toml",
        type: "generated",
        merge_strategy: "merge",
        mcp_format: { format: "toml", root_key: "mcp_servers" },
      },
    },
  },
  windsurf: {
    name: "windsurf",
    description: "Windsurf (Cascade)",
    features: {
      instructions: { enabled: false, destination: "AGENTS.md", type: "generated" },
      skills: { enabled: false, destination: ".windsurf/skills", type: "symlink" },
      commands: { enabled: false, destination: ".windsurf/commands", type: "symlink" },
      mcp: {
        enabled: false,
        destination: ".windsurf/mcp_config.json",
        type: "generated",
        merge_strategy: "merge",
        mcp_format: { format: "json", root_key: "mcpServers" },
      },
    },
  },
  copilot: {
    name: "copilot",
    description: "GitHub Copilot",
    features: {
      instructions: { enabled: false, destination: ".github/copilot-instructions.md", type: "symlink" },
      commands: { enabled: false, destination: ".github/agents", type: "symlink" },
      mcp: {
        enabled: false,
        destination: ".mcp.json",
        type: "generated",
        merge_strategy: "merge",
        mcp_format: { format: "json", root_key: "mcpServers" },
      },
    },
  },
  gemini: {
    name: "gemini",
    description: "Google Gemini CLI",
    features: {
      instructions: { enabled: false, destination: "GEMINI.md", type: "symlink" },
      skills: { enabled: false, destination: ".gemini/skills", type: "symlink" },
      commands: { enabled: false, destination: ".gemini/commands", type: "symlink" },
      mcp: {
        enabled: false,
        destination: ".gemini/settings.json",
        type: "generated",
        merge_strategy: "merge",
        mcp_format: { format: "json", root_key: "mcpServers" },
      },
    },
  },
  opencode: {
    name: "opencode",
    description: "OpenCode AI",
    features: {
      instructions: { enabled: false, destination: "AGENTS.md", type: "generated" },
      skills: { enabled: false, destination: ".opencode/skills", type: "symlink" },
      commands: { enabled: false, destination: ".opencode/command", type: "symlink" },
      mcp: {
        enabled: false,
        destination: "opencode.json",
        type: "generated",
        merge_strategy: "merge",
        mcp_format: { format: "json", root_key: "mcp" },
      },
    },
  },
  antigravity: {
    name: "antigravity",
    description: "Antigravity AI CLI",
    features: {
      instructions: { enabled: false, destination: ".agent/rules/instructions.md", type: "symlink" },
      skills: { enabled: false, destination: ".agent/skills", type: "symlink" },
      commands: { enabled: false, destination: ".agent/commands", type: "symlink" },
    },
  },
};

type FeatureKey = "instructions" | "skills" | "commands" | "mcp";

export function resolveAgentConfig(
  userAgents: AgsyncConfig["agents"],
  globalFeatures?: GlobalFeatures
): ResolvedAgentConfig {
  const resolved: ResolvedAgentConfig = {};

  for (const [agentName, userOverrides] of Object.entries(userAgents)) {
    const registryDef = AGENT_REGISTRY[agentName];
    if (!registryDef) {
      throw new Error(`Unknown agent "${agentName}". Available: ${Object.keys(AGENT_REGISTRY).join(", ")}`);
    }

    const agentConfig: AgentConfig = {};
    const featureKeys: FeatureKey[] = ["instructions", "skills", "commands", "mcp"];
    const typedOverrides = userOverrides as Partial<UserAgentConfig>;

    for (const key of featureKeys) {
      const registryFeature = registryDef.features[key];
      const userFeature = typedOverrides[key];

      if (!registryFeature && !userFeature) continue;
      if (!registryFeature && userFeature) {
        throw new Error(`Agent "${agentName}" does not support feature "${key}"`);
      }

      const globallyEnabled = !globalFeatures || globalFeatures[key];

      if (key === "mcp") {
        const base = registryFeature as AgentMcpFeatureConfig;
        const enabled = globallyEnabled && (userFeature ? userFeature.enabled : base.enabled);
        agentConfig.mcp = {
          ...base,
          ...(userFeature ? {
            ...(userFeature.destination ? { destination: userFeature.destination } : {}),
            ...(userFeature.merge_strategy ? { merge_strategy: userFeature.merge_strategy } : {}),
          } : {}),
          enabled,
          mcp_format: base.mcp_format,
        };
      } else {
        const enabled = globallyEnabled && (userFeature ? userFeature.enabled : registryFeature!.enabled);
        agentConfig[key] = {
          ...registryFeature!,
          ...(userFeature ? {
            ...(userFeature.destination ? { destination: userFeature.destination } : {}),
            ...(userFeature.merge_strategy ? { merge_strategy: userFeature.merge_strategy } : {}),
          } : {}),
          enabled,
        };
      }
    }

    resolved[agentName] = agentConfig;
  }

  return resolved;
}

export function getEnabledAgents(resolved: ResolvedAgentConfig): string[] {
  return Object.entries(resolved)
    .filter(([, config]) =>
      config.instructions?.enabled ||
      config.skills?.enabled ||
      config.commands?.enabled ||
      config.mcp?.enabled
    )
    .map(([name]) => name);
}

export function getAgentRegistry(): Record<string, AgentDefinition> {
  return AGENT_REGISTRY;
}

export function getAgentNames(): string[] {
  return Object.keys(AGENT_REGISTRY);
}
