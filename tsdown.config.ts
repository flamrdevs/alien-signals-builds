import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  target: "esnext",
  minify: false,
  outDir: "dist-tsdown",
  clean: true,
});
