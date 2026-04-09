import { mkdir, writeFile, readFile, symlink, lstat, unlink, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { loadHierarchicalConfig } from "@/loader/hierarchy";
import { resolveAllSkills } from "@/resolver/skills";
import { getAllConverters, BaseAgentConverter } from "@/converters";
import { runValidate } from "@/commands/validate";
import { expandToolEnv } from "@/utils/env";
import type { ResolvedConfig, LoadedConfig } from "@/types";

const AGSYNC_BEGIN = "<!-- agsync:begin -->";
const AGSYNC_END = "<!-- agsync:end -->";

function buildResolvedConfig(
  loaded: LoadedConfig,
  resolvedSkills: ResolvedConfig["skills"]
): ResolvedConfig {
  return {
    targets: loaded.config.targets,
    skills: resolvedSkills,
    tools: expandToolEnv(loaded.tools),
  };
}

function mergeJsonContent(existing: string, incoming: string): string {
  try {
    const existingObj = JSON.parse(existing);
    const incomingObj = JSON.parse(incoming);

    for (const key of Object.keys(incomingObj)) {
      if (
        typeof existingObj[key] === "object" &&
        existingObj[key] !== null &&
        typeof incomingObj[key] === "object" &&
        incomingObj[key] !== null &&
        !Array.isArray(existingObj[key])
      ) {
        existingObj[key] = { ...existingObj[key], ...incomingObj[key] };
      } else {
        existingObj[key] = incomingObj[key];
      }
    }

    return JSON.stringify(existingObj, null, 2);
  } catch (_) {
    void _;
    return incoming;
  }
}

async function writeConvertedFiles(
  converter: BaseAgentConverter,
  config: ResolvedConfig,
  outputDir: string
): Promise<string[]> {
  const output = converter.convert(config, outputDir);
  const written: string[] = [];

  for (const file of output.files) {
    await mkdir(dirname(file.path), { recursive: true });

    if (file.path.endsWith(".json")) {
      const existing = await readFileOrEmpty(file.path);
      if (existing) {
        const merged = mergeJsonContent(existing, file.content);
        await writeFile(file.path, merged, "utf-8");
      } else {
        await writeFile(file.path, file.content, "utf-8");
      }
    } else {
      await writeFile(file.path, file.content, "utf-8");
    }

    written.push(file.path);
  }

  return written;
}

function injectAgsyncSection(existingContent: string, section: string): string {
  const beginIndex = existingContent.indexOf(AGSYNC_BEGIN);
  const endIndex = existingContent.indexOf(AGSYNC_END);

  if (beginIndex !== -1 && endIndex !== -1) {
    const before = existingContent.slice(0, beginIndex);
    const after = existingContent.slice(endIndex + AGSYNC_END.length);
    return before + section + after;
  }

  if (existingContent.length > 0 && !existingContent.endsWith("\n")) {
    return existingContent + "\n\n" + section + "\n";
  }

  if (existingContent.length > 0) {
    return existingContent + "\n" + section + "\n";
  }

  return section + "\n";
}

async function readFileOrEmpty(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch (_) {
    void _;
    return "";
  }
}

async function writeAgentsMd(
  converter: BaseAgentConverter,
  config: ResolvedConfig,
  outputDir: string
): Promise<string[]> {
  const agentsMdPath = resolve(outputDir, "AGENTS.md");
  const claudeMdPath = resolve(outputDir, "CLAUDE.md");

  const section = converter.generateAgsyncSection(config);
  const existing = await readFileOrEmpty(agentsMdPath);
  const updated = injectAgsyncSection(existing, section);
  await writeFile(agentsMdPath, updated, "utf-8");

  try {
    const stat = await lstat(claudeMdPath);
    if (stat.isSymbolicLink() || stat.isFile()) {
      await unlink(claudeMdPath);
    }
  } catch (_) {
    void _;
  }

  await symlink("AGENTS.md", claudeMdPath);

  return [agentsMdPath, claudeMdPath];
}

export async function runSync(targetDir: string): Promise<string[]> {
  const allErrors = await runValidate(targetDir);
  const hardErrors = allErrors.filter((e) => e.severity !== "warn");
  if (hardErrors.length > 0) {
    const messages = hardErrors.map((e) => `  ${e.file}: ${e.message}`).join("\n");
    throw new Error(`Validation failed:\n${messages}`);
  }

  const loaded = await loadHierarchicalConfig(targetDir);
  if (!loaded) {
    throw new Error("No agsync.yaml found");
  }

  const skillsDir = resolve(dirname(loaded.configPath), ".agsync", "skills");
  const cacheDir = resolve(dirname(loaded.configPath), ".agsync", "cache");
  const resolvedSkills = await resolveAllSkills(loaded.skills, skillsDir, cacheDir);
  const config = buildResolvedConfig(loaded, resolvedSkills);

  const converters = getAllConverters(config.targets);
  const allWritten: string[] = [];

  const skillOutputDirs = [
    resolve(targetDir, ".agents", "skills"),
    resolve(targetDir, ".claude", "skills"),
  ];
  for (const dir of skillOutputDirs) {
    await rm(dir, { recursive: true, force: true });
  }

  const agentsMdFiles = await writeAgentsMd(converters[0], config, targetDir);
  allWritten.push(...agentsMdFiles);

  for (const converter of converters) {
    const written = await writeConvertedFiles(converter, config, targetDir);
    allWritten.push(...written);
  }

  return allWritten;
}
