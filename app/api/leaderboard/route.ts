import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all"; // all | language | difficulty
    const value  = searchParams.get("value")  ?? "";    // e.g. "python" or "hard"

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const attemptsCol = db.collection("attempts");

    // Build match stage
    const match: Record<string, any> = {};
    if (filter === "language" && value)   match.language   = value;
    if (filter === "difficulty" && value) match.difficulty = value;

    // ── Global leaderboard — rank users by total XP ───────────────────────
    const globalRaw = await attemptsCol
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: "$userId",
            userName:       { $first: "$userName" },
            totalXP:        { $sum: "$xpEarned" },
            totalAttempts:  { $sum: 1 },
            correctAnswers: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            totalHints:     { $sum: "$hintsUsed" },
            totalTime:      { $sum: "$timeTaken" },
            lastActive:     { $max: "$createdAt" },
          },
        },
        { $sort: { totalXP: -1, correctAnswers: -1 } },
        { $limit: 50 },
      ])
      .toArray();

    const currentUserId = session.user.email;

    const global = globalRaw.map((u, i) => ({
      rank:           i + 1,
      userId:         u._id,
      userName:       u.userName || "Anonymous",
      totalXP:        u.totalXP,
      totalAttempts:  u.totalAttempts,
      correctAnswers: u.correctAnswers,
      accuracy:       u.totalAttempts
        ? Math.round((u.correctAnswers / u.totalAttempts) * 100)
        : 0,
      hintsUsed:      u.totalHints,
      avgTime:        u.totalAttempts
        ? Math.round(u.totalTime / u.totalAttempts)
        : 0,
      lastActive:     u.lastActive,
      isCurrentUser:  u._id === currentUserId,
    }));

    // ── Current user's rank (in case they're outside top 50) ─────────────
    let currentUserRank: number | null = null;
    const foundInTop = global.find((u) => u.isCurrentUser);
    if (!foundInTop) {
      const allIds = await attemptsCol
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: "$userId",
              totalXP: { $sum: "$xpEarned" },
            },
          },
          { $sort: { totalXP: -1 } },
        ])
        .toArray();
      const idx = allIds.findIndex((u) => u._id === currentUserId);
      if (idx !== -1) currentUserRank = idx + 1;
    }

    // ── Language leaderboard — top scorer per language ────────────────────
    const byLanguage = await attemptsCol
      .aggregate([
        {
          $group: {
            _id: { userId: "$userId", language: "$language" },
            userName: { $first: "$userName" },
            xp:       { $sum: "$xpEarned" },
            correct:  { $sum: { $cond: ["$isCorrect", 1, 0] } },
            total:    { $sum: 1 },
          },
        },
        { $sort: { xp: -1 } },
        {
          $group: {
            _id:      "$_id.language",
            entries:  { $push: "$$ROOT" },
          },
        },
      ])
      .toArray();

    const languageLeaderboard: Record<string, any[]> = {};
    byLanguage.forEach((lang) => {
      languageLeaderboard[lang._id] = lang.entries
        .slice(0, 10)
        .map((e: any, i: number) => ({
          rank:          i + 1,
          userId:        e._id.userId,
          userName:      e.userName || "Anonymous",
          xp:            e.xp,
          correct:       e.correct,
          total:         e.total,
          accuracy:      e.total ? Math.round((e.correct / e.total) * 100) : 0,
          isCurrentUser: e._id.userId === currentUserId,
        }));
    });

    return NextResponse.json({
      global,
      currentUserRank: foundInTop?.rank ?? currentUserRank,
      languageLeaderboard,
      totalPlayers: globalRaw.length,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
