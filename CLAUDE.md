# CLAUDE.md — হিসাব ইন (Hostel Meal Management)

Context for Claude Code. **Keep this file up to date:** whenever a change affects
anything below (features, structure, conventions, env vars, commands, decisions),
update the relevant section in the same task.

@AGENTS.md

## What this is

A **multi-hostel** Next.js app for monthly hostel meal accounting: members, deposits,
meal counts, expenses, meal rate, outstanding balances (বকেয়া) and refunds (ফেরত). The UI
is in Bangla, and all calculations are automatic.

Anyone can sign up (`/register`). Each user owns exactly **one hostel**, and every member
and monthly record belongs to a hostel.

- **Public:**
  - `/` landing page;
  - `/monthly-bill` asks for a hostel code;
  - `/monthly-bill/<code>` shows that hostel's latest **published** month;
  - `/monthly-bill/<code>/YYYY-MM` shows an older month.
  - No login needed.
  - The public report shows only the member table + meal rate; the "মাসিক খরচের সারসংক্ষেপ"
    summary grid is hidden there (`showSummary={false}`) but still shown in admin views.
  - The report pages live in the `(report)` route group, with **no navbar or footer**.
    `/monthly-bill` itself is in `(site)`.
- **Navigation:**
  - `SiteHeader` appears on `(site)` pages **and** in the admin layout, with
    `AdminMobileMenu` in its `menu` slot. The desktop sidebar sits below it.
  - Logged-in users see ড্যাশবোর্ড instead of লগইন/রেজিস্টার, and the landing page's
    main button becomes "ড্যাশবোর্ডে যান". লগআউট is in the sidebar.
- **Admin:** `/login`, `/register`, and `/admin/*` (dashboard, new month, monthly records,
  members, profile). **There is no settings page**: everything account- and hostel-related
  is on `/admin/profile`, and `/admin/settings` redirects there. Don't re-add a settings page.
  - `/admin/profile` shows the avatar initial, name, email and join date; hostel stats
    (`getHostelStats`); the hostel public link; a name/email form; the hostel-name form
    (`SettingsForms`); and the change-password form (`#password`).
  - **Changing the email** checks availability **first**: the form checks live (debounced,
    via `checkEmailAvailableAction` → `isEmailAvailable`) and only then shows the
    current-password field. `updateProfile` checks for an email in use before verifying
    the password, and maps a duplicate-key race to the same message.
  - `/admin/password` redirects there. The sidebar's প্রোফাইল item, the user label, and
    the header link all point to it.
  - The dashboard is kept minimal: a title with the current month and status, the
    public-link card, the 8 summary cards (or one create button if no record exists), and
    a link to the public report.
  - Don't re-add lists that duplicate sidebar pages.

## Stack

Next.js 16.4 (App Router, Turbopack, Server Actions; `proxy.ts` replaces middleware) ·
React 19 · TypeScript · MongoDB Atlas + Mongoose 9 · Auth.js v5 beta (Credentials only) ·
Tailwind v4 · shadcn/ui (radix-nova style; `cn` comes from the `cn` package) ·
lucide-react · React Hook Form + Zod 4 · next-themes · html2canvas-pro + jsPDF · Vitest.

Next 16 differs from older versions, so read `node_modules/next/dist/docs/` before
using unfamiliar APIs. `cacheComponents` is intentionally **off**. DB-backed public
pages call `await connection()` so they render per request.

## Commands

```bash
npm run dev            # dev server :3000 (restart it after moving or deleting route folders)
npm run build          # production build (needs AUTH_SECRET in env)
npm test               # Vitest; in-memory MongoDB, needs no .env
npm run typecheck      # run `npx next typegen` first if PageProps/LayoutProps are missing
npm run lint
npm run db:check       # verify the MongoDB connection and list collections
npm run db:migrate     # one-time single→multi-hostel migration (idempotent; already run on Atlas)
npm run admin:create -- --email x@y.com --password "..." [--name "Name"] [--hostel "Hostel"]  # create user / reset password
```

## User decisions (do not change without asking)

- **App name:** "হিসাব ইন", from `APP_NAME` in `src/lib/site.ts`. Use the constant
  and never hard-code the name.
- **Font:** Hind Siliguri (`next/font/google`, CSS var `--font-hind-siliguri`).
- **The word "Admin"** is used in UI text instead of প্রশাসক/প্রশাসনিক (e.g.
  "Admin লগইন"). The public nav uses লগইন / রেজিস্টার. The rest of the UI is Bangla.
- **Accounts:**
  - public self sign-up;
  - one hostel per user;
  - no roles, since every user is the admin of their own hostel;
  - no OAuth: email + bcrypt password in the `admins` collection;
  - change the password at `/admin/password`, or reset it with `npm run admin:create`.
  - `ADMIN_EMAILS` and `HOSTEL_NAME` are no longer used and were removed from `.env`.
    `.env` holds `MONGO_URI`, `MONGO_DB_NAME`, `AUTH_SECRET` and `APP_URL`.
- **Domain:** `APP_URL` (e.g. `https://hisab.in`, no trailing slash) builds shareable report
  links via `getAppUrl()` in `src/lib/site.ts`. It's currently `http://localhost:3000`; set
  the real domain when deploying.
- **Hostel ID in public links:** a short random code of 6 characters from
  `abcdefghjkmnpqrstuvwxyz23456789` (`generateHostelCode`). It is unique and never chosen
  by the user.
- **Database:** env var `MONGO_URI` (currently a non-SRV `mongodb://` Atlas URI) and
  database `hostel` (`MONGO_DB_NAME`).
- **Schema/field names** are in English (month, year, members, investment…).
- **Theme:** light/dark toggle (`ThemeToggle`). Print and PDF always render light.
- **Brand color is orange.**
  - The `--primary` token is orange-600 in light mode and orange-500 in dark mode.
  - Use `primary` or `orange-*` for brand and success UI.
  - The only remaining green (`emerald`) is for refund (ফেরত) amounts; red is for বকেয়া.
- **Logo:** the lucide `Calculator` icon (header, sidebar, login and register cards) and
  `src/app/icon.svg` (orange calculator favicon).
- **Public route is `/monthly-bill`** (renamed from `/monthly-report`). `next.config.ts`
  permanently redirects old `/monthly-report/*` links.

## Architecture

```
src/app/(site)/          public pages, sharing SiteHeader + footer (landing, monthly-bill code entry, login, register)
src/app/(report)/        bare layout: /monthly-bill/[hostel] and /monthly-bill/[hostel]/[period] (no navbar)
src/app/admin/           protected pages; layout calls requireAdminPage(), sidebar nav
src/app/api/auth/        Auth.js route handler
src/features/accounting/ calculate.ts (pure calculator), actions.ts (server actions), AccountEditor (create + edit), AccountActions
src/features/members/    member actions, MemberPicker, MembersManager
src/features/auth/       login/register/logout/hostel-settings/password actions + forms
src/services/            business logic + DB access (no auth inside; every function takes hostelId)
src/lib/                 mongodb.ts, auth.ts, authz.ts, money.ts, months.ts, site.ts, action-result.ts
src/models/              Admin (user), Hostel, Member, MonthlyAccount
src/schemas/             Zod schemas shared by client and server
scripts/                 create-admin, check-db, migrate-multi-hostel
tests/                   calculate, accounting-service (DB, incl. hostel isolation), authorization (+ sign-up)
```

Layering: UI → server action (`const { hostel } = await requireAdmin()`, then `runAction()`
→ `ActionResult`) → service (`fn(hostel.id, …)`, Zod `parseOrThrow`, throws `ServiceError`
with a Bangla message) → Mongoose.

## Core rules

- **Tenant isolation:**
  - every Member/MonthlyAccount query and update filters by `hostelId`;
  - actions take the hostel from the session on the server, never from the client;
  - member IDs from another hostel are rejected.
- **Session:** the JWT `sub` is the user's `_id`. `getAdminSession()` (cached per
  request) loads the user and hostel from the DB, so deleted users lose access
  immediately.
- **Money is integer paisa**; meals are integer hundredths (half meals allowed).
  Never use float math for money. Parse input with `parseHundredths` and format
  with `formatTaka`, `formatAmount` and `formatMealUnits` (Bangla digits, lakh grouping).
- **Calculator** (`calculate.ts`) is the single source of truth, used by both the server
  save and the live preview:
  - meal rate = food ÷ meals, displayed rounded half-up;
  - meal cost and extra share are split with **largest remainder** (ties → lower memberId),
    so totals reconcile exactly;
  - `reconcile()` checks every result.
- **Monthly records** store member **snapshots** (name at that time + all figures).
  There is one record per `(hostelId, year, month)` (unique index).
- **Carry-forward:** a new month takes members from the hostel's most recent earlier
  record, with current registry names, skipping inactive members. Financial data is
  never copied.
- **New month = one page.**
  - `/admin/accounts/new` renders the full `AccountEditor` in `mode: "create"`, with
    month/year pickers in section ক and members pre-filled from carry-forward.
  - Changing the period reloads the members via `prepareNewMonthAction`. An existing
    period shows a link instead.
  - Save or publish calls `createAccountWithValuesAction` → `createAccountWithValues`,
    which creates the record with all data in one write (DRAFT, or PUBLISHED if valid;
    nothing is written on validation failure), then redirects to `/admin/accounts/<id>`.
  - There is no separate "select members first" step; don't re-add it.
  - `FieldError` lives in `src/components/field-error.tsx`.
- **Draft/publish:**
  - saving keeps the record a DRAFT;
  - publishing needs a manager name, ≥1 member and total meals > 0;
  - published records are locked by updates conditioned on `status: "DRAFT"`.
    Editing requires an explicit, confirmed unpublish.
  - `AccountActions` offers **unpublish** and **delete**, each with a confirmation dialog,
    in the records list (icon buttons) and on the published-record page.
  - `deleteAccount` refuses published records unless `allowPublished` is set;
    `deleteAccountAction` sets it after the UI confirmation.
- **Public page:** the hostel's latest published month, sorted by `{year: -1, month: -1}`.
  Drafts are never shown.
- **Hostel name** lives on the `Hostel` document and is edited on the profile page. The
  old `settings` collection is legacy and no longer read.

## Gotchas

- On this Windows machine Node's DNS (127.0.0.1) refuses SRV lookups. `connectDB`
  falls back to `MONGO_DNS_SERVERS` (default 8.8.8.8, 1.1.1.1) for `mongodb+srv` URIs.
- Don't kill all `node.exe` processes; stop only the specific port's PID.
- **Never put text containing backticks inside a double-quoted shell string.** Bash runs
  them as commands. Once this ran README `npm run admin:create` lines against the real
  database. Edit docs with the Edit/Write tools, not `node -e "…"`.
- The dev server can keep serving deleted routes after folders are moved; restart it.
- The `.env` file holds real credentials. Never print or commit it (`.gitignore`
  has `.env*` and `!.env.example`).
- The `rules-of-hooks` lint rule flags functions named `use*` in tests; test helpers
  use `setup*` and `makeHostel` names.
- npm 12 blocks install scripts by default (warnings are expected).
- Sign-up has no email verification or rate limiting yet.

## Status

- **Done:** all spec features, multi-hostel sign-up, landing page, nav bar, theme toggle
  and branding.
- **Atlas:** migrated. The first user (muntasir.us7@gmail.com) owns the hostel
  "faCEBOOK MESS" with code `x5cy76`.
- **Remaining:** a manual browser walk-through, then commit and deploy. Optionally add
  email verification and sign-up rate limiting.
