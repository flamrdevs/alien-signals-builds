import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      index: "./src/index.ts",
    },
  },
  lib: [
    {
      format: "esm",
      syntax: "esnext",
      output: { distPath: { root: "dist-rslib/esm" } },
    },
    {
      format: "cjs",
      syntax: "esnext",
      output: { distPath: { root: "dist-rslib/cjs" } },
    },
  ],
  output: {
    minify: false,
    cleanDistPath: true,
  },
});
