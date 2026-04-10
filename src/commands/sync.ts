import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { loadHierarchicalConfig } from "@/loader/hierarchy";
import { resolveAllSkills } from "@/resolver/skills";
import { getAllConverters } from "@/converters";
import { runValidate } from "@/commands/validate";
import { expandToolEnv } from "@/utils/env";
import type { ResolvedConfig, LoadedConfig, SyncPlan, PlannedFile, PlannedSkill } from "@/types";

const AGSYNC_BEGIN = "<!-- agsync:begin -->";
const AGSYNC_END = "<!-- agsync:end -->";

function buildResolvedConfig(
  loaded: LoadedConfig,
  resolvedSkills: ResolvedConfig["skills"],
  options?: { expandEnv?: boolean }
): { config: ResolvedConfig; warnings: string[] } {
  if (options?.expandEnv === false) {
    return {
      config: { targets: loaded.config.targets, skills: resolvedSkills, tools: loaded.tools },
      warnings: [],
    };
  }

  const { tools, warnings } = expandToolEnv(loaded.tools);
  return {
    config: { targets: loaded.config.targets, skills: resolvedSkills, tools },
    warnings: warnings.map(
      (w) => `Environment variable "${w.varName}" is not set (tool "${w.tool}", key "${w.key}")`
    ),
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

async function listSubdirectories(dir: string): Promise<string[]> {
  const { readdir, stat } = await import("node:fs/promises");
  try {
    const entries = await readdir(dir);
    const dirs: string[] = [];
    for (const entry of entries) {
      const s = await stat(resolve(dir, entry));
      if (s.isDirectory()) dirs.push(entry);
    }
    return dirs;
  } catch (_) {
    void _;
    return [];
  }
}

export async function buildSyncPlan(
  targetDir: string,
  options?: { expandEnv?: boolean }
): Promise<SyncPlan> {
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
  const { config, warnings } = buildResolvedConfig(loaded, resolvedSkills, {
    expandEnv: options?.expandEnv,
  });

  const converters = getAllConverters(config.targets);
  const plannedFiles: PlannedFile[] = [];

  const definedSkillNames = new Set(config.skills.map((s) => s.name));

  const skillOutputDirs: string[] = [];
  for (const converter of converters) {
    for (const p of converter.getOutputPaths(targetDir)) {
      if (p.endsWith("skills")) skillOutputDirs.push(p);
    }
  }
  const existingSkillNames = new Set<string>();
  for (const dir of skillOutputDirs) {
    for (const name of await listSubdirectories(dir)) {
      existingSkillNames.add(name);
    }
  }

  const plannedSkills: PlannedSkill[] = [];
  for (const name of definedSkillNames) {
    plannedSkills.push({
      name,
      operation: existingSkillNames.has(name) ? "update" : "create",
    });
  }
  for (const name of existingSkillNames) {
    if (!definedSkillNames.has(name)) {
      plannedSkills.push({ name, operation: "delete" });
    }
  }

  const instructionFiles: { path: string; skillsPath: string }[] = [
    { path: resolve(targetDir, "AGENTS.md"), skillsPath: ".agents/skills/" },
  ];
  if (config.targets.includes("claude-code")) {
    instructionFiles.push({
      path: resolve(targetDir, "CLAUDE.md"),
      skillsPath: ".claude/skills/",
    });
  }
  for (const { path: filePath, skillsPath } of instructionFiles) {
    const section = converters[0].generateAgsyncSection(config, skillsPath);
    const existing = await readFileOrEmpty(filePath);
    const updated = injectAgsyncSection(existing, section);
    if (updated !== existing) {
      plannedFiles.push({
        path: filePath,
        content: updated,
        existing,
        operation: existing ? "update" : "create",
      });
    }
  }

  for (const converter of converters) {
    const output = converter.convert(config, targetDir);
    for (const file of output.files) {
      const existing = await readFileOrEmpty(file.path);
      let content = file.content;

      if (file.path.endsWith(".json") && existing) {
        content = mergeJsonContent(existing, file.content);
      }

      plannedFiles.push({
        path: file.path,
        content,
        existing,
        operation: !existing ? "create" : content !== existing ? "update" : "unchanged",
      });
    }
  }

  return { skills: plannedSkills, files: plannedFiles, skillOutputDirs, warnings };
}

async function applySyncPlan(plan: SyncPlan): Promise<string[]> {
  const staleSkills = plan.skills.filter((s) => s.operation === "delete");
  for (const skill of staleSkills) {
    for (const dir of plan.skillOutputDirs) {
      await rm(resolve(dir, skill.name), { recursive: true, force: true });
    }
  }

  const written: string[] = [];
  for (const file of plan.files) {
    if (file.operation === "delete") continue;
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.content, "utf-8");
    written.push(file.path);
  }

  return written;
}

export async function runSync(targetDir: string): Promise<{ written: string[]; warnings: string[] }> {
  const plan = await buildSyncPlan(targetDir);
  const written = await applySyncPlan(plan);
  return { written, warnings: plan.warnings };
}
