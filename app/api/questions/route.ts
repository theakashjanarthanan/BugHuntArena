import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Public endpoint to fetch questions for users (no hints/answers exposed)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language");
    const difficulty = searchParams.get("difficulty");
    // Comma-separated list of question IDs to exclude (already seen in this session)
    const excludeParam = searchParams.get("exclude");

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("questions");

    // Build query
    const query: any = {};
    if (language) query.language = language;
    if (difficulty) query.difficulty = difficulty;

    if (excludeParam) {
      const excludeIds = excludeParam
        .split(",")
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (excludeIds.length > 0) {
        query._id = { $nin: excludeIds };
      }
    }

    const questions = await collection
      .find(query)
      .project({
        // Exclude sensitive data (hints and bug explanation)
        bugExplanation: 0,
        hints: 0,
      })
      .toArray();

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q._id.toString(),
        title: q.title,
        description: q.description,
        language: q.language,
        difficulty: q.difficulty,
        code: q.code,
        bugLine: q.bugLine,
        xp: q.xp,
        answerOptions: q.answerOptions || [],
        correctAnswer: q.correctAnswer || "",
      })),
      total: questions.length,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
