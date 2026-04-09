import { z } from "zod";

export const targetClientSchema = z.enum(["claude-code", "codex", "cursor"]);

export const toolDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["mcp", "cli", "builtin"]),
  command: z.string().optional(),
  url: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export const skillSourceSchema = z.object({
  registry: z.string().min(1),
  org: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().min(1),
  ref: z.string().optional(),
});

export const skillDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  extends: z.array(z.string()).optional(),
  instructions: z.string().min(1),
  tools: z.array(z.string()).optional(),
  source: skillSourceSchema.optional(),
});

export const skillMdFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
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

export const agsyncConfigSchema = z.object({
  version: z.string().default("1"),
  targets: z.array(targetClientSchema).min(1),
  skills: z.array(pathRefSchema).default([]),
  tools: z.array(pathRefSchema).default([]),
});
