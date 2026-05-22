const { spawn } = require("child_process");
const path = require("path");
const net = require("net");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 5093;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

function run(command, args, cwd, name) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start:`, error.message);
  });

  return child;
}

async function main() {
  const [frontendPortFree, backendPortFree] = await Promise.all([
    isPortFree(FRONTEND_PORT),
    isPortFree(BACKEND_PORT),
  ]);

  if (!frontendPortFree || !backendPortFree) {
    if (!frontendPortFree) {
      console.error(
        `[dev-monorepo] port ${FRONTEND_PORT} is already in use. Stop the existing frontend dev server first.`
      );
    }
    if (!backendPortFree) {
      console.error(
        `[dev-monorepo] port ${BACKEND_PORT} is already in use. Stop the existing backend server first.`
      );
    }
    process.exit(1);
    return;
  }

  const backend = run(
    "dotnet",
    ["run", "--project", "WebApp.csproj", "--urls", "http://localhost:5093"],
    backendDir,
    "backend"
  );

  const frontend = run("npm", ["run", "dev"], rootDir, "frontend");

  let shuttingDown = false;

  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[dev-monorepo] received ${signal}, stopping services...`);

    for (const child of [frontend, backend]) {
      if (child && !child.killed) {
        child.kill("SIGTERM");
      }
    }

    setTimeout(() => process.exit(0), 1500);
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  backend.on("exit", (code) => {
    if (!shuttingDown) {
      console.log(`[dev-monorepo] backend exited with code ${code ?? "unknown"}`);
      shutdown("BACKEND_EXIT");
    }
  });

  frontend.on("exit", (code) => {
    if (!shuttingDown) {
      console.log(`[dev-monorepo] frontend exited with code ${code ?? "unknown"}`);
      shutdown("FRONTEND_EXIT");
    }
  });
}

main().catch((error) => {
  console.error("[dev-monorepo] startup error:", error?.message || error);
  process.exit(1);
});
