import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src"],
    splitting: false,
    sourcemap: true,
    format: ["esm", "cjs"],
    clean: true,
});
