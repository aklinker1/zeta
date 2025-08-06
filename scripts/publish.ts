import { version as oldPkgVersion } from "../package.json" with { type: "json" };
import { version as oldJsrVersion } from "../jsr.json" with { type: "json" };
import {
  loadChangelogConfig,
  getGitDiff,
  generateMarkDown,
  createGithubRelease,
  parseChangelogMarkdown,
  bumpVersion,
  parseCommits,
} from "changelogen";

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

console.log(`\nBumping version and generating changelog...`);

const changelogConfig = await loadChangelogConfig(process.cwd(), {});
const commits = parseCommits(
  await getGitDiff(changelogConfig.from),
  changelogConfig,
);
const newVersion = await bumpVersion(commits, changelogConfig);
if (!newVersion) {
  console.error("Failed to bump version", { commits });
  process.exit(1);
}

const md = await generateMarkDown(commits, changelogConfig);
console.log(md);
const changelog = parseChangelogMarkdown(
  await Bun.file("CHANGELOG.md")
    .text()
    .catch(() => ""),
);
changelog.releases.unshift({
  body: md,
  version: newVersion,
});
await Bun.write(
  "CHANGELOG.md",
  `# Changelog\n\n${changelog.releases.map((release) => release.body).join("\n\n")}\n`,
);

console.log(`Bumped version from ${oldVersion} to ${newVersion}`);

// Manually update jsr.json to match the new version bumped by changelogen
function replaceVersion(text: string, oldVer: string, newVer: string): string {
  return text.replace(`"version": "${oldVer}"`, `"version": "${newVer}"`);
}

const jsrJsonContent = await Bun.file("jsr.json").text();
const updatedJsrJsonContent = replaceVersion(
  jsrJsonContent,
  oldJsrVersion,
  newVersion,
);
await Bun.write("jsr.json", updatedJsrJsonContent);

const changedFiles = (await Bun.$`git diff --name-only`)
  .text()
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line !== "");

const expectedFiles = ["CHANGELOG.md", "jsr.json", "package.json"].sort();
const actualFiles = changedFiles.sort();

if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
  console.error(
    "Unexpected changed files after changelogen and jsr.json update.",
    "Expected:",
    expectedFiles,
    "Actual:",
    actualFiles,
  );
  await Bun.$`git status`;
  process.exit(1);
}

await Bun.$`git add jsr.json package.json CHANGELOG.md`;
await Bun.$`git commit -m "chore(release): v${newVersion}"`;
await Bun.$`git tag v${newVersion}`;
await Bun.$`git push origin main`;
await Bun.$`git push --tags`;
await createGithubRelease(changelogConfig, {
  tag_name: `v${newVersion}`,
  body: md,
});
await Bun.$`bun jsr publish`;
