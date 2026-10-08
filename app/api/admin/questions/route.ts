import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";

// Helper to check admin auth
function isAuthenticated(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

// GET - List all questions
export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("questions");

    const questions = await collection
      .find({})
      .sort({ createdAt: -1 })
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
        bugExplanation: q.bugExplanation,
        hints: q.hints,
        xp: q.xp,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST - Create new question
export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, language, difficulty, code, bugLine, bugExplanation, hints, xp } = body;

    // Validation
    if (!title || !description || !language || !difficulty || !code || !bugExplanation || !hints || !xp) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(hints) || hints.length === 0) {
      return NextResponse.json(
        { error: "At least one hint is required" },
        { status: 400 }
      );
    }

    if (hints.some((h: string) => !h.trim())) {
      return NextResponse.json(
        { error: "All hints must be filled" },
        { status: 400 }
      );
    }

    if (typeof bugLine !== "number" || bugLine < 1) {
      return NextResponse.json(
        { error: "Invalid bug line number" },
        { status: 400 }
      );
    }

    if (typeof xp !== "number" || xp < 1) {
      return NextResponse.json(
        { error: "XP must be greater than 0" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("questions");

    const result = await collection.insertOne({
      title,
      description,
      language,
      difficulty,
      code,
      bugLine,
      bugExplanation,
      hints,
      xp,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        id: result.insertedId.toString(),
        message: "Question created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
