import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => (format === "cjs" ? `cjs/${entryName}.cjs` : `esm/${entryName}.js`),
    },
    target: "esnext",
    minify: false,
    outDir: "dist-vite",
    emptyOutDir: true,
  },
});
