import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const token = process.env.OVSX_PAT;

if (!token) {
  console.error(
    "OVSX_PAT is not set. Create a token at https://open-vsx.org/user-settings/tokens and set it only in your shell or a GitHub Actions secret. Never commit it."
  );
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const ovsx = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "ovsx.cmd" : "ovsx"
);

const existing = readdirSync(root).find(
  (name) => name === `${pkg.name}-${pkg.version}.vsix`
);

if (!existing) {
  console.log("No matching VSIX found; packaging first.");
  run(npm, ["run", "package"]);
}

const vsix = join(root, `${pkg.name}-${pkg.version}.vsix`);
if (!existsSync(vsix)) {
  console.error(`Expected ${vsix} after packaging.`);
  process.exit(1);
}

const baseUrl =
  "https://raw.githubusercontent.com/FloKuersten/Gitmoji/main/extension";

console.log(
  `Publishing ${pkg.publisher}.${pkg.name}@${pkg.version} to Open VSX.`
);
if (!existsSync(ovsx)) {
  console.error("ovsx is not installed. Run npm install in extension/ first.");
  process.exit(1);
}

run(ovsx, [
  "publish",
  vsix,
  "--no-dependencies",
  "--skip-duplicate",
  "--baseContentUrl",
  baseUrl,
  "--baseImagesUrl",
  baseUrl,
]);

console.log(
  `Published: https://open-vsx.org/extension/${pkg.publisher}/${pkg.name}`
);
