"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrophyIcon,
  ZapIcon,
  TargetIcon,
  FlameIcon,
  ClockIcon,
  MedalIcon,
  UsersIcon,
  BugIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GlobalEntry = {
  rank: number;
  userId: string;
  userName: string;
  totalXP: number;
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number;
  hintsUsed: number;
  avgTime: number;
  lastActive: string;
  isCurrentUser: boolean;
};

type LangEntry = {
  rank: number;
  userId: string;
  userName: string;
  xp: number;
  correct: number;
  total: number;
  accuracy: number;
  isCurrentUser: boolean;
};

type LeaderboardData = {
  global: GlobalEntry[];
  currentUserRank: number | null;
  languageLeaderboard: Record<string, LangEntry[]>;
  totalPlayers: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANGUAGES = ["python", "javascript", "typescript", "java", "cpp"] as const;
type Language = (typeof LANGUAGES)[number];

const LANG_LABEL: Record<Language, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  cpp: "C++",
};

const LANG_BADGE: Record<Language, string> = {
  python:     "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  javascript: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
  typescript: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
  java:       "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  cpp:        "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
};

function formatTime(s: number) {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-amber-400/20 text-amber-500 font-bold text-sm">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-400/20 text-slate-500 font-bold text-sm">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-orange-400/20 text-orange-600 font-bold text-sm">
        🥉
      </span>
    );
  return (
    <span className="inline-flex size-7 items-center justify-center font-mono text-sm text-muted-foreground">
      {rank}
    </span>
  );
}

// ─── Avatar Initial ───────────────────────────────────────────────────────────

function UserAvatar({ name, isCurrentUser }: { name: string; isCurrentUser: boolean }) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        isCurrentUser
          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background"
          : "bg-muted text-muted-foreground"
      )}
    >
      {initial}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="dark:bg-transparent">
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="dark:bg-transparent">
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
      <UsersIcon className="size-10 text-muted-foreground/40" />
      <div>
        <p className="font-medium">No hunters yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to solve a challenge and claim the top spot!
        </p>
      </div>
    </div>
  );
}

// ─── Podium (top 3) ───────────────────────────────────────────────────────────

function Podium({ top3 }: { top3: GlobalEntry[] }) {
  const [first, second, third] = [top3[0], top3[1], top3[2]];

  const PodiumCard = ({
    entry,
    height,
    order,
  }: {
    entry?: GlobalEntry;
    height: string;
    order: string;
  }) => (
    <div className={cn("flex flex-col items-center gap-2", order)}>
      {entry ? (
        <>
          <UserAvatar name={entry.userName} isCurrentUser={entry.isCurrentUser} />
          <p className={cn(
            "max-w-[80px] truncate text-center text-xs font-semibold",
            entry.isCurrentUser && "text-primary"
          )}>
            {entry.userName}
          </p>
          <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
            <ZapIcon className="size-2.5" />
            {entry.totalXP.toLocaleString()}
          </Badge>
        </>
      ) : (
        <div className="size-7 rounded-full bg-muted" />
      )}
      <div
        className={cn(
          "w-20 rounded-t-lg flex items-center justify-center text-lg font-bold",
          height,
          entry?.rank === 1 && "bg-amber-400/20 text-amber-500",
          entry?.rank === 2 && "bg-slate-400/20 text-slate-500",
          entry?.rank === 3 && "bg-orange-400/20 text-orange-600"
        )}
      >
        {entry?.rank === 1 ? "🥇" : entry?.rank === 2 ? "🥈" : "🥉"}
      </div>
    </div>
  );

  return (
    <div className="flex items-end justify-center gap-4 pb-4">
      <PodiumCard entry={second} height="h-16" order="order-1" />
      <PodiumCard entry={first}  height="h-24" order="order-2" />
      <PodiumCard entry={third}  height="h-12" order="order-3" />
    </div>
  );
}

// ─── Global Table ─────────────────────────────────────────────────────────────

function GlobalTable({ data, currentUserRank }: { data: GlobalEntry[]; currentUserRank: number | null }) {
  return (
    <Card className="dark:bg-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrophyIcon className="size-4 text-amber-500" />
          Global Rankings
        </CardTitle>
        <CardDescription>
          Top 50 players ranked by total XP earned
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-6">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">
                <span className="flex items-center justify-end gap-1">
                  <ZapIcon className="size-3 text-amber-500" /> XP
                </span>
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                <span className="flex items-center justify-end gap-1">
                  <TargetIcon className="size-3" /> Accuracy
                </span>
              </TableHead>
              <TableHead className="text-right hidden md:table-cell">
                <span className="flex items-center justify-end gap-1">
                  <BugIcon className="size-3" /> Solved
                </span>
              </TableHead>
              <TableHead className="text-right hidden lg:table-cell pr-6">
                <span className="flex items-center justify-end gap-1">
                  <ClockIcon className="size-3" /> Avg Time
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow
                key={entry.userId}
                className={cn(
                  entry.isCurrentUser &&
                    "bg-primary/5 hover:bg-primary/10 font-medium"
                )}
              >
                <TableCell className="pl-6">
                  <RankBadge rank={entry.rank} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={entry.userName}
                      isCurrentUser={entry.isCurrentUser}
                    />
                    <span className={cn(
                      "text-sm",
                      entry.isCurrentUser && "text-primary font-semibold"
                    )}>
                      {entry.userName}
                      {entry.isCurrentUser && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {entry.totalXP.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden sm:table-cell">
                  <span className={cn(
                    "text-sm",
                    entry.accuracy >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                    entry.accuracy >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-500"
                  )}>
                    {entry.accuracy}%
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground text-sm hidden md:table-cell">
                  {entry.correctAnswers}/{entry.totalAttempts}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground text-sm hidden lg:table-cell pr-6">
                  {formatTime(entry.avgTime)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Current user rank footer if outside top 50 */}
        {currentUserRank && currentUserRank > 50 && (
          <>
            <Separator />
            <div className="px-6 py-3 text-sm text-muted-foreground text-center">
              Your rank: <span className="font-semibold text-foreground">#{currentUserRank}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Per-Language Table ───────────────────────────────────────────────────────

function LanguageTable({
  language,
  data,
}: {
  language: string;
  data: LangEntry[];
}) {
  return (
    <Card className="dark:bg-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Badge
            variant="outline"
            className={cn("capitalize", LANG_BADGE[language as Language])}
          >
            {LANG_LABEL[language as Language] ?? language}
          </Badge>
          <span className="text-muted-foreground font-normal">Top 10</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4">#</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">XP</TableHead>
              <TableHead className="text-right pr-4">Acc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((e) => (
              <TableRow
                key={e.userId}
                className={cn(e.isCurrentUser && "bg-primary/5 hover:bg-primary/10")}
              >
                <TableCell className="pl-4">
                  <RankBadge rank={e.rank} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <UserAvatar name={e.userName} isCurrentUser={e.isCurrentUser} />
                    <span className={cn("text-xs truncate max-w-[90px]", e.isCurrentUser && "text-primary font-semibold")}>
                      {e.userName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  {e.xp.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums pr-4">
                  <span className={cn(
                    e.accuracy >= 75 ? "text-emerald-600 dark:text-emerald-400" :
                    e.accuracy >= 50 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-500"
                  )}>
                    {e.accuracy}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                  No data yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LeaderboardSkeleton />;

  if (error) return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-600 dark:text-red-400">
      Failed to load leaderboard. Try refreshing.
    </div>
  );

  const isEmpty = !data || data.global.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <TrophyIcon className="size-6 text-amber-500" />
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.totalPlayers
            ? `${data.totalPlayers} hunter${data.totalPlayers !== 1 ? "s" : ""} competing`
            : "See who's dominating the arena"}
        </p>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Podium */}
          {data.global.length >= 2 && (
            <Card className="dark:bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <MedalIcon className="size-4 text-amber-500" />
                  Top 3 Hunters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Podium top3={data.global.slice(0, 3)} />
              </CardContent>
            </Card>
          )}

          {/* Summary pills */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Card className="dark:bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">Top Score</p>
                <ZapIcon className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {data.global[0]?.totalXP.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {data.global[0]?.userName}
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">Your Rank</p>
                <FlameIcon className="size-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {data.currentUserRank ? `#${data.currentUserRank}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  out of {data.totalPlayers} players
                </p>
              </CardContent>
            </Card>
            <Card className="dark:bg-transparent md:col-span-1 col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <p className="text-sm font-medium text-muted-foreground">Best Accuracy</p>
                <TargetIcon className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {Math.max(...data.global.map((u) => u.accuracy))}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {data.global.find((u) => u.accuracy === Math.max(...data.global.map((u) => u.accuracy)))?.userName}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Global table */}
          <GlobalTable
            data={data.global}
            currentUserRank={data.currentUserRank}
          />

          {/* Per-language tables */}
          {Object.keys(data.languageLeaderboard).length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <BugIcon className="size-4 text-muted-foreground" />
                By Language
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {LANGUAGES.filter((l) => data.languageLeaderboard[l]?.length).map((lang) => (
                  <LanguageTable
                    key={lang}
                    language={lang}
                    data={data.languageLeaderboard[lang]}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
