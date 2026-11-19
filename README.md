# SAANS — AI-Powered Community Clean Air & Pollution Protection Platform
> *Because every breath matters.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)

---

## 1. Project Vision

**SAANS** is an AI-powered community clean air platform built to help urban communities actively navigate severe winter smog and urban air pollution with actionable, daily solutions. 

**SAANS is NOT another passive AQI widget.**  
Its primary purpose is to mobilize ground interventions: connecting citizens in distress with community air purifiers, open-hardware DIY Corsi-Rosenthal blueprints, vetted public clean-air sanctuaries, verified donors, and local volunteers.

* **Initial Geographic Focus:** Mumbai Metropolitan Region (Bandra, Kurla, Dadar, Andheri, Chembur, Worli, Thane, Colaba).
* **Architecture:** Engineered with extensible city and regional adapters across India.

---

## 2. Key Modules & Differentiators

| Module | What It Does | Key Differentiator |
|---|---|---|
| **Air Quality Centre** | Real-time atmospheric telemetry from Open-Meteo & CAAQMS ground stations. | Strictly computes **CPCB Indian National AQI** with 24h breakpoint equations. Never confuses foreign indices (US AQI) with Indian standards. |
| **Get Help (Assistance Wizard)** | 9 categories of community clean-air aid (purifier loans, DIY installation, N95 masks). | 6-state request lifecycle with real-time in-app notification dispatches. |
| **Volunteer Network & Matching Engine** | Spatial distance & skill matching algorithm (Haversine formula). | Ranks volunteers by proximity, skill category (electrical, installation, repair), and availability. |
| **Clean Air Equipment Library** | Community marketplace for lending and donating HEPA purifiers, filters, and IAQ sensors. | Tracks complete equipment lifecycle (`Available` &rarr; `Requested` &rarr; `Reserved` &rarr; `Issued` &rarr; `Returned`). |
| **DIY Air Purifier Lab** | Interactive room CADR calculator & step-by-step Corsi-Rosenthal build instructions. | Formula: `CADR = Room Volume × Desired ACH / 60`. Includes safety checklists, fan specifications, and filter direction guides. |
| **Clean Air Sanctuaries Directory** | Geolocation directory of verified public filtered rooms (libraries, schools, clinics). | Interactive Leaflet map with filtration specifications, capacity, and 1-click external driving directions. |
| **Community Pollution Watch** | Crowdsourced reporting for garbage burning, construction dust, and industrial smoke. | Privacy-safe, anti-defamation moderation queue. Approved reports appear on public map. |
| **SAANS AI Assistant** | Multi-lingual GenAI copilot (English, हिन्दी, मराठी) via OpenRouter API. | Grounded in platform database context; strict safety guardrails (no medical diagnoses or prescriptions). |
| **Community Impact Engine** | Real-time impact dashboard aggregating verified database records. | Transparent methodology; zero fictitious carbon credits or fabricated statistics. |
| **1-Click Role Switcher** | Instant evaluator role toggle in the navbar. | Switch between **Citizen (Priya)**, **Volunteer (Rahul)**, **Donor (CleanAir NGO)**, and **Admin (SAANS)** seamlessly. |

---

## 3. Technology Stack

### Frontend:
* **Core:** React 18, TypeScript, Vite
* **Styling & Design System:** Tailwind CSS (custom dark/light tokens, cinematic near-black `#080c0e`, airflow gradients), Lucide React
* **Routing & State:** React Router v6, TanStack Query (React Query v5)
* **Forms & Validation:** React Hook Form, Zod
* **Mapping:** Leaflet, OpenStreetMap Tile Layer

### Backend:
* **Runtime:** Node.js v24, Express, TypeScript, TSX
* **Architecture:** Modular service-repository pattern, REST APIs
* **Security:** JWT authentication, bcryptjs, role-based middleware (`requireRole`), input sanitization

### Database & Cloud Infrastructure:
* **Relational Schema:** 23 PostgreSQL relational tables with UUIDs, foreign keys, timestamps, indexes, and RLS policies
* **Supabase:** Supabase PostgreSQL, Supabase Auth, Row Level Security (`supabase/migrations/`)
* **Dual-Tier Resilience:** Automatically connects to Supabase Cloud when credentials exist; seamlessly falls back to a persistent local JSON store (`server/data/saans_db.json`) for zero-friction local development and testing.

### External APIs & Data Sources:
* **Open-Meteo Air Quality API:** ECMWF CAMS regional chemistry model (free, no API key required).
* **OpenAQ API v3:** Worldwide ground monitoring station measurements.
* **OpenRouter API:** OpenAI-compatible endpoint with configurable primary (`google/gemini-2.0-flash-exp:free`) and fallback models.

---

## 4. Database Schema (23 Relational Tables)

The database schema is fully defined in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) and [`supabase/migrations/002_rls_policies.sql`](supabase/migrations/002_rls_policies.sql):

1. `profiles`: Core user profile with location coordinates and language.
2. `user_roles`: Role mapping (`citizen`, `volunteer`, `donor`, `admin`).
3. `household_profiles`: Room sizes, vulnerable residents (elderly, infants, respiratory conditions).
4. `volunteer_profiles`: Service radius (km), years of experience, languages, bio, verification status.
5. `volunteer_skills`: Categorized skill proficiency (`electrical`, `installation`, `repair`, etc.).
6. `organisations`: Registered clean air NGOs and donor organizations.
7. `assistance_requests`: 9 categories, urgency, household type, 6-state lifecycle.
8. `request_assignments`: Volunteer task assignments, progress notes, completion photos.
9. `equipment`: Inventory of purifiers, DIY units, filters, CADR ratings, and condition.
10. `equipment_requests`: Citizen loan and donation applications.
11. `equipment_transactions`: Chain-of-custody transfer records.
12. `equipment_maintenance`: Log of filter replacements and motor checks.
13. `facilities`: Clean-air sanctuaries with filtration specs, hours, capacity, and coordinates.
14. `facility_verifications`: Administrative audit inspections.
15. `community_reports`: Crowdsourced incident reports with photos and resolution notes.
16. `community_initiatives`: Neighborhood workshops and clean corridor drives.
17. `donations`: Pledged and allocated filters, masks, and purifier units.
18. `notifications`: In-app notification queue with read/unread flags.
19. `conversations`: Multi-turn chat sessions with language selection.
20. `conversation_messages`: Structured AI messages.
21. `air_quality_cache`: 15-minute spatial cache of atmospheric readings.
22. `impact_records`: Granular audit trail for verified community interventions.
23. `audit_logs`: Administrative actions log.

---

## 5. Getting Started

### Prerequisites:
* **Node.js:** v18+ (tested on Node v24)
* **npm:** v9+

### 1. Installation
Clone the repository and install dependencies:
```bash
# Clone repository
git clone <repo-url>
cd ep6

# Install server dependencies
cd server
npm.cmd install

# Install client dependencies
cd ../client
npm.cmd install
```

### 2. Environment Setup
Create environment files from the examples:

**Backend (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=saans-super-secret-jwt-key-2026-mumbai

# Optional Supabase Cloud Credentials
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# Optional OpenRouter AI Credentials
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Map Tile CDN
MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

**Frontend (`client/.env`):**
```env
VITE_API_BASE_URL=/api
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### 3. Running the Application
In separate terminal sessions:

**Start the Backend Server:**
```bash
cd server
npm.cmd run dev
# Server runs at http://localhost:5000
```

**Start the Vite Frontend:**
```bash
cd client
npm.cmd run dev
# Client runs at http://localhost:5173
```

---

## 6. Testing & Acceptance Criteria Verification

SAANS includes two comprehensive automated test suites:

### 1. Core End-to-End Test Suite:
```bash
cd server
npm.cmd test
```
Verifies:
* CPCB breakpoint mathematical sub-index calculations
* Real-time air quality ingestion from Open-Meteo & CAAQMS Mumbai
* Spatial volunteer matching algorithm
* CADR mass-balance calculator
* Multi-lingual AI assistant safety responses

### 2. Full 18-Criteria Acceptance Test Suite:
```bash
cd server
npx.cmd tsx test/acceptance_criteria.test.ts
```
Directly verifies every requirement defined in the prompt:
1. Citizen registers and completes onboarding.
2. Citizen views real air-quality information with source attribution.
3. Citizen submits equipment assistance request.
4. Administrator reviews and approves request.
5. Volunteer registers and accepts assignment.
6. Volunteer updates assignment with completion notes and photo evidence.
7. Citizen sees updated status and receives real-time notification.
8. Donor lists equipment in community library.
9. Another user requests equipment.
10. Administrator/donor approves transaction.
11. User calculates required purifier capacity (CADR).
12. AI assistant answers using OpenRouter / grounded engine.
13. AI assistant explains DIY purifier assembly and safety.
14. User finds participating clean-air facility on map.
15. User submits community pollution report.
16. Administrator moderates report.
17. Impact dashboard reflects completed activities.
18. Unauthorized users cannot access protected administrative records.

---

## 7. Pre-Seeded Evaluation Accounts

The platform includes 4 pre-seeded Mumbai accounts with a **1-click Role Switcher** in the top navbar:

| Account | Role | Name | Location | Password |
|---|---|---|---|---|
| `priya.sharma@example.com` | **Citizen** | Priya Sharma | Kurla West, Mumbai | `password123` |
| `rahul.deshmukh@example.com` | **Volunteer** | Rahul Deshmukh | Dadar, Mumbai | `password123` |
| `cleanair.mumbai@example.com` | **Donor / NGO** | CleanAir NGO Mumbai | Andheri East, Mumbai | `password123` |
| `admin@saans.org` | **Administrator** | Admin SAANS | Bandra West, Mumbai | `password123` |

---

## 8. Deployment Instructions

### Frontend (Vercel):
* Set Root Directory to `client`.
* Build Command: `npm run build`
* Output Directory: `dist`
* Environment Variables: `VITE_API_BASE_URL=https://<your-backend-url>/api`

### Backend (Render / Railway):
* Set Root Directory to `server`.
* Build Command: `npm run build`
* Start Command: `npm start`
* Configure environment variables from `server/.env.example`.

### Database (Supabase):
* Create a new Supabase PostgreSQL project.
* Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor.
* Run `supabase/migrations/002_rls_policies.sql` to activate Row Level Security.
* Run `supabase/seed.sql` to populate initial Mumbai facilities and baseline records.

---

## 9. Ethics, Safety & Methodology Disclaimers

1. **Medical Safety:** SAANS is an environmental engineering and community logistics platform. It does not provide medical diagnoses, prescribe drugs, or guarantee disease prevention. Inhabitants experiencing acute respiratory distress are always directed to registered medical doctors.
2. **DIY Hardware Integrity:** DIY Corsi-Rosenthal box units provide mechanical particle filtration; they are not medically certified commercial devices. Assembly instructions mandate thermal fuse fan motors and forbid unauthorized electrical modifications.
3. **Data Transparency:** Impact statistics reflect actual database transactions (fulfilled requests, verified loans, audited facilities). They are not inflated into speculative carbon offsets or invented disability-adjusted life years (DALYs).
