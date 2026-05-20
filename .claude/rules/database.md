# Database Rules

## Stack
- Prisma 7 + `@prisma/adapter-pg` + Supabase PostgreSQL (production)
- SQLite local (legacy, dev only)

## Migration commands
```bash
npx prisma db push      # dùng thay cho migrate (vì migration_lock.toml mismatch sqlite→pg)
npx prisma generate     # bắt buộc sau mỗi schema change
```
Phải kill dev server trước khi chạy db push (SQLite locks).

## Dedup logic (quan trọng)
Dedup check bằng `Lead.postUrl` — KHÔNG phải `RawPost.postUrl`.
- Nếu RawPost tồn tại nhưng không có Lead → post vẫn được re-process
- Lý do: timeout có thể tạo RawPost nhưng chưa tạo Lead

## Session sync
Khi scan timeout trên Vercel, `ScanSession.status` và `totalLeads` không được update.
→ Dùng `/api/admin/sync-sessions` (POST) để fix tất cả sessions.
`totalLeads` = qualified leads (không REJECTED, không DUPLICATED).
