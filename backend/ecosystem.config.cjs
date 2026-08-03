module.exports = {
  apps: [
    {
      name: "opsapi",
      script: "./server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
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
