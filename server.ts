import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";
import { handleConnection } from "./lib/relay/handleConnection";
import type { Language } from "./types/conversation";

const VALID_LANGUAGES: Language[] = ["en", "he", "ru", "ar"];

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const nextUpgradeHandler = app.getUpgradeHandler();

  server.on("upgrade", (req, socket, head) => {
    const { pathname, query } = parse(req.url || "/", true);
    if (pathname === "/api/relay") {
      const langParam = typeof query.lang === "string" ? query.lang : "";
      const language: Language = (VALID_LANGUAGES as string[]).includes(langParam)
        ? (langParam as Language)
        : "en";
      wss.handleUpgrade(req, socket, head, (ws) => {
        handleConnection(ws, language).catch((err) => {
          console.error("[server] relay connection failed", err);
          ws.close();
        });
      });
    } else {
      // Next's own dev-mode HMR socket (and anything else Next needs to
      // upgrade) comes through here too — hand it back instead of killing
      // the connection, or client-side hydration silently never runs.
      nextUpgradeHandler(req, socket, head);
    }
  });

  server.listen(port, () => {
    console.log(`> PSAI ready on http://localhost:${port}`);
    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        "> WARNING: GEMINI_API_KEY is not set. Voice conversations will fail to start. See .env.local.example."
      );
    }
  });
});
