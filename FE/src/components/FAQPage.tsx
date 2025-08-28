import { HelpCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { useState } from "react";

const faqList = [
  {
    question: "1. Làm sao để tạo tài khoản sử dụng hệ thống gửi xe eParking?",
    answer: "Bạn chỉ cần nhập MSSV, họ tên và mật khẩu, sau đó nhấn “Đăng ký” trên trang web eParking."
  },
  {
    question: "2. Nếu tôi quên mật khẩu thì phải làm sao?",
    answer: "Nhấn vào nút “Quên mật khẩu” tại trang đăng nhập và làm theo hướng dẫn để tạo lại mật khẩu mới qua email đã đăng ký."
  },
  {
    question: "3. Tôi không có tiền lẻ, vậy nạp tiền như thế nào?",
    answer: "Chọn chức năng “Nạp tiền QR”, sau đó quét mã QR bằng ứng dụng ngân hàng (như Agribank, Vietcombank...). Sau khi thanh toán, hệ thống sẽ cộng tiền vào ví điện tử của bạn."
  },
  {
    question: "4. Hệ thống trừ tiền như thế nào?",
    answer: "Khi bạn đưa xe ra khỏi bãi, hệ thống sẽ nhận diện biển số và tự động trừ 2.000đ từ tài khoản nếu xác định được xe."
  },
  {
    question: "5. Nếu hệ thống không nhận diện được xe của tôi thì sao?",
    answer: "Bạn có thể liên hệ bảo vệ tại bãi xe để được hỗ trợ xác minh và ghi nhận thủ công."
  },
  {
    question: "6. Làm sao để biết tài khoản của tôi còn bao nhiêu tiền?",
    answer: "Vào mục “Tài khoản” → “Số dư” để xem số tiền còn lại trong ví của bạn."
  },
  {
    question: "7. Tôi đã nạp tiền nhưng chưa thấy cập nhật?",
    answer: "Thông thường sau vài giây tiền sẽ được cộng. Nếu quá 2 phút vẫn chưa có, hãy liên hệ với bảo vệ để kiểm tra."
  },
  {
    question: "8. Tôi có thể nạp tiền bằng cách nào khác ngoài QR không?",
    answer: "Có. Bạn có thể đến trực tiếp bảo vệ và nạp tiền mặt, người quản lý sẽ cộng tiền vào tài khoản cho bạn."
  },
  {
    question: "9. Làm sao để cập nhật lại biển số nếu tôi đổi xe?",
    answer: "Bạn vào mục “Thông tin cá nhân” → “Cập nhật biển số” để sửa lại thông tin phương tiện."
  },
  {
    question: "10. Tôi có thể xem lịch sử xe ra vào của mình không?",
    answer: "Có. Trong phần “Lịch sử gửi xe”, bạn có thể xem toàn bộ lượt xe vào/ra kèm theo thời gian."
  },
  {
    question: "11. Hệ thống có hoàn tiền nếu tôi không dùng nữa không?",
    answer: "Hiện tại hệ thống chưa hỗ trợ hoàn tiền. Bạn có thể giữ số dư để sử dụng tiếp vào kỳ sau."
  },
  {
    question: "12. Tôi có thể chia sẻ tài khoản cho bạn bè dùng chung không?",
    answer: "Không. Mỗi tài khoản chỉ dùng cho một người và một phương tiện để đảm bảo tính chính xác khi nhận diện."
  },
  {
    question: "13. Hệ thống có nhận diện được vào ban đêm không?",
    answer: "Có. Camera được thiết kế để hoạt động tốt trong điều kiện ánh sáng yếu hoặc vào ban đêm."
  },
  {
    question: "14. Tôi có cần điện thoại hoặc kết nối mạng khi gửi xe không?",
    answer: "Không. Hệ thống hoạt động độc lập. Bạn chỉ cần đảm bảo tài khoản còn tiền là có thể sử dụng."
  },
  {
    question: "15. Tôi có thể dùng số điện thoại để đăng nhập không?",
    answer: "Không. Hệ thống sử dụng MSSV và mật khẩu để đăng nhập."
  },
  {
    question: "16. Có ứng dụng điện thoại cho hệ thống này không?",
    answer: "Hiện tại chưa có. Bạn có thể truy cập bằng trình duyệt web trên điện thoại hoặc máy tính."
  },
  {
    question: "17. Làm sao để nhận thông báo khi tài khoản gần hết tiền?",
    answer: "Hệ thống sẽ gửi thông báo khi số dư dưới mức tối thiểu (ví dụ 2.000đ) để nhắc bạn nạp thêm tiền."
  },
  {
    question: "18. Tôi có thể đăng ký gói gửi xe theo tháng không?",
    answer: "Có. Bạn có thể chọn mua gói gửi xe theo tháng với chi phí tiết kiệm hơn tại mục “Gói thuê bao”."
  },
  {
    question: "19. Tôi có thể chỉnh sửa thông tin tài khoản được không?",
    answer: "Có. Bạn có thể thay đổi mật khẩu, thông tin cá nhân và biển số trong phần “Tài khoản”."
  },
  {
    question: "20. Thông tin cá nhân của tôi có được bảo mật không?",
    answer: "Có. Tất cả thông tin của bạn được bảo mật theo chính sách của hệ thống và không chia sẻ cho bên thứ ba."
  }
];

export function FAQPage() {
    const [openItems, setOpenItems] = useState<number[]>([]);

    const toggleItem = (index: number) => {
        setOpenItems(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-4 lg:p-8 text-white shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-xl lg:text-3xl font-bold mb-2">FAQ – Câu hỏi thường gặp về hệ thống gửi xe eParking</h1>
                        <p className="text-cyan-100 text-base lg:text-lg">Tìm hiểu cách sử dụng hệ thống eParking</p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 lg:p-4 rounded-full border border-white border-opacity-30 self-start lg:self-auto">
                        <HelpCircle className="h-6 w-6 lg:h-8 lg:w-8" />
                    </div>
                </div>
            </div>

            {/* FAQ List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Danh sách câu hỏi</h2>
                </div>
                <div className="p-4 lg:p-6">
                    <div className="space-y-4 lg:space-y-6">
                        {faqList.map((item, index) => {
                            const isOpen = openItems.includes(index);
                            return (
                                <div key={index} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                                    <button
                                        onClick={() => toggleItem(index)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-answer-${index}`}
                                        id={`faq-question-${index}`}
                                    >
                                        <p className="font-semibold text-gray-900 text-left">{item.question}</p>
                                        {isOpen ? (
                                            <ChevronUp className="h-5 w-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-500" />
                                        )}
                                    </button>
                                    {isOpen && (
                                        <div
                                            id={`faq-answer-${index}`}
                                            role="region"
                                            aria-labelledby={`faq-question-${index}`}
                                            className="px-6 pb-4 border-t border-gray-100"
                                        >
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{item.answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Contact Support */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Liên hệ hỗ trợ</h2>
                </div>
                <div className="p-4 lg:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-6 rounded-2xl">
                            <div className="flex items-center space-x-3 mb-4">
                                <AlertCircle className="h-6 w-6" />
                                <h3 className="text-lg font-semibold">Hỗ trợ kỹ thuật</h3>
                            </div>
                            <p className="text-cyan-100 mb-4">Gặp vấn đề với hệ thống? Liên hệ ngay với đội ngũ kỹ thuật.</p>
                            <button className="bg-white text-cyan-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                                Liên hệ ngay
                            </button>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl">
                            <div className="flex items-center space-x-3 mb-4">
                                <HelpCircle className="h-6 w-6" />
                                <h3 className="text-lg font-semibold">Hướng dẫn sử dụng</h3>
                            </div>
                            <p className="text-emerald-100 mb-4">Xem hướng dẫn chi tiết cách sử dụng hệ thống eParking.</p>
                            <button className="bg-white text-emerald-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                                Xem hướng dẫn
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
