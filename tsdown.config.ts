import { defineConfig, type UserConfig } from "tsdown";

const shared = {
  entry: ["src/index.ts"],
  target: "esnext",
  minify: false,
  clean: true,
} satisfies UserConfig;

export default defineConfig([
  {
    format: "esm",
    outDir: "dist-tsdown/esm",
    ...shared,
  },
  {
    format: "cjs",
    outDir: "dist-tsdown/cjs",
    ...shared,
  },
]);
