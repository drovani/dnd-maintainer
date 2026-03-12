# D&D Keeper - Setup Guide

## Prerequisites

- Docker Desktop (running, with WSL2 integration enabled)
- WSL2/Ubuntu with Supabase CLI installed
- Node.js 18+ (in WSL2)

## Quick Start

All commands run from **WSL2/Ubuntu**. Navigate to the project folder:

```bash
cd /path/to/dnd-maintainer
```

### 1. Install Node dependencies

```bash
npm install
```

### 2. Start Supabase (local)

```bash
supabase start
```

This pulls Docker images on first run (may take a few minutes). Once running, it prints out your local API URL and keys. The defaults in `.env.local` should match, but verify:

- API URL: `http://127.0.0.1:54321`
- Anon key: the `anon key` value from `supabase start` output

If the anon key differs, update `.env.local`.

### 3. Apply migrations and seed data

Migrations run automatically with `supabase start`. To re-run or reset:

```bash
npx supabase db reset
```

This drops and recreates the database, applies all migrations, and runs `seed.sql` (sample "Lost Mines of Phandelver" campaign with characters).

### 4. Start the dev server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## Supabase Dashboard

Access the local Supabase dashboard at **http://127.0.0.1:54323** to browse tables, run SQL, and manage data directly.

## Project Structure

```
dnd-maintainer/
  src/
    components/       # Shared UI components
      ui/             # Button, Card, Input, Modal, etc.
      Layout.tsx      # App shell with sidebar
      Sidebar.tsx     # Navigation sidebar
    hooks/            # TanStack Query data hooks
    lib/              # Supabase client, query client, D&D helpers
    pages/            # Route pages
    types/            # TypeScript type definitions
  supabase/
    config.toml       # Local Supabase configuration
    migrations/       # Database schema migrations
    seed.sql          # Sample data
```

## Useful Commands

```bash
npx supabase status          # Check running services
npx supabase stop            # Stop all containers
npx supabase db reset        # Reset DB + re-seed
npx supabase migration new   # Create a new migration
npm run build                # Production build
```
