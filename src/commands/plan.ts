import { relative } from "node:path";
import { buildSyncPlan } from "@/commands/sync";
import type { SyncPlan } from "@/types";

export function formatPlan(plan: SyncPlan, baseDir: string): string {
  const lines: string[] = [];

  const skillCreates = plan.skills.filter((s) => s.operation === "create");
  const skillUpdates = plan.skills.filter((s) => s.operation === "update");
  const skillDeletes = plan.skills.filter((s) => s.operation === "delete");

  const changedFiles = plan.files.filter((f) => f.operation !== "unchanged");
  const hasSkillChanges = plan.skills.length > 0;
  const hasFileChanges = changedFiles.length > 0;

  if (!hasSkillChanges && !hasFileChanges && plan.warnings.length === 0) {
    return "No changes needed. Everything is up to date.";
  }

  if (hasSkillChanges) {
    lines.push("Skills:");
    for (const s of skillCreates) {
      lines.push(`  + ${s.name} (create)`);
    }
    for (const s of skillUpdates) {
      lines.push(`  ~ ${s.name} (update)`);
    }
    for (const s of skillDeletes) {
      lines.push(`  - ${s.name} (delete)`);
    }
  }

  if (hasFileChanges) {
    lines.push("Files:");
    for (const f of changedFiles) {
      const prefix = f.operation === "create" ? "+" : f.operation === "update" ? "~" : "-";
      if (f.symlink) {
        lines.push(`  ${prefix} ${relative(baseDir, f.path)} -> ${f.symlink} (symlink)`);
      } else {
        lines.push(`  ${prefix} ${relative(baseDir, f.path)}`);
      }
    }
  }

  if (plan.warnings.length > 0) {
    lines.push("Warnings:");
    for (const w of plan.warnings) {
      lines.push(`  ${w}`);
    }
  }

  if (hasSkillChanges) {
    lines.push("");
    lines.push(
      `${plan.skills.length} skill(s): ${skillCreates.length} create, ${skillUpdates.length} update, ${skillDeletes.length} delete`
    );
  }

  return lines.join("\n");
}

export async function runPlan(
  targetDir: string,
  options?: { frozen?: boolean }
): Promise<SyncPlan> {
  return buildSyncPlan(targetDir, { expandEnv: false, frozen: options?.frozen });
}
