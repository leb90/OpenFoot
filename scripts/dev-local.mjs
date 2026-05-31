import { spawn } from "node:child_process";

const apiPort = process.env.API_PORT ?? "3001";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
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

start("local API", process.execPath, ["server/localServer.js"]);
start("Vite", npmCommand, ["run", "dev:web"]);
