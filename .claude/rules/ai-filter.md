# AI Filter Rules

File: `src/prompts/leadFilterPrompt.ts` — `buildLeadFilterPrompt(postText, postUrl)`

## KEEP (isLead = true)
Brands/shops trả tiền mặt để thuê KOL/KOC/TikToker có phí cast bằng tiền.

## REJECT (isLead = false)
1. Freecast / đổi sản phẩm không có phí tiền mặt
2. Agency/đối thủ tuyển TikToker vào pool của họ
3. Tuyển nhân viên TikTok nội bộ, quản lý kênh, CTV hoa hồng
4. KOL/KOC tự quảng cáo / tìm việc
5. Seeding/spam/không liên quan

## Đặc biệt — venue review (nhà hàng, spa, cafe, khách sạn)
Chỉ KEEP nếu: địa điểm ở HN/HCM/Đà Nẵng VÀ phí cast tiền mặt > 1,000,000 VNĐ được nêu rõ.

## Tone tin nhắn
- Phong cách freelancer, KHÔNG nhắc đến "agency" (khách sợ giá cao)
- Có SĐT/Zalo: hỏi thẳng nhu cầu + append postUrl
- Không có contact: hỏi xin Zalo + append postUrl
