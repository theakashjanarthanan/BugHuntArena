"use client";

import { useEffect, useState, useId } from "react";
import { useSession } from "next-auth/react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, RadialBarChart, RadialBar, PolarGrid } from "recharts";
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
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ZapIcon,
  BugIcon,
  TargetIcon,
  FlameIcon,
  TrophyIcon,
  ClockIcon,
  LightbulbIcon,
  CheckCircle2Icon,
  XCircleIcon,
  BookOpenIcon,
  LayersIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  summary: {
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    totalXP: number;
    totalHints: number;
    avgTimeTaken: number;
    bestStreak: number;
    totalSessions: number;
    bestSessionXP: number;
  };
  dailyXp: { date: string; xp: number; attempts: number }[];
  byLanguage: { language: string; total: number; correct: number; accuracy: number; xp: number }[];
  byDifficulty: { difficulty: string; total: number; correct: number; accuracy: number; xp: number }[];
  recentAttempts: {
    id: string;
    isCorrect: boolean;
    timeTaken: number;
    xpEarned: number;
    hintsUsed: number;
    language: string;
    difficulty: string;
    createdAt: string;
  }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  python:     "var(--chart-1)",
  javascript: "var(--chart-2)",
  typescript: "var(--chart-3)",
  java:       "var(--chart-4)",
  cpp:        "var(--chart-5)",
};

const DIFF_COLORS: Record<string, string> = {
  easy:   "var(--chart-2)",
  medium: "var(--chart-4)",
  hard:   "var(--chart-1)",
};

const DIFF_BADGE: Record<string, string> = {
  easy:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  hard:   "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
};

const LANG_BADGE: Record<string, string> = {
  python:     "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  javascript: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
  typescript: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
  java:       "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  cpp:        "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
};

function formatTime(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="dark:bg-transparent">
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 dark:bg-transparent">
          <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
        <Card className="dark:bg-transparent">
          <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <BugIcon className="size-10 text-muted-foreground/40" />
      <div>
        <p className="font-medium">No activity yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Head to Bug Hunt and solve your first challenge to see your stats here.
        </p>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="dark:bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={cn("size-4 text-muted-foreground", color)} />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── XP Activity Chart ────────────────────────────────────────────────────────

function XpActivityChart({ data }: { data: Stats["dailyXp"] }) {
  const gradientId = `xp-area-${useId().replace(/:/g, "")}`;
  const total = data.reduce((s, d) => s + d.xp, 0);

  const chartConfig = {
    xp: { label: "XP", color: "var(--chart-2)" },
    attempts: { label: "Attempts", color: "var(--chart-3)" },
  } satisfies ChartConfig;

  return (
    <Card className="md:col-span-2 dark:bg-transparent">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="font-mono text-2xl tabular-nums">
            {total.toLocaleString()} XP
          </CardTitle>
          <CardDescription>Earned over the last 14 days</CardDescription>
        </div>
        <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
          <ZapIcon className="size-3" />
          Last 14 days
        </Badge>
      </CardHeader>
      <CardContent>
        <ChartContainer className="aspect-auto h-52 w-full" config={chartConfig}>
          <AreaChart data={data} margin={{ left: 0, right: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-xp)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-xp)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              interval={1}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="dashed" />}
              cursor={{ stroke: "var(--color-xp)", strokeDasharray: "3 3" }}
              wrapperStyle={{ outline: "none" }}
            />
            <Area
              dataKey="xp"
              stroke="var(--color-xp)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ fill: "var(--color-xp)", r: 2, strokeWidth: 2 }}
              isAnimationActive={false}
              name={chartConfig.xp.label}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ─── Accuracy Radial ──────────────────────────────────────────────────────────

function AccuracyRadial({ accuracy, correct, total }: { accuracy: number; correct: number; total: number }) {
  const chartConfig = {
    accuracy: { label: "Accuracy", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  const chartData = [{ name: "Accuracy", accuracy, fill: "var(--chart-2)" }];

  return (
    <Card className="dark:bg-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TargetIcon className="size-4 text-muted-foreground" />
          Accuracy
        </CardTitle>
        <CardDescription>{correct} correct out of {total}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <ChartContainer config={chartConfig} className="h-36 w-36">
          <RadialBarChart
            data={chartData}
            innerRadius={45}
            outerRadius={70}
            startAngle={90}
            endAngle={90 - 360 * (accuracy / 100)}
          >
            <PolarGrid gridType="circle" radialLines={false} stroke="none"
              className="first:fill-muted last:fill-background"
            />
            <RadialBar dataKey="accuracy" background cornerRadius={5} />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
              className="fill-foreground text-xl font-bold"
            >
              {accuracy}%
            </text>
          </RadialBarChart>
        </ChartContainer>
        <div className="flex gap-4 text-center text-sm">
          <div>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{correct}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div>
            <p className="font-semibold text-red-500">{total - correct}</p>
            <p className="text-xs text-muted-foreground">Wrong</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Language Breakdown ───────────────────────────────────────────────────────

function LanguageBreakdown({ data }: { data: Stats["byLanguage"] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((l) => l.xp), 1);

  return (
    <Card className="dark:bg-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BookOpenIcon className="size-4 text-muted-foreground" />
          By Language
        </CardTitle>
        <CardDescription>XP earned per language</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((l) => (
          <div key={l.language} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <Badge variant="outline" className={cn("capitalize", LANG_BADGE[l.language])}>
                {capitalize(l.language)}
              </Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                {l.xp} XP · {l.accuracy}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(l.xp / max) * 100}%`,
                  backgroundColor: LANG_COLORS[l.language] ?? "var(--chart-1)",
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Difficulty Breakdown ─────────────────────────────────────────────────────

function DifficultyBreakdown({ data }: { data: Stats["byDifficulty"] }) {
  const order = ["easy", "medium", "hard"];
  const sorted = [...data].sort((a, b) => order.indexOf(a.difficulty) - order.indexOf(b.difficulty));

  return (
    <Card className="dark:bg-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <LayersIcon className="size-4 text-muted-foreground" />
          By Difficulty
        </CardTitle>
        <CardDescription>Questions attempted per tier</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((d) => (
          <div key={d.difficulty} className="flex items-center gap-3">
            <Badge variant="outline" className={cn("capitalize w-16 justify-center", DIFF_BADGE[d.difficulty])}>
              {capitalize(d.difficulty)}
            </Badge>
            <div className="flex-1 space-y-0.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{d.correct}/{d.total} correct</span>
                <span>{d.xp} XP</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${d.accuracy}%`,
                    backgroundColor: DIFF_COLORS[d.difficulty] ?? "var(--chart-1)",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        {!sorted.length && (
          <p className="text-center text-xs text-muted-foreground py-2">No data yet</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Recent Attempts ──────────────────────────────────────────────────────────

function RecentAttempts({ data }: { data: Stats["recentAttempts"] }) {
  return (
    <Card className="md:col-span-2 lg:col-span-3 dark:bg-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ClockIcon className="size-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your last 5 attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">No attempts yet</p>
        ) : (
          <div className="space-y-2">
            {data.map((a, i) => (
              <div key={a.id}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center gap-3">
                  {a.isCorrect ? (
                    <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircleIcon className="size-4 shrink-0 text-red-500" />
                  )}
                  <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
                    <Badge variant="outline" className={cn("capitalize text-xs", LANG_BADGE[a.language])}>
                      {capitalize(a.language)}
                    </Badge>
                    <Badge variant="outline" className={cn("capitalize text-xs", DIFF_BADGE[a.difficulty])}>
                      {capitalize(a.difficulty)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {a.xpEarned > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-medium">
                        <ZapIcon className="size-3" />
                        +{a.xpEarned}
                      </span>
                    )}
                    {a.hintsUsed > 0 && (
                      <span className="flex items-center gap-0.5">
                        <LightbulbIcon className="size-3" />
                        {a.hintsUsed}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <ClockIcon className="size-3" />
                      {formatTime(a.timeTaken ?? 0)}
                    </span>
                    <span className="hidden sm:block">{formatDate(a.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setStats(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-600 dark:text-red-400">
      Failed to load stats. Try refreshing.
    </div>
  );
  if (!stats) return null;

  const { summary } = stats;
  const isEmpty = summary.totalAttempts === 0;

  const name = session?.user?.name?.split(" ")[0] ?? "Hunter";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {name}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's how your bug hunting is going.
        </p>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Stat Pills ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total XP"
              value={summary.totalXP.toLocaleString()}
              icon={ZapIcon}
              sub={`Best session: ${summary.bestSessionXP} XP`}
              color="text-amber-500"
            />
            <StatCard
              label="Best Streak"
              value={summary.bestStreak}
              icon={FlameIcon}
              sub="consecutive correct"
              color="text-orange-500"
            />
            <StatCard
              label="Questions"
              value={summary.totalAttempts}
              icon={BugIcon}
              sub={`${summary.correctAttempts} correct`}
            />
            <StatCard
              label="Sessions"
              value={summary.totalSessions}
              icon={TrophyIcon}
              sub={`Avg time: ${formatTime(summary.avgTimeTaken)}`}
            />
          </div>

          {/* ── Charts Row ─────────────────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            <XpActivityChart data={stats.dailyXp} />
            <AccuracyRadial
              accuracy={summary.accuracy}
              correct={summary.correctAttempts}
              total={summary.totalAttempts}
            />
          </div>

          {/* ── Breakdown Row ──────────────────────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            <LanguageBreakdown data={stats.byLanguage} />
            <DifficultyBreakdown data={stats.byDifficulty} />
            <RecentAttempts data={stats.recentAttempts} />
          </div>
        </>
      )}
    </div>
  );
}
