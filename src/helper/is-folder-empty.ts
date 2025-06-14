import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { green, blue } from "picocolors";

export function isFolderEmpty(root: string, name: string): boolean {
  const validFiles = [
    ".DS_Store",
    ".git",
    ".gitattributes",
    ".gitignore",
    ".gitlab-ci.yml",
    ".hg",
    ".ngcheck",
    ".hgignore",
    ".idea",
    ".npmignore",
    ".trivis.yml",
    "LICENSE",
    "Thumbs.db",
    "docs",
    "mkdocs.yml",
    "npm-debug.log",
    "yarn-debug.log",
    "yarn-error.log",
    "yarnrc.yml",
    ".yarn",
  ];
  const conflicts = readdirSync(root).filter(
    (file) => !validFiles.includes(file) && !/\.iml$/.test(file)
  );

  if (conflicts.length > 0) {
    console.log(
      `the directory ${green(name)} contains files that could conflicts:`
    );
    console.log();
    for (const file of conflicts) {
      try {
        const stats = lstatSync(join(root, file));
        if (stats.isDirectory()) {
          console.log(`  ${blue(file)}/`);
        } else {
          console.log(`  ${file}`);
        }
      } catch {
        console.log(`  ${file}`);
      }
    }
    console.log();
    return false;
  }
  return true;
}
