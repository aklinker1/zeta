import { version as oldPkgVersion } from "../package.json" with { type: "json" };
import { version as oldJsrVersion } from "../jsr.json" with { type: "json" };

const newVersion = process.argv[2];
if (!newVersion) {
  console.error("Usage: bun run scripts/publish.ts <new_version>");
  process.exit(1);
}

if (oldPkgVersion !== oldJsrVersion) {
  console.error(
    "Package and JSR versions do not match - update them so they match then run this script again.",
  );
  process.exit(1);
}
const oldVersion = oldPkgVersion;

try {
  await Bun.$`git diff --quiet`;
} catch {
  console.error("Uncommitted changes - commit then run this script again.");
  await Bun.$`git status`;
  process.exit(1);
}

const currentBranch = (await Bun.$`git branch --show-current`).text().trim();
if (currentBranch !== "main") {
  console.error("Must be on main branch to publish.");
  process.exit(1);
}

console.log("\nBumping version...", {
  oldVersion,
  newVersion,
});

function replaceVersion(
  text: string,
  oldVersion: string,
  newVersion: string,
): string {
  return text.replace(
    `"version": "${oldVersion}"`,
    `"version": "${newVersion}"`,
  );
}

const pkgJsonContent = await Bun.file("package.json").text();
const updatedPkgJsonContent = replaceVersion(
  pkgJsonContent,
  oldVersion,
  newVersion,
);
await Bun.write("package.json", updatedPkgJsonContent);

const jsrJsonContent = await Bun.file("jsr.json").text();
const updatedJsrJsonContent = replaceVersion(
  jsrJsonContent,
  oldVersion,
  newVersion,
);
await Bun.write("jsr.json", updatedJsrJsonContent);

const changedFiles = (await Bun.$`git diff --name-only`)
  .text()
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line !== "");
if (
  changedFiles.length !== 2 ||
  changedFiles[0] !== "jsr.json" ||
  changedFiles[1] !== "package.json"
) {
  console.error(
    "Missing required changes - jsr.json and package.json should be the only changed files.",
  );
  await Bun.$`git status`;
  process.exit(1);
}

await Bun.$`git add jsr.json package.json`;
await Bun.$`git commit -m "chore(release): v${newVersion}"`;
await Bun.$`git tag v${newVersion}`;
await Bun.$`git push origin main`;
await Bun.$`git push --tags`;
await Bun.$`bun jsr publish`;
