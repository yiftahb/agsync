import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { parse as parseYaml } from "yaml";
import { skillDefinitionSchema } from "@/schema/config";
import { parseSkillMd } from "@/utils/github";
import { getRegistry } from "@/registries/index";
import type {
  SkillDefinition, ResolvedSkill, SkillSource, GitHubSource, ClawHubSource,
  LockFile, LockEntry, ResolveOptions, ResolveResult,
} from "@/types";

const GITHUB_PREFIX = "github:";
const CLAWHUB_PREFIX = "clawhub:";
const LOCAL_PREFIX = "./";

function isExternalRef(ref: string): boolean {
  return ref.startsWith(GITHUB_PREFIX) || ref.startsWith(CLAWHUB_PREFIX);
}

function isLocalRef(ref: string): boolean {
  return ref.startsWith(LOCAL_PREFIX) || ref.startsWith("../");
}

function parseExternalRef(ref: string): { source: SkillSource; rawRef: string } {
  if (ref.startsWith(CLAWHUB_PREFIX)) {
    const rest = ref.slice(CLAWHUB_PREFIX.length);
    const atIdx = rest.lastIndexOf("@");
    if (atIdx === -1) {
      throw new Error(`ClawHub extends ref "${ref}" must include @version`);
    }
    const slug = rest.slice(0, atIdx);
    const version = rest.slice(atIdx + 1);
    return {
      source: { registry: "clawhub", slug, version } as ClawHubSource,
      rawRef: ref,
    };
  }

  const stripped = ref.startsWith(GITHUB_PREFIX) ? ref.slice(GITHUB_PREFIX.length) : ref;
  const atIdx = stripped.lastIndexOf("@");
  if (atIdx === -1) {
    throw new Error(`GitHub extends ref "${ref}" must include @version`);
  }
  const pathPart = stripped.slice(0, atIdx);
  const version = stripped.slice(atIdx + 1);
  const parts = pathPart.split("/");
  const org = parts[0];
  const repo = parts[1];
  const path = parts.slice(2).join("/") || "skill.yaml";
  return {
    source: { registry: "github", org, repo, path, version } as GitHubSource,
    rawRef: ref,
  };
}

interface ResolveContext {
  skillsDir: string;
  cacheDir: string;
  lock: LockFile | null;
  frozen: boolean;
  lockUpdates: { sources: Record<string, LockEntry>; extends: Record<string, LockEntry> };
}

async function loadLocalSkill(
  ref: string,
  skillsDir: string
): Promise<SkillDefinition> {
  const yamlPath = resolve(skillsDir, ref.endsWith(".yaml") ? ref : `${ref}.yaml`);
  const raw = await readFile(yamlPath, "utf-8");
  return skillDefinitionSchema.parse(parseYaml(raw));
}

async function fetchExternalSkill(
  ref: string,
  ctx: ResolveContext
): Promise<SkillDefinition> {
  const { source, rawRef } = parseExternalRef(ref);
  const registry = getRegistry(source.registry);

  if (ctx.frozen) {
    if (!ctx.lock) {
      throw new Error("--frozen: no lock file found");
    }
    const entry = ctx.lock.extends[rawRef];
    if (!entry || entry.version !== source.version) {
      throw new Error(`--frozen: extends ref "${rawRef}" is not locked or version mismatch`);
    }
  }

  const fetched = await registry.fetch(source, ctx.cacheDir);
  const parsed = parseSkillMd(fetched.skillMd);

  ctx.lockUpdates.extends[rawRef] = {
    registry: source.registry,
    version: source.version,
    resolved: fetched.resolvedVersion,
    integrity: fetched.integrity,
    fetchedAt: new Date().toISOString(),
  };

  return {
    name: parsed.name,
    description: parsed.description,
    instructions: parsed.instructions || undefined,
    extends: parsed.extends,
    tools: parsed.tools,
    source: parsed.source,
  };
}

async function loadExtendedSkill(
  ref: string,
  ctx: ResolveContext
): Promise<SkillDefinition> {
  if (isExternalRef(ref)) {
    return fetchExternalSkill(ref, ctx);
  }
  if (isLocalRef(ref)) {
    return loadLocalSkill(ref, ctx.skillsDir);
  }
  throw new Error(`Unknown skill reference format: ${ref}`);
}

async function resolveSourceSkill(
  skill: SkillDefinition,
  ctx: ResolveContext
): Promise<{ instructions: string; description: string }> {
  if (!skill.source) {
    throw new Error(`Skill "${skill.name}" has no source to resolve`);
  }

  const registry = getRegistry(skill.source.registry);

  if (ctx.frozen) {
    if (!ctx.lock) {
      throw new Error("--frozen: no lock file found");
    }
    const entry = ctx.lock.sources[skill.name];
    if (!entry || entry.version !== skill.source.version) {
      throw new Error(`--frozen: source "${skill.name}" is not locked or version mismatch`);
    }
  }

  const fetched = await registry.fetch(skill.source, ctx.cacheDir);

  ctx.lockUpdates.sources[skill.name] = {
    registry: skill.source.registry,
    version: skill.source.version,
    resolved: fetched.resolvedVersion,
    integrity: fetched.integrity,
    fetchedAt: new Date().toISOString(),
  };

  let remoteInstructions = "";
  let remoteDescription = skill.description;

  if (fetched.skillMd) {
    const parsed = parseSkillMd(fetched.skillMd);
    remoteInstructions = parsed.instructions;
    remoteDescription = parsed.description || skill.description;
  }

  const localDir = resolve(ctx.skillsDir, skill.name);
  await mkdir(localDir, { recursive: true });
  for (const file of fetched.supportingFiles) {
    const filePath = resolve(localDir, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, "utf-8");
  }

  return { instructions: remoteInstructions, description: remoteDescription };
}

function mergeSkills(base: ResolvedSkill, overlay: SkillDefinition): ResolvedSkill {
  return {
    name: overlay.name,
    description: overlay.description,
    instructions: [base.instructions, overlay.instructions].filter(Boolean).join("\n\n"),
    tools: [...new Set([...base.tools, ...(overlay.tools ?? [])])],
    extendsChain: [...base.extendsChain, overlay.name],
  };
}

function detectCircularExtends(
  skillName: string,
  visited: Set<string>
): void {
  if (visited.has(skillName)) {
    throw new Error(`Circular extends detected: ${[...visited, skillName].join(" -> ")}`);
  }
}

async function resolveSkillChain(
  skill: SkillDefinition,
  ctx: ResolveContext,
  visited: Set<string>
): Promise<ResolvedSkill> {
  detectCircularExtends(skill.name, visited);
  visited.add(skill.name);

  let effectiveInstructions = skill.instructions ?? "";
  let effectiveDescription = skill.description;

  if (skill.source) {
    const remote = await resolveSourceSkill(skill, ctx);
    if (skill.instructions) {
      effectiveInstructions = [remote.instructions, skill.instructions]
        .filter(Boolean)
        .join("\n\n");
    } else {
      effectiveInstructions = remote.instructions;
    }
    if (!skill.description || skill.description === effectiveDescription) {
      effectiveDescription = remote.description;
    }
  }

  if (!skill.extends || skill.extends.length === 0) {
    return {
      name: skill.name,
      description: effectiveDescription,
      instructions: effectiveInstructions,
      tools: skill.tools ?? [],
      extendsChain: [skill.name],
    };
  }

  let resolved: ResolvedSkill = {
    name: skill.name,
    description: effectiveDescription,
    instructions: "",
    tools: [],
    extendsChain: [],
  };

  for (const ref of skill.extends) {
    const baseSkill = await loadExtendedSkill(ref, ctx);
    const resolvedBase = await resolveSkillChain(baseSkill, ctx, new Set(visited));
    resolved = {
      ...resolved,
      instructions: [resolved.instructions, resolvedBase.instructions]
        .filter(Boolean)
        .join("\n\n"),
      tools: [...new Set([...resolved.tools, ...resolvedBase.tools])],
      extendsChain: [...resolved.extendsChain, ...resolvedBase.extendsChain],
    };
  }

  const overlayWithResolved: SkillDefinition = {
    ...skill,
    instructions: effectiveInstructions,
    description: effectiveDescription,
  };

  return mergeSkills(resolved, overlayWithResolved);
}

export async function resolveAllSkills(
  skills: SkillDefinition[],
  skillsDir: string,
  cacheDir: string,
  options?: ResolveOptions
): Promise<ResolveResult> {
  const ctx: ResolveContext = {
    skillsDir,
    cacheDir,
    lock: options?.lock ?? null,
    frozen: options?.frozen ?? false,
    lockUpdates: { sources: {}, extends: {} },
  };

  const resolved: ResolvedSkill[] = [];
  for (const skill of skills) {
    const result = await resolveSkillChain(skill, ctx, new Set());
    if (skill.scope) result.scope = skill.scope;
    if (skill.sourceDir) result.sourceDir = skill.sourceDir;
    resolved.push(result);
  }

  return { skills: resolved, lockUpdates: ctx.lockUpdates };
}
