# BioBin X - Project Skill Documentation

## Overview

**BioBin X** is a Next.js web application for smart food waste management in schools. Students register food waste, produce biogas, and compete on leaderboards while learning about environmental impact.

**Tech Stack:**
- Next.js 14 (Pages Router)
- React 18
- Tailwind CSS
- SQLite (sql.js) for local storage
- Framer Motion for animations
- Recharts for statistics visualization

---

## Project Structure

```
biobin-x/
├── pages/                    # Next.js pages (file-based routing)
│   ├── _app.js               # Global app wrapper
│   ├── index.js              # Landing page
│   ├── about.js              # About page
│   ├── scan.js               # Camera QR/barcode scanning
│   ├── leaderboard.js        # Rankings page
│   ├── quiz.js               # Environmental quiz
│   ├── stats.js              # Statistics dashboard
│   ├── auth/
│   │   ├── login.js          # Login page
│   │   └── signup.js         # Registration page
│   └── dashboard/
│       ├── student.js        # Student dashboard
│       ├── teacher.js        # Teacher dashboard
│       └── classes.js        # Class management
├── components/
│   └── layout/
│       └── Layout.js         # Sidebar navigation (auth-aware)
├── firebase/
│   ├── config.js             # Firebase initialization
│   ├── auth.js               # Authentication functions
│   ├── db.js                 # Database operations
│   └── sqlite.js             # SQLite (sql.js) local storage
├── hooks/
│   └── useAuth.js            # Authentication context & hook
├── utils/
│   ├── calculator.js          # Energy/CO₂/points calculations
│   └── quizData.js           # Quiz questions
├── styles/
│   └── globals.css           # Global styles + Tailwind
├── firestore.rules           # Firebase security rules
├── tailwind.config.js        # Tailwind configuration
└── package.json
```

---

## Database Schema (SQLite)

### Tables

**users**
| Column      | Type    | Description                    |
|-------------|---------|--------------------------------|
| id          | TEXT    | Primary key                    |
| name        | TEXT    | User's display name            |
| email       | TEXT    | Unique email                   |
| password    | TEXT    | Hashed password                |
| role        | TEXT    | 'student' or 'teacher'         |
| classId     | TEXT    | Foreign key to classes         |
| points      | INTEGER | Total points earned            |
| totalWaste  | REAL    | Total kg of waste registered   |
| badges      | TEXT    | JSON array of badge IDs        |
| createdAt   | TEXT    | ISO timestamp                  |

**classes**
| Column        | Type    | Description              |
|---------------|---------|--------------------------|
| id            | TEXT    | Primary key              |
| name          | TEXT    | Class name               |
| teacherId     | TEXT    | Owner's user ID          |
| code          | TEXT    | Unique invite code       |
| totalWaste    | REAL    | Combined waste (kg)      |
| totalPoints   | INTEGER | Combined points          |
| studentCount  | INTEGER | Number of students       |
| createdAt     | TEXT    | ISO timestamp            |

**waste_logs**
| Column    | Type   | Description                    |
|-----------|--------|--------------------------------|
| id        | TEXT   | Primary key                    |
| userId    | TEXT   | Foreign key to users           |
| classId   | TEXT   | Foreign key to classes         |
| weight    | REAL   | Waste weight in kg              |
| imageUrl  | TEXT   | Optional image URL             |
| points    | INTEGER| Points earned                  |
| energyKwh | REAL   | Energy produced (kWh)           |
| co2Saved  | REAL   | CO₂ saved (kg)                 |
| timestamp | TEXT   | ISO timestamp                   |

---

## Key Functions

### Database Operations (`firebase/db.js`)

```javascript
// Waste logging
logWaste({ userId, weight, imageUrl, classId })
getUserLogs(userId)
getClassLogs(classId)

// Leaderboards
getStudentLeaderboard(classId?)
getClassLeaderboard()

// Class management
createClass({ name, teacherId })
getTeacherClasses(teacherId)
getClassStudents(classId)
getClassData(classId)

// Badges
checkBadges(userId, totalWaste, currentBadges)

// Statistics
getGlobalStats()
```

### Calculations (`utils/calculator.js`)

```javascript
calculateEnergy(weightKg)      // weight * 0.5 → kWh
calculateCO2Saved(weightKg)   // weight * 0.8 → kg CO₂
calculatePoints(weightKg)      // weight * 10 → points
energyEquivalent(kwh)          // Human-readable energy description
getRank(points)                // Returns rank object { name, icon, color }
getWeeklyData(logs)            // Aggregates logs by day of week
```

---

## Badge System

| Badge ID      | Name           | Icon | Requirement                    |
|---------------|----------------|------|--------------------------------|
| first_log     | Første kast!   | 🌱   | First waste registration       |
| waste_10kg    | 10 kg Helt     | 💪   | 10 kg total waste              |
| waste_50kg    | 50 kg Mester   | 🏆   | 50 kg total waste              |
| waste_100kg   | 100 kg Legende | 👑   | 100 kg total waste             |

---

## User Roles

### Student
- Register food waste with camera
- View personal stats and leaderboard
- Complete environmental quizzes
- Earn badges

### Teacher
- Create/manage classes with invite codes
- View class-wide statistics
- Monitor all students in their classes

---

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Adding New Features

### Adding a new page:
1. Create file in `pages/` (e.g., `pages/newpage.js`)
2. Use Layout component for consistent navigation
3. Protect routes with `useAuth()` hook if auth required

### Adding database functions:
1. Add to `firebase/db.js` using SQLite helpers
2. Use `runQuery`, `getOne`, or `getAll` from `firebase/sqlite.js`

### Adding new badges:
1. Add entry to `BADGE_THRESHOLDS` array in `firebase/db.js:134-139`
2. Update badge display component if needed

### Adding quiz questions:
1. Add to `utils/quizData.js` array
2. Follow existing format: `{ question, options, correctAnswer }`

---

## Styling Conventions

- **Tailwind CSS** for all styling
- Component files co-located with pages when possible
- Use `clsx` for conditional class names
- Framer Motion for animations (import from `framer-motion`)

---

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Dependencies

| Package           | Purpose                           |
|-------------------|-----------------------------------|
| next              | React framework                   |
| firebase          | Backend services (auth, storage)  |
| framer-motion     | Animations                        |
| lucide-react      | Icons                             |
| recharts          | Charts/graphs                     |
| react-hot-toast    | Toast notifications               |
| sql.js            | SQLite in browser                 |
| clsx              | Conditional class names           |
