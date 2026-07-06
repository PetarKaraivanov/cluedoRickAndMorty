// pm2 process definition for the Rick & Morty Cluedo server.
//
// Usage on the server:
//   cd /var/opt/cluedoRickAndMorty
//   npm install
//   npm run build
//   pm2 delete cluedo 2>/dev/null
//   pm2 start ecosystem.config.cjs
//   pm2 save
//
// Real secrets (APP_PASSWORD, AUTH_SECRET) should NOT be committed here.
// Either:
//   1. Edit this file's `env` block locally on the server and never commit it back, OR
//   2. Keep them in a .env file you load separately, OR
//   3. Use `pm2 set cluedo:APP_PASSWORD xxx` (per-machine secrets).

module.exports = {
  apps: [
    {
      name: "cluedo",
      script: "server.js",
      cwd: "/var/opt/cluedoRickAndMorty",
      // tsx loader must be registered so server.js can require() .ts files.
      node_args: "--import tsx",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 4001,
        APP_PASSWORD: "CHANGE_ME_shared_password",
        AUTH_SECRET: "CHANGE_ME_long_random_string",
      },
    },
  ],
};
