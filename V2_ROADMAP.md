# WE Tracker - V2 Roadmap

**Last Updated:** December 16, 2025
**Project Location:** `/Users/alexdreier/Documents/GitHub/wetrack`
**Production URL:** https://wetracker.vercel.app

---

## Current State (V1 Complete)

### Tech Stack
- **Frontend/Backend:** Next.js 14 (App Router), React, TypeScript
- **Database/Auth/Storage:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Email:** Nodemailer with Gmail SMTP
- **Hosting:** Vercel
- **Real-time:** Supabase subscriptions

### Features Implemented

#### Core Task Management
- Create, read, update, delete tasks
- Task fields: title, notes (rich text with TipTap), priority, status, time estimate, start/due dates
- Three priority levels: Urgent, Normal, Rainy Day
- Three statuses: Not Started, In Progress, Completed
- Task assignment to team members (2 users: Alex & Bob)
- Real-time updates via Supabase subscriptions

#### Views & Filtering
- List view with task cards
- Calendar view with clickable dates (popover shows tasks)
- Filter by: status, priority, assignee (All/Mine/Unassigned), search
- Sort by: recently updated, recently created, due date, lead, priority
- Compact calendar in sidebar

#### Collaboration
- Comments on tasks (rich text)
- File attachments (max 10MB, stored in Supabase)
- Activity log tracking all changes
- Real-time sync between users

#### Email Notifications
- Master toggle + granular settings per user
- Notifications for: new tasks, assignments, comments, status changes
- Branded email templates with WestEd styling
- SMTP configured via environment variables

#### User Management
- Supabase authentication (email/password)
- User profiles with avatars
- Password reset flow
- Notification preferences in settings

#### Integrations
- Things 3 integration (optional, per-user setting)
- "Send to Things" button on task cards
- Properly formatted URL scheme with title, notes, deadline

### Database Schema

```
profiles
  - id, full_name, email, avatar_url
  - email_notifications, notify_on_assignment, notify_on_comments, notify_on_status_change
  - things_integration
  - created_at

tasks
  - id, title, notes (HTML), priority, status
  - time_estimate, start_date, due_date
  - assigned_to (FK), created_by (FK)
  - created_at, updated_at

comments
  - id, task_id (FK), user_id (FK), content (HTML), created_at

attachments
  - id, task_id (FK), user_id (FK)
  - file_name, file_url, file_size, content_type
  - created_at

activity_log
  - id, task_id (FK), user_id (FK)
  - action, details (JSON), created_at
```

### Key Files
- `app/dashboard/page.tsx` - Main dashboard
- `app/dashboard/tasks/[id]/page.tsx` - Task detail
- `app/dashboard/settings/page.tsx` - User settings
- `components/TaskCard.tsx` - Task card in list
- `components/TaskList.tsx` - Task list with filtering/sorting
- `components/TaskFilters.tsx` - Filter dropdowns
- `components/TaskDetail.tsx` - Full task view/edit
- `components/CalendarView.tsx` - Calendar with popovers
- `components/CreateTaskButton.tsx` - New task dialog
- `components/CommentSection.tsx` - Comments on tasks
- `components/FileUpload.tsx` - Attachment handling
- `app/api/notifications/route.ts` - Email notification logic
- `lib/email.ts` - Email templates

---

## V2 Roadmap

### Phase 1: Quick Wins

Small improvements with high impact:

1. **Confirm before deleting comments**
   - File: `components/CommentSection.tsx`
   - Add confirmation dialog (currently instant delete)

2. **Show file upload progress**
   - File: `components/FileUpload.tsx`
   - Add progress bar during upload

3. **Validate start date < due date**
   - Files: `components/CreateTaskButton.tsx`, `components/TaskDetail.tsx`
   - Show error if start date is after due date

4. **Add task count to filters**
   - File: `components/TaskFilters.tsx`
   - Show counts like "Urgent (3)", "In Progress (5)"

5. **"Clear filters" button**
   - File: `components/TaskFilters.tsx`
   - Reset all filters with one click

6. **Empty state for calendar**
   - File: `components/CalendarView.tsx`
   - Show message when no tasks have due dates

### Phase 2: Tags/Labels

Allow categorizing tasks beyond priority:

1. **Database changes:**
   - New `tags` table: id, name, color, created_by
   - New `task_tags` junction table: task_id, tag_id
   - SQL migration needed in Supabase

2. **UI components:**
   - Tag selector in task creation/editing
   - Tag badges on task cards
   - Filter by tag in TaskFilters
   - Tag management in settings (create/edit/delete)

3. **Files to modify:**
   - `types/database.ts` - Add Tag types
   - `components/TaskCard.tsx` - Display tags
   - `components/CreateTaskButton.tsx` - Tag selector
   - `components/TaskDetail.tsx` - Tag editing
   - `components/TaskFilters.tsx` - Tag filter
   - `components/SettingsForm.tsx` - Tag management section

### Phase 3: Drag-and-Drop Reordering

Allow manual task ordering:

1. **Library:** Use `@dnd-kit/core` and `@dnd-kit/sortable`

2. **Database changes:**
   - Add `position` field to tasks table (integer)
   - Or use fractional indexing for better performance

3. **Implementation:**
   - Wrap TaskList in DndContext
   - Make TaskCards draggable
   - Update position on drop
   - Persist to database

4. **Files to modify:**
   - `components/TaskList.tsx` - Add DnD context
   - `components/TaskCard.tsx` - Make draggable
   - `types/database.ts` - Add position field

### Phase 4: Keyboard Shortcuts

Power user productivity:

1. **Global shortcuts:**
   - `N` - New task
   - `?` - Show shortcuts help
   - `/` - Focus search
   - `Escape` - Close modals

2. **List navigation:**
   - `J` / `K` - Move down/up in task list
   - `Enter` - Open selected task
   - `E` - Edit selected task
   - `C` - Toggle complete

3. **Implementation:**
   - Add keyboard event listener in layout or dashboard
   - Track "selected" task index in state
   - Visual indicator for selected task
   - Help modal showing all shortcuts

4. **Files to modify:**
   - `app/dashboard/layout.tsx` - Global listener
   - `components/TaskList.tsx` - Selection state
   - `components/TaskCard.tsx` - Selected styling
   - New `components/KeyboardShortcutsHelp.tsx`

### Phase 5: Dark Mode

Theme switching:

1. **Approach:** Use CSS variables + Tailwind dark mode

2. **Implementation:**
   - Add theme toggle in navbar or settings
   - Store preference in localStorage + profile
   - Update CSS variables for dark theme
   - Use `dark:` Tailwind classes throughout

3. **Files to modify:**
   - `app/globals.css` - Dark theme variables
   - `tailwind.config.ts` - Enable dark mode
   - `components/Navbar.tsx` - Theme toggle
   - All components - Add `dark:` variants as needed

### Phase 6: Bulk Operations

Select and act on multiple tasks:

1. **Selection UI:**
   - Checkbox on each task card
   - "Select all" checkbox in header
   - Selection count indicator
   - Bulk action toolbar (appears when items selected)

2. **Bulk actions:**
   - Mark complete
   - Change status
   - Change priority
   - Assign to user
   - Delete (with confirmation)

3. **Implementation:**
   - Track selected task IDs in state
   - Bulk update via Supabase
   - Clear selection after action

4. **Files to modify:**
   - `components/TaskList.tsx` - Selection state
   - `components/TaskCard.tsx` - Checkbox
   - New `components/BulkActionBar.tsx`
   - `components/DashboardContent.tsx` - Integrate bulk bar

---

## Security Fixes (Should Do)

1. **XSS Vulnerability**
   - `components/RichTextEditor.tsx` line 159
   - RichTextDisplay uses `dangerouslySetInnerHTML` without sanitization
   - Fix: Install and use DOMPurify

2. **File upload validation**
   - `components/FileUpload.tsx`
   - Only checks size, not file type
   - Fix: Add MIME type validation

---

## Environment Variables (Production)

Set in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://retbvqlloyyiqoyakzmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=adreier@wested.org
SMTP_PASS=<app-password>
NEXT_PUBLIC_APP_URL=https://wetracker.vercel.app
```

---

## Recent Session Context

- Fixed email notifications (SMTP env vars were missing in Vercel)
- Added Things 3 integration with proper icon and URL encoding
- Modernized UI for task cards and calendar
- Added clickable calendar dates with task popovers
- Fixed timezone bug with date parsing (parseLocalDate helper)
- Added "My Tasks" filter and sorting options
- Added debug logging to notifications API

---

## Notes for Next Session

When resuming:
1. Read this file to get full context
2. Start with Phase 1 Quick Wins (small, impactful)
3. Tags/Labels is the biggest database change - plan carefully
4. Dark mode touches many files but is straightforward
5. Consider doing keyboard shortcuts early (high user value)
