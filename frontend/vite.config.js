import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    build: {
        rolldownOptions: {
            input: {
                main: resolve(projectRoot, "index.html"),
                dashboard: resolve(projectRoot, "dashboard.html")
            }
        }
    }
});
