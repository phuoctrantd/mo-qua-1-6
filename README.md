# Mở quà 1/6

Next.js (Vercel) + Supabase (Postgres + Storage).

## Supabase setup

1. Run `supabase/schema.sql` in **SQL Editor** (new project).
2. If you already created tables earlier, run `supabase/migrations/002_add_gender.sql`.
3. Create Storage bucket **`screenshots`** (private is OK).

## Environment

`.env.local`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
```

Same variables on Vercel.

## Import children from Excel (company template)

Add **column E: Giới tính** (`Nam` / `Nữ`) for each child row.

| A | B | C | D | E |
|---|---|---|---|---|
| STT | Họ tên bố/mẹ | Họ tên con | Ngày sinh | Giới tính |

- Department rows (`Ban …`, `Phòng …`) are skipped automatically.
- Date in column D: Excel date or `dd/mm/yyyy` → stored as `ddmmyyyy`.

Preview (no DB write):

```bash
npm run import:children -- "C:\path\file.xlsx" --dry-run
```

Import:

```bash
npm run import:children -- "C:\path\file.xlsx"
```

Re-import updates rows with the same `dob` (upsert).

## Import gifts

Create a simple sheet with headers: **Tên quà**, **Số lượng**, **Giới tính** (`Nam` / `Nữ` / `Chung`), **Ảnh** (optional URL).

Run migration `supabase/migrations/004_gift_image_url.sql` first.

If **Ảnh** is empty, the wheel and result card show text/emoji only.

```bash
npm run import:gifts -- "C:\path\gifts.xlsx" --dry-run
npm run import:gifts -- "C:\path\gifts.xlsx"
```

Spin logic: only gifts where `gender` matches the child (`male`/`female`) or `unisex` (`Chung`), and `quantity_remaining > 0`.

## View screenshots

After upload, table `spins` stores:

- `screenshot_path` — e.g. `spins/c5704d17-....png`
- `screenshot_url` — signed link (open in browser, valid ~1 year)

**In Supabase Dashboard**

1. **Table Editor** → `spins` → column `screenshot_url` → copy/open link.
2. **Storage** → bucket `screenshots` → folder `spins` → click file to preview.

Run migration `supabase/migrations/003_screenshot_url.sql`, then backfill old rows:

```bash
npm run backfill:screenshot-urls
```

**Public URL (optional)**  
If bucket `screenshots` is **Public**, you can open:

`https://<project-id>.supabase.co/storage/v1/object/public/screenshots/spins/<spin-id>.png`

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.
