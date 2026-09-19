import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const errors = [];
const warnings = [];

function requireField(name, predicate, message) {
  if (!predicate(pkg[name])) {
    errors.push(message);
  }
}

requireField(
  "name",
  (v) => typeof v === "string" && v.length > 0,
  "package.json is missing name."
);
requireField(
  "publisher",
  (v) => v === "kuetech",
  `package.json publisher must be "kuetech" (Open VSX namespace). Found: ${pkg.publisher}`
);
requireField(
  "version",
  (v) => typeof v === "string" && /^\d+\.\d+\.\d+/.test(v),
  "package.json needs a semver version."
);
requireField(
  "license",
  (v) => v === "MIT",
  "package.json license must be MIT."
);
requireField(
  "repository",
  (v) => v?.url === "https://github.com/FloKuersten/Gitmoji.git",
  "package.json repository.url must point at the public GitHub repo."
);
requireField(
  "icon",
  (v) => typeof v === "string" && existsSync(join(root, v)),
  "package.json icon is missing or the file does not exist."
);
requireField(
  "main",
  (v) => typeof v === "string",
  "package.json is missing main."
);
requireField(
  "engines",
  (v) => typeof v?.vscode === "string",
  "package.json engines.vscode is required."
);

for (const file of ["README.md", "CHANGELOG.md", "LICENSE", "media/icon.png"]) {
  if (!existsSync(join(root, file))) {
    errors.push(`Required listing file is missing: ${file}`);
  }
}

if (process.env.OVSX_PAT) {
  warnings.push(
    "OVSX_PAT is set in this environment. That is correct for publish, never commit it."
  );
}

if (errors.length > 0) {
  console.error("Open VSX preflight failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Open VSX preflight passed.");
console.log(`  id:      ${pkg.publisher}.${pkg.name}`);
console.log(`  version: ${pkg.version}`);
console.log(
  `  listing: https://open-vsx.org/extension/${pkg.publisher}/${pkg.name}`
);
for (const warning of warnings) {
  console.log(`  note: ${warning}`);
}
