import { HelpCircle, ChevronDown, ChevronUp, Car, CreditCard, Camera, AlertCircle } from "lucide-react";
import { useState } from "react";

export function FAQPage() {
    const [openItems, setOpenItems] = useState<number[]>([]);

    const faqData = [
        {
            id: 1,
            question: "Làm thế nào để đăng ký xe máy?",
            answer: "Bạn có thể đăng ký xe máy bằng cách vào trang 'Phương tiện' và nhấn 'Thêm phương tiện'. Hệ thống cho phép đăng ký tối đa 3 xe máy cho mỗi tài khoản.",
            category: "Đăng ký xe",
            icon: Car
        },
        {
            id: 2,
            question: "Phí gửi xe là bao nhiêu?",
            answer: "Phí gửi xe máy được cố định là 2,000₫ cho mỗi lượt gửi xe, không phụ thuộc vào thời gian gửi.",
            category: "Thanh toán",
            icon: CreditCard
        },
        {
            id: 3,
            question: "Làm thế nào để nạp tiền vào tài khoản?",
            answer: "Bạn có thể nạp tiền qua các phương thức: Momo, VNPay, ZaloPay hoặc nạp tiền thủ công qua bảo vệ bãi xe.",
            category: "Thanh toán",
            icon: CreditCard
        },
        {
            id: 4,
            question: "Hệ thống nhận diện biển số hoạt động như thế nào?",
            answer: "Hệ thống sử dụng camera và công nghệ AI để tự động nhận diện biển số xe khi xe vào/ra bãi. Độ chính xác hiện tại đạt 96%.",
            category: "Công nghệ",
            icon: Camera
        },
        {
            id: 5,
            question: "Tôi có thể đăng ký bao nhiêu xe máy?",
            answer: "Mỗi tài khoản được phép đăng ký tối đa 3 xe máy. Khi đã đăng ký đủ 3 xe, bạn cần xóa một xe để thêm xe mới.",
            category: "Đăng ký xe",
            icon: Car
        },
        {
            id: 6,
            question: "Làm gì khi hệ thống không nhận diện được biển số?",
            answer: "Trong trường hợp này, bạn có thể liên hệ bảo vệ bãi xe để được hỗ trợ nhập biển số thủ công hoặc quét mã QR.",
            category: "Hỗ trợ",
            icon: AlertCircle
        },
        {
            id: 7,
            question: "Làm thế nào để xem lịch sử gửi xe?",
            answer: "Bạn có thể xem lịch sử gửi xe trong trang 'Lịch sử gửi xe'. Hệ thống hiển thị tất cả các lượt gửi xe của bạn.",
            category: "Sử dụng",
            icon: Car
        },
        {
            id: 8,
            question: "Tôi có thể thanh toán bằng tiền mặt không?",
            answer: "Có, bạn có thể nạp tiền mặt qua bảo vệ bãi xe. Bảo vệ sẽ nhập số tiền vào tài khoản của bạn.",
            category: "Thanh toán",
            icon: CreditCard
        }
    ];

    const toggleItem = (id: number) => {
        setOpenItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const categories = [
        { name: "Tất cả", count: faqData.length },
        { name: "Đăng ký xe", count: faqData.filter(item => item.category === "Đăng ký xe").length },
        { name: "Thanh toán", count: faqData.filter(item => item.category === "Thanh toán").length },
        { name: "Công nghệ", count: faqData.filter(item => item.category === "Công nghệ").length },
        { name: "Hỗ trợ", count: faqData.filter(item => item.category === "Hỗ trợ").length },
        { name: "Sử dụng", count: faqData.filter(item => item.category === "Sử dụng").length }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Câu hỏi thường gặp</h1>
                        <p className="text-cyan-100 text-lg">Tìm hiểu cách sử dụng hệ thống eParking</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-4 rounded-full">
                        <HelpCircle className="h-8 w-8" />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Danh mục câu hỏi</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category, index) => (
                            <button
                                key={index}
                                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <div className="text-center">
                                    <p className="font-semibold">{category.name}</p>
                                    <p className="text-cyan-100 text-sm">{category.count} câu hỏi</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Danh sách câu hỏi</h2>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {faqData.map((item) => {
                            const Icon = item.icon;
                            const isOpen = openItems.includes(item.id);

                            return (
                                <div key={item.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-cyan-100 p-3 rounded-full">
                                                <Icon className="h-5 w-5 text-cyan-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-semibold text-gray-900">{item.question}</p>
                                                <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.category === "Đăng ký xe" ? "bg-emerald-100 text-emerald-800" :
                                                    item.category === "Thanh toán" ? "bg-violet-100 text-violet-800" :
                                                        item.category === "Công nghệ" ? "bg-cyan-100 text-cyan-800" :
                                                            item.category === "Hỗ trợ" ? "bg-amber-100 text-amber-800" :
                                                                "bg-blue-100 text-blue-800"
                                                }`}>
                                                {item.category}
                                            </span>
                                            {isOpen ? (
                                                <ChevronUp className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            )}
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-6 pb-4 border-t border-gray-100">
                                            <div className="pt-4">
                                                <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                                            </div>
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
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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