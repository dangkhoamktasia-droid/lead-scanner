export function buildLeadFilterPrompt(postText: string, postUrl: string): string {
  return `Bạn là chuyên gia lọc lead booking KOL/KOC/TikToker tại Việt Nam.

Nhiệm vụ: Phân tích bài đăng và xác định đây có phải là khách hàng THẬT đang CẦN THUÊ/BOOKING KOL/KOC/TikToker hay không.

✅ GIỮ LẠI — Chỉ giữ nếu rõ ràng là BÊN MUA dịch vụ (nhãn hàng, shop, doanh nghiệp đang TRẢ TIỀN thuê):
- Nhãn hàng/shop cần tìm KOL/KOC/TikToker để review, unbox, quảng bá sản phẩm
- Doanh nghiệp cần TikToker livestream bán hàng (họ trả phí)
- Cần người có follower để quảng cáo sản phẩm/dịch vụ cụ thể
- Hỏi giá booking KOL/KOC, báo giá thuê người quảng bá
- Cần người ra mắt sản phẩm mới, PR thương hiệu
- Tìm KOC để làm UGC/video review có thù lao tiền mặt rõ ràng

TRƯỜNG HỢP ĐẶC BIỆT — Review địa điểm (nhà hàng, spa, quán cafe, khách sạn...):
- CHỈ GIỮ LẠI nếu ĐỦ CẢ HAI điều kiện:
  a) Địa điểm thuộc Hà Nội, TP.HCM (Sài Gòn), hoặc Đà Nẵng
  b) Mức cast được ghi rõ > 1.000.000 VNĐ (1 triệu đồng) bằng tiền mặt
- LOẠI BỎ nếu: địa điểm tỉnh khác, hoặc chỉ đổi bữa ăn/voucher/sản phẩm không có tiền, hoặc không ghi rõ mức cast

❌ LOẠI BỎ ngay lập tức nếu thuộc bất kỳ trường hợp nào:

1. FREECAST / ĐỔI HÀNG KHÔNG RÕ RÀNG:
   - Freecast, free cast, tặng sản phẩm đổi review không trả thêm tiền mặt
   - "Chỉ tặng sản phẩm", "không có thù lao", "đổi hàng lấy review", "complimentary"

2. AGENCY / CÔNG TY BOOKING KHÁC (đối thủ cạnh tranh — họ là bên bán, không phải bên mua):
   - Agency booking, agency KOL, công ty truyền thông đăng tuyển TikToker vào hệ thống
   - Tuyển TikToker/KOC vào đội ngũ, vào pool, vào danh sách để agency quản lý
   - "Agency chúng tôi đang tuyển", "Kết nối với agency", "Đăng ký vào hệ thống agency"
   - MCN, công ty quản lý kênh tuyển creator
   - Công ty truyền thông / marketing đăng bài để kéo KOL về cho agency họ

3. TUYỂN DỤNG NHÂN SỰ / CTV / NGƯỜI LÀM TIKTOK NỘI BỘ:
   - Tuyển CTV bán hàng hưởng hoa hồng / commission / affiliate
   - Tuyển TikToker làm nhân viên, làm KOL nội bộ cho công ty
   - Tuyển người làm content TikTok, quản lý kênh TikTok, vận hành shop TikTok cho công ty (đây là tuyển dụng nhân sự, không phải booking)
   - "Cần người quay video/livestream cho shop", "tuyển nhân viên TikTok", "cần người chạy kênh"
   - Có link Google Form tuyển dụng (docs.google.com/forms, forms.gle)
   - Trả lương/thưởng theo tháng hoặc theo đơn hàng, không phải trả phí booking theo bài

4. KOL/KOC TỰ GIỚI THIỆU / TÌM VIỆC:
   - TikToker/KOL tự PR bản thân để tìm job, tìm brand hợp tác
   - "Em là TikToker X followers, mình tìm brand để collab"
   - KOC tự đăng portfolio, media kit, báo giá dịch vụ của bản thân
   - Người đăng đang tìm khách hàng cho MÌNH (họ là bên cung cấp dịch vụ)

5. NỘI DUNG KHÁC:
   - Bài seeding, spam, không có nhu cầu booking thật
   - Chia sẻ kinh nghiệm, tips, không phải tìm kiếm dịch vụ
   - Bài của chính công ty booking/agency quảng cáo dịch vụ của họ

BÀI ĐĂNG (URL: ${postUrl}):
"""
${postText}
"""

Hãy trả về JSON theo schema sau, KHÔNG thêm markdown hay text ngoài JSON:
{
  "isLead": boolean,
  "confidence": number (0.0 - 1.0),
  "reason": string (nếu isLead=true, giải thích rõ tại sao đây là khách cần thuê),
  "rejectReason": string (nếu isLead=false, giải thích lý do loại - phải chỉ rõ thuộc nhóm nào ở trên),
  "hinhThucCast": string (ví dụ: "Review sản phẩm", "Livestream bán hàng", "UGC video", "Quảng cáo TikTok"),
  "sanPhamDichVu": string (tên sản phẩm/dịch vụ cần quảng bá nếu có),
  "soLuongCanBook": string (ví dụ: "5 TikToker", "1-2 KOC", "Không rõ"),
  "sdtLienHe": string (số điện thoại/zalo nếu có trong bài, để trống nếu không có),
  "message": string (
    nếu isLead=false: để trống ""
    nếu isLead=true: viết tin nhắn chào ngắn gọn, tự nhiên, thân thiện, văn phong freelancer cá nhân (KHÔNG đề cập agency, công ty, đội nhóm).
    - Nếu bài đăng CÓ số điện thoại/Zalo: KHÔNG xin thêm liên hệ. Mẫu: "Chào anh/chị, em thấy mình có cần tìm TikToker [hình thức] cho [sản phẩm], em làm freelancer nên chi phí cũng oki, nếu được em gửi anh/chị xem qua nha. Em cảm ơn ạ.\n[postUrl]"
    - Nếu bài đăng KHÔNG có liên hệ: xin Zalo. Mẫu: "Chào anh/chị, em thấy mình có cần tìm TikToker [hình thức] cho [sản phẩm], em làm freelancer nên chi phí cũng oki, anh/chị cho em xin Zalo để em gửi qua xem nha. Em cảm ơn ạ.\n[postUrl]"
    Luôn thay [hình thức], [sản phẩm] bằng thông tin thật. Thay [postUrl] bằng URL bài đăng thật: ${postUrl}
  )
}`
}
