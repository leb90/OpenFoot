import { getWebSession } from "../server/session.js";
import { runCommand } from "../server/gameCommands.js";

function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === "string") {
    return Promise.resolve(JSON.parse(req.body || "{}"));
  }

  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { command, args = {} } = await readBody(req);
    if (!command || typeof command !== "string") {
      res.status(400).json({ error: "Missing command" });
      return;
    }

    const context = await getWebSession(req, res);
    const data = await runCommand(command, args, context);
    res.status(200).json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("be.error.commandNotImplemented") ? 501 : 400;
    res.status(status).json({ error: message });
  }
}
