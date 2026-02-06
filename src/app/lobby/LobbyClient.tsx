"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Team = {
  id: string;
  status: string;
  memberCount: number;
  rndCount: number;
  productCount: number;
  growthCount: number;
  rootCount: number;
};

type Member = {
  userId: string;
  name: string;
  roleCategory: string;
};

type OnlineUser = {
  userId: string;
  name: string;
  employeeId: string;
  roleCategory: string;
};

type Snapshot = {
  user: { name: string; employeeId: string; roleCategory: string };
  teams: Team[];
  myTeamId: string | null;
  membersByTeam: Record<string, Member[]>;
};

function needText(rnd: number, product: number, growth: number) {
  const needRnd = Math.max(0, 2 - rnd);
  const needP = Math.max(0, 1 - product);
  const needG = Math.max(0, 1 - growth);

  const parts: string[] = [];
  if (needRnd) parts.push(`研发+${needRnd}`);
  if (needP) parts.push(`产品+${needP}`);
  if (needG) parts.push(`增长+${needG}`);

  if (!parts.length) return "✅ 构成已满足（可补第 5 人）";
  return `缺口：${parts.join("，")}`;
}

const ROLE_BADGE: Record<string, string> = {
  RND: "bg-blue-50 text-blue-700 border border-blue-200",
  PRODUCT: "bg-purple-50 text-purple-700 border border-purple-200",
  GROWTH: "bg-amber-50 text-amber-700 border border-amber-200",
  ROOT: "bg-red-50 text-red-700 border border-red-200",
};

const ROLE_LABEL: Record<string, string> = {
  RND: "研发",
  PRODUCT: "产品",
  GROWTH: "增长",
  ROOT: "ROOT",
};

export default function LobbyClient({ initial }: { initial: Snapshot }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snapshot>(initial);
  const [onlineExpanded, setOnlineExpanded] = useState(false);

  const { teams, myTeamId, membersByTeam } = snap;

  // --------------- WebSocket presence ---------------

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/presence`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!unmounted) setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "presence") {
            setOnlineUsers(data.users);
            setOnlineUserIds(new Set(data.users.map((u: OnlineUser) => u.userId)));
          }
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          setWsConnected(false);
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

  // --------------- Filter members by online presence ---------------

  const onlineMembersByTeam = useMemo(() => {
    const result: Record<string, Member[]> = {};
    for (const [teamId, members] of Object.entries(membersByTeam)) {
      result[teamId] = members.filter((m) => onlineUserIds.has(m.userId));
    }
    return result;
  }, [membersByTeam, onlineUserIds]);

  /** My team info — counts only online members */
  const my = useMemo(() => {
    if (!myTeamId) return null;
    const om = onlineMembersByTeam[myTeamId] ?? [];
    return {
      id: myTeamId,
      memberCount: om.length,
      rndCount: om.filter((m) => m.roleCategory === "RND").length,
      productCount: om.filter((m) => m.roleCategory === "PRODUCT").length,
      growthCount: om.filter((m) => m.roleCategory === "GROWTH").length,
    };
  }, [myTeamId, onlineMembersByTeam]);

  // --------------- Polling for team / membership data ---------------

  async function refreshOnce() {
    const res = await fetch("/api/lobby", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok || !data?.ok) return;
    setSnap({
      user: data.user,
      teams: data.teams,
      myTeamId: data.myTeamId,
      membersByTeam: data.membersByTeam ?? {},
    });
  }

  useEffect(() => {
    refreshOnce();
    const id = setInterval(refreshOnce, 5_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------- Actions ---------------

  async function join(teamId: string) {
    setBusy(teamId);
    setMsg(null);
    const res = await fetch(`/api/teams/${teamId}/join`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setMsg(data?.message ?? "加入失败");
      return;
    }
    await refreshOnce();
  }

  async function leave() {
    setBusy("leave");
    setMsg(null);
    const res = await fetch(`/api/teams/leave`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setMsg(data?.message ?? "退出失败");
      return;
    }
    await refreshOnce();
  }

  // --------------- Render ---------------

  return (
    <div className="space-y-4">
      {/* Online users bar */}
      <div
        className="gala-card p-4 text-sm space-y-2 cursor-pointer"
        onClick={() => setOnlineExpanded(!onlineExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-medium text-foreground">在线用户</div>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  wsConnected ? "bg-green-500 animate-pulse" : "bg-neutral-300"
                }`}
              />
              <span className="gala-muted text-xs">
                {wsConnected ? `${onlineUsers.length} 人在线` : "连接中..."}
              </span>
            </div>
          </div>
          <div className="gala-muted text-[10px]">{onlineExpanded ? "收起" : "展开"}</div>
        </div>

        {onlineExpanded && (
          <div className="pt-2 border-t gala-divider">
            {onlineUsers.length === 0 ? (
              <div className="gala-muted text-xs">暂无在线用户</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {onlineUsers.map((u) => (
                  <span key={u.userId} className="inline-flex items-center gap-1 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-foreground/80">{u.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        ROLE_BADGE[u.roleCategory] ?? "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {ROLE_LABEL[u.roleCategory] ?? u.roleCategory}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="gala-card p-4 text-sm">
        <div className="font-medium text-foreground mb-1">📋 组队规则</div>
        <div className="gala-muted text-xs leading-relaxed">
          每队 4-5 人；研发≥2、产品≥1、增长≥1、ROOT≤1
        </div>
      </div>

      {/* My team */}
      {my ? (
        <div className="gala-card gala-card-highlight p-4 text-sm flex items-center justify-between">
          <div>
            <div className="font-medium text-red-primary">
              🎯 你当前在队伍：{my.id}
            </div>
            <div className="gala-muted text-xs mt-1">
              {needText(my.rndCount, my.productCount, my.growthCount)}；在线人数：{my.memberCount}
            </div>
          </div>
          <button disabled={busy === "leave"} className="gala-btn-outline" onClick={leave}>
            {busy === "leave" ? "处理中..." : "退出队伍"}
          </button>
        </div>
      ) : (
        <div className="gala-card p-4 text-sm gala-muted">
          你还没加入队伍，选择下面任意队伍加入（先到先得）。
        </div>
      )}

      {msg ? (
        <div className="text-sm text-red-primary gala-card p-3 bg-red-50">⚠ {msg}</div>
      ) : null}

      {/* Team grid — counts reflect online members only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((t) => {
          const isMine = t.id === myTeamId;
          const om = onlineMembersByTeam[t.id] ?? [];
          const oRnd = om.filter((m) => m.roleCategory === "RND").length;
          const oProduct = om.filter((m) => m.roleCategory === "PRODUCT").length;
          const oGrowth = om.filter((m) => m.roleCategory === "GROWTH").length;
          const oRoot = om.filter((m) => m.roleCategory === "ROOT").length;

          return (
            <div
              key={t.id}
              className={`gala-card p-4 space-y-2 ${isMine ? "gala-card-highlight" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-foreground">队伍 {t.id}</div>
                <div
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    t.status === "locked"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-green-50 text-green-600 border border-green-200"
                  }`}
                >
                  {t.status === "locked" ? "🔒 已锁定" : "开放中"}
                </div>
              </div>

              <div className="text-sm gala-muted">在线人数：{om.length}/5</div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                  研发 {oRnd}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                  产品 {oProduct}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                  增长 {oGrowth}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                  ROOT {oRoot}
                </span>
              </div>

              <div className="text-xs gala-muted">
                {needText(oRnd, oProduct, oGrowth)}
              </div>

              <div className="text-xs gala-muted">
                在线成员：
                {om.length
                  ? om.map((m) => (
                      <span key={m.userId}>
                        {m.name}
                        <span className="text-foreground/40">({ROLE_LABEL[m.roleCategory] ?? m.roleCategory})</span>
                        {" "}
                      </span>
                    ))
                  : "（无人在线）"}
              </div>

              <div className="pt-1">
                <button
                  disabled={
                    !!myTeamId || t.memberCount >= 5 || busy === t.id || t.status === "locked"
                  }
                  className="gala-btn text-xs"
                  onClick={() => join(t.id)}
                >
                  {busy === t.id
                    ? "加入中..."
                    : myTeamId
                      ? "已加入其它队"
                      : t.status === "locked"
                        ? "已锁定"
                        : "加入队伍"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
