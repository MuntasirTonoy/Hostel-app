# হিসাব ইন — Hostel Meal Management

A full-stack, multi-hostel Next.js app for monthly hostel meal accounting: members,
deposits, meal counts, expenses, meal rate, outstanding balances and refunds. The UI
is entirely in Bangla, and all calculations are automatic.

- **Sign up** (`/register`): anyone can create an account. Each account owns one hostel
  with its own members and records, fully separate from other hostels.
- **Admin dashboard** (`/admin`): members, monthly records, draft/publish, hostel settings.
- **Public report** (`/monthly-bill/<code>`): a hostel's latest *published* month, no
  login needed. Every hostel gets a short random code, e.g. `/monthly-bill/k7x2p9`.
  Older months are at `/monthly-bill/<code>/YYYY-MM`. The link is shown, with a copy
  button, on the dashboard and the profile page.

## Tech stack

Next.js 16 (App Router, Server Actions) · TypeScript · MongoDB + Mongoose ·
Auth.js v5 (Credentials, no OAuth) · Tailwind CSS v4 · shadcn/ui · Lucide ·
React Hook Form · Zod · Vitest · Font: Hind Siliguri

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment.** Copy `.env.example` to `.env` and fill it in:

   | Variable | Purpose |
   | --- | --- |
   | `MONGO_URI` | MongoDB connection string (no database name in it) |
   | `MONGO_DB_NAME` | Database name. Default `hostel` |
   | `AUTH_SECRET` | Session encryption secret. Generate with `npx auth secret` |
   | `MONGO_DNS_SERVERS` | Optional DNS fallback for `mongodb+srv` lookups |

   On MongoDB Atlas, make sure the database user in `MONGO_URI` exists under
   *Database Access* and that your IP is allowed under *Network Access*.

3. **Create an account.** Open `/register` in the browser, or use the CLI (which also
   resets passwords):

   ```bash
   npm run admin:create -- --email <email> --password "<password>" --name "<name>" --hostel "<hostel name>"
   ```

4. **Run**

   ```bash
   npm run dev          # http://localhost:3000
   npm run build && npm start
   ```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | All automated tests (uses an in-memory MongoDB, so no setup is needed) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run admin:create` | Create a user (and hostel) or reset a password |
| `npm run db:check` | Verify the database connection |
| `npm run db:migrate` | One-time upgrade of single-hostel data to multi-hostel (safe to re-run) |

The first `npm test` run downloads a MongoDB binary for `mongodb-memory-server`,
which takes a few minutes once.

## Monthly workflow

1. **নতুন মাসের হিসাব**: pick the month and year. Members from the most recent
   earlier record are carried forward automatically, using only names and IDs.
   Deposits, meals and expenses are never copied. Inactive members are skipped.
   You can add or remove members, or create new ones, before creating the record.
2. Enter each member's deposit and meal count, plus market, rice, fuel and other
   expenses. The meal rate, extra share and every balance update live.
3. **হিসাব সংরক্ষণ করুন** saves a draft. Drafts are never public.
4. **হিসাব প্রিভিউ দেখুন** shows the report exactly as it will be published.
5. **মাসিক হিসাব প্রকাশ করুন** publishes the record after confirmation. It needs a
   manager name, at least one member, and total meals > 0.
6. A published record is locked. To correct it, use "সম্পাদনার জন্য অপ্রকাশিত
   করুন" (with confirmation), edit it, and publish again.

## Calculation rules

All logic lives in `src/features/accounting/calculate.ts`, a pure module. The
server uses it to save authoritative snapshots, and the admin form uses it for
the live preview.

```
মোট খাবারের খরচ  = বাজার + চাল
মিল রেট          = মোট খাবারের খরচ ÷ মোট মিল
মোট অতিরিক্ত খরচ = জ্বালানি + অন্যান্য
জনপ্রতি অতিরিক্ত = মোট অতিরিক্ত খরচ ÷ সদস্য সংখ্যা
সদস্যের খরচ      = মিল × মিল রেট + জনপ্রতি অতিরিক্ত
ব্যালেন্স         = জমা − সদস্যের খরচ   (negative → বকেয়া, positive → ফেরত)
```

### Precision and rounding policy

- Money is stored and calculated as **integer paisa** (1 ৳ = 100 paisa), and meal
  counts as integer hundredths, so half meals such as `2.5` are supported. No
  floating-point arithmetic is used for money; input strings are parsed directly
  into integers, and Bangla digits are accepted.
- The **displayed meal rate** is rounded half-up to 2 decimals. Member meal costs
  use the **unrounded** rate.
- Fractions of a paisa are distributed with the **largest-remainder method**.
  Everyone first gets the floor of their exact share. The few leftover paisa go
  one each to the members with the largest fractional remainders, and ties go to
  the lower member ID. No bill moves more than 1 paisa from its exact value, and
  the result does not depend on the order members are listed in.
- Because of this, Σ meal costs = food cost and Σ extra shares = extra cost
  **exactly**. A reconciliation check runs after every calculation, and publishing
  is blocked if it ever fails.

## Data model (database `hostel`)

- `admins`: user accounts (email, name, bcrypt password hash).
- `hostels`: one per user (`code` is unique and public, `name`, `ownerId`).
- `members`: each hostel's permanent registry (`hostelId`, `name`, `isActive`).
- `monthlyaccounts`: one per hostel per period, enforced by a unique index on
  `(hostelId, year, month)`.
  Each record stores a **snapshot** of its members (ID + name at that time +
  deposit, meals, meal cost, extra cost, total, outstanding, refund), the
  expenses, all totals, `status` (`DRAFT` / `PUBLISHED`) and `publishedAt`.
  Renaming or deactivating a member never changes past records.
The public page picks the latest report with
`find({hostelId, status: "PUBLISHED"}).sort({year: -1, month: -1})`. It sorts by accounting
period, not by insertion order or publish time.

## Security

- Every Server Action that reads private data or changes anything calls
  `requireAdmin()` on the server. This loads the signed-in user **and their hostel** from
  the database. Every query is then filtered by that `hostelId`, so a user can never
  read or change another hostel's data, even by calling actions directly.
- Deleting a user revokes their access immediately.
- Sign-up has no email verification or rate limiting yet; consider adding both
  before a wide public launch.
- Admin pages also redirect unauthenticated visitors to `/login`.
- Published records cannot be overwritten. Updates are conditional on
  `status: "DRAFT"` at the database level.
- Secrets stay on the server. Sessions are encrypted HTTP-only cookies.

## Printing and PDF

On the public report, **প্রিন্ট করুন** uses a print stylesheet (A4 landscape, no
buttons or navigation, full table). **PDF ডাউনলোড** renders the report in the
browser, so Bangla text shapes correctly, and saves a paginated A4 PDF.

## Project structure

```
src/app/                 pages & route handlers: (site)/ public (landing, monthly-bill, login, register), admin/, api/auth/
src/components/          UI (shadcn ui/, report/, admin/)
src/features/accounting/ calculator, server actions, editor & new-month forms
src/features/members/    member actions & UI
src/features/auth/       login, register, hostel settings, password actions
src/lib/                 mongodb.ts, auth.ts, authz.ts, money.ts, months.ts
src/models/              Mongoose models
src/schemas/             Zod schemas (shared client/server)
src/services/            business logic & DB access
src/types/               shared types
tests/                   Vitest unit + integration tests
scripts/                 create-admin, check-db, migrate-multi-hostel
```
