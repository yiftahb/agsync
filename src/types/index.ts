import type {
  LockEntry as _LockEntry,
  LockFile as _LockFile,
} from "@/lock/schema";

export type LockEntry = _LockEntry;
export type LockFile = _LockFile;

export type McpSerializationFormat = "json" | "toml";

export interface McpFormat {
  format: McpSerializationFormat;
  root_key: string;
}

export interface AgentFeatureConfig {
  enabled: boolean;
  destination: string;
  type: "symlink" | "generated";
  merge_strategy?: "merge" | "override";
}

export interface AgentMcpFeatureConfig extends AgentFeatureConfig {
  mcp_format: McpFormat;
}

export interface UserAgentFeatureConfig {
  enabled: boolean;
  destination?: string;
  merge_strategy?: "merge" | "override";
}

export interface UserAgentConfig {
  instructions?: UserAgentFeatureConfig;
  skills?: UserAgentFeatureConfig;
  commands?: UserAgentFeatureConfig;
  mcp?: UserAgentFeatureConfig;
}

export interface AgentConfig {
  instructions?: AgentFeatureConfig;
  skills?: AgentFeatureConfig;
  commands?: AgentFeatureConfig;
  mcp?: AgentMcpFeatureConfig;
}

export interface AgentDefinition {
  name: string;
  description: string;
  features: AgentConfig;
}

export interface ToolDefinition {
  name: string;
  description: string;
  type: "mcp" | "cli" | "builtin";
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface GitHubSource {
  registry: "github";
  org: string;
  repo: string;
  path: string;
  version: string;
}

export interface ClawHubSource {
  registry: "clawhub";
  slug: string;
  version: string;
}

export type SkillSource = GitHubSource | ClawHubSource;

export interface SkillDefinition {
  name: string;
  description: string;
  extends?: string[];
  instructions?: string;
  tools?: string[];
  source?: SkillSource;
  scope?: string;
  sourceDir?: string;
}

export interface ResolvedSkill {
  name: string;
  description: string;
  instructions: string;
  tools: string[];
  extendsChain: string[];
  scope?: string;
  sourceDir?: string;
}

export interface CommandDefinition {
  name: string;
  content: string;
  scope?: string;
}

export interface GlobalFeatures {
  instructions: boolean;
  skills: boolean;
  commands: boolean;
  mcp: boolean;
}

export type GitignoreMode = "on" | "off" | "mcpOnly";

export interface AgsyncConfig {
  version: string;
  features: GlobalFeatures;
  gitignore: GitignoreMode;
  agents: Record<string, Partial<UserAgentConfig>>;
  skills: { path: string }[];
  commands: { path: string }[];
  tools: { path: string }[];
}

export interface ResolvedAgentConfig {
  [agentName: string]: AgentConfig;
}

export interface ScopedContent {
  scope: string;
  dir: string;
  instructions: string;
  skills: SkillDefinition[];
  commands: CommandDefinition[];
  tools: ToolDefinition[];
}

export interface LoadedConfig {
  config: AgsyncConfig;
  skills: SkillDefinition[];
  commands: CommandDefinition[];
  tools: ToolDefinition[];
  configPath: string;
  scopes: ScopedContent[];
}

export interface ResolvedConfig {
  agents: ResolvedAgentConfig;
  skills: ResolvedSkill[];
  commands: CommandDefinition[];
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
  sourceDir?: string;
}

export interface PlannedFile {
  path: string;
  content: string;
  operation: PlannedOperation;
  existing: string;
  symlink?: string;
}

export interface LockUpdateEntry {
  registry: string;
  version: string;
  resolved: string;
  integrity: string;
  fetchedAt: string;
}

export interface LockUpdates {
  sources: Record<string, LockUpdateEntry>;
  extends: Record<string, LockUpdateEntry>;
}

export interface SyncPlan {
  skills: PlannedSkill[];
  files: PlannedFile[];
  skillOutputDirs: string[];
  canonicalSkillsDir: string;
  warnings: string[];
  lockUpdates?: LockUpdates;
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

export interface FetchedSkill {
  skillMd: string;
  supportingFiles: { path: string; content: string }[];
  resolvedVersion: string;
  integrity: string;
}

export type PartialSkillSource = Record<string, unknown> & { registry: string; version?: string };

export interface SkillRegistry {
  name: string;
  fetch(source: SkillSource): Promise<FetchedSkill>;
  resolveLatest(source: PartialSkillSource): Promise<string>;
}

export interface ResolveOptions {
  lock?: LockFile | null;
  frozen?: boolean;
}

export interface ResolveResult {
  skills: ResolvedSkill[];
  lockUpdates: { sources: Record<string, LockEntry>; extends: Record<string, LockEntry> };
}

export interface GitHubContentEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

export interface GitHubSearchResult {
  total_count: number;
  items: { name: string; path: string; repository: { full_name: string } }[];
}

export interface EnvWarning {
  tool: string;
  key: string;
  varName: string;
}

export interface EnvReference {
  tool: string;
  key: string;
  varName: string;
}

