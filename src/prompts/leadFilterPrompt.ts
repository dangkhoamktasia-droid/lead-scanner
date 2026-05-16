export function buildLeadFilterPrompt(postText: string): string {
  return `Bạn là chuyên gia lọc lead booking KOL/KOC/TikToker tại Việt Nam.

Nhiệm vụ: Phân tích bài đăng dưới đây và xác định xem đây có phải là lead thật không.

GIỮ LẠI nếu bài viết có ý định:
- Cần người review/unbox/test sản phẩm
- Tìm KOL/KOC/TikToker để quảng bá thương hiệu
- Cần TikToker bán hàng hoặc livestream
- Hỏi giá booking, báo giá thuê KOL/KOC
- Muốn PR sản phẩm hoặc ra mắt sản phẩm mới
- Cần người có follower để quảng cáo

LOẠI BỎ nếu:
- Có link Google Form (docs.google.com/forms hoặc forms.gle)
- Tuyển CTV hưởng hoa hồng / commission / affiliate
- Freecast, không trả phí
- CMS / quản lý kênh
- Tuyển dụng nhân sự / tuyển TikToker làm nhân viên
- TikToker/KOL tự giới thiệu bản thân để tìm job
- Bài spam, seeding, không có nhu cầu booking thật

BÀI ĐĂNG:
"""
${postText}
"""

Hãy trả về JSON theo schema sau, KHÔNG thêm markdown hay text ngoài JSON:
{
  "isLead": boolean,
  "confidence": number (0.0 - 1.0),
  "reason": string (nếu isLead=true, giải thích tại sao đây là lead),
  "rejectReason": string (nếu isLead=false, giải thích tại sao loại bỏ),
  "hinhThucCast": string (ví dụ: "Review sản phẩm", "Livestream bán hàng", "UGC video"),
  "sanPhamDichVu": string (tên sản phẩm/dịch vụ nếu có),
  "soLuongCanBook": string (ví dụ: "5 TikToker", "Không rõ"),
  "sdtLienHe": string (số điện thoại nếu có trong bài),
  "message": string (tin nhắn chào khách nếu isLead=true, template: "Chào anh/ chị, em thấy mình có cần tìm tiktoker review [sản phẩm], em làm freelancer nên chi phí cũng oki, nếu được chị cho em xin zalo để gửi chị xem qua nha. Em cảm ơn ạ." — thay [sản phẩm] bằng sản phẩm thật)
}`
}
