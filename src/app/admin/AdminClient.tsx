"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { supabase } from "@/lib/supabase-browser";

type AnnualMeetingRow = {
  userId: string;
  name: string;
  email: string;
  roleCategory: string;
  createdAt: string;
};

type OnlineUser = {
  userId: string;
  name: string;
  email: string;
  roleCategory: string;
  teamId?: string | null;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN");
}

function exportToExcel(rows: Record<string, string>[], filename: string, sheetName: string) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export default function AdminClient({
  initialAnnualMeeting,
  initialDeclined,
  initialTeamSignupCount = 0,
}: {
  initialAnnualMeeting: AnnualMeetingRow[];
  initialDeclined: AnnualMeetingRow[];
  initialTeamSignupCount?: number;
}) {
  const [annualMeeting, setAnnualMeeting] = useState<AnnualMeetingRow[]>(initialAnnualMeeting);
  const [declined, setDeclined] = useState<AnnualMeetingRow[]>(initialDeclined);
  const [teamSignupCount, setTeamSignupCount] = useState(initialTeamSignupCount);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const adminKey = useMemo(() => {
    const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    return `admin-${id}`;
  }, []);

  // --------------- Poll annual meeting data ---------------

  const refreshAnnualMeeting = useCallback(async () => {
    const res = await fetch("/api/admin/annual-meeting", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      setAnnualMeeting(data.rows);
    }
  }, []);

  const refreshDeclined = useCallback(async () => {
    const res = await fetch("/api/admin/annual-meeting/declined", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      setDeclined(data.rows);
    }
  }, []);

  useEffect(() => {
    refreshAnnualMeeting();
    refreshDeclined();
    const id = setInterval(() => {
      refreshAnnualMeeting();
      refreshDeclined();
    }, 5_000);
    return () => clearInterval(id);
  }, [refreshAnnualMeeting, refreshDeclined]);

  // --------------- Supabase Presence for contest ---------------

  useEffect(() => {
    const channel = supabase.channel("lobby-presence", {
      config: { presence: { key: adminKey } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<OnlineUser>();
      const users = Object.values(state).flat().filter((u) => u.userId !== adminKey);
      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setConnected(true);
        await channel.track({
          userId: adminKey,
          name: "Admin",
          email: "",
          roleCategory: "ADMIN",
        });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [adminKey]);

  // --------------- Export helpers ---------------

  const annualMeetingExportRows = useMemo(
    () =>
      annualMeeting.map((r) => ({
        姓名: r.name,
        邮箱: r.email,
        角色: r.roleCategory,
        报名时间: formatDate(r.createdAt),
      })),
    [annualMeeting],
  );

  const declinedExportRows = useMemo(
    () =>
      declined.map((r) => ({
        姓名: r.name,
        邮箱: r.email,
        角色: r.roleCategory,
        报名时间: formatDate(r.createdAt),
      })),
    [declined],
  );

  const contestExportRows = useMemo(
    () =>
      onlineUsers.map((u) => ({
        姓名: u.name,
        邮箱: u.email,
        角色: u.roleCategory,
        队号: u.teamId ?? "未加入",
        实时在线: "是",
      })),
    [onlineUsers],
  );

  // --------------- Render ---------------

  return (
    <div className="space-y-6">
      <section className="gala-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-medium text-foreground">年会报名（数据库）</div>
          <div className="flex items-center gap-2">
            <button className="gala-btn-outline text-xs" onClick={refreshAnnualMeeting}>
              刷新
            </button>
            <button
              className="gala-btn-outline text-xs"
              disabled={!annualMeetingExportRows.length}
              onClick={() => exportToExcel(annualMeetingExportRows, "annual-meeting.xlsx", "annual_meeting")}
            >
              导出 Excel
            </button>
          </div>
        </div>
        <div className="text-xs gala-muted">共 {annualMeeting.length} 人（每 5 秒自动刷新）</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs gala-muted border-b">
                <th className="py-2 pr-3">姓名</th>
                <th className="py-2 pr-3">邮箱</th>
                <th className="py-2 pr-3">角色</th>
                <th className="py-2">报名时间</th>
              </tr>
            </thead>
            <tbody>
              {annualMeeting.map((r) => (
                <tr key={r.userId} className="border-b last:border-0">
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3 text-xs break-all">{r.email}</td>
                  <td className="py-2 pr-3">{r.roleCategory}</td>
                  <td className="py-2">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {!annualMeeting.length ? (
                <tr>
                  <td className="py-3 text-xs gala-muted" colSpan={4}>
                    暂无报名数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="gala-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-medium text-foreground">未参加年会（领取礼盒）</div>
          <div className="flex items-center gap-2">
            <button className="gala-btn-outline text-xs" onClick={refreshDeclined}>
              刷新
            </button>
            <button
              className="gala-btn-outline text-xs"
              disabled={!declinedExportRows.length}
              onClick={() => exportToExcel(declinedExportRows, "declined.xlsx", "declined")}
            >
              导出 Excel
            </button>
          </div>
        </div>
        <div className="text-xs gala-muted">共 {declined.length} 人（每 5 秒自动刷新）</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs gala-muted border-b">
                <th className="py-2 pr-3">姓名</th>
                <th className="py-2 pr-3">邮箱</th>
                <th className="py-2 pr-3">角色</th>
                <th className="py-2">报名时间</th>
              </tr>
            </thead>
            <tbody>
              {declined.map((r) => (
                <tr key={r.userId} className="border-b last:border-0">
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3 text-xs break-all">{r.email}</td>
                  <td className="py-2 pr-3">{r.roleCategory}</td>
                  <td className="py-2">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {!declined.length ? (
                <tr>
                  <td className="py-3 text-xs gala-muted" colSpan={4}>
                    暂无数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="gala-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-medium text-foreground">比赛报名（实时人数）</div>
          <button
            className="gala-btn-outline text-xs"
            disabled={!contestExportRows.length}
            onClick={() => exportToExcel(contestExportRows, "contest-realtime.xlsx", "contest_realtime")}
          >
            导出 Excel
          </button>
        </div>
        <div className="text-xs gala-muted">
          {teamSignupCount} 人已组队
          {connected ? `（${onlineUsers.length} 人在线）` : "（连接中...）"}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {onlineUsers.map((u) => (
            <span key={u.userId} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span>{u.name}</span>
              <span className="gala-muted text-[10px] break-all">({u.email})</span>
              <span className="gala-muted">{u.roleCategory}</span>
            </span>
          ))}
          {!onlineUsers.length ? <span className="text-xs gala-muted">暂无在线报名</span> : null}
        </div>
      </section>
    </div>
  );
}
