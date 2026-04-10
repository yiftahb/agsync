export type TargetClient = "claude-code" | "codex" | "cursor";

export interface ToolDefinition {
  name: string;
  description: string;
  type: "mcp" | "cli" | "builtin";
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface SkillSource {
  registry: string;
  org: string;
  repo: string;
  path: string;
  ref?: string;
}

export interface SkillDefinition {
  name: string;
  description: string;
  extends?: string[];
  instructions?: string;
  tools?: string[];
  source?: SkillSource;
}

export interface ResolvedSkill {
  name: string;
  description: string;
  instructions: string;
  tools: string[];
  extendsChain: string[];
}

export interface AgsyncConfig {
  version: string;
  targets: TargetClient[];
  skills: { path: string }[];
  tools: { path: string }[];
}

export interface LoadedConfig {
  config: AgsyncConfig;
  skills: SkillDefinition[];
  tools: ToolDefinition[];
  configPath: string;
}

export interface ResolvedConfig {
  targets: TargetClient[];
  skills: ResolvedSkill[];
  tools: ToolDefinition[];
}

export interface ConvertedFile {
  path: string;
  content: string;
  symlink?: string;
}

export interface ConvertedOutput {
  files: ConvertedFile[];
}

export type PlannedOperation = "create" | "update" | "delete" | "unchanged";

export interface PlannedSkill {
  name: string;
  operation: PlannedOperation;
}

export interface PlannedFile {
  path: string;
  content: string;
  operation: PlannedOperation;
  existing: string;
  symlink?: string;
}

export interface SyncPlan {
  skills: PlannedSkill[];
  files: PlannedFile[];
  skillOutputDirs: string[];
  canonicalSkillsDir: string;
  warnings: string[];
}

export interface DoctorCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface ValidationError {
  file: string;
  message: string;
  severity?: "error" | "warn";
}
