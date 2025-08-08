import { CreditCard, Building2, QrCode, DollarSign, Plus, History, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export function PaymentPage() {
    const [selectedTab, setSelectedTab] = useState("methods");

    const paymentMethods = [
        {
            id: 1,
            name: "Momo",
            type: "Ví điện tử",
            icon: "MOMO",
            balance: "150,000₫",
            status: "active"
        },
        {
            id: 2,
            name: "VNPay",
            type: "Ví điện tử",
            icon: "VNPAY",
            balance: "75,000₫",
            status: "active"
        },
        {
            id: 3,
            name: "ZaloPay",
            type: "Ví điện tử",
            icon: "ZALOPAY",
            balance: "0₫",
            status: "inactive"
        }
    ];

    const transactions = [
        {
            id: 1,
            type: "Nạp tiền",
            method: "Momo",
            amount: "+50,000₫",
            time: "2024-01-15 10:30",
            status: "Thành công"
        },
        {
            id: 2,
            type: "Trừ phí gửi xe",
            method: "Tự động",
            amount: "-2,000₫",
            time: "2024-01-15 09:15",
            status: "Thành công"
        },
        {
            id: 3,
            type: "Nạp tiền",
            method: "VNPay",
            amount: "+25,000₫",
            time: "2024-01-14 16:45",
            status: "Thành công"
        },
        {
            id: 4,
            type: "Trừ phí gửi xe",
            method: "Tự động",
            amount: "-2,000₫",
            time: "2024-01-14 14:30",
            status: "Thành công"
        }
    ];

    const PaymentMethodIcon = ({ icon }: { icon: string }) => {
        return (
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-cyan-600">{icon}</span>
            </div>
        );
    };

    const getStatusColor = (status: string) => {
        if (status === "Thành công") return "bg-emerald-100 text-emerald-800";
        if (status === "Thất bại") return "bg-red-100 text-red-800";
        return "bg-amber-100 text-amber-800";
    };

    const getAmountColor = (amount: string) => {
        if (amount.startsWith("+")) return "text-emerald-600";
        if (amount.startsWith("-")) return "text-red-600";
        return "text-gray-600";
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                <img
                    src="/img/DLU.jpg"
                    alt="Đại học Đà Lạt"
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Nạp tiền</h1>
                        <p className="text-cyan-100 text-lg drop-shadow-md">Quản lý phương thức thanh toán và giao dịch</p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-full border border-white border-opacity-30">
                        <CreditCard className="h-8 w-8 drop-shadow-lg" />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Tổng số dư</p>
                            <p className="text-2xl font-bold text-gray-900">45,000₫</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Phương thức</p>
                            <p className="text-2xl font-bold text-gray-900">2</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
                            <CreditCard className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div> */}

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Giao dịch tháng</p>
                            <p className="text-2xl font-bold text-gray-900">12</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg">
                            <History className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setSelectedTab("methods")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "methods"
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Phương thức thanh toán
                        </button>
                        <button
                            onClick={() => setSelectedTab("transactions")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${selectedTab === "transactions"
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Lịch sử giao dịch
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {selectedTab === "methods" && (
                        <div className="space-y-6">
                            {/* Payment Methods */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-900">Phương thức thanh toán</h2>
                                        {/* <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <Plus className="h-4 w-4" />
                                            <span>Thêm phương thức</span>
                                        </button> */}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {paymentMethods.map((method) => (
                                            <div key={method.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                                                <div className="flex items-center justify-between mb-4">
                                                    <PaymentMethodIcon icon={method.icon} />
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${method.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                                                        }`}>
                                                        {method.status === "active" ? "Hoạt động" : "Không hoạt động"}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{method.name}</h3>
                                                <p className="text-sm text-gray-500 mb-3">{method.type}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">Số dư:</span>
                                                    <span className="font-semibold text-gray-900">{method.balance}</span>
                                                </div>
                                                <div className="flex space-x-2 mt-4">
                                                    <button className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-3 py-2 rounded-lg text-sm hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300">
                                                        Nạp tiền
                                                    </button>
                                                    <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                                                        Chi tiết
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Thao tác nhanh</h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <Building2 className="h-5 w-5" />
                                            <span>Nạp tiền qua ngân hàng</span>
                                        </button>
                                        <button className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-4 rounded-xl flex items-center space-x-3 hover:from-violet-600 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <QrCode className="h-5 w-5" />
                                            <span>Quét mã QR</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === "transactions" && (
                        <div className="space-y-6">
                            {/* Transactions */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-900">Lịch sử giao dịch</h2>
                                        <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                                            <Download className="h-4 w-4" />
                                            <span>Xuất báo cáo</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Giao dịch
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phương thức
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số tiền
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thời gian
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {transactions.map((transaction) => (
                                                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className={`p-2 rounded-lg ${transaction.type === "Nạp tiền" ? "bg-emerald-100" : "bg-red-100"
                                                                }`}>
                                                                {transaction.type === "Nạp tiền" ? (
                                                                    <Plus className="h-4 w-4 text-emerald-600" />
                                                                ) : (
                                                                    <DollarSign className="h-4 w-4 text-red-600" />
                                                                )}
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">{transaction.type}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.method}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                        <span className={getAmountColor(transaction.amount)}>
                                                            {transaction.amount}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                        {transaction.time}
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
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
                    )}
                </div>
            </div>
        </div>
    );
} 