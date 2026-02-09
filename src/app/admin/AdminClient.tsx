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

type ContestSignupRow = {
  userId: string;
  name: string;
  email: string;
  roleCategory: string;
  status: string;
  teamId: string | null;
  createdAt: string;
};

type OnlineUser = {
  userId: string;
  name: string;
  email: string;
  roleCategory: string;
  teamId?: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  RND: "研发",
  PRODUCT: "产品",
  GROWTH: "增长",
  ROOT: "ROOT",
  FUNCTION: "职能",
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
  initialContestSignups = [],
}: {
  initialAnnualMeeting: AnnualMeetingRow[];
  initialDeclined: AnnualMeetingRow[];
  initialTeamSignupCount?: number;
  initialContestSignups?: ContestSignupRow[];
}) {
  const [annualMeeting, setAnnualMeeting] = useState<AnnualMeetingRow[]>(initialAnnualMeeting);
  const [declined, setDeclined] = useState<AnnualMeetingRow[]>(initialDeclined);
  const [teamSignupCount, setTeamSignupCount] = useState(initialTeamSignupCount);
  const [contestSignups, setContestSignups] = useState<ContestSignupRow[]>(initialContestSignups);
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

  const refreshContestSignups = useCallback(async () => {
    const res = await fetch("/api/admin/contest-signup", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      setContestSignups(data.rows);
    }
  }, []);

  useEffect(() => {
    refreshAnnualMeeting();
    refreshDeclined();
    refreshContestSignups();
    const id = setInterval(() => {
      refreshAnnualMeeting();
      refreshDeclined();
      refreshContestSignups();
    }, 5_000);
    return () => clearInterval(id);
  }, [refreshAnnualMeeting, refreshDeclined, refreshContestSignups]);

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
        角色: ROLE_LABEL[r.roleCategory] ?? r.roleCategory,
        报名时间: formatDate(r.createdAt),
      })),
    [annualMeeting],
  );

  const declinedExportRows = useMemo(
    () =>
      declined.map((r) => ({
        姓名: r.name,
        邮箱: r.email,
        角色: ROLE_LABEL[r.roleCategory] ?? r.roleCategory,
        报名时间: formatDate(r.createdAt),
      })),
    [declined],
  );

  const onlineUserIds = useMemo(() => new Set(onlineUsers.map((u) => u.userId)), [onlineUsers]);

  const contestExportRows = useMemo(
    () =>
      contestSignups.map((r) => ({
        姓名: r.name,
        邮箱: r.email,
        角色: ROLE_LABEL[r.roleCategory] ?? r.roleCategory,
        队号: r.teamId ?? "未加入",
        报名时间: formatDate(r.createdAt),
        在线状态: onlineUserIds.has(r.userId) ? "在线" : "离线",
      })),
    [contestSignups, onlineUserIds],
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
                  <td className="py-2 pr-3">{ROLE_LABEL[r.roleCategory] ?? r.roleCategory}</td>
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
                  <td className="py-2 pr-3">{ROLE_LABEL[r.roleCategory] ?? r.roleCategory}</td>
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
          <div className="font-medium text-foreground">比赛报名（数据库）</div>
          <div className="flex items-center gap-2">
            <button className="gala-btn-outline text-xs" onClick={refreshContestSignups}>
              刷新
            </button>
            <button
              className="gala-btn-outline text-xs"
              disabled={!contestExportRows.length}
              onClick={() => exportToExcel(contestExportRows, "contest-signup.xlsx", "contest_signup")}
            >
              导出 Excel
            </button>
          </div>
        </div>
        <div className="text-xs gala-muted">
          共 {contestSignups.length} 人报名，{teamSignupCount} 人已组队
          {connected ? `（${onlineUsers.length} 人在线）` : "（连接中...）"}
          （每 5 秒自动刷新）
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs gala-muted border-b">
                <th className="py-2 pr-3">状态</th>
                <th className="py-2 pr-3">姓名</th>
                <th className="py-2 pr-3">邮箱</th>
                <th className="py-2 pr-3">角色</th>
                <th className="py-2 pr-3">队号</th>
                <th className="py-2">报名时间</th>
              </tr>
            </thead>
            <tbody>
              {contestSignups.map((r) => (
                <tr key={r.userId} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${onlineUserIds.has(r.userId) ? "bg-green-500" : "bg-neutral-300"}`}
                      title={onlineUserIds.has(r.userId) ? "在线" : "离线"}
                    />
                  </td>
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3 text-xs break-all">{r.email}</td>
                  <td className="py-2 pr-3">{ROLE_LABEL[r.roleCategory] ?? r.roleCategory}</td>
                  <td className="py-2 pr-3">{r.teamId ?? <span className="gala-muted">未加入</span>}</td>
                  <td className="py-2">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {!contestSignups.length ? (
                <tr>
                  <td className="py-3 text-xs gala-muted" colSpan={6}>
                    暂无报名数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
