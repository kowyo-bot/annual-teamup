"use client";

import { useEffect, useMemo, useState } from "react";

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

type Snapshot = {
  teams: Team[];
  myTeamId: string | null;
  membersByTeam: Record<string, Member[]>;
};

function needText(t: Team) {
  const needRnd = Math.max(0, 2 - t.rndCount);
  const needP = Math.max(0, 1 - t.productCount);
  const needG = Math.max(0, 1 - t.growthCount);

  const parts: string[] = [];
  if (needRnd) parts.push(`研发+${needRnd}`);
  if (needP) parts.push(`产品+${needP}`);
  if (needG) parts.push(`增长+${needG}`);

  if (!parts.length) return "构成已满足（可补第 5 人）";
  return `缺口：${parts.join("，")}`;
}

export default function LobbyClient({ initial }: { initial: Snapshot }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snapshot>(initial);

  const { teams, myTeamId, membersByTeam } = snap;

  const my = useMemo(() => teams.find((t) => t.id === myTeamId) ?? null, [teams, myTeamId]);

  async function refreshOnce() {
    const res = await fetch("/api/lobby", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as any;
    if (!res.ok || !data?.ok) return;
    setSnap({
      teams: data.teams,
      myTeamId: data.myTeamId,
      membersByTeam: data.membersByTeam ?? {},
    });
  }

  useEffect(() => {
    // 先拉一次最新快照
    refreshOnce();

    // 简易“准实时”：2s 轮询（后续可换 Supabase Realtime）
    const id = setInterval(() => {
      refreshOnce();
    }, 2000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="space-y-3">
      <div className="rounded border p-3 text-sm">
        <div className="font-medium">规则</div>
        <div className="text-neutral-600">每队 4-5 人；研发≥2、产品≥1、增长≥1、ROOT≤1（ROOT 强制打散）。</div>
      </div>

      {my ? (
        <div className="rounded border p-3 text-sm flex items-center justify-between">
          <div>
            <div className="font-medium">你当前在队伍：{my.id}</div>
            <div className="text-neutral-600">{needText(my)}；人数：{my.memberCount}/5</div>
          </div>
          <button disabled={busy === "leave"} className="border px-3 py-2" onClick={leave}>
            {busy === "leave" ? "处理中..." : "退出队伍"}
          </button>
        </div>
      ) : (
        <div className="text-sm text-neutral-600">你还没加入队伍，选择下面任意队伍加入（先到先得）。</div>
      )}

      {msg ? <div className="text-sm text-red-600">{msg}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams.map((t) => {
          const isMine = t.id === myTeamId;
          return (
            <div key={t.id} className={`rounded border p-3 space-y-1 ${isMine ? "border-black" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">队伍 {t.id}</div>
                <div className="text-xs text-neutral-500">{t.status}</div>
              </div>
              <div className="text-sm text-neutral-700">人数：{t.memberCount}/5</div>
              <div className="text-xs text-neutral-600">研发 {t.rndCount} · 产品 {t.productCount} · 增长 {t.growthCount} · ROOT {t.rootCount}</div>
              <div className="text-xs text-neutral-600">{needText(t)}</div>
              <div className="text-xs text-neutral-600">
                成员：
                {(membersByTeam[t.id] ?? []).length
                  ? (membersByTeam[t.id] ?? []).map((m) => `${m.name}(${m.roleCategory})`).join("，")
                  : "（空）"}
              </div>

              <div className="pt-2">
                <button
                  disabled={!!myTeamId || t.memberCount >= 5 || busy === t.id || t.status === "locked"}
                  className="border px-3 py-2 text-sm disabled:opacity-50"
                  onClick={() => join(t.id)}
                >
                  {busy === t.id ? "加入中..." : myTeamId ? "已加入其它队" : t.status === "locked" ? "已锁定" : "加入"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
