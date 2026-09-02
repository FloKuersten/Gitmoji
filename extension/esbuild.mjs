import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  outfile: "dist/extension.js",
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  external: ["vscode"],
  minify: production,
  sourcemap: !production,
  logLevel: "info",
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
