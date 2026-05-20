# Lead Status & Counting Rules

## Status machine
```
(new post) → REJECTED | DUPLICATED | AI_FILTERED | NEED_REVIEW
                                        ↓
                            User approve/reject in /leads
                                        ↓
                                     APPROVED / CLOSED
```

- `AI_FILTERED`: confidence ≥ 0.85 — hiện thị cho user duyệt
- `NEED_REVIEW`: confidence 0.60–0.84 — hiện thị cho user duyệt  
- `REJECTED`: confidence < 0.60 hoặc isLead=false — AI tự xử lý, KHÔNG hiển thị cho user
- `DUPLICATED`: fingerprint trùng với lead đã approved
- `APPROVED`: user đã duyệt
- `CLOSED`: đã hợp tác

## Quy tắc đếm leads

**"Tổng số leads" = chỉ tính leads đã được lọc qua AI:**
- ✅ AI_FILTERED, NEED_REVIEW, APPROVED, CLOSED
- ❌ REJECTED — không tính, không hiển thị
- ❌ DUPLICATED — không tính trong lead count

**ScanSession.totalLeads** phải lưu qualified count (không REJECTED, không DUPLICATED).

## UI rules
- Dropdown trạng thái: KHÔNG có option "Đã reject" — AI tự lo
- Default API filter `/api/leads`: `notIn: ['REJECTED']`
- Session dropdown count dùng `totalLeads` từ DB (đã được sync đúng)
