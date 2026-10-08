"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SessionConfigDialog } from "@/components/session-config-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import {
  BugIcon,
  ChevronRightIcon,
  LightbulbIcon,
  RotateCcwIcon,
  CheckCircle2Icon,
  XCircleIcon,
  TimerIcon,
  ZapIcon,
  TrophyIcon,
  CodeIcon,
  EyeIcon,
  EyeOffIcon,
  SparklesIcon,
  FlameIcon,
  StarIcon,
  RefreshCwIcon,
  LogOutIcon,
  ClockIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Language = {
  id: string;
  label: string;
  color: string;
};

type Difficulty = "easy" | "medium" | "hard";

type BugChallenge = {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: Difficulty;
  code: string;
  bugLine: number;
  bugExplanation: string;
  hints: string[];
  xp: number;
  answerOptions?: string[];
  correctAnswer?: string;
};

// ─── Static UI Config ─────────────────────────────────────────────────────────

const LANGUAGES: Language[] = [
  { id: "python",     label: "Python",     color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400" },
  { id: "javascript", label: "JavaScript", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400" },
  { id: "typescript", label: "TypeScript", color: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400" },
  { id: "java",       label: "Java",       color: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400" },
  { id: "cpp",        label: "C++",        color: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400" },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string; xpMultiplier: number }[] = [
  { value: "easy",   label: "Easy",   color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400", xpMultiplier: 1   },
  { value: "medium", label: "Medium", color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",         xpMultiplier: 1.5 },
  { value: "hard",   label: "Hard",   color: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",                 xpMultiplier: 2   },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

/** Returns a random challenge from the DB, excluding already-seen questions. */
async function fetchRandomChallenge(
  language: string,
  difficulty: Difficulty,
  excludeIds: string[] = []
): Promise<BugChallenge | null> {
  try {
    const excludeParam =
      excludeIds.length > 0
        ? `&exclude=${encodeURIComponent(excludeIds.join(","))}`
        : "";
    const res = await fetch(
      `/api/questions?language=${encodeURIComponent(language)}&difficulty=${encodeURIComponent(difficulty)}${excludeParam}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const list: { id: string }[] = data.questions ?? [];
    if (!list.length) return null;
    // Pick a random one from the remaining pool, then fetch full details
    const picked = list[Math.floor(Math.random() * list.length)];
    return fetchFullChallenge(picked.id);
  } catch {
    return null;
  }
}

/** Fetches a single question with hints + explanation from the DB. */
async function fetchFullChallenge(id: string): Promise<BugChallenge | null> {
  try {
    const res = await fetch(`/api/questions/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.question ?? null;
  } catch {
    return null;
  }
}

function difficultyConfig(d: Difficulty) {
  return DIFFICULTIES.find((x) => x.value === d)!;
}

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({
  code,
  highlightLine,
  revealed,
}: {
  code: string;
  highlightLine?: number;
  revealed: boolean;
}) {
  const lines = code.split("\n");
  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted/40 font-mono text-sm">
      <div className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2">
        <div className="size-3 rounded-full bg-red-400/80" />
        <div className="size-3 rounded-full bg-yellow-400/80" />
        <div className="size-3 rounded-full bg-green-400/80" />
        <span className="ml-2 text-xs text-muted-foreground">buggy_code</span>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isBugLine = revealed && lineNum === highlightLine;
              return (
                <tr
                  key={idx}
                  className={cn(
                    "group transition-colors",
                    isBugLine ? "bg-red-500/15 dark:bg-red-500/20" : "hover:bg-muted/60"
                  )}
                >
                  <td className="w-10 select-none pr-4 text-right text-muted-foreground/50 text-xs">
                    {lineNum}
                  </td>
                  <td className="whitespace-pre text-foreground/90">
                    {line || " "}
                    {isBugLine && (
                      <span className="ml-3 inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-red-500 text-xs dark:text-red-400">
                        <BugIcon className="size-3" />
                        bug here
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────

function XpBar({ xp, maxXp = 500 }: { xp: number; maxXp?: number }) {
  const pct = Math.min(100, (xp / maxXp) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ZapIcon className="size-3 text-amber-500" /> XP
        </span>
        <span>{xp} / {maxXp}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Hint Panel ───────────────────────────────────────────────────────────────

function HintPanel({
  hints,
  revealed,
  onReveal,
  hintsUsed,
}: {
  hints: string[];
  revealed: number;
  onReveal: () => void;
  hintsUsed: number;
}) {
  return (
    <div className="space-y-2">
      {hints.slice(0, revealed).map((hint, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm"
        >
          <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <span className="text-foreground/80">{hint}</span>
        </div>
      ))}
      {revealed < hints.length ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
          onClick={onReveal}
        >
          <LightbulbIcon className="size-3.5" />
          Reveal Hint {revealed + 1} of {hints.length}
          {hintsUsed > 0 && (
            <Badge variant="outline" className="ml-1 text-xs">
              −{hintsUsed * 10} XP
            </Badge>
          )}
        </Button>
      ) : (
        <p className="text-center text-xs text-muted-foreground">All hints revealed</p>
      )}
    </div>
  );
}

// ─── Result Banner ────────────────────────────────────────────────────────────

function ResultBanner({
  correct,
  xpEarned,
  explanation,
  onNext,
  onRetry,
  loading = false,
}: {
  correct: boolean;
  xpEarned: number;
  explanation: string;
  onNext: () => void;
  onRetry: () => void;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-4",
        correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        {correct ? (
          <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-emerald-500" />
        ) : (
          <XCircleIcon className="mt-0.5 size-5 shrink-0 text-red-500" />
        )}
        <div className="space-y-1">
          <p className={cn("font-semibold", correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {correct ? "Nice find! Bug squashed. 🎉" : "Not quite — keep hunting."}
          </p>
          <p className="text-sm text-muted-foreground">{explanation}</p>
        </div>
        {correct && (
          <Badge className="ml-auto shrink-0 gap-1 bg-amber-500/20 text-amber-600 border-amber-500/30 dark:text-amber-400">
            <ZapIcon className="size-3" />
            +{xpEarned} XP
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        {correct ? (
          <Button size="sm" className="gap-1.5" onClick={onNext} disabled={loading}>
            {loading ? (
              <SparklesIcon className="size-3.5 animate-spin" />
            ) : (
              <ChevronRightIcon className="size-3.5" />
            )}
            {loading ? "Loading…" : "Next Challenge"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onRetry}>
            <RotateCcwIcon className="size-3.5" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Select Phase Skeleton ────────────────────────────────────────────────────

function SelectSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BugHunt() {
  const [selectedLang, setSelectedLang] = useState<string>("python");
  const [selectedDiff, setSelectedDiff] = useState<Difficulty>("easy");

  // availability[lang][diff] = true if DB has questions
  const [availability, setAvailability] = useState<Record<string, Record<string, boolean>>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  // Session management
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionConfigOpen, setSessionConfigOpen] = useState(false);
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [phase, setPhase] = useState<"select" | "hunt" | "result" | "done">("select");
  const [challenge, setChallenge] = useState<BugChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [showBugLine, setShowBugLine] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tracks which question IDs have already been shown this session
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);

  // ── On mount: check which lang/diff combos have questions ──────────────────
  useEffect(() => {
    const checkAvailability = async () => {
      setAvailabilityLoading(true);
      const map: Record<string, Record<string, boolean>> = {};

      await Promise.all(
        LANGUAGES.map(async (lang) => {
          map[lang.id] = {};
          await Promise.all(
            DIFFICULTIES.map(async (d) => {
              try {
                const res = await fetch(
                  `/api/questions?language=${lang.id}&difficulty=${d.value}`
                );
                if (res.ok) {
                  const data = await res.json();
                  map[lang.id][d.value] = (data.questions?.length ?? 0) > 0;
                } else {
                  map[lang.id][d.value] = false;
                }
              } catch {
                map[lang.id][d.value] = false;
              }
            })
          );
        })
      );

      setAvailability(map);
      setAvailabilityLoading(false);
    };

    checkAvailability();
  }, []);

  // ── Check for active session on mount ──────────────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/sessions");
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setActiveSession(data.session);
            setSelectedLang(data.session.language);
            setSelectedDiff(data.session.difficulty);
            setTotalXp(data.session.totalXP || 0);
            toast.success("Session resumed!");
          } else if (data.expired) {
            toast.info("Your previous session has expired");
          }
        }
      } catch (error) {
        console.error("Failed to check session:", error);
      }
    };

    checkSession();
  }, []);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Session time remaining countdown
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSession?.expiryTime) {
      setSessionTimeRemaining(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(activeSession.expiryTime).getTime() - Date.now()) / 1000));
      setSessionTimeRemaining(remaining);
      if (remaining === 0) {
        setActiveSession(null);
        setPhase("select");
        setChallenge(null);
        toast.warning("Session expired! Time's up.");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession?.expiryTime]);

  const formatSessionTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const xpEarned = () => {
    if (!challenge) return 0;
    const diff = difficultyConfig(challenge.difficulty);
    const hintPenalty = hintsRevealed * 10;
    const timePenalty = Math.floor(elapsed / 30) * 5;
    return Math.max(10, Math.round(challenge.xp * diff.xpMultiplier) - hintPenalty - timePenalty);
  };

  const hasQuestions = availability[selectedLang]?.[selectedDiff] === true;

  // ── Session Handlers ───────────────────────────────────────────────────────

  const handleStartClick = () => {
    if (activeSession) {
      // Resume existing session — don't reset seen IDs
      handleStart();
    } else {
      // Show session config dialog
      setSessionConfigOpen(true);
    }
  };

  const handleCreateSession = async (timeframe: number) => {
    setSessionLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLang,
          difficulty: selectedDiff,
          timeframe,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create session");
      }

      const data = await res.json();
      setActiveSession(data.session);
      setSessionConfigOpen(false);
      toast.success(`Session started! ${timeframe} minutes to hunt.`);
      
      // Start the first challenge (reset seen IDs for new session)
      handleStart(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to start session");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      const res = await fetch(`/api/sessions?sessionId=${activeSession.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to end session");
      }

      setActiveSession(null);
      setPhase("select");
      setChallenge(null);
      setTotalXp(0);
      setStreak(0);
      toast.success("Session ended successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to end session");
    }
  };

  const updateSession = async (questionId: string, isCorrect: boolean, xpEarned: number) => {
    if (!activeSession) return;

    try {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          questionId,
          isCorrect,
          xpEarned,
          hintsUsed: hintsRevealed,
        }),
      });
    } catch (error) {
      console.error("Failed to update session:", error);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStart = async (resetSeen = false) => {
    setLoading(true);
    try {
      const currentSeenIds = resetSeen ? [] : seenIds;

      // Fetch total available (for the counter) on first question
      if (resetSeen || questionNumber === 0) {
        const countRes = await fetch(
          `/api/questions?language=${selectedLang}&difficulty=${selectedDiff}`
        );
        if (countRes.ok) {
          const countData = await countRes.json();
          setTotalAvailable(countData.total ?? countData.questions?.length ?? 0);
        }
        if (resetSeen) {
          setSeenIds([]);
          setQuestionNumber(0);
        }
      }

      const c = await fetchRandomChallenge(selectedLang, selectedDiff, currentSeenIds);
      if (!c) {
        // No unseen questions left — all done
        setPhase("done");
        return;
      }
      setChallenge(c);
      setSeenIds((prev) => [...prev, c.id]);
      setQuestionNumber((n) => n + 1);
      setAnswer("");
      setHintsRevealed(0);
      setCorrect(false);
      setShowBugLine(false);
      setElapsed(0);
      setTimerActive(true);
      setPhase("hunt");
    } catch {
      toast.error("Failed to load challenge. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!challenge) return;
    
    // Check if using multiple choice
    if (challenge.answerOptions && challenge.correctAnswer) {
      if (!answer.trim()) {
        toast.error("Please select an answer");
        return;
      }
      setTimerActive(false);
      const isCorrect = answer.trim() === challenge.correctAnswer.trim();
      setCorrect(isCorrect);
      setShowBugLine(true);

      if (isCorrect) {
        const earned = xpEarned();
        setTotalXp((prev) => prev + earned);
        setStreak((s) => s + 1);
        
        // Save attempt to database
        try {
          await fetch("/api/attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: challenge.id,
              selectedAnswer: answer,
              correctAnswer: challenge.correctAnswer,
              isCorrect: true,
              timeTaken: elapsed,
              hintsUsed: hintsRevealed,
              xpEarned: earned,
              language: challenge.language,
              difficulty: challenge.difficulty,
            }),
          });
        } catch (error) {
          console.error("Failed to save attempt:", error);
        }

        // Update session
        await updateSession(challenge.id, true, earned);

        toast.success(`+${earned} XP earned!`);
      } else {
        setStreak(0);
        
        // Save failed attempt
        try {
          await fetch("/api/attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: challenge.id,
              selectedAnswer: answer,
              correctAnswer: challenge.correctAnswer,
              isCorrect: false,
              timeTaken: elapsed,
              hintsUsed: hintsRevealed,
              xpEarned: 0,
              language: challenge.language,
              difficulty: challenge.difficulty,
            }),
          });
        } catch (error) {
          console.error("Failed to save attempt:", error);
        }

        // Update session (incorrect)
        await updateSession(challenge.id, false, 0);
      }
      setPhase("result");
      return;
    }
    
    // Old text-based answer logic
    if (!answer.trim()) return;
    setTimerActive(false);

    // Keyword matching against the bug explanation
    const lower = answer.toLowerCase();
    const explanationWords = challenge.bugExplanation.toLowerCase().split(/\s+/);
    const keyTerms = explanationWords.filter((w) => w.length > 4).slice(0, 8);
    const matches = keyTerms.filter((term) => lower.includes(term)).length;
    const isCorrect = matches >= 2;

    setCorrect(isCorrect);
    setShowBugLine(true);

    if (isCorrect) {
      const earned = xpEarned();
      setTotalXp((prev) => prev + earned);
      setStreak((s) => s + 1);
      toast.success(`+${earned} XP earned!`);
    } else {
      setStreak(0);
    }
    setPhase("result");
  };

  const handleNext = async () => {
    // Auto-advance to next question in same language/difficulty
    setLoading(true);
    try {
      const c = await fetchRandomChallenge(selectedLang, selectedDiff, seenIds);
      if (!c) {
        // All questions completed for this combo
        setPhase("done");
        return;
      }
      setChallenge(c);
      setSeenIds((prev) => [...prev, c.id]);
      setQuestionNumber((n) => n + 1);
      setAnswer("");
      setHintsRevealed(0);
      setCorrect(false);
      setShowBugLine(false);
      setElapsed(0);
      setTimerActive(true);
      setPhase("hunt");
    } catch {
      toast.error("Failed to load next challenge.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (!challenge) return;
    setAnswer("");
    setCorrect(false);
    setShowBugLine(false);
    setElapsed(0);
    setTimerActive(true);
    setPhase("hunt");
  };

  const handleRevealHint = () => {
    if (!challenge || hintsRevealed >= challenge.hints.length) return;
    setHintsRevealed((n) => n + 1);
    toast.info(`Hint ${hintsRevealed + 1} revealed (−10 XP)`);
  };

  // ── RENDER: Select Phase ───────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <TooltipProvider>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <BugIcon className="size-6 text-primary" />
                Bug Hunt Arena
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a language and difficulty, then track down the bug hiding in the code.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {streak > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="gap-1 border-orange-500/30 text-orange-600 dark:text-orange-400">
                      <FlameIcon className="size-3" />
                      {streak} streak
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Current correct answer streak</TooltipContent>
                </Tooltip>
              )}
              <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                <ZapIcon className="size-3" />
                {totalXp} XP
              </Badge>
            </div>
          </div>

          <XpBar xp={totalXp} />

          {availabilityLoading ? (
            <SelectSkeleton />
          ) : (
            <>
              {/* Language picker */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CodeIcon className="size-4 text-muted-foreground" />
                    Choose Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => {
                      const hasAny = Object.values(availability[lang.id] ?? {}).some(Boolean);
                      return (
                        <button
                          key={lang.id}
                          onClick={() => setSelectedLang(lang.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selectedLang === lang.id
                              ? cn(lang.color, "ring-2 ring-offset-1 ring-offset-background")
                              : "border-border bg-background hover:bg-muted text-foreground"
                          )}
                        >
                          {lang.label}
                          {!hasAny && (
                            <Badge variant="outline" className="text-[10px]">No Questions</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Difficulty picker */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <StarIcon className="size-4 text-muted-foreground" />
                    Choose Difficulty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTIES.map((d) => {
                      const avail = availability[selectedLang]?.[d.value] === true;
                      return (
                        <button
                          key={d.value}
                          onClick={() => setSelectedDiff(d.value)}
                          disabled={!avail}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border p-4 text-sm font-medium transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            !avail && "cursor-not-allowed opacity-40",
                            selectedDiff === d.value && avail
                              ? cn(d.color, "ring-2 ring-offset-1 ring-offset-background")
                              : "border-border bg-background hover:bg-muted text-foreground"
                          )}
                        >
                          <span className="text-xl">
                            {d.value === "easy" ? "🟢" : d.value === "medium" ? "🟡" : "🔴"}
                          </span>
                          <span>{d.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {avail ? `×${d.xpMultiplier} XP` : "No Questions"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleStartClick}
                disabled={loading || !hasQuestions}
              >
                {loading ? (
                  <>
                    <SparklesIcon className="size-4 animate-spin" />
                    Loading challenge…
                  </>
                ) : activeSession ? (
                  <>
                    <RefreshCwIcon className="size-4" />
                    Resume Hunt
                  </>
                ) : (
                  <>
                    <BugIcon className="size-4" />
                    Start Hunt
                  </>
                )}
              </Button>

              {activeSession && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <ZapIcon className="size-4 text-primary" />
                      Active Session
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                      onClick={() => setEndSessionDialogOpen(true)}
                    >
                      <LogOutIcon className="size-3.5" />
                      End Session
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Time Left</p>
                      <p className={cn(
                        "font-mono font-semibold",
                        sessionTimeRemaining !== null && sessionTimeRemaining < 300
                          ? "text-red-500"
                          : "text-foreground"
                      )}>
                        {sessionTimeRemaining !== null ? formatSessionTime(sessionTimeRemaining) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Questions</p>
                      <p className="font-semibold">{activeSession.questionsAttempted?.length ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total XP</p>
                      <p className="font-semibold text-amber-600 dark:text-amber-400">{activeSession.totalXP ?? 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {!hasQuestions && !loading && (
                <p className="text-center text-xs text-muted-foreground">
                  No questions available for this combination yet — ask your admin to add some!
                </p>
              )}
            </>
          )}
        </div>

        {/* Session Config Dialog */}
        <SessionConfigDialog
          open={sessionConfigOpen}
          onOpenChange={setSessionConfigOpen}
          language={selectedLang}
          difficulty={selectedDiff}
          onStart={handleCreateSession}
          loading={sessionLoading}
        />

        {/* End Session Confirm Dialog */}
        <ConfirmDialog
          open={endSessionDialogOpen}
          onOpenChange={setEndSessionDialogOpen}
          title="End Session?"
          description="This will permanently end your current session. Your progress and XP earned so far will be saved."
          confirmLabel="End Session"
          variant="destructive"
          icon="logout"
          onConfirm={handleEndSession}
        />
      </TooltipProvider>
    );
  }

  // ── RENDER: All Done Phase ─────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <TooltipProvider>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4">
            <TrophyIcon className="mx-auto size-12 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold">All questions completed! 🏆</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You've gone through every{" "}
                <span className="font-medium capitalize">{selectedLang}</span>{" "}
                <span className="font-medium capitalize">{selectedDiff}</span>{" "}
                question in the arena.
              </p>
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalXp}</p>
                <p className="text-muted-foreground">Total XP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{questionNumber}</p>
                <p className="text-muted-foreground">Questions</p>
              </div>
              {streak > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{streak}</p>
                  <p className="text-muted-foreground">Best Streak</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => { setPhase("select"); setChallenge(null); setSeenIds([]); setQuestionNumber(0); }}
              >
                <RotateCcwIcon className="size-4" />
                Change Config
              </Button>
              <Button
                className="gap-2"
                onClick={() => handleStart(true)}
                disabled={loading}
              >
                {loading ? (
                  <SparklesIcon className="size-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="size-4" />
                )}
                Play Again
              </Button>
            </div>
          </div>

          {/* End Session if active */}
          {activeSession && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                onClick={() => setEndSessionDialogOpen(true)}
              >
                <LogOutIcon className="size-3.5" />
                End Session
              </Button>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={endSessionDialogOpen}
          onOpenChange={setEndSessionDialogOpen}
          title="End Session?"
          description="This will permanently end your current session. Your progress and XP earned so far will be saved."
          confirmLabel="End Session"
          variant="destructive"
          icon="logout"
          onConfirm={handleEndSession}
        />
      </TooltipProvider>
    );
  }

  // ── RENDER: Hunt / Result Phase ────────────────────────────────────────────

  if (!challenge) return null;
  const diff = difficultyConfig(challenge.difficulty);
  const lang = LANGUAGES.find((l) => l.id === challenge.language)!;

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-4xl space-y-4">

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => { setPhase("select"); setChallenge(null); }}
                aria-label="Back to selection"
              >
                <RotateCcwIcon className="size-3.5" />
              </Button>
              <h2 className="font-semibold tracking-tight">{challenge.title}</h2>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn(lang?.color)}>
                {lang?.label ?? challenge.language}
              </Badge>
              <Badge variant="outline" className={cn(diff.color)}>
                {diff.label}
              </Badge>
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 dark:text-amber-400">
                <ZapIcon className="size-3" />
                up to {Math.round(challenge.xp * diff.xpMultiplier)} XP
              </Badge>
              {totalAvailable > 0 && (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <SparklesIcon className="size-3" />
                  Q {questionNumber} / {totalAvailable}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeSession && sessionTimeRemaining !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-sm",
                    sessionTimeRemaining < 300
                      ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                      : "border-primary/30 bg-primary/5"
                  )}>
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    {formatSessionTime(sessionTimeRemaining)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>Session time remaining</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-1.5 font-mono text-sm">
                  <TimerIcon className="size-3.5 text-muted-foreground" />
                  {formatTime(elapsed)}
                </div>
              </TooltipTrigger>
              <TooltipContent>Time elapsed (longer = fewer XP)</TooltipContent>
            </Tooltip>
            <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
              <ZapIcon className="size-3" />
              {totalXp} XP
            </Badge>
            {activeSession && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                onClick={() => setEndSessionDialogOpen(true)}
              >
                <LogOutIcon className="size-3.5" />
                End Session
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Left: code + answer */}
          <div className="space-y-4">
            {/* Description */}
            <Card size="sm">
              <CardContent className="pt-3">
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
              </CardContent>
            </Card>

            {/* Code block */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Buggy Code
                </span>
                {phase === "result" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs"
                    onClick={() => setShowBugLine((v) => !v)}
                  >
                    {showBugLine ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
                    {showBugLine ? "Hide" : "Show"} bug line
                  </Button>
                )}
              </div>
              <CodeBlock
                code={challenge.code}
                highlightLine={challenge.bugLine}
                revealed={showBugLine}
              />
            </div>

            {/* Answer area */}
            {phase === "hunt" && (
              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {challenge.answerOptions ? "Select the Correct Answer" : "Describe the Bug"}
                </label>
                
                {challenge.answerOptions && challenge.answerOptions.length > 0 ? (
                  /* Multiple Choice Options */
                  <div className="space-y-2">
                    {challenge.answerOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setAnswer(option)}
                        className={cn(
                          "w-full rounded-lg border-2 p-4 text-left text-sm transition-all",
                          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          answer === option
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            answer === option
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          )}>
                            {answer === option && (
                              <CheckCircle2Icon className="size-3" />
                            )}
                          </div>
                          <span className="flex-1 font-mono">{option}</span>
                        </div>
                      </button>
                    ))}
                    <Button
                      className="w-full gap-2 mt-4"
                      onClick={handleSubmit}
                      disabled={!answer.trim()}
                    >
                      <BugIcon className="size-4" />
                      Submit Answer
                    </Button>
                  </div>
                ) : (
                  /* Text Answer (fallback) */
                  <>
                    <Textarea
                      placeholder="Explain what the bug is and where it is. The more specific, the better…"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="min-h-28 resize-none text-sm"
                    />
                    <Button
                      className="w-full gap-2"
                      onClick={handleSubmit}
                      disabled={!answer.trim()}
                    >
                      <BugIcon className="size-4" />
                      Submit Answer
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Result banner */}
            {phase === "result" && (
              <ResultBanner
                correct={correct}
                xpEarned={xpEarned()}
                explanation={challenge.bugExplanation}
                onNext={handleNext}
                onRetry={handleRetry}
                loading={loading}
              />
            )}
          </div>

          {/* Right: hints + session stats */}
          <div className="space-y-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <LightbulbIcon className="size-4 text-amber-500" />
                  Hints
                </CardTitle>
                <p className="text-xs text-muted-foreground">Each hint costs 10 XP from your reward.</p>
              </CardHeader>
              <CardContent>
                <HintPanel
                  hints={challenge.hints}
                  revealed={hintsRevealed}
                  onReveal={handleRevealHint}
                  hintsUsed={hintsRevealed}
                />
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrophyIcon className="size-4 text-muted-foreground" />
                  Your Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <XpBar xp={totalXp} />
                <Separator />
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Streak</span>
                  <span className="flex items-center justify-end gap-1 text-right font-medium">
                    {streak > 0 && <FlameIcon className="size-3.5 text-orange-500" />}
                    {streak}
                  </span>
                  <span className="text-muted-foreground">Hints used</span>
                  <span className="text-right font-medium">{hintsRevealed}</span>
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-right font-mono text-xs font-medium">{formatTime(elapsed)}</span>
                  {activeSession && (
                    <>
                      <span className="text-muted-foreground">Questions</span>
                      <span className="text-right font-medium">
                        {activeSession.questionsAttempted?.length ?? 0}
                      </span>
                      <span className="text-muted-foreground">Correct</span>
                      <span className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {activeSession.correctAnswers ?? 0}
                      </span>
                    </>
                  )}
                  {phase === "result" && (
                    <>
                      <span className="text-muted-foreground">XP earned</span>
                      <span className="text-right font-medium text-amber-600 dark:text-amber-400">
                        {correct ? `+${xpEarned()}` : "—"}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* End Session Confirm Dialog */}
      <ConfirmDialog
        open={endSessionDialogOpen}
        onOpenChange={setEndSessionDialogOpen}
        title="End Session?"
        description="This will permanently end your current session. Your progress and XP earned so far will be saved."
        confirmLabel="End Session"
        variant="destructive"
        icon="logout"
        onConfirm={handleEndSession}
      />
    </TooltipProvider>
  );
}
