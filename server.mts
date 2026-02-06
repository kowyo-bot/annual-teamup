import { config } from "dotenv";
config({ path: ".env.local" });

import { createServer } from "node:http";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import postgres from "postgres";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// --------------- Presence tracking ---------------

type OnlineUser = {
  userId: string;
  name: string;
  employeeId: string;
  roleCategory: string;
};

/** ws → user info */
const connections = new Map<WebSocket, OnlineUser>();

function getOnlineUsers(): OnlineUser[] {
  const seen = new Map<string, OnlineUser>();
  for (const user of connections.values()) {
    if (!seen.has(user.userId)) {
      seen.set(user.userId, user);
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "zh-Hans-CN"),
  );
}

function broadcast() {
  const msg = JSON.stringify({ type: "presence", users: getOnlineUsers() });
  for (const ws of connections.keys()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

// --------------- Cookie helper ---------------

function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

// --------------- DB helper (raw SQL, no path-alias needed) ---------------

let sql: ReturnType<typeof postgres> | null = null;

function getSQL() {
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 3 });
  }
  return sql;
}

async function authenticateToken(token: string): Promise<OnlineUser | null> {
  const db = getSQL();
  const rows = await db`
    SELECT u.id, u.name, u.employee_id, u.role_category
    FROM teamup_sessions s
    JOIN teamup_users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    userId: row.id,
    name: row.name,
    employeeId: row.employee_id,
    roleCategory: row.role_category,
  };
}

// --------------- Start server ---------------

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    if (url.pathname !== "/ws/presence") {
      socket.destroy();
      return;
    }

    // Auth via session cookie
    const cookieHeader = req.headers.cookie || "";
    const cookies = parseCookies(cookieHeader);
    const token = cookies["teamup_session"];

    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const user = await authenticateToken(token);
      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, user);
      });
    } catch (err) {
      console.error("WebSocket auth error:", err);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket, user: OnlineUser) => {
    connections.set(ws, user);
    broadcast();

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30_000);

    ws.on("close", () => {
      clearInterval(heartbeat);
      connections.delete(ws);
      broadcast();
    });

    ws.on("error", () => {
      clearInterval(heartbeat);
      connections.delete(ws);
      broadcast();
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
