import { createHash } from "node:crypto";
import type { SkillSource, ClawHubSource, SkillRegistry, FetchedSkill } from "@/types";

const CLAWHUB_API = "https://clawhub.ai/api/v1";

function isClawHubSource(source: SkillSource): source is ClawHubSource {
  return source.registry === "clawhub";
}

function computeIntegrity(content: string): string {
  return "sha256:" + createHash("sha256").update(content, "utf-8").digest("hex");
}

interface ClawHubSkillMeta {
  slug: string;
  latestVersion?: string;
  versions?: { version: string }[];
}

interface ClawHubFileEntry {
  path: string;
  size: number;
}

export class ClawHubRegistry implements SkillRegistry {
  name = "clawhub";

  async fetch(source: SkillSource): Promise<FetchedSkill> {
    if (!isClawHubSource(source)) {
      throw new Error("ClawHubRegistry.fetch called with non-ClawHub source");
    }

    const { slug, version } = source;

    const filesResponse = await fetch(
      `${CLAWHUB_API}/skills/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!filesResponse.ok) {
      throw new Error(`ClawHub API error: ${filesResponse.status} for ${slug}@${version}`);
    }

    const meta = (await filesResponse.json()) as ClawHubSkillMeta & { files?: ClawHubFileEntry[] };
    const fileList = meta.files ?? [];

    let skillMd = "";
    const supportingFiles: { path: string; content: string }[] = [];

    for (const file of fileList) {
      const content = await this.fetchFile(slug, version, file.path);
      if (file.path === "SKILL.md") {
        skillMd = content;
      } else {
        supportingFiles.push({ path: file.path, content });
      }
    }

    if (!skillMd && fileList.length === 0) {
      const content = await this.fetchFile(slug, version, "SKILL.md");
      skillMd = content;
    }

    return {
      skillMd,
      supportingFiles,
      resolvedVersion: version,
      integrity: computeIntegrity(skillMd),
    };
  }

  async resolveLatest(source: Record<string, unknown> & { registry: string }): Promise<string> {
    if (source.registry !== "clawhub") {
      throw new Error("ClawHubRegistry.resolveLatest called with non-ClawHub source");
    }
    const slug = source.slug as string;

    const response = await fetch(
      `${CLAWHUB_API}/skills/${encodeURIComponent(slug)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) {
      throw new Error(`ClawHub API error: ${response.status} for ${slug}`);
    }

    const meta = (await response.json()) as ClawHubSkillMeta;
    if (meta.latestVersion) {
      return meta.latestVersion;
    }
    if (meta.versions && meta.versions.length > 0) {
      return meta.versions[0].version;
    }
    throw new Error(`No versions found for ClawHub skill "${slug}"`);
  }

  private async fetchFile(slug: string, version: string, filePath: string): Promise<string> {
    const url = `${CLAWHUB_API}/skills/${encodeURIComponent(slug)}/file?version=${encodeURIComponent(version)}&path=${encodeURIComponent(filePath)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ClawHub file fetch failed: ${response.status} for ${slug}/${filePath}@${version}`);
    }
    return response.text();
  }
}
