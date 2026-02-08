"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { supabase } from "@/lib/supabase-browser";

type AnnualMeetingRow = {
  userId: string;
  name: string;
  employeeId: string;
  roleCategory: string;
  createdAt: string;
};

type OnlineUser = {
  userId: string;
  name: string;
  employeeId: string;
  roleCategory: string;
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

export default function AdminClient({ initialAnnualMeeting }: { initialAnnualMeeting: AnnualMeetingRow[] }) {
  const [annualMeeting, setAnnualMeeting] = useState<AnnualMeetingRow[]>(initialAnnualMeeting);
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

  useEffect(() => {
    refreshAnnualMeeting();
    const id = setInterval(refreshAnnualMeeting, 5_000);
    return () => clearInterval(id);
  }, [refreshAnnualMeeting]);

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
          employeeId: "",
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
        工号: r.employeeId,
        角色: r.roleCategory,
        报名时间: formatDate(r.createdAt),
      })),
    [annualMeeting],
  );

  const contestExportRows = useMemo(
    () =>
      onlineUsers.map((u) => ({
        姓名: u.name,
        工号: u.employeeId,
        角色: u.roleCategory,
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
                <th className="py-2 pr-3">工号</th>
                <th className="py-2 pr-3">角色</th>
                <th className="py-2">报名时间</th>
              </tr>
            </thead>
            <tbody>
              {annualMeeting.map((r) => (
                <tr key={r.userId} className="border-b last:border-0">
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3">{r.employeeId}</td>
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
          <div className="font-medium text-foreground">比赛报名（实时在线）</div>
          <button
            className="gala-btn-outline text-xs"
            disabled={!contestExportRows.length}
            onClick={() => exportToExcel(contestExportRows, "contest-realtime.xlsx", "contest_realtime")}
          >
            导出 Excel
          </button>
        </div>
        <div className="text-xs gala-muted">
          {connected ? `${onlineUsers.length} 人在线` : "连接中..."}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {onlineUsers.map((u) => (
            <span key={u.userId} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span>{u.name}</span>
              <span className="gala-muted">({u.employeeId})</span>
              <span className="gala-muted">{u.roleCategory}</span>
            </span>
          ))}
          {!onlineUsers.length ? <span className="text-xs gala-muted">暂无在线报名</span> : null}
        </div>
      </section>
    </div>
  );
}
