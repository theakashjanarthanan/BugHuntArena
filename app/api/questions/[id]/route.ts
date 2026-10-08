import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Get full question (with hints but not bug explanation until verified)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("questions");

    const question = await collection.findOne({ _id: new ObjectId(id) });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({
      question: {
        id: question._id.toString(),
        title: question.title,
        description: question.description,
        language: question.language,
        difficulty: question.difficulty,
        code: question.code,
        bugLine: question.bugLine,
        bugExplanation: question.bugExplanation,
        hints: question.hints,
        xp: question.xp,
        answerOptions: question.answerOptions || [],
        correctAnswer: question.correctAnswer || "",
      },
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
