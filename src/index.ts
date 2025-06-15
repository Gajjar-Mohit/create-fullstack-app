#!/usr/bin/env node
import type { InitialReturnValue } from "prompts";
import prompts from "prompts";
let projectPath: string = "";
import { Command } from "commander";
import { getPkgManager, PackageManager } from "./helper/get-pkg-manager";
// import Conf from "conf";
import { validateNpmName } from "./helper/validate-pkg";
import { basename, resolve } from "node:path";
import { blue, blueBright, bold, cyan, green, red } from "picocolors";
import { existsSync } from "node:fs";
import { isFolderEmpty } from "./helper/is-folder-empty";
import ciInfo from "ci-info";
import { DownloadError } from "./create-app";

const packageVersion = "1.0.0";
const packageName = "create-fullstack-app";

const handleSigTerm = () => process.exit(0);

process.on("SIGINT", handleSigTerm);
process.on("SIGTERM", handleSigTerm);

const onPromptState = (state: {
  value: InitialReturnValue;
  aborted: boolean;
  exited: boolean;
}) => {
  if (state.aborted) {
    process.stdout.write("\x1B[?25h");
    process.stdout.write("\n");
    process.exit(1);
  }
};

const program = new Command(packageName)
  .version(
    packageVersion,
    "-v, --version",
    "Output the current version of create-fullstack-app."
  )
  .argument("[directory]")
  .usage("[directory] [options]")
  .helpOption("-h, --help", "Display this help message.")
  .option("--b, --backend", "Initialize a saperate backend also.")
  .option("--prisma", "Initialize with prisma (default)")
  .option("--mongodb", "Initialize with mongodb")
  .option(
    "--use-npm",
    "Explicitly tell the CLI to bootstrap the application using npm."
  )
  .option(
    "--use-pnpm",
    "Explicitly tell the CLI to bootstrap the application using pnpm."
  )
  .option(
    "--use-yarn",
    "Explicitly tell the CLI to bootstrap the application using Yarn."
  )
  .option(
    "--use-bun",
    "Explicitly tell the CLI to bootstrap the application using Bun."
  )
  .action((name) => {
    if (name && !name.startsWith("--no--")) {
      projectPath = name;
    }
  })
  .allowUnknownOption()
  .parse(process.argv);

const opts = program.opts();
const { args } = program;

const packageManager: PackageManager = !!opts.useNpm
  ? "npm"
  : !!opts.usePnpm
  ? "pnpm"
  : !!opts.useYarn
  ? "yarn"
  : !!opts.useBun
  ? "bun"
  : getPkgManager();

async function exit(reason: { command?: string }) {
  console.log();
  console.log("Aborting installation.");
  if (reason.command) {
    console.log(`  ${cyan(reason.command)} has failed.`);
  } else {
    console.log(
      red("Unexpected error. Please report it as a bug:") + "\n",
      reason
    );
  }
  console.log();
  // await notifyUpdate();
  process.exit(1);
}
async function run(): Promise<void> {
  if (typeof projectPath === "string") {
    projectPath = projectPath.trim();
  }
  if (!projectPath) {
    const res = await prompts({
      onState: onPromptState,
      type: "text",
      name: "path",
      message: "Whats is your project named?",
      initial: "my-app",
      validate: (name) => {
        const validation = validateNpmName(basename(resolve(name)));
        if (validation.valid) {
          return true;
        }
        return "Invalid project name: " + validation.problems[0];
      },
    });
    if (typeof res.path === "string") {
      projectPath = res.path.trim();
    }
  }
  if (!projectPath) {
    console.log(
      "\nPlease specify the project directory:\n" +
        `  ${cyan(opts.name())} ${green("<project-directory>")}\n` +
        "For example:\n" +
        `  ${cyan(opts.name())} ${green("my-fullstack-app")}\n\n` +
        `Run ${cyan(`${opts.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const appPath = resolve(projectPath);
  const appName = basename(appPath);

  const validation = validateNpmName(appName);
  if (!validation.valid) {
    console.error(
      `Could no create a project called ${red(
        `"${appName}"`
      )} because of npm naming restrections:`
    );
    validation.problems.forEach((p) =>
      console.error(`     ${red(bold("*"))} ${p}`)
    );
    process.exit(1);
  }
  if (existsSync(appPath) && !isFolderEmpty) {
    process.exit(0);
  }

  // const skipPrompt = ciInfo.isCI || opts.yes;
  const styledTypeScript = blue("Typescript");
  const { typescript } = await prompts(
    {
      type: "toggle",
      name: "typescript",
      message: `Would you like to use ${styledTypeScript}?`,
      initial: "Yes",
      active: "Yes",
      inactive: "No",
    },
    {
      onCancel: () => {
        console.error("Existing.");
        process.exit(1);
      },
    }
  );
  opts.typescript = Boolean(typescript);
  opts.javascript = !Boolean(typescript);
  const { requiredDb } = await prompts({
    type: "toggle",
    name: "requiredDb",
    message: "Would you required database?",
    initial: "Yes",
    active: "Yes",
    inactive: "No",
  });
  const styledMongoDb = green("MongoDb");
  const styledPostgress = blueBright("Postgress");
  let selectedDb;
  if (requiredDb) {
    const { db } = await prompts({
      type: "toggle",
      name: "db",
      message: "Which db provider you want to use?",
      initial: styledPostgress,
      active: styledPostgress,
      inactive: styledMongoDb,
    });
    console.log(db);
    if (db) {
      selectedDb = "Postgress";
    } else {
      selectedDb = "MongoDb";
    }
  }

  try {
    console.log({
      typescript: typescript,
      name: appName,
      requiredDb: requiredDb,
      selectedDb: selectedDb,
    });
    // create app
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason;
    }
  }
}
run().catch(exit);
