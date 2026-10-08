# Quick Setup Guide

## Step 1: Install Dependencies

First, install the required packages for running the seed script:

```bash
npm install --save-dev tsx dotenv
```

Or if you prefer yarn:

```bash
yarn add -D tsx dotenv
```

## Step 2: Configure Environment

Make sure your `.env` file has the MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bughuntarena?retryWrites=true&w=majority
```

## Step 3: Run the Script

Execute the population script:

```bash
npm run seed
```

## Step 4: Verify

Check your MongoDB database to confirm 200 questions were inserted.

You can also verify through the admin portal at `/admin` after logging in.

## Troubleshooting

### "Cannot find module 'tsx'"
Run: `npm install`

### "Missing MONGODB_URI"
Add the connection string to your `.env` file

### "Connection refused"
- Check your MongoDB cluster is running
- Verify your IP is whitelisted in MongoDB Atlas
- Test the connection string in MongoDB Compass

### "Unauthorized"
- Check your MongoDB username and password
- Verify database permissions

## What's Next?

After populating the database:

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Try the Bug Hunt game with the populated questions
4. Or manage questions via the admin portal at `/admin`

## Re-running the Script

You can run the script multiple times safely. It will:
- Delete all existing questions
- Insert a fresh set of 200 questions
- Show the updated statistics

This is useful for:
- Resetting the database
- Testing with fresh data
- Updating question content
