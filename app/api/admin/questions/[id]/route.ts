import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper to check admin auth
function isAuthenticated(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

// GET - Get single question by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    console.log("[GET /api/admin/questions/[id]] Received ID:", id, "Type:", typeof id);

    if (!ObjectId.isValid(id)) {
      console.log("[GET /api/admin/questions/[id]] Invalid ObjectId:", id);
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
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
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

// PUT - Update question
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    console.log("[PUT /api/admin/questions/[id]] Received ID:", id, "Type:", typeof id);

    if (!ObjectId.isValid(id)) {
      console.log("[PUT /api/admin/questions/[id]] Invalid ObjectId:", id);
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

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

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          description,
          language,
          difficulty,
          code,
          bugLine,
          bugExplanation,
          hints,
          xp,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE - Delete question
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    console.log("[DELETE /api/admin/questions/[id]] Received ID:", id, "Type:", typeof id);

    if (!ObjectId.isValid(id)) {
      console.log("[DELETE /api/admin/questions/[id]] Invalid ObjectId:", id);
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("questions");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
