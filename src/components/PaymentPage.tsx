import React from "react";
import { CreditCard, Wallet, Building2, QrCode, Plus, History, Download } from "lucide-react";

export function PaymentPage() {
    const PaymentMethodIcon = ({ icon: Icon, color }: { icon: any; color: string }) => (
        <div className={`p-2 rounded-full ${color}`}>
            <Icon className="h-5 w-5 text-white" />
        </div>
    );

    const paymentMethods = [
        {
            id: 1,
            name: "Ví điện tử",
            icon: Wallet,
            color: "bg-blue-500",
            balance: "2,450,000₫",
            isDefault: true
        },
        {
            id: 2,
            name: "Thẻ ngân hàng",
            icon: CreditCard,
            color: "bg-green-500",
            balance: "5,000,000₫",
            isDefault: false
        },
        {
            id: 3,
            name: "Chuyển khoản",
            icon: Building2,
            color: "bg-purple-500",
            balance: "1,200,000₫",
            isDefault: false
        }
    ];

    const transactionHistory = [
        {
            id: 1,
            type: "Nạp tiền",
            amount: "+100,000₫",
            method: "Ví điện tử",
            date: "2024-01-15 09:15",
            status: "Thành công"
        },
        {
            id: 2,
            type: "Thanh toán gửi xe",
            amount: "-2,000₫",
            method: "Ví điện tử",
            date: "2024-01-15 16:45",
            status: "Thành công"
        },
        {
            id: 3,
            type: "Nạp tiền",
            amount: "+200,000₫",
            method: "Thẻ ngân hàng",
            date: "2024-01-14 14:30",
            status: "Thành công"
        },
        {
            id: 4,
            type: "Thanh toán gửi xe",
            amount: "-2,000₫",
            method: "Ví điện tử",
            date: "2024-01-14 18:30",
            status: "Thành công"
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Nạp tiền</h1>
                <p className="text-gray-600">Quản lý ví điện tử và thanh toán</p>
            </div>

            {/* Thông tin ví */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Ví eParking</h2>
                        <p className="text-blue-100">Số dư hiện tại</p>
                        <p className="text-3xl font-bold">2,450,000₫</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                        <Wallet className="h-8 w-8" />
                    </div>
                </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>

                    <div className="space-y-4">
                        {paymentMethods.map((method) => (
                            <div key={method.id} className={`p-4 rounded-lg border-2 ${method.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <PaymentMethodIcon icon={method.icon} color={method.color} />
                                        <div>
                                            <p className="font-medium text-gray-900">{method.name}</p>
                                            <p className="text-sm text-gray-500">{method.balance}</p>
                                        </div>
                                    </div>
                                    {method.isDefault && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            Mặc định
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors">
                        <Plus className="h-4 w-4" />
                        <span>Thêm phương thức mới</span>
                    </button>
                </div>

                {/* Nạp tiền nhanh */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Nạp tiền nhanh</h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors">
                            <p className="font-medium">50,000₫</p>
                        </button>
                        <button className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors">
                            <p className="font-medium">100,000₫</p>
                        </button>
                        <button className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors">
                            <p className="font-medium">200,000₫</p>
                        </button>
                        <button className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors">
                            <p className="font-medium">500,000₫</p>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Số tiền tùy chọn
                            </label>
                            <input
                                type="number"
                                placeholder="Nhập số tiền"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            Nạp tiền
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thanh toán bằng QR Code</h3>

                <div className="flex items-center space-x-6">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <QrCode className="h-32 w-32 text-gray-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Quét mã QR để nạp tiền</p>
                        <p className="text-xs text-gray-500">Hỗ trợ: MoMo, ZaloPay, ViettelPay</p>
                    </div>
                </div>
            </div>

            {/* Lịch sử giao dịch */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Lịch sử giao dịch</h3>
                    <button className="text-blue-600 hover:text-blue-700 flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Xuất báo cáo</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loại giao dịch
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Số tiền
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phương thức
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactionHistory.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-full ${transaction.type === "Nạp tiền" ? "bg-green-100" : "bg-red-100"
                                                }`}>
                                                {transaction.type === "Nạp tiền" ? (
                                                    <Plus className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <History className="h-4 w-4 text-red-600" />
                                                )}
                                            </div>
                                            <span className="ml-3 text-sm font-medium text-gray-900">
                                                {transaction.type}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-medium ${transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.amount}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.method}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {transaction.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {transaction.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 