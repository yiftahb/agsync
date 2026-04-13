import { Command } from "commander";
import { runInit } from "@/commands/init";
import { runValidate } from "@/commands/validate";
import { runSync } from "@/commands/sync";
import { runPlan, formatPlan } from "@/commands/plan";
import { runDoctor } from "@/commands/doctor";
import { getExtendedHelp } from "@/commands/help";
import { runAdd, runAddCommand, runAddTool } from "@/commands/add";
import { runRemove, runRemoveCommand, runRemoveTool } from "@/commands/remove";
import { runUpdate } from "@/commands/update";
import { runVersion } from "@/commands/version";
import { CURRENT_VERSION } from "@/utils/version";

const program = new Command();

program
  .name("agsync")
  .description("Git-native CLI to sync skills, commands, and MCP tools across AI coding agents")
  .version(CURRENT_VERSION);

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
  .option("--frozen", "Fail if lock file is missing or stale")
  .action(async (opts) => {
    try {
      const plan = await runPlan(opts.dir, { frozen: opts.frozen });
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
  .option("--frozen", "Fail if lock file is missing or stale")
  .action(async (opts) => {
    try {
      const { written, warnings } = await runSync(opts.dir, { frozen: opts.frozen });
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
  .command("add <name-or-source> [skill-name]")
  .description("Add a local skill or import from github:/clawhub:")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (source: string, skillName: string | undefined, opts: { dir: string }) => {
    try {
      const files = await runAdd(opts.dir, source, skillName ?? "");
      console.log(`Added skill:`);
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

const command = program
  .command("command")
  .description("Manage commands");

command
  .command("add <name>")
  .description("Create a new empty command")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (name: string, opts: { dir: string }) => {
    try {
      const file = await runAddCommand(opts.dir, name);
      console.log(`Added command:\n  + ${file}`);
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

command
  .command("remove <name>")
  .description("Remove a command")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (name: string, opts: { dir: string }) => {
    try {
      const removed = await runRemoveCommand(opts.dir, name);
      console.log(`Removed command "${name}" from ${removed}`);
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

const tool = program
  .command("tool")
  .description("Manage tools");

tool
  .command("add <name>")
  .description("Create a new empty tool definition")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (name: string, opts: { dir: string }) => {
    try {
      const file = await runAddTool(opts.dir, name);
      console.log(`Added tool:\n  + ${file}`);
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

tool
  .command("remove <name>")
  .description("Remove a tool")
  .option("-d, --dir <path>", "Target directory", process.cwd())
  .action(async (name: string, opts: { dir: string }) => {
    try {
      const removed = await runRemoveTool(opts.dir, name);
      console.log(`Removed tool "${name}" from ${removed}`);
    } catch (err: unknown) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("version")
  .description("Show current version and check for updates")
  .action(async () => {
    try {
      await runVersion();
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
