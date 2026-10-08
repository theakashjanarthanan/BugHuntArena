# Scripts

This folder contains utility scripts for the BugHuntArena project.

## populate-questions.ts

Populates the MongoDB database with 200 sample bug hunt questions across different programming languages and difficulty levels.

### Prerequisites

1. Make sure you have a `.env` file with your `MONGODB_URI` configured
2. Install dependencies: `npm install`

### Usage

Run the script using one of these methods:

**Option 1: Using npm script (recommended)**
```bash
npm run seed
```

**Option 2: Using tsx directly**
```bash
npx tsx scripts/populate-questions.ts
```

### What it does

- Clears existing questions from the database
- Generates 200 diverse questions covering:
  - **Languages**: Python, JavaScript, TypeScript, Java, C++
  - **Difficulty levels**: Easy, Medium, Hard
  - **Bug types**: Off-by-one errors, type issues, memory leaks, logic errors, etc.
- Inserts all questions with proper timestamps
- Displays statistics about the populated data

### Output

The script provides detailed feedback:
```
BugHuntArena Database Population Script
==========================================

Connecting to MongoDB...
✅ Connected successfully!

Clearing existing questions...
✅ Deleted X existing questions

Generating questions...
✅ Generated 200 questions

Inserting questions into database...
✅ Successfully inserted 200 questions!

Database Statistics:
   Questions by Language & Difficulty:
   python       easy     16 questions
   python       medium   12 questions
   python       hard     8 questions
   ...

   Total XP Pool: 14500

✅ Database population complete!
```

### Question Distribution

The script creates a balanced distribution:
- Approximately 40 questions per language (Python, JavaScript, TypeScript, Java, C++)
- More easy questions than medium, more medium than hard
- XP values: Easy (50), Medium (75), Hard (120)

### Customization

To modify the questions or add more:

1. Edit the `questionTemplates` array to add new base questions
2. Modify the `generateAdditionalQuestions()` function for more variations
3. Adjust the `slice(0, 200)` line to change the total number of questions

### Error Handling

If the script fails:
- Check your MongoDB connection string in `.env`
- Ensure MongoDB is accessible from your network
- Verify you have write permissions on the database
- Check the console output for specific error messages
