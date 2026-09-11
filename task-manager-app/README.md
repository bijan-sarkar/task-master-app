# TaskMaster AI: Full-Stack Task Manager, Smart Scheduler & Tough-Love Accountability Engine

A mobile-responsive web application designed to automatically organize rough weekly tasks into your actual daily free-time blocks, track done/undone progress, visualize a 5-month GSoC roadmap, sync with Google Calendar, and send email & WhatsApp notifications (including tough-love/harsh accountability alerts).

---

## 🌟 Key Features

1. **Smart Free-Time Slot Allocation**:
   - Define your recurring weekly availability (e.g., Mon–Fri: 19:00–22:00, Weekends: 14:00–18:00).
   - An intelligent interval-packing algorithm fits tasks with estimated durations into your free windows without double-booking.

2. **Google Summer of Code (GSoC) 5-Month Master Roadmap**:
   - Pre-loaded with a structured 5-month curriculum (51 concrete tasks spanning developer tooling, open source contributions, mentor networking, proposal drafting, and summer kickoff).
   - Automatically synchronizes curriculum tasks into your actual calendar dates and free hours.

3. **Multi-Channel Tough Love & Harsh Alerts**:
   - Background worker monitors pending tasks and calculates exact time remaining.
   - Escalates alerts (Gentle ➡️ Firm ➡️ Harsh ➡️ Roast) to push you to complete your scheduled commitments.
   - Dispatches via Email (Gmail SMTP / Resend) and WhatsApp (Meta WhatsApp Cloud API).

4. **1-Click Google Calendar Synchronization**:
   - Every scheduled task includes a direct 1-click Google Calendar integration link with pre-filled title, description, and exact start/end datetimes.

5. **Mobile-First Responsive Dashboard**:
   - Built with Next.js 14, Tailwind CSS, Lucide icons, and PWA readiness.
   - Real-time weekly progress percentage, done/undone counts, and task toggles.

---

## 🚀 Free Hosting Recommendations

| Component | Recommended Platform | Free Tier Highlights |
| :--- | :--- | :--- |
| **Frontend UI** | **Vercel** | Unlimited deployments, automatic GitHub CI/CD, fast global edge CDN, custom domain support. |
| **Backend API** | **Render** or **Koyeb** | Free web services supporting Python 3.11 / FastAPI with automatic git deploys and free SSL. |
| **Database** | **Supabase** | Generous free PostgreSQL tier (500 MB storage, connection pooling, built-in SQL editor). |
| **Email Service**| **Gmail SMTP** or **Resend** | Free 500 emails/day via Gmail App Passwords, or 3,000 free emails/month via Resend API. |
| **WhatsApp API** | **Meta WhatsApp Cloud API** | First 1,000 service conversations per month are completely free. |

---

## 🛠️ Step-by-Step Setup Guide

### 1. Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com/) and create a free project.
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Copy and paste the contents of `backend/supabase_schema.sql` into the editor and click **Run**.
4. Copy your PostgreSQL connection URI from **Project Settings ➡️ Database ➡️ Connection string (URI)**.

### 2. Backend Setup (FastAPI)
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL, SMTP_USER, and SMTP_PASSWORD
   ```
5. Start the FastAPI API server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
6. Start the background deadline worker in a separate terminal:
   ```bash
   python worker.py
   ```

### 3. Frontend Setup (Next.js)
1. Navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) on your browser or mobile phone!

---

## 📱 Deploying to Production (Free)

### Deploying Frontend to Vercel
1. Push your repository to GitHub.
2. Import your repo on [Vercel](https://vercel.com/).
3. Set the root directory to `frontend`.
4. Set the environment variable:
   - `NEXT_PUBLIC_API_URL`: Your hosted backend URL (e.g. `https://your-app.onrender.com`).
5. Click **Deploy**.

### Deploying Backend to Render
1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository and set the root directory to `backend`.
3. Set:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, add your `DATABASE_URL`, `SMTP_USER`, and `SMTP_PASSWORD`.
5. Deploy the service.
