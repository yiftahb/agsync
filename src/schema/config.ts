import { z } from "zod";

export const mcpDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["stdio", "http"]).optional(),
  command: z.string().optional(),
  url: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
});

export const githubSourceSchema = z.object({
  registry: z.literal("github"),
  org: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().min(1),
  version: z.string().min(1),
});

export const clawhubSourceSchema = z.object({
  registry: z.literal("clawhub"),
  slug: z.string().min(1),
  version: z.string().min(1),
});

export const skillSourceSchema = z.discriminatedUnion("registry", [
  githubSourceSchema,
  clawhubSourceSchema,
]);

export const skillDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  extends: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  tools: z.array(z.string()).optional(),
  source: skillSourceSchema.optional(),
});

export const skillMdFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  extends: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  source: skillSourceSchema.optional(),
  scope: z.string().optional(),
  license: z.string().optional(),
  metadata: z
    .object({
      author: z.string().optional(),
      version: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const pathRefSchema = z.object({
  path: z.string().min(1),
});

export const agentFeatureConfigSchema = z.object({
  enabled: z.boolean().default(false),
  destination: z.string().optional(),
  merge_strategy: z.enum(["merge", "override"]).optional(),
});

export const agentConfigSchema = z.object({
  instructions: agentFeatureConfigSchema.optional(),
  skills: agentFeatureConfigSchema.optional(),
  commands: agentFeatureConfigSchema.optional(),
  mcp: agentFeatureConfigSchema.optional(),
});

export const globalFeaturesSchema = z.object({
  instructions: z.boolean().default(false),
  skills: z.boolean().default(false),
  commands: z.boolean().default(false),
  mcp: z.boolean().default(false),
});

export const agsyncConfigSchema = z.object({
  version: z.string().default("1"),
  features: globalFeaturesSchema.default({}),
  gitignore: z.enum(["on", "off", "mcpOnly"]).default("mcpOnly"),
  agents: z.record(agentConfigSchema).default({}),
  skills: z.array(pathRefSchema).default([]),
  commands: z.array(pathRefSchema).default([]),
  mcp: z.array(pathRefSchema).default([]),
});
