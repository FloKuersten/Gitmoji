import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const token = process.env.VSCE_PAT;

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
const vsce = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vsce.cmd" : "vsce"
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
  `Publishing ${pkg.publisher}.${pkg.name}@${pkg.version} to Visual Studio Code Marketplace.`
);

if (!existsSync(vsce)) {
  console.error("vsce is not installed. Run npm install in extension/ first.");
  process.exit(1);
}

if (!token) {
  console.warn(
    "Notice: VSCE_PAT environment variable is not set. Attempting publish with existing session or keychain..."
  );
}

const publishArgs = [
  "publish",
  "--packagePath",
  vsix,
  "--no-dependencies",
  "--skip-duplicate",
  "--baseContentUrl",
  baseUrl,
  "--baseImagesUrl",
  baseUrl,
];

if (token) {
  publishArgs.push("-p", token);
}

const res = spawnSync(vsce, publishArgs, {
  cwd: root,
  stdio: "inherit",
  shell: false,
  env: process.env,
});

if (res.status !== 0) {
  if (!token) {
    console.error(
      "\n❌ VSCE_PAT is not set and no active login session was found.\n" +
        "To publish to Visual Studio Code Marketplace:\n" +
        "1. Generate an Azure DevOps PAT at https://marketplace.visualstudio.com/manage with 'Marketplace (Publish)' scope.\n" +
        "2. Publish locally:\n" +
        '     $env:VSCE_PAT = "your-token-here"\n' +
        "     npm run publish:marketplace\n" +
        "3. Or add 'VSCE_PAT' to GitHub repository secrets to publish via the 'Publish VS Code Marketplace' workflow.\n"
    );
  }
  process.exit(res.status ?? 1);
}

console.log(
  `Published: https://marketplace.visualstudio.com/items?itemName=${pkg.publisher}.${pkg.name}`
);
