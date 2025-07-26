import { Car, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function VehiclesPage() {
  const vehicles = [
    { id: 1, plate: "29A-12345", type: "Xe máy", status: "Đang gửi", entryTime: "10:30 AM" },
    { id: 2, plate: "30F-67890", type: "Xe máy", status: "Đã ra", entryTime: "08:45 AM" },
    { id: 3, plate: "51H-99999", type: "Xe máy", status: "Đang gửi", entryTime: "07:20 AM" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Phương tiện</h1>
          <p className="text-gray-600">Quản lý các phương tiện đã đăng ký</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm phương tiện
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phương tiện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Car className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.plate}</p>
                    <p className="text-sm text-gray-500">{vehicle.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${vehicle.status === 'Đang gửi' ? 'text-green-600' : 'text-gray-500'}`}>
                    {vehicle.status}
                  </p>
                  <p className="text-sm text-gray-500">{vehicle.entryTime}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}