import { createHash } from "node:crypto";
import type { SkillSource, GitHubSource, SkillRegistry, FetchedSkill } from "@/types";
import {
  fetchGitHubDirectory,
  fetchFileContent,
} from "@/utils/github";

function isGitHubSource(source: SkillSource): source is GitHubSource {
  return source.registry === "github";
}

function computeIntegrity(content: string): string {
  return "sha256:" + createHash("sha256").update(content, "utf-8").digest("hex");
}

async function resolveRefToSha(org: string, repo: string, ref: string): Promise<string> {
  const url = `https://api.github.com/repos/${org}/${repo}/commits/${ref}`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} resolving ref "${ref}"`);
  }
  const data = (await response.json()) as { sha: string };
  return data.sha;
}

function isSha(ref: string): boolean {
  return /^[0-9a-f]{7,40}$/.test(ref);
}

export class GitHubRegistry implements SkillRegistry {
  name = "github";

  async fetch(source: SkillSource): Promise<FetchedSkill> {
    if (!isGitHubSource(source)) {
      throw new Error("GitHubRegistry.fetch called with non-GitHub source");
    }

    const { org, repo, path, version } = source;

    let resolvedVersion: string;
    if (isSha(version)) {
      resolvedVersion = version;
    } else {
      resolvedVersion = await resolveRefToSha(org, repo, version);
    }

    const entries = await fetchGitHubDirectory(org, repo, path);
    const skillMdEntry = entries.find((e) => e.name === "SKILL.md");
    if (!skillMdEntry?.download_url) {
      throw new Error(`SKILL.md not found at ${org}/${repo}/${path}`);
    }
    const skillMd = await fetchFileContent(skillMdEntry.download_url);

    const supportingFiles: { path: string; content: string }[] = [];
    const collectFiles = async (dirEntries: Awaited<ReturnType<typeof fetchGitHubDirectory>>, prefix: string) => {
      for (const entry of dirEntries) {
        if (entry.name === "SKILL.md" && prefix === "") continue;
        const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.type === "file" && entry.download_url) {
          const content = await fetchFileContent(entry.download_url);
          supportingFiles.push({ path: relativePath, content });
        } else if (entry.type === "dir") {
          const subEntries = await fetchGitHubDirectory(org, repo, entry.path);
          await collectFiles(subEntries, relativePath);
        }
      }
    };
    await collectFiles(entries, "");

    return {
      skillMd,
      supportingFiles,
      resolvedVersion,
      integrity: computeIntegrity(skillMd),
    };
  }

  async resolveLatest(source: Record<string, unknown> & { registry: string }): Promise<string> {
    if (source.registry !== "github") {
      throw new Error("GitHubRegistry.resolveLatest called with non-GitHub source");
    }
    const org = source.org as string;
    const repo = source.repo as string;

    const tagsUrl = `https://api.github.com/repos/${org}/${repo}/tags`;
    const response = await fetch(tagsUrl, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (response.ok) {
      const tags = (await response.json()) as { name: string; commit: { sha: string } }[];
      const semverTags = tags.filter((t) => /^v?\d+\.\d+/.test(t.name));
      if (semverTags.length > 0) {
        return semverTags[0].name;
      }
    }

    const sha = await resolveRefToSha(org, repo, "main");
    return sha.slice(0, 12);
  }
}
