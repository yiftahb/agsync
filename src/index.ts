import { Command } from "commander";
import { runInit } from "@/commands/init";
import { runValidate } from "@/commands/validate";
import { runSync } from "@/commands/sync";
import { runPlan, formatPlan } from "@/commands/plan";
import { runDoctor } from "@/commands/doctor";
import { getExtendedHelp } from "@/commands/help";
import { runAdd } from "@/commands/add";
import { runRemove } from "@/commands/remove";
import { runUpdate } from "@/commands/update";

declare const __VERSION__: string;

const program = new Command();

program
  .name("agsync")
  .description("Git-native CLI to sync skills and MCP tools across AI coding clients")
  .version(__VERSION__);

program
  .command("init")
  .description("Scaffold a new agsync project")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (opts) => {
    try {
      const created = await runInit(opts.dir);
      console.log("Initialized agsync project:");
      for (const file of created) {
        console.log(`  + ${file}`);
      }
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate config and all definitions")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (opts) => {
    try {
      const results = await runValidate(opts.dir);
      const warnings = results.filter((e) => e.severity === "warn");
      const hard = results.filter((e) => e.severity !== "warn");
      if (warnings.length > 0) {
        console.warn("Warnings:");
        for (const w of warnings) {
          console.warn(`  ${w.file}: ${w.message}`);
        }
      }
      if (hard.length > 0) {
        console.error("Validation errors:");
        for (const err of hard) {
          console.error(`  ${err.file}: ${err.message}`);
        }
        process.exit(1);
      } else if (warnings.length === 0) {
        console.log("Validation passed");
      }
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("plan")
  .description("Preview changes without writing files")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (opts) => {
    try {
      const plan = await runPlan(opts.dir);
      console.log(formatPlan(plan, opts.dir));
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("sync")
  .description("Compile and generate client configs")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (opts) => {
    try {
      const { written, warnings } = await runSync(opts.dir);
      if (warnings.length > 0) {
        console.warn("Warnings:");
        for (const w of warnings) {
          console.warn(`  ${w}`);
        }
      }
      console.log("Synced files:");
      for (const file of written) {
        console.log(`  + ${file}`);
      }
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("doctor")
  .description("Check environment health")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (opts) => {
    const checks = await runDoctor(opts.dir);
    for (const check of checks) {
      const icon = check.status === "pass" ? "[PASS]" : check.status === "warn" ? "[WARN]" : "[FAIL]";
      console.log(`${icon} ${check.name}: ${check.message}`);
    }
    const hasFail = checks.some((c) => c.status === "fail");
    if (hasFail) {
      process.exit(1);
    }
  });

const skill = program
  .command("skill")
  .description("Manage skills");

skill
  .command("add <repo> <skill-name>")
  .description("Add a skill from a GitHub repository")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (repo: string, skillName: string, opts: { dir: string }) => {
    try {
      const files = await runAdd(opts.dir, repo, skillName);
      console.log(`Added skill "${skillName}" from ${repo}:`);
      for (const file of files) {
        console.log(`  + ${file}`);
      }
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

skill
  .command("remove <skill-name>")
  .description("Remove a skill")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (skillName: string, opts: { dir: string }) => {
    try {
      const removed = await runRemove(opts.dir, skillName);
      console.log(`Removed skill "${skillName}" from ${removed}`);
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("update")
  .description("Update agsync to the latest version")
  .action(async () => {
    try {
      await runUpdate();
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("help")
  .description("Show extended help")
  .action(() => {
    console.log(getExtendedHelp());
  });

program.parse();
