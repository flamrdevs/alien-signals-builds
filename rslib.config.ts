import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    {
      source: {
        entry: {
          index: "./src/index.ts",
        },
      },
      format: "esm",
      syntax: "esnext",
      output: {
        minify: false,
        distPath: {
          root: "dist-rslib",
        },
        cleanDistPath: true,
      },
    },
  ],
});
