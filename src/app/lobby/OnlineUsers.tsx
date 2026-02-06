"use client";

import { useEffect, useRef, useState } from "react";

type OnlineUser = {
  userId: string;
  name: string;
  employeeId: string;
  roleCategory: string;
};

export default function OnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws/presence`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!unmounted) setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "presence") {
            setUsers(data.users);
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          setConnected(false);
          // Reconnect after 3 seconds
          reconnectRef.current = setTimeout(connect, 3_000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmounted = true;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  const roleBadgeColor: Record<string, string> = {
    RND: "bg-blue-100 text-blue-700",
    PRODUCT: "bg-purple-100 text-purple-700",
    GROWTH: "bg-amber-100 text-amber-700",
    ROOT: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded border p-3 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">在线用户</div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-neutral-300"
            }`}
          />
          <span className="text-xs text-neutral-500">
            {connected ? `${users.length} 人在线` : "连接中..."}
          </span>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-neutral-400 text-xs py-1">暂无在线用户</div>
      ) : (
        <ul className="space-y-1.5">
          {users.map((u) => (
            <li key={u.userId} className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span className="truncate">{u.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  roleBadgeColor[u.roleCategory] ?? "bg-neutral-100 text-neutral-600"
                }`}
              >
                {u.roleCategory}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
