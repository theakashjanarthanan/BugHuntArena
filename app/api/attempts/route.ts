import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST - Save user attempt
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      questionId,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      timeTaken,
      hintsUsed,
      xpEarned,
      language,
      difficulty,
    } = body;

    // Validation
    if (!questionId || selectedAnswer === undefined || correctAnswer === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("attempts");

    const attempt = {
      userId: session.user.email,
      userName: session.user.name || "Anonymous",
      questionId,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      timeTaken,
      hintsUsed: hintsUsed || 0,
      xpEarned: xpEarned || 0,
      language,
      difficulty,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(attempt);

    return NextResponse.json(
      {
        success: true,
        attemptId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving attempt:", error);
    return NextResponse.json(
      { error: "Failed to save attempt" },
      { status: 500 }
    );
  }
}

// GET - Get user attempts (optional: for leaderboard/history)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("attempts");

    const attempts = await collection
      .find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      attempts: attempts.map((a) => ({
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
    console.error("Error fetching attempts:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
