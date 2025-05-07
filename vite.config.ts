import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    target: "esnext",
    minify: false,
    outDir: "dist-vite",
    emptyOutDir: true,
  },
});
