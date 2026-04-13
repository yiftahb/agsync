import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { stringify as toYaml } from "yaml";
import { findNearestAgsyncDir, findNearestConfigFile } from "@/loader/config";
import { getRegistry } from "@/registries/index";
import { parseSkillMd } from "@/utils/github";
import { writeLockFile, readLockFile } from "@/lock/lock";
import type { SkillSource } from "@/types";

const GITHUB_PREFIX = "github:";
const CLAWHUB_PREFIX = "clawhub:";

function buildSkillMd(frontmatter: Record<string, unknown>, body?: string): string {
  const yaml = toYaml(frontmatter).trim();
  const parts = [`---`, yaml, `---`];
  if (body) {
    parts.push("", body);
  }
  return parts.join("\n") + "\n";
}

interface PartialSource {
  registry: string;
  org?: string;
  repo?: string;
  path?: string;
  slug?: string;
  version?: string;
}

interface ParsedRef {
  source: PartialSource | null;
  name: string;
}

function parseSource(ref: string, nameOverride: string): ParsedRef {
  if (ref.startsWith(GITHUB_PREFIX)) {
    const rest = ref.slice(GITHUB_PREFIX.length);
    const atIdx = rest.lastIndexOf("@");
    const pathPart = atIdx === -1 ? rest : rest.slice(0, atIdx);
    const version = atIdx === -1 ? undefined : rest.slice(atIdx + 1);
    const parts = pathPart.split("/");
    if (parts.length < 3) {
      throw new Error(`Invalid GitHub reference "${ref}". Expected format: github:org/repo/path[@version]`);
    }
    const org = parts[0];
    const repo = parts[1];
    const path = parts.slice(2).join("/") || "";
    const name = nameOverride || parts[parts.length - 1] || repo;
    return {
      source: { registry: "github", org, repo, path, version },
      name,
    };
  }

  if (ref.startsWith(CLAWHUB_PREFIX)) {
    const rest = ref.slice(CLAWHUB_PREFIX.length);
    const atIdx = rest.lastIndexOf("@");
    const slug = atIdx === -1 ? rest : rest.slice(0, atIdx);
    const version = atIdx === -1 ? undefined : rest.slice(atIdx + 1);
    const name = nameOverride || slug.split("/").pop() || slug;
    return {
      source: { registry: "clawhub", slug, version },
      name,
    };
  }

  return { source: null, name: nameOverride || ref };
}

async function resolveAgsyncDir(targetDir: string): Promise<string> {
  const agsyncDir = await findNearestAgsyncDir(targetDir);
  if (agsyncDir) return agsyncDir;

  const configPath = await findNearestConfigFile(targetDir);
  if (configPath) return resolve(dirname(configPath), ".agsync");

  throw new Error("No .agsync/ directory or agsync.yaml found. Run 'agsync init' first");
}

export async function runAdd(
  targetDir: string,
  ref: string,
  skillName: string
): Promise<string[]> {
  const agsyncDir = await resolveAgsyncDir(targetDir);
  const baseDir = dirname(agsyncDir);
  const { source: partialSource, name } = parseSource(ref, skillName);

  if (!partialSource) {
    const localSkillDir = resolve(agsyncDir, "skills", name);
    await mkdir(localSkillDir, { recursive: true });
    const skillMdPath = resolve(localSkillDir, "SKILL.md");
    await writeFile(skillMdPath, buildSkillMd({ name, description: "" }), "utf-8");
    return [skillMdPath];
  }

  const registry = getRegistry(partialSource.registry);

  let version = partialSource.version;
  if (!version) {
    const latestSource = partialSource.registry === "clawhub"
      ? { registry: "clawhub" as const, slug: partialSource.slug!, version: "" }
      : { registry: "github" as const, org: partialSource.org!, repo: partialSource.repo!, path: partialSource.path!, version: "" };
    version = await registry.resolveLatest(latestSource);
  }

  let source: SkillSource;
  if (partialSource.registry === "clawhub") {
    source = { registry: "clawhub", slug: partialSource.slug!, version };
  } else {
    source = { registry: "github", org: partialSource.org!, repo: partialSource.repo!, path: partialSource.path!, version };
  }

  const localSkillDir = resolve(agsyncDir, "skills", name);
  await mkdir(localSkillDir, { recursive: true });

  const fetched = await registry.fetch(source);

  let resolvedName = name;
  let description = "";

  if (fetched.skillMd) {
    const parsed = parseSkillMd(fetched.skillMd);
    resolvedName = parsed.name || name;
    description = parsed.description;
  }

  const frontmatter: Record<string, unknown> = {
    name: resolvedName,
    description,
    source,
  };

  const skillMdPath = resolve(localSkillDir, "SKILL.md");
  await writeFile(skillMdPath, buildSkillMd(frontmatter), "utf-8");

  for (const file of fetched.supportingFiles) {
    const filePath = resolve(localSkillDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, "utf-8");
  }

  const existingLock = await readLockFile(baseDir);
  const newLock = {
    lockVersion: 1 as const,
    sources: {
      ...(existingLock?.sources ?? {}),
      [resolvedName]: {
        registry: source.registry,
        version: source.version,
        resolved: fetched.resolvedVersion,
        integrity: fetched.integrity,
        fetchedAt: new Date().toISOString(),
      },
    },
    extends: existingLock?.extends ?? {},
  };
  await writeLockFile(baseDir, newLock);

  return [skillMdPath];
}

export async function runAddCommand(
  targetDir: string,
  commandName: string
): Promise<string> {
  const agsyncDir = await resolveAgsyncDir(targetDir);
  const cmdDir = resolve(agsyncDir, "commands");
  await mkdir(cmdDir, { recursive: true });
  const cmdPath = resolve(cmdDir, `${commandName}.md`);
  await writeFile(cmdPath, `# ${commandName}\n\nDescribe what this command does.\n`, "utf-8");
  return cmdPath;
}

export async function runAddTool(
  targetDir: string,
  toolName: string
): Promise<string> {
  const agsyncDir = await resolveAgsyncDir(targetDir);
  const mcpDir = resolve(agsyncDir, "mcp");
  await mkdir(mcpDir, { recursive: true });
  const toolPath = resolve(mcpDir, `${toolName}.yaml`);
  await writeFile(
    toolPath,
    toYaml({ name: toolName, description: "", type: "mcp", command: "", args: [] }),
    "utf-8"
  );
  return toolPath;
}
