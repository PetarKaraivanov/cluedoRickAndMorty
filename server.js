// Custom Next.js server that also hosts the Socket.io instance.
// Uses tsx (registered via --import tsx in package.json scripts) so we can
// import .ts files directly without a prebuild step.

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(async () => {
    const { initIO } = await import("./lib/socket.ts");
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
