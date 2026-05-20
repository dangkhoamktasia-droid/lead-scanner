# UI Display Rules

## Timezone
Tất cả datetime display phải dùng `{ timeZone: 'Asia/Ho_Chi_Minh' }`:
```typescript
new Date(s.startedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
```
KHÔNG dùng `.toLocaleString('vi-VN')` không có timezone — mobile và desktop sẽ hiện giờ khác nhau.

## Session dropdown (Leads page)
- Dùng `session.totalLeads` từ DB — đã được sync đúng
- KHÔNG dùng `_count.leads` với where filter (không reliable trên Prisma + PostgreSQL)

## Sidebar schedule
- Hiển thị: "7h · 19h" 
- KHÔNG phải "6h · 10h · 14h · 18h · 22h" (lịch cũ đã xóa)
- Key trong DB: `cronScheduleHours`, fallback hardcode: `['7h', '19h']`

## UI Style
- Background: `#F0F2FF` + fixed gradient orbs
- Cards: `.glass-card` (white/80 + backdrop-blur + white border)
- Active sidebar: `bg-gradient-to-r from-indigo-500 to-purple-600`
- Toast: `sonner` (top-right, richColors)
- Scan History cost tooltip: `position: fixed` (tránh `overflow-hidden` clipping)
