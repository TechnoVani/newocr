module.exports = {
  apps: [
    {
      name: "opsapi",
      script: "./server.js",
      cwd: "/home/portal/web/opsapi.notioninsurance.co.in/public_html/backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};