import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requestedApiPort = Number.parseInt(process.env.API_PORT ?? "3001", 10);
const rootDir = fileURLToPath(new URL("..", import.meta.url));
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const children = [];
let shuttingDown = false;

async function portIsAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  const firstPort = Number.isInteger(startPort) && startPort > 0 ? startPort : 3001;

  for (let port = firstPort; port < firstPort + 20; port += 1) {
    if (await portIsAvailable(port)) {
      return String(port);
    }
  }

  throw new Error(`No available API port found from ${firstPort} to ${firstPort + 19}`);
}

const apiPort = await findAvailablePort(requestedApiPort);

if (apiPort !== String(requestedApiPort)) {
  console.log(`API port ${requestedApiPort} is busy; using ${apiPort} instead.`);
}

function start(name, command, args) {
  const child = spawn(command, args, {
    env: {
      ...process.env,
      API_PORT: apiPort,
    },
    stdio: "inherit",
  });

  children.push(child);

  child.on("error", (error) => {
    if (shuttingDown) return;

    console.error(`${name} failed to start: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`${name} exited with ${reason}`);
    shutdown(code ?? 1);
  });

  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exitCode = code;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("exit", () => shutdown(process.exitCode ?? 0));

start("local API", process.execPath, [path.join(rootDir, "server", "localServer.js")]);
start("Vite", process.execPath, [viteBin]);
