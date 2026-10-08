import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;
    const client = await clientPromise;
    const db = client.db("bughuntarena");

    const attemptsCol = db.collection("attempts");
    const sessionsCol = db.collection("sessions");

    // ── Aggregate all attempts for this user ─────────────────────────────────
    const [summary] = await attemptsCol
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            correctAttempts: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            totalXP: { $sum: "$xpEarned" },
            totalHints: { $sum: "$hintsUsed" },
            totalTimeTaken: { $sum: "$timeTaken" },
          },
        },
      ])
      .toArray();

    // ── XP earned per day (last 14 days) ─────────────────────────────────────
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyXpRaw = await attemptsCol
      .aggregate([
        { $match: { userId, createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            xp: { $sum: "$xpEarned" },
            attempts: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Fill in missing days with 0
    const dailyXpMap: Record<string, { xp: number; attempts: number }> = {};
    dailyXpRaw.forEach((d) => {
      dailyXpMap[d._id] = { xp: d.xp, attempts: d.attempts };
    });
    const dailyXp: { date: string; xp: number; attempts: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyXp.push({ date: key, xp: dailyXpMap[key]?.xp ?? 0, attempts: dailyXpMap[key]?.attempts ?? 0 });
    }

    // ── Breakdown by language ─────────────────────────────────────────────────
    const byLanguage = await attemptsCol
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$language",
            total: { $sum: 1 },
            correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            xp: { $sum: "$xpEarned" },
          },
        },
        { $sort: { xp: -1 } },
      ])
      .toArray();

    // ── Breakdown by difficulty ───────────────────────────────────────────────
    const byDifficulty = await attemptsCol
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$difficulty",
            total: { $sum: 1 },
            correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            xp: { $sum: "$xpEarned" },
          },
        },
      ])
      .toArray();

    // ── Recent attempts (last 5) ──────────────────────────────────────────────
    const recent = await attemptsCol
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // ── Session stats ─────────────────────────────────────────────────────────
    const [sessionSummary] = await sessionsCol
      .aggregate([
        { $match: { userId, status: { $in: ["completed", "expired"] } } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            bestXP: { $max: "$totalXP" },
            avgCorrect: { $avg: "$correctAnswers" },
          },
        },
      ])
      .toArray();

    // ── Compute longest correct streak ───────────────────────────────────────
    const allAttempts = await attemptsCol
      .find({ userId })
      .sort({ createdAt: 1 })
      .project({ isCorrect: 1 })
      .toArray();

    let bestStreak = 0;
    let currentStreak = 0;
    for (const a of allAttempts) {
      if (a.isCorrect) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return NextResponse.json({
      summary: {
        totalAttempts: summary?.totalAttempts ?? 0,
        correctAttempts: summary?.correctAttempts ?? 0,
        accuracy:
          summary?.totalAttempts
            ? Math.round((summary.correctAttempts / summary.totalAttempts) * 100)
            : 0,
        totalXP: summary?.totalXP ?? 0,
        totalHints: summary?.totalHints ?? 0,
        avgTimeTaken:
          summary?.totalAttempts
            ? Math.round(summary.totalTimeTaken / summary.totalAttempts)
            : 0,
        bestStreak,
        totalSessions: sessionSummary?.totalSessions ?? 0,
        bestSessionXP: sessionSummary?.bestXP ?? 0,
      },
      dailyXp,
      byLanguage: byLanguage.map((l) => ({
        language: l._id,
        total: l.total,
        correct: l.correct,
        accuracy: Math.round((l.correct / l.total) * 100),
        xp: l.xp,
      })),
      byDifficulty: byDifficulty.map((d) => ({
        difficulty: d._id,
        total: d.total,
        correct: d.correct,
        accuracy: Math.round((d.correct / d.total) * 100),
        xp: d.xp,
      })),
      recentAttempts: recent.map((a) => ({
        id: a._id.toString(),
        questionId: a.questionId,
        isCorrect: a.isCorrect,
        timeTaken: a.timeTaken,
        xpEarned: a.xpEarned,
        hintsUsed: a.hintsUsed,
        language: a.language,
        difficulty: a.difficulty,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
