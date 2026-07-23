module.exports = {
  apps: [
    {
      name: "field-notes-blog",
      script: "scripts/run-next.mjs",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
