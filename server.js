// Custom Next.js server that also hosts the Socket.io instance.
// Uses tsx (registered via --import tsx in package.json scripts, or
// via node_args in ecosystem.config.cjs when run under pm2) so we can
// load .ts files directly without a prebuild step.

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    // tsx registers a require() hook for .ts when started with --import tsx,
    // so a synchronous require() works and avoids the ESM/CJS default-export
    // mismatch that dynamic `await import()` of a .ts file can produce.
    const { initIO } = require("./lib/socket.ts");
    if (typeof initIO !== "function") {
      throw new Error(
        "initIO was not exported from lib/socket.ts. " +
          "Make sure you `npm install` so tsx is present, and that you start " +
          "the server with `--import tsx` (see package.json or ecosystem.config.cjs).",
      );
    }
    const server = createServer((req, res) => handle(req, res));
    initIO(server);

    server.listen(port, "0.0.0.0", () => {
      console.log(`> Rick & Morty Cluedo ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
