import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { uid, email, name, provider } = await req.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("bughuntarena");
    const usersCollection = db.collection("users");

    // Check if user exists by email (to link Firebase and email logins)
    let user = await usersCollection.findOne({ email });

    if (user) {
      // Update existing user with Firebase UID if not already set
      if (!user.firebaseUid) {
        await usersCollection.updateOne(
          { email },
          {
            $set: {
              firebaseUid: uid,
              provider: provider || "firebase",
              updatedAt: new Date(),
            },
          }
        );
      }
    } else {
      // Create new user for Firebase authentication
      const result = await usersCollection.insertOne({
        firebaseUid: uid,
        name: name || email.split("@")[0],
        email,
        provider: provider || "firebase",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      user = {
        _id: result.insertedId,
        firebaseUid: uid,
        name: name || email.split("@")[0],
        email,
        provider: provider || "firebase",
      };
    }

    return NextResponse.json(
      {
        message: "User authenticated successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Firebase auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
