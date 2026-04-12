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

function buildSkillMd(frontmatter: Record<string, unknown>, body?: string): string {
  const yaml = toYaml(frontmatter).trim();
  const parts = [`---`, yaml, `---`];
  if (body) {
    parts.push("", body);
  }
  return parts.join("\n") + "\n";
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

  const frontmatter: Record<string, unknown> = {
    name,
    description,
    source,
  };

  const skillMdPath = resolve(localSkillDir, "SKILL.md");
  await writeFile(skillMdPath, buildSkillMd(frontmatter), "utf-8");

  return [skillMdPath];
}
