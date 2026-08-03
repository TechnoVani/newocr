import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL(".", import.meta.url));

export default {
  apps: [
    {
      name: "opsapi",
      script: "./server.js",
      cwd: appDirectory,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "production"
      },
      env_production: {
        NODE_ENV: "production",
        APP_ENV: "production"
      }
    }
  ]
};
