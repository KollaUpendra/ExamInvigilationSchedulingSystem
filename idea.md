# 🎓 Exam Invigilation Scheduling System — Core Idea Breakdown

---

## 1. 💡 Core Idea (Most Important)

- **Main Goal**: Automate the assignment of teachers as exam invigilators for university/college exam sessions.
- **Problem Solved**: Manually assigning teachers to invigilate exams is tedious and error-prone — you need to ensure a teacher is **free** during that exam time (not teaching a class) and hasn't been overloaded with too many invigilation duties on a single day.
- **In Simple Words**: *"Given a teacher's class timetable (Excel) and a list of upcoming exam slots, automatically figure out which teachers are free and fairly assign them as invigilators — then export the result as a downloadable Excel sheet."*

---

## 2. 🧠 Concept Behind It

| Concept | Why It's Used |
|---|---|
| **Constraint-Based Scheduling** | Teachers can only invigilate if they have no conflicting class during that time |
| **Greedy Algorithm (Load Balancing)** | At each exam slot, pick teachers with the *least accumulated load* first — ensures fair distribution |
| **Time-Overlap Detection** | Maps exam time windows to known teaching periods to detect conflicts |
| **Excel Parsing & Generation** (`xlsx` library) | Input & output both use Excel — the standard format in academia |
| **REST API + React SPA** | Full-stack web app so admins can use it via browser rather than running scripts manually |

---

## 3. 🔄 How It Works (High-Level Flow)

```
1. Admin uploads the teacher timetable Excel file
   └─ Each sheet = one teacher, rows = days, columns = 6 teaching periods

2. Admin enters exam slot details
   └─ Exam dates, each slot's start/end time, which year (e.g. 2nd year students), how many teachers needed

3. System parses the timetable
   └─ Builds a map: teacher → day → period → which student year they're teaching

4. For each exam slot:
   a. Find which teaching periods overlap with the exam time
   b. Check every teacher — are they teaching a different year during those periods?
      - If YES → CONFLICT → skip this teacher
      - If NO (free, or teaching same year) → AVAILABLE
   c. From available teachers, pick those with the LEAST total invigilation load so far
   d. Assign the required number of teachers to this slot

5. Generate an output Excel:
   └─ Rows = Teachers, Columns = Exam Slots, Cells = "YES" if assigned

6. Save to MongoDB for history + allow download
```

---

## 4. 🧱 Key Components

```
ExamInvigilationSchedulingSystem/
├── backend/
│   ├── server.js                   → Express server entry point, routes, CORS setup
│   ├── config/db.js                → MongoDB connection
│   ├── models/
│   │   ├── Lead.js                 → Stores "Get Started" form sign-ups (name, email, institution)
│   │   └── Schedule.js             → Stores generated schedules + Excel file binaries in DB
│   ├── controllers/
│   │   └── scheduleController.js   → THE BRAIN — all scheduling logic lives here
│   └── routes/
│       ├── leads.js                → POST/GET /api/leads
│       └── schedule.js             → POST /api/schedule/generate, GET history, download
│
└── frontend/ (React + Vite)
    └── src/
        ├── App.jsx                 → Auth routing: Landing → Login → Dashboard
        ├── context/AuthContext.jsx → Google OAuth login state management
        ├── pages/
        │   ├── LoginPage.jsx       → Google Sign-In page
        │   └── Dashboard.jsx       → Main app page after login (shows generator + history)
        └── components/
            ├── ScheduleGenerator.jsx → Form: upload Excel + enter exam slots → trigger generation
            ├── HeroSection.jsx       │
            ├── Features.jsx          │ → Landing page marketing sections
            ├── HowItWorks.jsx        │
            ├── ProblemSolution.jsx   │
            ├── GetStartedModal.jsx   → Interest capture form (Lead model)
            └── Navbar/Footer         → Navigation
```

---

## 5. 📊 Input → Process → Output

```
INPUT:
  1. Teacher Timetable Excel (.xlsx)
     - Each sheet = one teacher's weekly schedule
     - Columns = 6 periods (09:30–15:20)
     - Cells = which student year (1, 2, 3...) the teacher teaches in that period

  2. Exam Slot Details (entered via web form):
     - Exam dates (e.g., 5/4/26, 6/4/26)
     - Each slot: Name, Start Time, End Time, Student Year, No. of teachers needed

        ↓↓↓ PROCESSING ↓↓↓

  1. Parse Excel → Build teacherSchedule map
  2. For each slot → find overlapping periods → check each teacher's conflict
  3. Filter available teachers → sort by lowest load → assign top N

        ↓↓↓ OUTPUT ↓↓↓

  Output Excel (.xlsx):
  ┌──────────────┬──────────────────┬──────────────────┐
  │ Teacher      │ 5/4/26 Slot1 ... │ 6/4/26 Slot1 ... │
  ├──────────────┼──────────────────┼──────────────────┤
  │ Dr. Sharma   │      YES         │                  │
  │ Prof. Rao    │                  │       YES        │
  └──────────────┴──────────────────┴──────────────────┘
```

---

## 6. 🎯 Real-World Analogy

> Think of it like a **hospital shift scheduling system**, but for exam rooms.

Imagine a hospital needs nurses (teachers) to cover night shifts (exam slots). Each nurse already has day shifts (classes). You need to:
- ✅ Only assign nurses who are **free** during that night shift
- ✅ Make sure no nurse gets **too many** night shifts in one day
- ✅ Keep it **fair** — nurses with fewer total shifts get priority

The system does exactly this — automatically — and hands you a neat printed roster (Excel).

---

## 7. ⚡ Key Takeaways

| Point | Detail |
|---|---|
| **Algorithm Type** | Greedy constraint-satisfaction scheduler |
| **Conflict Detection** | Time-overlap check between exam windows and teaching periods |
| **Fairness Mechanism** | Always assign teacher with minimum total load first |
| **Daily Load Limit** | Max **2 invigilation slots per teacher per day** |
| **Data Format** | Input = `.xlsx` timetable, Output = `.xlsx` invigilation roster |
| **Tech Stack** | Node.js + Express (backend), React + Vite (frontend), MongoDB (storage) |
| **Auth** | Google OAuth 2.0 — only logged-in users can generate schedules |
| **Storage** | Generated Excel files are stored as binary buffers in MongoDB for future re-download |
| **Key Constraint** | A teacher **cannot** invigilate if they're teaching a *different year* during that slot. Teaching the *same year* is allowed (exam = no class for them anyway) |
