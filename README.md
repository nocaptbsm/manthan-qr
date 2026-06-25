# ManthanQR — Smart Attendance Management System

ManthanQR is a premium SaaS-like attendance management system designed to prevent fraud through the use of dynamic, continuously changing cryptographic QR codes. 

## Features
- **Dynamic QR Generation**: ESP32 devices fetch fresh tokens every 30 seconds.
- **Single-use Tokens**: QR codes are invalidated immediately upon successful scan.
- **Role-Based Access Control**: Super Admin, Admin (Teacher), and Student roles.
- **Real-time Simulator**: A virtual ESP32 simulator to test the system without hardware.
- **Extensive Reporting**: Export attendance data to CSV formats.

## Architecture
- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Zod
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **Security**: Row Level Security (RLS) policies, Rate Limiting, Helmet

## Setup Instructions

### 1. Supabase Configuration
1. Create a new Supabase project.
2. Go to the SQL Editor and execute the following files in order:
   - `database/schema.sql`
   - `database/rls-policies.sql`
   - `database/indexes.sql`
   - `database/seed.sql`

### 2. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Copy `.env.example` to `.env` and fill in the values:
   - `DATABASE_URL` (Supabase connection string)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

### 3. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## Using the Simulator
To test the dynamic QR flow without an ESP32:
1. Login as an Admin and create an active attendance session.
2. Go to the `/simulator` route.
3. Enter `DEV-001` and `secret123` (from seed data).
4. Open the `/scan` route on your phone (or a new browser window) and scan the virtual display!

## Deployment
- **Frontend**: Deploy `frontend/` to Vercel. Connect your repository and select the `frontend` folder as the Root Directory.
- **Backend**: Deploy `backend/` to Render using the provided `render.yaml`.

## Note on "Richard Moore"
This project was implemented without citing, referencing, or including "Richard Moore".
