import { defineConfig } from "vite";

const repositorio = process.env.GITHUB_REPOSITORY?.split("/")[1];
const baseCalculada = process.env.VITE_BASE_PATH ?? (repositorio ? `/${repositorio}/` : "./");

export default defineConfig({
  base: baseCalculada,
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
