# Harsh A Movie

Premium movie theater booking platform built with Next.js 15, Supabase, and Tailwind CSS.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and fill in your credentials
3. Run `supabase/schema.sql` in the Supabase SQL Editor
4. Run `supabase/seed.sql` in the Supabase SQL Editor

### 3. Create Admin User
In Supabase Dashboard → Authentication → Users → Create User:
- Email: `admin@harshamovie.com`
- Password: your choice

Then in the SQL Editor:
```sql
INSERT INTO admins (id, email, role)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'admin@harshamovie.com';
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure
```
src/
├── app/              # Next.js App Router pages
│   ├── admin/        # Admin CMS panel
│   ├── booking/      # Booking flow (seats, checkout, confirmation)
│   └── movie/        # Movie detail pages
├── actions/          # Server actions (CRUD operations)
├── components/       # Reusable components
├── hooks/            # Custom hooks (Zustand store, media query)
└── lib/              # Utilities, types, constants, Supabase clients
```

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **UI**: Shadcn/UI (customized for cinema theme)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State**: Zustand (booking flow)
- **Deployment**: Vercel-ready

## Features
- 🎬 Public movie browsing with hero carousel
- 🎟️ Interactive seat selection (BookMyShow-style)
- 💳 Guest checkout with promo codes
- 📊 Full admin dashboard with KPIs
- 🎥 Movie CRUD with media management
- ⏰ Showtime management
- 🎫 Booking management with cancellation
- 🏷️ Promo code system (FIRST50 = 50% off)
- 📱 Fully responsive design
- ✨ Premium cinema theme with animations
