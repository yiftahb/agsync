import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { parse as parseYaml } from "yaml";
import { skillMdFrontmatterSchema } from "@/schema/config";
import type { GitHubContentEntry, GitHubSearchResult } from "@/types";

export async function fetchGitHubDirectory(
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

export async function fetchFileContent(url: string): Promise<string> {
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

export async function findSkillInRepo(
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

export async function downloadSupportingFiles(
  org: string,
  repo: string,
  remotePath: string,
  localDir: string,
  skipFiles: string[] = []
): Promise<string[]> {
  const entries = await fetchGitHubDirectory(org, repo, remotePath);
  const downloaded: string[] = [];
  const skipSet = new Set(skipFiles);

  for (const entry of entries) {
    if (skipSet.has(entry.name)) continue;

    const localPath = resolve(localDir, entry.name);

    if (entry.type === "file" && entry.download_url) {
      const content = await fetchFileContent(entry.download_url);
      await mkdir(dirname(localPath), { recursive: true });
      await writeFile(localPath, content, "utf-8");
      downloaded.push(localPath);
    } else if (entry.type === "dir") {
      await mkdir(localPath, { recursive: true });
      const nested = await downloadDirectoryRecursive(org, repo, entry.path, localPath);
      downloaded.push(...nested);
    }
  }

  return downloaded;
}

async function downloadDirectoryRecursive(
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
      const nested = await downloadDirectoryRecursive(org, repo, entry.path, localPath);
      downloaded.push(...nested);
    }
  }

  return downloaded;
}

export function parseSkillMd(raw: string): {
  name: string;
  description: string;
  instructions: string;
  extends?: string[];
  tools?: string[];
  source?: import("@/types").SkillSource;
} {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error("SKILL.md must have YAML frontmatter delimited by ---");
  }

  const frontmatter = skillMdFrontmatterSchema.parse(parseYaml(frontmatterMatch[1]));
  const body = frontmatterMatch[2].trim();

  return {
    name: frontmatter.name,
    description: frontmatter.description.trim(),
    instructions: body,
    extends: frontmatter.extends,
    tools: frontmatter.tools,
    source: frontmatter.source as import("@/types").SkillSource | undefined,
  };
}
