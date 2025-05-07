import { defineConfig, Options } from "tsup";

const shared = {
  entry: ["src/index.ts"],
  target: "esnext",
  minify: false,
  clean: true,
} satisfies Options;

export default defineConfig([
  {
    format: "esm",
    outDir: "dist-tsup/esm",
    ...shared,
  },
  {
    format: "cjs",
    outDir: "dist-tsup/cjs",
    ...shared,
  },
]);
