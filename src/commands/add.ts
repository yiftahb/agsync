import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { parse as parseYaml, stringify as toYaml } from "yaml";
import { findConfigFile } from "@/loader/config";
import { skillMdFrontmatterSchema } from "@/schema/config";
import type { SkillSource } from "@/types";

interface GitHubContentEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

interface GitHubSearchResult {
  total_count: number;
  items: { name: string; path: string; repository: { full_name: string } }[];
}

async function fetchGitHubDirectory(
  org: string,
  repo: string,
  path: string
): Promise<GitHubContentEntry[]> {
  const url = `https://api.github.com/repos/${org}/${repo}/contents/${path}`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} for ${path}`);
  }

  return response.json() as Promise<GitHubContentEntry[]>;
}

async function fetchFileContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function hasSkillFile(entries: GitHubContentEntry[]): boolean {
  return entries.some(
    (e) => e.name === "SKILL.md" || e.name.endsWith(".yaml") || e.name.endsWith(".yml")
  );
}

async function findSkillInRepo(
  org: string,
  repo: string,
  skillName: string
): Promise<string> {
  const url = `https://api.github.com/search/code?q=filename:SKILL.md+path:${skillName}+repo:${org}/${repo}`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });

  if (response.ok) {
    const data = (await response.json()) as GitHubSearchResult;
    if (data.total_count > 0) {
      const skillMdPath = data.items[0].path;
      return dirname(skillMdPath);
    }
  }

  const candidates = [
    skillName,
    `.agsync/skills/${skillName}`,
    `.agents/skills/${skillName}`,
    `skills/${skillName}`,
    `awesome_agent_skills/${skillName}`,
    `agent_skills/${skillName}`,
  ];

  for (const candidate of candidates) {
    try {
      const entries = await fetchGitHubDirectory(org, repo, candidate);
      if (hasSkillFile(entries)) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  throw new Error(
    `Could not find skill "${skillName}" in ${org}/${repo}`
  );
}

function parseSkillMdToYaml(
  raw: string,
  skillName: string,
  source: SkillSource
): string {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error("SKILL.md must have YAML frontmatter delimited by ---");
  }

  const frontmatter = skillMdFrontmatterSchema.parse(parseYaml(frontmatterMatch[1]));
  const body = frontmatterMatch[2].trim();

  const skillDef: Record<string, unknown> = {
    name: frontmatter.name || skillName,
    description: frontmatter.description.trim(),
    instructions: body,
    source,
  };

  return toYaml(skillDef);
}

async function downloadSupportingFiles(
  org: string,
  repo: string,
  remotePath: string,
  localDir: string,
  skillName: string
): Promise<string[]> {
  const entries = await fetchGitHubDirectory(org, repo, remotePath);
  const downloaded: string[] = [];

  for (const entry of entries) {
    if (entry.name === "SKILL.md" || entry.name === `${skillName}.yaml`) {
      continue;
    }

    const localPath = resolve(localDir, entry.name);

    if (entry.type === "file" && entry.download_url) {
      const content = await fetchFileContent(entry.download_url);
      await mkdir(dirname(localPath), { recursive: true });
      await writeFile(localPath, content, "utf-8");
      downloaded.push(localPath);
    } else if (entry.type === "dir") {
      await mkdir(localPath, { recursive: true });
      const nested = await downloadSupportingFilesRecursive(
        org,
        repo,
        entry.path,
        localPath
      );
      downloaded.push(...nested);
    }
  }

  return downloaded;
}

async function downloadSupportingFilesRecursive(
  org: string,
  repo: string,
  remotePath: string,
  localDir: string
): Promise<string[]> {
  const entries = await fetchGitHubDirectory(org, repo, remotePath);
  const downloaded: string[] = [];

  for (const entry of entries) {
    const localPath = resolve(localDir, entry.name);

    if (entry.type === "file" && entry.download_url) {
      const content = await fetchFileContent(entry.download_url);
      await mkdir(dirname(localPath), { recursive: true });
      await writeFile(localPath, content, "utf-8");
      downloaded.push(localPath);
    } else if (entry.type === "dir") {
      await mkdir(localPath, { recursive: true });
      const nested = await downloadSupportingFilesRecursive(
        org,
        repo,
        entry.path,
        localPath
      );
      downloaded.push(...nested);
    }
  }

  return downloaded;
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
  const written: string[] = [];

  if (skillMdEntry && skillMdEntry.download_url) {
    const skillMdContent = await fetchFileContent(skillMdEntry.download_url);
    const yamlContent = parseSkillMdToYaml(skillMdContent, skillName, source);
    const yamlPath = resolve(localSkillDir, `${skillName}.yaml`);
    await writeFile(yamlPath, yamlContent, "utf-8");
    written.push(yamlPath);
  }

  const supportingFiles = await downloadSupportingFiles(
    org,
    repo,
    remotePath,
    localSkillDir,
    skillName
  );
  written.push(...supportingFiles);

  return written;
}
