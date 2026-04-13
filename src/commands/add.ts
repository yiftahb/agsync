import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { stringify as toYaml } from "yaml";
import { findConfigFile } from "@/loader/config";
import { getRegistry } from "@/registries/index";
import { parseSkillMd } from "@/utils/github";
import { writeLockFile, readLockFile } from "@/lock/lock";
import type { SkillSource } from "@/types";

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

function parseRef(repoRef: string, skillName: string): {
  source: PartialSource;
  name: string;
} {
  if (repoRef.startsWith(CLAWHUB_PREFIX)) {
    const rest = repoRef.slice(CLAWHUB_PREFIX.length);
    const atIdx = rest.lastIndexOf("@");
    const slug = atIdx === -1 ? rest : rest.slice(0, atIdx);
    const version = atIdx === -1 ? undefined : rest.slice(atIdx + 1);
    const name = skillName || slug.split("/").pop() || slug;
    return {
      source: { registry: "clawhub", slug, version },
      name,
    };
  }

  const atIdx = skillName.lastIndexOf("@");
  let resolvedName = skillName;
  let version: string | undefined;
  if (atIdx !== -1) {
    resolvedName = skillName.slice(0, atIdx);
    version = skillName.slice(atIdx + 1);
  }

  const parts = repoRef.split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid repo reference "${repoRef}". Expected format: org/repo`);
  }
  const [org, repo] = parts;

  return {
    source: { registry: "github", org, repo, path: resolvedName, version },
    name: resolvedName,
  };
}

export async function runAdd(
  targetDir: string,
  repoRef: string,
  skillName: string
): Promise<string[]> {
  const configPath = await findConfigFile(targetDir);
  if (!configPath) {
    throw new Error("No agsync.yaml found. Run 'agsync init' first");
  }

  const { source: partialSource, name } = parseRef(repoRef, skillName);
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

  const localSkillDir = resolve(targetDir, ".agsync", "skills", name);
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

  const baseDir = dirname(configPath);
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
