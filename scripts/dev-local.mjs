import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiPort = process.env.API_PORT ?? "3001";
const rootDir = fileURLToPath(new URL("..", import.meta.url));
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const children = [];
let shuttingDown = false;

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
