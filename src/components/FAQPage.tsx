import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, Phone, Mail } from "lucide-react";
import { useState } from "react";

export function FAQPage() {
    const [expandedItems, setExpandedItems] = useState<number[]>([]);

    const faqData = [
        {
            id: 1,
            question: "Làm thế nào để đăng ký tài khoản eParking?",
            answer: "Bạn có thể đăng ký tài khoản bằng cách: 1) Tải ứng dụng eParking từ App Store hoặc Google Play, 2) Chọn 'Đăng ký' và nhập thông tin cá nhân, 3) Xác thực email hoặc số điện thoại, 4) Hoàn tất đăng ký và bắt đầu sử dụng."
        },
        {
            id: 2,
            question: "Cách nạp tiền vào ví eParking?",
            answer: "Bạn có thể nạp tiền bằng nhiều cách: 1) Thẻ ngân hàng nội địa, 2) Thẻ quốc tế (Visa/Mastercard), 3) Ví điện tử (MoMo, ZaloPay, ViettelPay), 4) Chuyển khoản ngân hàng, 5) Nạp tiền tại các điểm giao dịch."
        },
        {
            id: 3,
            question: "Giá vé gửi xe máy là bao nhiêu?",
            answer: "Giá vé gửi xe máy được cố định là 2,000₫ cho mỗi lần gửi xe, không phụ thuộc vào thời gian gửi."
        },
        {
            id: 4,
            question: "Làm sao để tìm bãi xe gần nhất?",
            answer: "Để tìm bãi xe gần nhất: 1) Mở ứng dụng eParking, 2) Chọn 'Tìm bãi xe', 3) Cho phép định vị GPS, 4) Xem danh sách bãi xe gần bạn, 5) Chọn bãi xe phù hợp và xem thông tin chi tiết."
        },
        {
            id: 5,
            question: "Có thể hủy vé gửi xe không?",
            answer: "Có thể hủy vé trong vòng 15 phút sau khi mua. Sau thời gian này, vé không thể hủy và tiền sẽ không được hoàn lại. Để hủy vé: vào 'Lịch sử gửi xe' > chọn vé cần hủy > nhấn 'Hủy vé'."
        },
        {
            id: 6,
            question: "Làm gì khi quên mật khẩu?",
            answer: "Khi quên mật khẩu: 1) Nhấn 'Quên mật khẩu' tại màn hình đăng nhập, 2) Nhập email hoặc số điện thoại đã đăng ký, 3) Nhận mã xác thực qua SMS/Email, 4) Nhập mã và tạo mật khẩu mới."
        },
        {
            id: 7,
            question: "Có thể gửi nhiều xe máy cùng lúc không?",
            answer: "Có thể gửi nhiều xe máy cùng lúc. Mỗi xe cần được đăng ký riêng với biển số khác nhau. Bạn có thể quản lý tối đa 3 xe máy trong phần 'Quản lý phương tiện'."
        },
        {
            id: 8,
            question: "Làm sao để báo cáo sự cố?",
            answer: "Để báo cáo sự cố: 1) Vào 'Hỗ trợ' > 'Báo cáo sự cố', 2) Chọn loại sự cố, 3) Mô tả chi tiết vấn đề, 4) Gửi báo cáo. Đội ngũ hỗ trợ sẽ liên hệ trong vòng 24 giờ."
        }
    ];

    const contactInfo = [
        {
            title: "Hỗ trợ trực tuyến",
            description: "Chat với chuyên viên hỗ trợ",
            icon: MessageCircle,
            color: "bg-blue-500"
        },
        {
            title: "Hotline",
            description: "1900-1234 (8:00 - 22:00)",
            icon: Phone,
            color: "bg-green-500"
        },
        {
            title: "Email",
            description: "support@eparking.com",
            icon: Mail,
            color: "bg-purple-500"
        }
    ];

    const toggleItem = (id: number) => {
        setExpandedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Câu hỏi thường gặp (FAQ)</h1>
                <p className="text-gray-600">Tìm câu trả lời cho các thắc mắc phổ biến</p>
            </div>

            {/* Tìm kiếm FAQ */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm câu hỏi..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Danh sách FAQ */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Câu hỏi thường gặp</h2>
                </div>

                <div className="divide-y divide-gray-200">
                    {faqData.map((item) => (
                        <div key={item.id} className="p-6">
                            <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full flex justify-between items-center text-left"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <HelpCircle className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="font-medium text-gray-900">{item.question}</span>
                                </div>
                                {expandedItems.includes(item.id) ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </button>

                            {expandedItems.includes(item.id) && (
                                <div className="mt-4 pl-11">
                                    <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Liên hệ hỗ trợ */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Liên hệ hỗ trợ</h2>
                    <p className="text-gray-600">Không tìm thấy câu trả lời? Hãy liên hệ với chúng tôi</p>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {contactInfo.map((contact, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full ${contact.color}`}>
                                        <contact.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{contact.title}</h3>
                                        <p className="text-sm text-gray-600">{contact.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Thông tin bổ sung */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hướng dẫn sử dụng</h3>
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <span className="text-green-600 font-semibold">1</span>
                            </div>
                            <span className="text-sm text-gray-700">Tải và cài đặt ứng dụng</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <span className="text-green-600 font-semibold">2</span>
                            </div>
                            <span className="text-sm text-gray-700">Đăng ký tài khoản</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <span className="text-green-600 font-semibold">3</span>
                            </div>
                            <span className="text-sm text-gray-700">Thêm phương tiện</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <span className="text-green-600 font-semibold">4</span>
                            </div>
                            <span className="text-sm text-gray-700">Nạp tiền và sử dụng</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thời gian hoạt động</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-700">Hỗ trợ khách hàng</span>
                            <span className="text-sm font-medium">8:00 - 22:00</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-700">Bãi xe hoạt động</span>
                            <span className="text-sm font-medium">24/7</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-700">Thanh toán trực tuyến</span>
                            <span className="text-sm font-medium">24/7</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-700">Bảo trì hệ thống</span>
                            <span className="text-sm font-medium">2:00 - 4:00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Đánh giá và phản hồi */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Đánh giá của bạn</h3>
                <p className="text-gray-600 mb-4">Chúng tôi luôn cải thiện để phục vụ bạn tốt hơn</p>
                <div className="flex space-x-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Đánh giá ứng dụng
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                        Gửi phản hồi
                    </button>
                </div>
            </div>
        </div>
    );
} 