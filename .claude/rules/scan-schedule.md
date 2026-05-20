# Lịch scan tự động

Scan chạy 2 lần mỗi ngày: **7:00 và 19:00 giờ Việt Nam (UTC+7)**

- 7:00 VN = 00:00 UTC
- 19:00 VN = 12:00 UTC

Cấu hình trong `vercel.json`:
```json
{ "crons": [
  { "path": "/api/cron", "schedule": "0 0 * * *" },
  { "path": "/api/cron", "schedule": "0 12 * * *" }
]}
```

Cron auth: `Authorization: Bearer <CRON_SECRET>` (Vercel) hoặc `?secret=<CRON_SECRET>` (manual).

Không được thêm lịch khác hay sửa về "6h · 10h · 14h · 18h · 22h" — lịch đó đã bị xóa.

Windows Task Scheduler cũ phải bị disable để tránh chạy trùng 2 lần.
