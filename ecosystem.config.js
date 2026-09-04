module.exports = {
  apps: [
    {
      name: "api_talleres",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
      },
    },
  ],
};
