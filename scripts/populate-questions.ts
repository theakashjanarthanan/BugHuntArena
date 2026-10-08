/**
 * populate-questions.ts
 *
 * Reads questions from data/questions.json and upserts them into MongoDB.
 * Existing questions are matched by (title + language) so re-running is safe.
 *
 * Usage:
 *   npm run seed
 *
 * questions.json shape (array of objects):
 * [
 *   {
 *     "title": "string",
 *     "description": "string",
 *     "language": "python" | "javascript" | "typescript" | "java" | "cpp",
 *     "difficulty": "easy" | "medium" | "hard",
 *     "code": "string  (multi-line code snippet with the bug)",
 *     "bugLine": number  (1-based line number where the bug is),
 *     "bugExplanation": "string",
 *     "hints": ["string", "string", "string"],
 *     "xp": number,
 *     "answerOptions": ["string", "string", "string"],
 *     "correctAnswer": "string  (must match one of answerOptions exactly)"
 *   },
 *   ...
 * ]
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { MongoClient } from "mongodb";

// Load env vars from .env in the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";
type Language = "python" | "javascript" | "typescript" | "java" | "cpp";

interface QuestionInput {
  title: string;
  description: string;
  language: Language;
  difficulty: Difficulty;
  code: string;
  bugLine: number;
  bugExplanation: string;
  hints: string[];
  xp: number;
  answerOptions: string[];
  correctAnswer: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_LANGUAGES: Language[] = [
  "python",
  "javascript",
  "typescript",
  "java",
  "cpp",
];
const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function validateQuestion(q: any, index: number): q is QuestionInput {
  const errors: string[] = [];

  if (!q.title || typeof q.title !== "string" || !q.title.trim())
    errors.push("title is required");
  if (!q.description || typeof q.description !== "string")
    errors.push("description is required");
  if (!VALID_LANGUAGES.includes(q.language))
    errors.push(`language must be one of: ${VALID_LANGUAGES.join(", ")}`);
  if (!VALID_DIFFICULTIES.includes(q.difficulty))
    errors.push(`difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`);
  if (!q.code || typeof q.code !== "string")
    errors.push("code is required");
  if (typeof q.bugLine !== "number" || q.bugLine < 1)
    errors.push("bugLine must be a positive number");
  if (!q.bugExplanation || typeof q.bugExplanation !== "string")
    errors.push("bugExplanation is required");
  if (!Array.isArray(q.hints) || q.hints.length === 0)
    errors.push("hints must be a non-empty array");
  if (typeof q.xp !== "number" || q.xp < 1)
    errors.push("xp must be a positive number");
  if (!Array.isArray(q.answerOptions) || q.answerOptions.length < 2)
    errors.push("answerOptions must have at least 2 entries");
  if (!q.correctAnswer || typeof q.correctAnswer !== "string")
    errors.push("correctAnswer is required");
  if (
    q.answerOptions &&
    q.correctAnswer &&
    !q.answerOptions.includes(q.correctAnswer)
  )
    errors.push("correctAnswer must exactly match one of the answerOptions");

  if (errors.length > 0) {
    console.error(
      `\n  ❌ Question [${index}] "${q.title ?? "(no title)"}" has validation errors:`
    );
    errors.forEach((e) => console.error(`     • ${e}`));
    return false;
  }
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "❌  MONGODB_URI is not set. Add it to your .env file and try again."
    );
    process.exit(1);
  }

  // Load questions.json
  const jsonPath = path.resolve(__dirname, "../data/questions.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌  Cannot find data/questions.json at: ${jsonPath}`);
    process.exit(1);
  }

  let rawQuestions: any[];
  try {
    const content = fs.readFileSync(jsonPath, "utf-8");
    rawQuestions = JSON.parse(content);
    if (!Array.isArray(rawQuestions)) {
      throw new Error("Root value must be an array");
    }
  } catch (err: any) {
    console.error(`❌  Failed to parse data/questions.json: ${err.message}`);
    process.exit(1);
  }

  if (rawQuestions.length === 0) {
    console.warn(
      "⚠️   data/questions.json is empty. Add questions and run again."
    );
    process.exit(0);
  }

  console.log(`\n📖  Loaded ${rawQuestions.length} question(s) from data/questions.json`);

  // Validate all questions first — bail out if any are invalid
  let valid = true;
  const questions: QuestionInput[] = [];
  rawQuestions.forEach((q, i) => {
    if (validateQuestion(q, i)) {
      questions.push(q);
    } else {
      valid = false;
    }
  });

  if (!valid) {
    console.error(
      "\n❌  Fix the validation errors above before seeding. No data was written."
    );
    process.exit(1);
  }

  console.log(`✅  All ${questions.length} questions passed validation`);

  // Connect to MongoDB
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("bughuntarena");
    const collection = db.collection("questions");

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    console.log("\n⬆️   Upserting questions...\n");

    for (const q of questions) {
      const filter = {
        title: q.title.trim(),
        language: q.language,
      };

      const doc = {
        title: q.title.trim(),
        description: q.description.trim(),
        language: q.language,
        difficulty: q.difficulty,
        code: q.code,
        bugLine: q.bugLine,
        bugExplanation: q.bugExplanation.trim(),
        hints: q.hints.map((h: string) => h.trim()),
        xp: q.xp,
        answerOptions: q.answerOptions.map((o: string) => o.trim()),
        correctAnswer: q.correctAnswer.trim(),
        updatedAt: new Date(),
      };

      const existing = await collection.findOne(filter);
      if (existing) {
        await collection.updateOne(filter, { $set: doc });
        updated++;
        console.log(`  ↺  Updated : [${q.language}/${q.difficulty}] ${q.title}`);
      } else {
        await collection.insertOne({ ...doc, createdAt: new Date() });
        inserted++;
        console.log(`  ✚  Inserted: [${q.language}/${q.difficulty}] ${q.title}`);
      }
    }

    // Summary
    console.log("\n─────────────────────────────────────");
    console.log(`  ✚  Inserted : ${inserted}`);
    console.log(`  ↺  Updated  : ${updated}`);
    console.log(`  ⊘  Skipped  : ${skipped}`);
    console.log(`  📦 Total    : ${questions.length}`);
    console.log("─────────────────────────────────────\n");

    // Count per language/difficulty
    const stats = await collection
      .aggregate([
        {
          $group: {
            _id: { language: "$language", difficulty: "$difficulty" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.language": 1, "_id.difficulty": 1 } },
      ])
      .toArray();

    console.log("📊  DB Question Counts:");
    stats.forEach((s) => {
      console.log(
        `     ${s._id.language.padEnd(12)} ${s._id.difficulty.padEnd(8)} → ${s.count}`
      );
    });
    console.log();
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
