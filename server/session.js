import { randomUUID } from "node:crypto";
import { prisma } from "./prisma.js";

const SESSION_COOKIE = "ofm_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function parseCookieHeader(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [
          decodeURIComponent(part.slice(0, index)),
          decodeURIComponent(part.slice(index + 1)),
        ];
      }),
  );
}

function buildSessionCookie(sessionId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(
    sessionId,
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ONE_YEAR_SECONDS}${secure}`;
}

export async function getWebSession(req, res) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const existingSessionId = cookies[SESSION_COOKIE];
  const sessionId = existingSessionId || randomUUID();

  if (!existingSessionId) {
    res.setHeader("Set-Cookie", buildSessionCookie(sessionId));
  }

  const session = await prisma.webSession.upsert({
    where: { id: sessionId },
    update: {},
    create: { id: sessionId },
  });

  return { sessionId, session };
}
