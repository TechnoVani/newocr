import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cwd } from "node:process";
import { selectModeUrls } from "./config/urlConfig.js";

export default defineConfig(({ mode }) => {
  const envDir = cwd();
  const env = loadEnv(mode, envDir, "");
  const { appUrl, apiUrl } = selectModeUrls(env, mode === "production");

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_APP_URL": JSON.stringify(appUrl),
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
    server: {
      host: true,
      strictPort: true,
      proxy: {
        "/api": { target: apiUrl, changeOrigin: true },
        "/uploads": { target: apiUrl, changeOrigin: true },
      },
    },
  };
});
