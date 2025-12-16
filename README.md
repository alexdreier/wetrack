# WETrack

A collaborative task management web app for teams with real-time sync, comments, file attachments, and email notifications.

## Features

- **Task Management**: Create, edit, and organize tasks with priorities, statuses, and due dates
- **Real-time Sync**: See changes instantly when your teammate updates a task
- **Comments**: Discuss tasks with threaded comments
- **File Attachments**: Upload and share files on tasks
- **Email Notifications**: Get notified about assignments, comments, and status changes
- **Two-user System**: Perfect for small teams or manager-employee pairs

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Supabase** - Database, auth, real-time, and file storage
- **Tailwind CSS + shadcn/ui** - Modern, accessible UI components
- **TypeScript** - Type-safe development

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

### 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql` and run it
3. Copy the contents of `supabase/storage.sql` and run it

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in the values from your Supabase project:
   - `NEXT_PUBLIC_SUPABASE_URL`: Found in Settings > API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Found in Settings > API (anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY`: Found in Settings > API (service_role key - keep secret!)

3. For email notifications (optional), configure SMTP:
   - `SMTP_HOST`: e.g., `smtp.gmail.com`
   - `SMTP_PORT`: e.g., `587`
   - `SMTP_USER`: Your email address
   - `SMTP_PASS`: App password (for Gmail, create one at Google Account > Security > App Passwords)

### 4. Create User Accounts

1. In Supabase dashboard, go to **Authentication > Users**
2. Click **Add User** and create accounts for you and your manager
3. Both users should receive email invitations to set their passwords

### 5. Run the Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all environment variables from `.env.local`
4. Deploy!

### Update Environment Variables

After deployment, update `NEXT_PUBLIC_APP_URL` to your production URL for email links to work correctly.

## Project Structure

```
wetrack/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard and task views
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # App-specific components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   └── email.ts          # Email notification helpers
├── supabase/             # Database schema files
│   ├── schema.sql        # Main database schema
│   └── storage.sql       # Storage bucket setup
└── types/                # TypeScript type definitions
```

## License

MIT
