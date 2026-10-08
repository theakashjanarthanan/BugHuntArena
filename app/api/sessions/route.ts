import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

// POST - Create new session
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
    const { language, difficulty, timeframe } = body;

    // Validation
    if (!language || !difficulty || !timeframe) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("sessions");

    // Check if user has an active session
    const existingSession = await collection.findOne({
      userId: session.user.email,
      status: "active",
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "Active session already exists" },
        { status: 409 }
      );
    }

    // Calculate expiry time based on timeframe (in minutes)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + timeframe);

    const newSession = {
      userId: session.user.email,
      userName: session.user.name || "Anonymous",
      language,
      difficulty,
      timeframe, // in minutes
      status: "active",
      questionsAttempted: [],
      correctAnswers: 0,
      totalXP: 0,
      hintsUsed: 0,
      startTime: new Date(),
      expiryTime,
      lastActivity: new Date(),
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newSession);

    return NextResponse.json(
      {
        success: true,
        sessionId: result.insertedId.toString(),
        session: {
          ...newSession,
          id: result.insertedId.toString(),
          _id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// GET - Get active session
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("sessions");

    const activeSession = await collection.findOne({
      userId: session.user.email,
      status: "active",
    });

    if (!activeSession) {
      return NextResponse.json({ session: null });
    }

    // Check if session has expired
    if (new Date() > new Date(activeSession.expiryTime)) {
      // Auto-expire the session
      await collection.updateOne(
        { _id: activeSession._id },
        {
          $set: {
            status: "expired",
            endTime: new Date(),
          },
        }
      );

      return NextResponse.json({ session: null, expired: true });
    }

    // Update last activity
    await collection.updateOne(
      { _id: activeSession._id },
      { $set: { lastActivity: new Date() } }
    );

    return NextResponse.json({
      session: {
        id: activeSession._id.toString(),
        language: activeSession.language,
        difficulty: activeSession.difficulty,
        timeframe: activeSession.timeframe,
        questionsAttempted: activeSession.questionsAttempted,
        correctAnswers: activeSession.correctAnswers,
        totalXP: activeSession.totalXP,
        hintsUsed: activeSession.hintsUsed,
        startTime: activeSession.startTime,
        expiryTime: activeSession.expiryTime,
        lastActivity: activeSession.lastActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// PATCH - Update session
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sessionId, questionId, isCorrect, xpEarned, hintsUsed } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("sessions");

    const updateData: any = {
      $set: { lastActivity: new Date() },
    };

    if (questionId) {
      updateData.$addToSet = { questionsAttempted: questionId };
    }

    const incFields: any = {};
    if (isCorrect) {
      incFields.correctAnswers = 1;
      incFields.totalXP = xpEarned || 0;
    }
    if (hintsUsed) {
      incFields.hintsUsed = hintsUsed;
    }
    if (Object.keys(incFields).length > 0) {
      updateData.$inc = incFields;
    }

    const result = await collection.updateOne(
      {
        _id: new ObjectId(sessionId),
        userId: session.user.email,
        status: "active",
      },
      updateData
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Session not found or inactive" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

// DELETE - End session
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const collection = db.collection("sessions");

    const result = await collection.updateOne(
      {
        _id: new ObjectId(sessionId),
        userId: session.user.email,
        status: "active",
      },
      {
        $set: {
          status: "completed",
          endTime: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Session not found or already ended" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
