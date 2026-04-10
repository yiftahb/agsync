import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify as toYaml } from "yaml";
import { findConfigFile } from "@/loader/config";
import {
  findSkillInRepo,
  fetchGitHubDirectory,
  fetchFileContent,
  parseSkillMd,
} from "@/utils/github";
import type { SkillSource } from "@/types";

export async function runAdd(
  targetDir: string,
  repoRef: string,
  skillName: string
): Promise<string[]> {
  const configPath = await findConfigFile(targetDir);
  if (!configPath) {
    throw new Error("No agsync.yaml found. Run 'agsync init' first");
  }

  const parts = repoRef.split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid repo reference "${repoRef}". Expected format: org/repo`);
  }

  const [org, repo] = parts;
  const remotePath = await findSkillInRepo(org, repo, skillName);
  const localSkillDir = resolve(targetDir, ".agsync", "skills", skillName);

  await mkdir(localSkillDir, { recursive: true });

  const source: SkillSource = {
    registry: "github",
    org,
    repo,
    path: remotePath,
  };

  const entries = await fetchGitHubDirectory(org, repo, remotePath);
  const skillMdEntry = entries.find((e) => e.name === "SKILL.md");

  let name = skillName;
  let description = "";

  if (skillMdEntry && skillMdEntry.download_url) {
    const content = await fetchFileContent(skillMdEntry.download_url);
    const parsed = parseSkillMd(content);
    name = parsed.name || skillName;
    description = parsed.description;
  }

  const skillDef: Record<string, unknown> = {
    name,
    description,
    source,
  };

  const yamlPath = resolve(localSkillDir, `${skillName}.yaml`);
  await writeFile(yamlPath, toYaml(skillDef), "utf-8");

  return [yamlPath];
}
