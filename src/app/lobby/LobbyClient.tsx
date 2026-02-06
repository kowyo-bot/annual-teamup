"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

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
  userId: string;
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

  if (!parts.length) return "构成已满足（可补第 5 人）";
  return `缺口：${parts.join("，")}`;
}

const ROLE_BADGE: Record<string, string> = {
  RND: "bg-blue-100 text-blue-700",
  PRODUCT: "bg-purple-100 text-purple-700",
  GROWTH: "bg-amber-100 text-amber-700",
  ROOT: "bg-red-100 text-red-700",
};

export default function LobbyClient({ initial }: { initial: Snapshot }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snapshot>(initial);

  const { userId, user, teams, myTeamId, membersByTeam } = snap;

  // --------------- Supabase Realtime Presence ---------------

  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel("lobby-presence", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<OnlineUser>();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
        setOnlineUserIds(new Set(users.map((u) => u.userId)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({
            userId,
            name: user.name,
            employeeId: user.employeeId,
            roleCategory: user.roleCategory,
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    setSnap((prev) => ({
      ...prev,
      user: data.user,
      teams: data.teams,
      myTeamId: data.myTeamId,
      membersByTeam: data.membersByTeam ?? {},
    }));
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
    <div className="space-y-3">
      {/* Online users bar */}
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
              {connected ? `${onlineUsers.length} 人在线` : "连接中..."}
            </span>
          </div>
        </div>

        {onlineUsers.length === 0 ? (
          <div className="text-neutral-400 text-xs">暂无在线用户</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u) => (
              <span key={u.userId} className="inline-flex items-center gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                {u.name}
                <span
                  className={`px-1 py-0.5 rounded text-[10px] ${
                    ROLE_BADGE[u.roleCategory] ?? "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {u.roleCategory}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="rounded border p-3 text-sm">
        <div className="font-medium">规则</div>
        <div className="text-neutral-600">
          每队 4-5 人；研发≥2、产品≥1、增长≥1、ROOT≤1（ROOT 强制打散）。
        </div>
      </div>

      {/* My team */}
      {my ? (
        <div className="rounded border p-3 text-sm flex items-center justify-between">
          <div>
            <div className="font-medium">你当前在队伍：{my.id}</div>
            <div className="text-neutral-600">
              {needText(my.rndCount, my.productCount, my.growthCount)}；在线人数：{my.memberCount}
            </div>
          </div>
          <button disabled={busy === "leave"} className="border px-3 py-2" onClick={leave}>
            {busy === "leave" ? "处理中..." : "退出队伍"}
          </button>
        </div>
      ) : (
        <div className="text-sm text-neutral-600">
          你还没加入队伍，选择下面任意队伍加入（先到先得）。
        </div>
      )}

      {msg ? <div className="text-sm text-red-600">{msg}</div> : null}

      {/* Team grid — counts reflect online members only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              className={`rounded border p-3 space-y-1 ${isMine ? "border-black" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">队伍 {t.id}</div>
                <div className="text-xs text-neutral-500">{t.status}</div>
              </div>

              <div className="text-sm text-neutral-700">在线人数：{om.length}/5</div>

              <div className="text-xs text-neutral-600">
                研发 {oRnd} · 产品 {oProduct} · 增长 {oGrowth} · ROOT {oRoot}
              </div>

              <div className="text-xs text-neutral-600">
                {needText(oRnd, oProduct, oGrowth)}
              </div>

              <div className="text-xs text-neutral-600">
                在线成员：
                {om.length
                  ? om.map((m) => `${m.name}(${m.roleCategory})`).join("，")
                  : "（无人在线）"}
              </div>

              <div className="pt-2">
                <button
                  disabled={
                    !!myTeamId || t.memberCount >= 5 || busy === t.id || t.status === "locked"
                  }
                  className="border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => join(t.id)}
                >
                  {busy === t.id
                    ? "加入中..."
                    : myTeamId
                      ? "已加入其它队"
                      : t.status === "locked"
                        ? "已锁定"
                        : "加入"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
