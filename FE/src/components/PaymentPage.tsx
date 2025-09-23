import { CreditCard, Building2, QrCode, DollarSign, Plus, History, Download, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiUrl } from "../api";

interface PaymentMethod {
    id: number;
    name: string;
    type: string;
    icon: string;
    status: string;
}

interface Transaction {
    id: number;
    user_id: number;
    type: string;
    method?: string;
    amount: number;
    status: string;
    description?: string;
    created_at: string;
}

interface WalletInfo {
    user_id: number;
    balance: number;
}

export function PaymentPage() {
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState("methods");
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (user?.id) {
            fetchPaymentData();
        }
    }, [user?.id]);

    const fetchPaymentData = async () => {
        if (!user?.id) return;
        
        try {
            setIsLoading(true);
            setError("");
            
            // Fetch payment methods, wallet info, and transactions in parallel
            const [methodsRes, walletRes, transactionsRes] = await Promise.all([
                fetch(apiUrl(`/payment-methods`)),
                fetch(apiUrl(`/wallet/${user.id}`)),
                fetch(apiUrl(`/transactions?user_id=${user.id}`))
            ]);

            if (methodsRes.ok) {
                const methodsData = await methodsRes.json();
                setPaymentMethods(methodsData);
            }

            if (walletRes.ok) {
                const walletData = await walletRes.json();
                setWallet(walletData);
            }

            if (transactionsRes.ok) {
                const transactionsData = await transactionsRes.json();
                setTransactions(transactionsData);
            }

        } catch (error) {
            console.error('Error fetching payment data:', error);
            setError('Không thể tải dữ liệu thanh toán');
        } finally {
            setIsLoading(false);
        }
    };

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

    const getAmountColor = (transaction: Transaction) => {
        if (transaction.type === "TOPUP") return "text-emerald-600";
        if (transaction.type === "FEE") return "text-red-600";
        return "text-gray-600";
    };

    const formatAmount = (transaction: Transaction) => {
        const sign = transaction.type === "TOPUP" ? "+" : "-";
        return `${sign}${transaction.amount.toLocaleString('vi-VN')}₫`;
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionType = (transaction: Transaction) => {
        switch (transaction.type) {
            case "TOPUP": return "Nạp tiền";
            case "FEE": return "Trừ phí gửi xe";
            case "REFUND": return "Hoàn tiền";
            default: return transaction.type;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-4 lg:p-8 text-white shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Nạp tiền</h1>
                            <p className="text-cyan-100 text-base lg:text-lg">Quản lý phương thức thanh toán và giao dịch</p>
                        </div>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 lg:p-4 rounded-full border border-white border-opacity-30 self-start lg:self-auto">
                            <CreditCard className="h-6 w-6 lg:h-8 lg:w-8" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải dữ liệu thanh toán...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-800 rounded-2xl p-4 lg:p-8 text-white shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Nạp tiền</h1>
                        <p className="text-cyan-100 text-base lg:text-lg">Quản lý phương thức thanh toán và giao dịch</p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 lg:p-4 rounded-full border border-white border-opacity-30 self-start lg:self-auto">
                        <CreditCard className="h-6 w-6 lg:h-8 lg:w-8" />
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Tổng số dư</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {wallet ? `${wallet.balance.toLocaleString('vi-VN')}₫` : "0₫"}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Phương thức</p>
                            <p className="text-2xl font-bold text-gray-900">{paymentMethods.filter(p => p.status === 'active').length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
                            <CreditCard className="h-6 w-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Giao dịch tháng</p>
                            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
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

                                <div className="p-4 lg:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                        {paymentMethods.length === 0 ? (
                                            <div className="col-span-full text-center py-8">
                                                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                <p className="text-gray-500">Chưa có phương thức thanh toán</p>
                                            </div>
                                        ) : (
                                            paymentMethods.map((method) => (
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
                                                        <span className="text-sm text-gray-600">Trạng thái:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {method.status === "active" ? "Sẵn sàng" : "Tạm dừng"}
                                                        </span>
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
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Thao tác nhanh</h2>
                                </div>
                                <div className="p-4 lg:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                <div className="overflow-x-auto -mx-4 lg:mx-0">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Giao dịch
                                                </th>
                                                <th className="hidden sm:table-cell px-3 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Phương thức
                                                </th>
                                                <th className="px-3 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Số tiền
                                                </th>
                                                <th className="hidden md:table-cell px-3 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thời gian
                                                </th>
                                                <th className="px-3 lg:px-6 py-4 text-left text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                        <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                        <p className="text-lg font-medium">Chưa có giao dịch nào</p>
                                                        <p className="text-sm">Hãy nạp tiền để bắt đầu sử dụng dịch vụ</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map((transaction) => (
                                                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-3 lg:px-6 py-6 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className={`p-2 rounded-lg ${transaction.type === "TOPUP" ? "bg-emerald-100" : "bg-red-100"
                                                                    }`}>
                                                                    {transaction.type === "TOPUP" ? (
                                                                        <Plus className="h-4 w-4 text-emerald-600" />
                                                                    ) : (
                                                                        <DollarSign className="h-4 w-4 text-red-600" />
                                                                    )}
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-gray-900">{getTransactionType(transaction)}</div>
                                                                    {transaction.description && (
                                                                        <div className="text-xs text-gray-500">{transaction.description}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="hidden sm:table-cell px-3 lg:px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                            {transaction.method || "Tự động"}
                                                        </td>
                                                        <td className="px-3 lg:px-6 py-6 whitespace-nowrap text-sm font-medium">
                                                            <span className={getAmountColor(transaction)}>
                                                                {formatAmount(transaction)}
                                                            </span>
                                                        </td>
                                                        <td className="hidden md:table-cell px-3 lg:px-6 py-6 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDateTime(transaction.created_at)}
                                                        </td>
                                                        <td className="px-3 lg:px-6 py-6 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                                                {transaction.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
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