import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { skillDefinitionSchema } from "@/schema/config";
import type { SkillDefinition, ResolvedSkill } from "@/types";

const GITHUB_PREFIX = "github:";
const LOCAL_PREFIX = "./";

function isGithubRef(ref: string): boolean {
  return ref.startsWith(GITHUB_PREFIX);
}

function isLocalRef(ref: string): boolean {
  return ref.startsWith(LOCAL_PREFIX) || ref.startsWith("../");
}

function parseGithubRef(ref: string): { org: string; repo: string; path: string } {
  const stripped = ref.slice(GITHUB_PREFIX.length);
  const parts = stripped.split("/");
  const org = parts[0];
  const repo = parts[1];
  const path = parts.slice(2).join("/") || "skill.yaml";
  return { org, repo, path };
}

function getCachePath(cacheDir: string, org: string, repo: string, path: string): string {
  return resolve(cacheDir, org, repo, path);
}

async function fetchGithubSkill(
  ref: string,
  cacheDir: string
): Promise<SkillDefinition> {
  const { org, repo, path } = parseGithubRef(ref);
  const cached = getCachePath(cacheDir, org, repo, path);

  if (existsSync(cached)) {
    const raw = await readFile(cached, "utf-8");
    return skillDefinitionSchema.parse(parseYaml(raw));
  }

  const url = `https://raw.githubusercontent.com/${org}/${repo}/main/${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch skill from ${url}: ${response.status}`);
  }

  const content = await response.text();
  await mkdir(dirname(cached), { recursive: true });
  await writeFile(cached, content, "utf-8");

  return skillDefinitionSchema.parse(parseYaml(content));
}

async function loadLocalSkill(
  ref: string,
  skillsDir: string
): Promise<SkillDefinition> {
  const yamlPath = resolve(skillsDir, ref.endsWith(".yaml") ? ref : `${ref}.yaml`);
  const raw = await readFile(yamlPath, "utf-8");
  return skillDefinitionSchema.parse(parseYaml(raw));
}

async function loadExtendedSkill(
  ref: string,
  skillsDir: string,
  cacheDir: string
): Promise<SkillDefinition> {
  if (isGithubRef(ref)) {
    return fetchGithubSkill(ref, cacheDir);
  }
  if (isLocalRef(ref)) {
    return loadLocalSkill(ref, skillsDir);
  }
  throw new Error(`Unknown skill reference format: ${ref}`);
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
  skillsDir: string,
  cacheDir: string,
  visited: Set<string>
): Promise<ResolvedSkill> {
  detectCircularExtends(skill.name, visited);
  visited.add(skill.name);

  if (!skill.extends || skill.extends.length === 0) {
    return {
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      tools: skill.tools ?? [],
      extendsChain: [skill.name],
    };
  }

  let resolved: ResolvedSkill = {
    name: skill.name,
    description: skill.description,
    instructions: "",
    tools: [],
    extendsChain: [],
  };

  for (const ref of skill.extends) {
    const baseSkill = await loadExtendedSkill(ref, skillsDir, cacheDir);
    const resolvedBase = await resolveSkillChain(baseSkill, skillsDir, cacheDir, new Set(visited));
    resolved = {
      ...resolved,
      instructions: [resolved.instructions, resolvedBase.instructions]
        .filter(Boolean)
        .join("\n\n"),
      tools: [...new Set([...resolved.tools, ...resolvedBase.tools])],
      extendsChain: [...resolved.extendsChain, ...resolvedBase.extendsChain],
    };
  }

  return mergeSkills(resolved, skill);
}

export async function resolveAllSkills(
  skills: SkillDefinition[],
  skillsDir: string,
  cacheDir: string
): Promise<ResolvedSkill[]> {
  const resolved: ResolvedSkill[] = [];
  for (const skill of skills) {
    const result = await resolveSkillChain(skill, skillsDir, cacheDir, new Set());
    resolved.push(result);
  }
  return resolved;
}
