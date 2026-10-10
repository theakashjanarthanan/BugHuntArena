# 🐛 BugHuntArena

A gamified platform for learning to identify and fix bugs in code. Users hunt through buggy code snippets across multiple programming languages, earn XP, compete on leaderboards, and track their debugging skills over time.

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-6.21-green?logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

---

## ✨ Features

### 🎮 Core Gameplay
- **Bug Hunting Sessions** — Configurable hunts by difficulty, language, and time frame
- **Multiple Languages** — JavaScript, Python, Java, C++, SQL, and more
- **Progressive Difficulty** — Beginner, Intermediate, Advanced levels
- **Smart Question Flow** — Get similar questions based on your session config
- **Hints System** — Unlock hints when stuck (costs XP)
- **Real-time Feedback** — Instant validation with detailed explanations

### 📊 Progress Tracking
- **XP System** — Earn points for correct answers, lose points for hints
- **Streak Tracking** — Build daily streaks for bonus rewards
- **Personal Dashboard** — View your stats, recent attempts, and progress over time
- **Leaderboard** — Global rankings with XP, questions solved, and streaks

### 🔐 Authentication
- **Firebase Auth** — Sign up with email/password or Google OAuth
- **Session Management** — Secure NextAuth.js sessions with MongoDB adapter
- **Admin Portal** — Protected route for question management

### ⚡ Admin Features
- **Question Management** — Create, edit, delete questions via UI
- **Rich Editor** — Syntax highlighting for code snippets
- **Bulk Import** — Seed database from JSON file
- **Search & Filter** — Find questions by language, difficulty, or topic

### ♿ Accessibility
- **WCAG 2.1 AA Compliant** — ARIA labels, keyboard navigation, screen reader support
- **Skip Navigation** — Quick access to main content
- **Form Accessibility** — All inputs labeled, errors announced live
- **Semantic HTML** — Proper landmarks and heading hierarchy

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ (with npm/pnpm/yarn)
- **MongoDB Atlas** account (or local MongoDB instance)
- **Firebase** project (for authentication)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd BugHuntArena
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Required variables:**
```env
# MongoDB
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/bughuntarena"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# Firebase (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Admin credentials
NEXT_USERNAME_ADMIN="admin"
NEXT_PASSWORD_ADMIN="<strong-password>"
```

### 3. Database Setup
Seed the database with sample questions:

```bash
npm run seed
```

This reads from `scripts/questions.json` and populates MongoDB with 200+ questions.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Access Admin Panel
Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) and log in with your admin credentials.

---

## 📁 Project Structure

```
BugHuntArena/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth & Firebase endpoints
│   │   ├── admin/           # Admin CRUD operations
│   │   ├── questions/       # Question fetching & submission
│   │   ├── leaderboard/     # Global rankings
│   │   ├── sessions/        # Hunt session management
│   │   └── stats/           # User statistics
│   ├── admin/               # Admin portal page
│   ├── auth/                # Sign in page
│   ├── signup/              # Sign up page
│   ├── dashboard/           # User dashboard
│   ├── hunt/                # Bug hunt gameplay
│   ├── leaderboard/         # Leaderboard page
│   └── layout.tsx           # Root layout with providers
│
├── components/              # React components
│   ├── ui/                  # shadcn/ui primitives
│   ├── admin-*.tsx          # Admin panel components
│   ├── bug-hunt.tsx         # Main gameplay component
│   ├── dashboard.tsx        # User stats dashboard
│   ├── leaderboard.tsx      # Leaderboard table
│   ├── auth.tsx             # Sign in form
│   ├── signup.tsx           # Sign up form
│   └── app-*.tsx            # Shell, sidebar, header
│
├── lib/                     # Utilities
│   ├── mongodb.ts           # MongoDB client
│   ├── auth.ts              # NextAuth config
│   └── utils.ts             # Helper functions
│
├── scripts/
│   ├── populate-questions.ts  # Seeding script
│   └── questions.json         # Question data
│
├── types/                   # TypeScript definitions
└── public/                  # Static assets
```

---

### For Users
1. **Sign Up** — Create an account via email or Google
2. **Configure Hunt** — Select language, difficulty, time frame
3. **Start Hunting** — Read buggy code, identify the issue
4. **Submit Answer** — Get instant feedback and explanations
5. **Track Progress** — View stats, streaks, and leaderboard rank

### For Admins
1. Navigate to `/admin` and log in
2. **Create Questions** — Use the form to add new bug hunt challenges
3. **Edit/Delete** — Click any question in the table to modify
4. **Bulk Import** — Update `scripts/questions.json` and run `npm run seed`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.4 (App Router) |
| **Frontend** | React 19.3, TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Database** | MongoDB 6.21 (with official Node driver) |
| **Auth** | NextAuth.js 4.24 + Firebase Auth |
| **Charts** | Recharts 3.8 |
| **Tables** | TanStack Table 8.20 |
| **Icons** | Lucide React |
| **Forms** | Native HTML with validation |

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Populate database from `scripts/questions.json` |

---

## 🗄️ Database Schema

### Collections

#### **users**
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  image?: string,
  emailVerified?: Date,
  firebaseUid?: string,
  xp: number,              // Total experience points
  questionsCompleted: number,
  currentStreak: number,
  lastActive: Date
}
```

#### **questions**
```typescript
{
  _id: ObjectId,
  language: "javascript" | "python" | "java" | "cpp" | "sql" | "csharp",
  difficulty: "beginner" | "intermediate" | "advanced",
  topic: string,
  buggyCode: string,
  correctAnswer: string,
  explanation: string,
  hints: string[],
  xpReward: number
}
```

#### **attempts**
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  questionId: ObjectId,
  isCorrect: boolean,
  hintsUsed: number,
  xpEarned: number,
  submittedAt: Date
}
```

#### **sessions** (NextAuth)
```typescript
{
  _id: ObjectId,
  sessionToken: string,
  userId: ObjectId,
  expires: Date
}
```

---

## 🎨 UI Components

Built with **shadcn/ui** primitives:
- `Button`, `Input`, `Label`, `Textarea`
- `Card`, `Badge`, `Avatar`
- `Dialog`, `DropdownMenu`, `Select`
- `Table`, `Tabs`, `Toast`
- `Sidebar` (with collapsible groups)

All components are fully accessible with ARIA labels and keyboard navigation.

---

## ♿ Accessibility

This project follows **WCAG 2.1 Level AA** guidelines:

✅ **Keyboard Navigation** — All interactive elements accessible via Tab/Enter/Space  
✅ **Screen Reader Support** — ARIA labels on all forms, buttons, tables  
✅ **Skip Navigation** — Skip to main content link  
✅ **Focus Management** — Visible focus indicators (`:focus-visible`)  
✅ **Form Accessibility** — Labels associated with inputs, live error announcements  
✅ **Live Regions** — `aria-live` for toasts, search results, loading states  
✅ **Semantic HTML** — Proper landmarks (`header`, `main`, `nav`)  

See `ACCESSIBILITY.md` (coming soon) for full implementation details and testing checklist.

---

## 🧪 Testing

### Manual Testing
1. **Keyboard Navigation**
   - Tab through all pages without a mouse
   - Test forms with Enter/Tab
   - Verify focus indicators are visible

2. **Screen Readers**
   - Test with NVDA (Windows) + Firefox
   - Test with VoiceOver (macOS) + Safari

3. **Form Validation**
   - Submit empty forms (check error messages)
   - Submit invalid data (check field-level errors)

### Automated Testing
- **Lighthouse** (Chrome DevTools) — Accessibility score 90+
- **axe DevTools** (browser extension) — Zero violations
- **WAVE** (browser extension) — Visual accessibility check

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
Works on any Node.js host (Netlify, Railway, AWS, etc.) that supports Next.js 16+.

**Environment Requirements:**
- Node.js 20+
- MongoDB connection string
- Firebase project credentials

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules (`npm run lint`)
- Use Tailwind utility classes (avoid custom CSS)
- Add ARIA labels to new interactive elements

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **shadcn/ui** — Beautiful component library
- **Vercel** — Next.js framework and hosting
- **Firebase** — Authentication infrastructure
- **MongoDB** — Database platform
- **Recharts** — Chart library
- **Lucide** — Icon set

---

## 📧 Contact

For questions or feedback, open an issue on GitHub or reach out to the maintainers.

---

**Happy Bug Hunting! 🐛🔍**
