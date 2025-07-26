import { Wallet, Car, Clock } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

export function HomePage() {
  const dashboardData = [
    {
      title: "Số dư",
      value: "2,450,000₫",
      icon: Wallet,
      color: "bg-blue-500"
    },
    {
      title: "Số phương tiện",
      value: "3",
      icon: Car,
      color: "bg-green-500"
    },
    {
      title: "Lịch sử",
      value: "127",
      icon: Clock,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Trang chủ</h1>
        <p className="text-gray-600">Tổng quan về tài khoản và hoạt động gửi xe</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardData.map((item, index) => (
          <DashboardCard
            key={index}
            title={item.title}
            value={item.value}
            icon={item.icon}
            color={item.color}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Car className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Xe vào bãi</p>
                  <p className="text-sm text-gray-500">Biển số: 29A-12345</p>
                </div>
              </div>
              <div className="text-right">
                {/* <p className="font-medium">-5,000₫</p> */}
                <p className="text-sm text-gray-500">10:30 AM</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Nạp tiền</p>
                  <p className="text-sm text-gray-500">Ví điện tử</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">+100,000₫</p>
                <p className="text-sm text-gray-500">09:15 AM</p>
              </div>
            </div>

            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <Car className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Xe ra bãi</p>
                  <p className="text-sm text-gray-500">Biển số: 30F-67890</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">-2,000₫</p>
                <p className="text-sm text-gray-500">11:15 AM</p>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Car className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Xe vào bãi</p>
                  <p className="text-sm text-gray-500">Biển số: 30F-67890</p>
                </div>
              </div>
              <div className="text-right">
                {/* <p className="font-medium">-5,000₫</p> */}
                <p className="text-sm text-gray-500">07:20 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}